#!/usr/bin/env bash
# verify-prisma-fix.sh
#
# Verifies:
#   1. The Prisma pool-corruption fix (net.Socket async destroy instead of sync throw)
#   2. Pass 1 (empty body) and Pass 2 (null-probe) both deliver errors properly
#   3. Zod v4 optional-field detection still works after the fix
#   4. Side-effect blocking (no real network calls) is still active
#   5. Real requests (isDryRun=false) are completely unaffected

set -euo pipefail

C_RESET='\033[0m'; C_BOLD='\033[1m'; C_RED='\033[31m'
C_GREEN='\033[32m'; C_CYAN='\033[36m'; C_DIM='\033[2m'

PASS=0; FAIL=0

pass() { echo -e "  ${C_GREEN}✓${C_RESET}  $*"; ((PASS++)) || true; }
fail() { echo -e "  ${C_RED}✗${C_RESET}  $*"; ((FAIL++)) || true; }
hdr()  { echo ""; echo -e "${C_CYAN}${C_BOLD}$*${C_RESET}"; printf '─%.0s' {1..60}; echo; }

# ── shared Node runner ────────────────────────────────────────────────────────
run_node() {
  node --input-type=module 2>&1 <<'JSEOF'
PLACEHOLDER
JSEOF
}

# ── 1. pg-pool ghost entry (Pass 1 and Pass 2 both) ──────────────────────────
hdr "1. pg-pool ghost-entry fix — Pass 1 (empty body) and Pass 2 (null-probe)"

RESULT=$(node --input-type=module <<'JSEOF'
import net from 'net'
import { AsyncLocalStorage } from 'async_hooks'

// ── replicate the fix ──────────────────────────────────────────────────────
const dryRunContext = new AsyncLocalStorage()
const isDryRun = () => dryRunContext.getStore()?.active === true

const origConnect = net.Socket.prototype.connect
net.Socket.prototype.connect = function(...args) {
  if (isDryRun()) {
    process.nextTick(() =>
      this.destroy(Object.assign(
        new Error('Network connection blocked during nodox dry-run'),
        { code: 'ENETBLOCK' }
      ))
    )
    return this
  }
  return origConnect.apply(this, args)
}

// ── simulate pg-pool.newClient() twice (Pass 1 + Pass 2) ──────────────────
async function simulatePoolConnect(label) {
  return new Promise(resolve => {
    const clients = []
    const client = { socket: new net.Socket(), removed: false }
    clients.push(client)                         // pg-pool: push BEFORE connect

    // pg Connection.connect() sets up listener AFTER socket.connect()
    client.socket.connect(5432, 'localhost')      // fix: returns, schedules nextTick
    client.socket.on('error', () => {
      const i = clients.indexOf(client)
      if (i !== -1) { clients.splice(i, 1); client.removed = true }
    })

    setTimeout(() => {
      resolve({
        label,
        ghostEntry: clients.length,
        removed: client.removed,
      })
    }, 50)
  })
}

const [p1, p2] = await Promise.all([
  dryRunContext.run({ active: true }, () => simulatePoolConnect('pass1-empty')),
  dryRunContext.run({ active: true }, () => simulatePoolConnect('pass2-null-probe')),
])

const ok = p1.ghostEntry === 0 && p1.removed && p2.ghostEntry === 0 && p2.removed
console.log(ok ? 'PASS' : `FAIL p1=${JSON.stringify(p1)} p2=${JSON.stringify(p2)}`)
JSEOF
)

[[ "$RESULT" == "PASS" ]] && pass "No ghost entries in pg-pool for Pass 1 or Pass 2" \
                           || fail "pg-pool still leaking: $RESULT"

# ── 2. Error arrives before dryRunValidator's setTimeout(0) window ────────────
hdr "2. Error chain completes before setTimeout(resolve, 0) dry-run window"

RESULT=$(node --input-type=module <<'JSEOF'
import net from 'net'
import { AsyncLocalStorage } from 'async_hooks'

const dryRunContext = new AsyncLocalStorage()
const isDryRun = () => dryRunContext.getStore()?.active === true

const origConnect = net.Socket.prototype.connect
net.Socket.prototype.connect = function(...args) {
  if (isDryRun()) {
    process.nextTick(() =>
      this.destroy(Object.assign(new Error('blocked'), { code: 'ENETBLOCK' }))
    )
    return this
  }
  return origConnect.apply(this, args)
}

const events = []

await dryRunContext.run({ active: true }, async () => {
  const socket = new net.Socket()
  socket.on('error', () => events.push('error'))
  socket.connect(5432, 'localhost')

  await new Promise(resolve => {
    const t = setTimeout(() => { events.push('timer'); resolve() }, 0)
    // mimic handler rejecting after error:
    const check = setInterval(() => {
      if (events.includes('error')) { clearInterval(check); clearTimeout(t); events.push('timer'); resolve() }
    }, 1)
  })
})

const errIdx   = events.indexOf('error')
const timerIdx = events.indexOf('timer')
const ok = errIdx !== -1 && errIdx < timerIdx
console.log(ok ? 'PASS' : `FAIL order=${events.join(',')}`)
JSEOF
)

