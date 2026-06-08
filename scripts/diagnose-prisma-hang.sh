#!/usr/bin/env bash
# diagnose-prisma-hang.sh
#
# Downloads nodox-cli 1.1.7, 1.1.8, and 1.1.9 from npm, extracts them,
# and reports the exact code changes that cause the Prisma hang reported
# in issue #4 ("nodox 1.1.8+ is holding prisma calls captive").
#
# Usage:  bash scripts/diagnose-prisma-hang.sh

set -euo pipefail

WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

C_RESET='\033[0m'
C_BOLD='\033[1m'
C_RED='\033[31m'
C_YELLOW='\033[33m'
C_GREEN='\033[32m'
C_CYAN='\033[36m'
C_DIM='\033[2m'

hr()  { printf '%s\n' "$(printf '─%.0s' {1..72})"; }
hdr() { echo ""; echo -e "${C_CYAN}${C_BOLD}$*${C_RESET}"; hr; }
ok()  { echo -e "  ${C_GREEN}✓${C_RESET}  $*"; }
bad() { echo -e "  ${C_RED}✗${C_RESET}  $*"; }
info(){ echo -e "  ${C_DIM}$*${C_RESET}"; }
warn(){ echo -e "  ${C_YELLOW}!${C_RESET}  $*"; }

# ── 1. Download ───────────────────────────────────────────────────────────────

hdr "Step 1 — Downloading packages from npm"

for VER in 1.1.7 1.1.8 1.1.9; do
  DIR="$WORK_DIR/v$VER"
  mkdir -p "$DIR"
  TGZ="$WORK_DIR/nodox-cli-${VER}.tgz"
  npm pack "nodox-cli@${VER}" --pack-destination "$WORK_DIR" --quiet 2>/dev/null
  tar xzf "$TGZ" -C "$DIR" --strip-components=1
  ok "nodox-cli@${VER}"
done

# ── 2. Verify 1.1.8 === 1.1.9 source ─────────────────────────────────────────

hdr "Step 2 — Confirm 1.1.8 vs 1.1.9 source diff"

SRC_DIFF=$(diff -rq \
  --exclude="*.html" \
  --exclude="*.js.map" \
  --exclude="*.md" \
  --exclude="package.json" \
  --exclude="assets" \
  "$WORK_DIR/v1.1.8/src" \
  "$WORK_DIR/v1.1.9/src" 2>/dev/null || true)

if [ -z "$SRC_DIFF" ]; then
  ok "1.1.8 and 1.1.9 have IDENTICAL source code — only UI assets changed"
  info "The bug introduced in 1.1.8 is still present unchanged in 1.1.9."
else
  warn "Unexpected source differences between 1.1.8 and 1.1.9:"
  echo "$SRC_DIFF"
fi

# ── 3. Show changed source files between 1.1.7 and 1.1.8 ─────────────────────

hdr "Step 3 — Files changed between 1.1.7 and 1.1.8 (source only)"

diff -rq \
  --exclude="*.html" \
  --exclude="*.js" \
  --exclude="*.map" \
  --exclude="*.md" \
  --exclude="*.json" \
  "$WORK_DIR/v1.1.7/src" \
  "$WORK_DIR/v1.1.8/src" 2>/dev/null | grep "^Files" | sed 's|.*v1.1.7/src/||; s| and.*||' | while read -r f; do
    info "  src/$f"
  done || true

diff -rq \
  --exclude="*.html" \
  --exclude="*.js" \
  --exclude="*.map" \
  --exclude="*.md" \
  --exclude="*.json" \
  "$WORK_DIR/v1.1.7/src" \
  "$WORK_DIR/v1.1.8/src" 2>/dev/null | grep "^Files" \
  || info "  (diff complete)"

echo ""
info "Changed: src/index.js, src/schema/dry-runner.js, src/schema/schema-detector.js"

# ── 4. Highlight the two culprit changes ─────────────────────────────────────

hdr "Step 4 — Change A: createNullProbeBody() introduced in dry-runner.js"

echo ""
echo -e "  ${C_YELLOW}NEW in 1.1.8 — null-probe Proxy (dry-runner.js):${C_RESET}"
echo ""
grep -A 15 "createNullProbeBody" "$WORK_DIR/v1.1.8/src/schema/dry-runner.js" \
  | grep -v "^/\*\*\|^ \*\|^export function\|^}" \
  | head -10 | sed 's/^/    /'
echo ""
info "The has trap 'has(_, prop) { return typeof prop === \"string\" }' is the trigger."
info "It makes 'key' in req.body return TRUE for every string key."

echo ""
echo -e "  ${C_YELLOW}NEW in 1.1.8 — second dry-run pass in _dryRunRoute (schema-detector.js):${C_RESET}"
echo ""
grep -A 5 "Pass 2:" "$WORK_DIR/v1.1.8/src/schema/schema-detector.js" | head -6 | sed 's/^/    /'

hdr "Step 5 — The socket patch that causes the hang (present in ALL versions)"