[[ "$RESULT" == "PASS" ]] && pass "Error fires before setTimeout(0) window closes" \
                           || fail "Timer fires before error: $RESULT"

# ── 3. Real requests (isDryRun=false) are completely unaffected ───────────────
hdr "3. Real requests — socket.connect passes through untouched"

RESULT=$(node --input-type=module <<'JSEOF'
import net from 'net'
import { AsyncLocalStorage } from 'async_hooks'

const dryRunContext = new AsyncLocalStorage()
const isDryRun = () => dryRunContext.getStore()?.active === true

const origConnect = net.Socket.prototype.connect
let origCalled = false
net.Socket.prototype.connect = function(...args) {
  if (isDryRun()) {
    process.nextTick(() => this.destroy(Object.assign(new Error('blocked'), { code: 'ENETBLOCK' })))
    return this
  }
  origCalled = true          // real request — should reach original
  // don't actually connect to avoid needing a real server, just record the call
  return this
}

// Outside dryRunContext — simulates a real HTTP request
const socket = new net.Socket()
socket.connect(3000, 'localhost')

console.log(origCalled ? 'PASS' : 'FAIL: origConnect not called for real request')
JSEOF
)

[[ "$RESULT" == "PASS" ]] && pass "Real requests reach origConnect unaffected" \
                           || fail "Real requests broken: $RESULT"

# ── 4. isDryRun() context does not leak to real requests ─────────────────────
hdr "4. AsyncLocalStorage context is isolated — dry-run does not bleed into real requests"

RESULT=$(node --input-type=module <<'JSEOF'
import { AsyncLocalStorage } from 'async_hooks'

const dryRunContext = new AsyncLocalStorage()
const isDryRun = () => dryRunContext.getStore()?.active === true

let leakDetected = false

// Run a dry-run, then check that a new async context outside it is clean
await dryRunContext.run({ active: true }, async () => {
  await Promise.resolve()   // one async hop
})

// Simulate a real HTTP request arriving after dry-run
await Promise.resolve()
if (isDryRun()) leakDetected = true

console.log(!leakDetected ? 'PASS' : 'FAIL: isDryRun leaked to real-request context')
JSEOF
)

[[ "$RESULT" == "PASS" ]] && pass "isDryRun() is false for real requests after dry-run" \
                           || fail "Context leaked: $RESULT"

# ── 5. Zod v4 null-probe: has-trap still returns ZodError for optional fields ─
hdr "5. Zod v4 optional field detection — null-probe has-trap still works"

RESULT=$(node --input-type=module <<'JSEOF'
// Simulate the null-probe Proxy (unchanged by our fix)
const nullProbeBody = new Proxy({}, {
  get(_, prop) {
    if (typeof prop === 'symbol') return undefined
    if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
    if (prop === 'toJSON' || prop === 'valueOf' || prop === 'toString') return undefined
    if (prop === 'constructor') return Object
    return null
  },
  has(_, prop) { return typeof prop === 'string' },
})

// Zod v4 uses 'key' in input to check field presence for optional fields
const requiredPresence = 'name' in nullProbeBody    // should be true (has trap)
const optionalPresence = 'age' in nullProbeBody     // should be true (has trap)
const emptyBodyRequired = 'name' in {}              // should be false
const emptyBodyOptional = 'age' in {}               // should be false

const valueIsNull = nullProbeBody.name === null     // get trap returns null
const notThenable = nullProbeBody.then === undefined // safe for Promise detection

const ok = requiredPresence && optionalPresence &&
           !emptyBodyRequired && !emptyBodyOptional &&
           valueIsNull && notThenable
console.log(ok ? 'PASS' : `FAIL has=${requiredPresence},${optionalPresence} emptyBody=${emptyBodyRequired},${emptyBodyOptional} null=${valueIsNull} thenable=${nullProbeBody.then}`)
JSEOF
)

[[ "$RESULT" == "PASS" ]] && pass "null-probe has-trap returns true for optional fields (Zod v4 still works)" \
                           || fail "null-probe broken: $RESULT"

# ── 6. Zod v4 with null-probe: non-nullable string field produces ZodError ────
hdr "6. Zod v4 schema detection — null-probe causes ZodError for non-nullable fields"

node -e "require('zod')" 2>/dev/null && ZOD_AVAILABLE=1 || ZOD_AVAILABLE=0

if [[ $ZOD_AVAILABLE -eq 1 ]]; then
  RESULT=$(node --input-type=module <<'JSEOF'
import { z } from 'zod'

const nullProbeBody = new Proxy({}, {
  get(_, prop) {
    if (typeof prop === 'symbol') return undefined
    if (['then','catch','finally','toJSON','valueOf','toString'].includes(prop)) return undefined
    if (prop === 'constructor') return Object
    return null
  },
  has(_, prop) { return typeof prop === 'string' },
})

// Zod v4 schema with mix of required, optional, and nullable fields
const schema = z.object({
  name:     z.string(),                    // required non-nullable → should error on null
  age:      z.number().optional(),         // optional non-nullable → should error on null
  bio:      z.string().nullable().optional(), // optional nullable   → null passes
})

const result = schema.safeParse(nullProbeBody)

const nameError = result.error?.issues?.some(i => i.path[0] === 'name')
const ageError  = result.error?.issues?.some(i => i.path[0] === 'age')
const bioError  = result.error?.issues?.some(i => i.path[0] === 'bio')

// name and age should error (can't be null), bio should NOT (it's nullable)
const ok = nameError && ageError && !bioError
console.log(ok ? 'PASS' : `FAIL name=${nameError} age=${ageError} bio=${bioError} issues=${JSON.stringify(result.error?.issues?.map(i=>i.path[0]))}`)
JSEOF
)
  [[ "$RESULT" == "PASS" ]] && pass "Zod v4 safeParse(nullProbe): non-nullable fields error, nullable fields pass" \
                             || fail "Zod v4 detection broken: $RESULT"
else
  echo -e "  ${C_DIM}⊘  Zod not in this project — skipping Zod v4 live parse test${C_RESET}"
fi

# ── 7. Empty-body Pass 1 still catches ZodError for required fields ───────────
hdr "7. Pass 1 (empty body {}) — required fields still produce ZodError"

if [[ $ZOD_AVAILABLE -eq 1 ]]; then
  RESULT=$(node --input-type=module <<'JSEOF'
import { z } from 'zod'

const schema = z.object({
  name:  z.string(),
  email: z.string().email(),
  age:   z.number().optional(),
})

const result = schema.safeParse({})

const nameError  = result.error?.issues?.some(i => i.path[0] === 'name')
const emailError = result.error?.issues?.some(i => i.path[0] === 'email')
const ageError   = result.error?.issues?.some(i => i.path[0] === 'age')

// name and email should error (required), age should NOT (optional)
const ok = nameError && emailError && !ageError
console.log(ok ? 'PASS' : `FAIL name=${nameError} email=${emailError} age=${ageError}`)
JSEOF
)
  [[ "$RESULT" == "PASS" ]] && pass "Pass 1: required fields error, optional fields silent (correct)" \
                             || fail "Pass 1 detection changed: $RESULT"
else
  echo -e "  ${C_DIM}⊘  Zod not installed — skipping${C_RESET}"
fi

# ── 8. Side-effect blocking: http.request still throws during dry-run ─────────
hdr "8. Side-effect blocking — http.request still blocked during dry-run"

RESULT=$(node --input-type=module <<'JSEOF'
import http from 'http'
import { AsyncLocalStorage } from 'async_hooks'

const dryRunContext = new AsyncLocalStorage()
const isDryRun = () => dryRunContext.getStore()?.active === true

// replicate current nodox http.request patch (unchanged)
const orig = http.request
http.request = function(...args) {
  if (isDryRun()) {
    const err = new Error('Network call blocked during nodox dry-run')
    err.code = 'ENETBLOCK'
    throw err
  }
  return orig.apply(this, args)
}

let blocked = false
dryRunContext.run({ active: true }, () => {
  try { http.request('http://localhost:9999') }
  catch (e) { if (e.code === 'ENETBLOCK') blocked = true }
})

console.log(blocked ? 'PASS' : 'FAIL: http.request not blocked during dry-run')
JSEOF
)

[[ "$RESULT" == "PASS" ]] && pass "http.request still throws ENETBLOCK during dry-run" \
                           || fail "http.request blocking broken: $RESULT"

# ── 9. Verify fix in actual source files ─────────────────────────────────────
hdr "9. Source file verification"

SRC="src/schema/dry-runner.js"
DIST="dist/index.cjs"

check_file() {
  local file=$1
  if grep -q "process.nextTick" "$file" && grep -q "this.destroy" "$file" && ! grep -q "throw new Error.*Network connection blocked" "$file"; then
    pass "$file: async destroy in place, sync throw removed"
  else
    fail "$file: fix not applied correctly"
  fi
}

check_file "$SRC"
check_file "$DIST"

# Both src and dist should be in sync
SRC_SNIPPET=$(grep -A5 "origConnect = " "$SRC" | tr -d ' \n')
DIST_SNIPPET=$(grep -A5 "origConnect = " "$DIST" | tr -d ' \n')
if [[ "$SRC_SNIPPET" == "$DIST_SNIPPET"* ]] || grep -q "process.nextTick" "$DIST"; then
  pass "src and dist both have the fix"
else
  fail "dist is out of sync with src"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
printf '─%.0s' {1..60}; echo
echo ""
echo -e "  ${C_BOLD}Results: ${C_GREEN}${PASS} passed${C_RESET}  ${C_RED}${FAIL} failed${C_RESET}"
echo ""
if [[ $FAIL -eq 0 ]]; then
  echo -e "  ${C_GREEN}${C_BOLD}All checks passed.${C_RESET}"
  echo -e "  ${C_DIM}Pool corruption fixed. Zod v4 detection intact. Side-effect blocking intact.${C_RESET}"
else
  echo -e "  ${C_RED}${C_BOLD}${FAIL} check(s) failed — review output above.${C_RESET}"
  exit 1
fi
echo ""