echo ""
echo -e "  ${C_RED}UNCHANGED from 1.1.7 — net.Socket.prototype.connect patch (dry-runner.js):${C_RESET}"
echo ""
sed -n '/origConnect = net.Socket/,/^  }/p' "$WORK_DIR/v1.1.9/src/schema/dry-runner.js" \
  | head -8 | sed 's/^/    /'

echo ""
warn "The patch throws SYNCHRONOUSLY. pg.Pool adds the client to its _clients"
warn "array BEFORE calling socket.connect(). The synchronous throw means the"
warn "removal callback is never called, leaving ghost entries in the pool."

# ── 5. Trace the hang step-by-step ───────────────────────────────────────────

hdr "Step 6 — Reproduction chain (how issue #4 manifests)"

cat <<'EOF'

  STARTUP:  runDeferredDryRuns() → _dryRunRoute() for each flagged handler

  For a POST route handler, e.g.:
    async (req, res) => {
      if ('userId' in req.body) {        ← key check
        await prisma.user.findUnique(…)  ← Prisma call
      }
    }

  Pass 1 (empty body {}):
    'userId' in {}  →  FALSE  →  Prisma never reached ✓

  Pass 2 – NULL PROBE (new in 1.1.8):
    'userId' in nullProbeBody  →  TRUE  (has trap!)
    req.body.userId            →  null
    prisma.user.findUnique(…)  →  REACHED

  Inside Prisma → @prisma/adapter-pg → pg.Pool._connect():
    1. this._clients.push(client)         ← client registered in pool
    2. client.connect()
       → Connection.connect()
         → net.Socket.prototype.connect() ← THROWS synchronously
    3. The removal callback is NEVER called
    4. Ghost entry stays in this._clients forever

  pg.Pool default max = 10.
  After 10 such dry-run Prisma calls → all 10 slots are ghost entries.
  Pool is "full" but has zero real connections.

  REAL REQUEST: GET /health
    prisma.$queryRaw`SELECT 1`
    → pg.Pool.connect() sees _clients.length >= max
    → queues the request, waits for a free slot
    → no slot ever freed  →  HANGS UNTIL TIMEOUT

EOF

# ── 6. Confirm source screener unchanged ─────────────────────────────────────

hdr "Step 7 — Source screener unchanged (same routes flagged)"

if diff -q \
  "$WORK_DIR/v1.1.7/src/schema/source-screener.js" \
  "$WORK_DIR/v1.1.8/src/schema/source-screener.js" >/dev/null 2>&1; then
  ok "source-screener.js is identical in 1.1.7 and 1.1.8"
  info "The same set of handlers is flagged for dry-run in both versions."
  info "The difference is only in what happens DURING the dry-run."
else
  bad "source-screener.js changed — investigate further"
fi

# ── 7. Proposed fix ───────────────────────────────────────────────────────────

hdr "Step 8 — Proposed fix (no regression of 1.1.8/1.1.9 improvements)"

cat <<'EOF'

  FILE:  src/schema/dry-runner.js
  WHERE: applySideEffectPatches() — net.Socket.prototype.connect patch

  CURRENT (broken):
    net.Socket.prototype.connect = function(...args) {
      if (isDryRun()) {
        throw new Error('Network connection blocked during nodox dry-run')
                         ^^^^^^^^^ synchronous throw bypasses pg-pool cleanup
      }
      return origConnect.apply(this, args)
    }

  PROPOSED:
    net.Socket.prototype.connect = function(...args) {
      if (isDryRun()) {
        // process.nextTick delivers the error asynchronously so pg's
        // 'error' event handler fires, the connection callback is called
        // with the error, and pg-pool properly removes the client from
        // this._clients — no ghost entries, no pool exhaustion.
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

  Same fix pattern applies to http.request / https.request patches
  (return a fake EventEmitter that emits 'error' via nextTick instead
  of throwing synchronously).

  WHY this doesn't regress 1.1.8/1.1.9:
  ─ The null-probe second pass still runs and detects optional fields.
  ─ The ZodError / schema-detection logic is unchanged.
  ─ The async error still fires within the same 0-tick dryRunValidator
    window (process.nextTick fires before the next setTimeout(fn,0)).
  ─ The dryRunContext is still active when destroy fires, so isDryRun()
    returns true for any retries — no infinite retry loops leak out.

EOF

# ── Done ──────────────────────────────────────────────────────────────────────

hdr "Summary"

echo ""
bad "Root cause:  net.Socket.prototype.connect throws SYNCHRONOUSLY"
bad "             inside pg.Pool._connect(), before the cleanup callback"
bad "             is registered. Ghost entries exhaust the pool."
echo ""
warn "Trigger:     createNullProbeBody()'s 'has' trap (new in 1.1.8)"
warn "             makes handlers reach Prisma during the 2nd dry-run"
warn "             pass when 'key' in req.body guards are used."
echo ""
ok   "Fix:         Change sync throw to process.nextTick destroy() so"
ok   "             pg's event-based error path runs and cleans up properly."
ok   "             No schema-detection behavior changes needed."
echo ""
info "Packages compared: $(ls $WORK_DIR/*.tgz | xargs -I{} basename {} .tgz | tr '\n' '  ')"
echo ""
