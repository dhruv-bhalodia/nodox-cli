#!/usr/bin/env bash
# check-ws-interference.sh
#
# Diagnoses whether nodox's WebSocket server attachment interferes with
# other WebSocket servers sharing the same HTTP server instance.
#
# Reproduction of the reported issue:
#   "Invalid WebSocket frame: RSV1 must be clear" when using
#   app.use(nodox(app, { server: httpServer })) alongside another WS server.
#
# Root cause: ws library calls abortHandshake(socket, 400) for paths that
# don't match /__nodox_ws, destroying the socket before the user's own
# WS server gets a chance to handle the upgrade.
#
# Usage:
#   ./check-ws-interference.sh
#   ./check-ws-interference.sh --verbose

set -euo pipefail

VERBOSE=0
[[ "${1:-}" == "--verbose" ]] && VERBOSE=1

PASS="\033[0;32mPASS\033[0m"
FAIL="\033[0;31mFAIL\033[0m"
INFO="\033[0;33m[info]\033[0m"

log() { [[ $VERBOSE -eq 1 ]] && echo -e "$INFO $*" || true; }

# ── Locate project root ────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if [[ ! -f "src/websocket/ws-server.js" ]]; then
  echo "ERROR: Run this script from the nodox project root." >&2
  exit 1
fi

# ── Check that ws and express are available ────────────────────────────────────
for pkg in ws express; do
  if [[ ! -d "node_modules/$pkg" ]]; then
    echo "ERROR: node_modules/$pkg not found. Run 'npm install' first." >&2
    exit 1
  fi
done

echo ""
echo "=== nodox WebSocket interference diagnostic ==="
echo ""

# ── Test 1: nodox's actual WS server does not interfere with user WS servers ────
echo -n "Test 1  nodox does not abort unmatched upgrade requests ... "

# Write a temp ESM test file in the project dir so node_modules are resolvable
TMPFILE=$(mktemp "$SCRIPT_DIR/nodox-ws-test-XXXXXX.mjs")
trap 'rm -f "$TMPFILE"' EXIT

cat > "$TMPFILE" << 'ESMTEST'
import http from 'http'
import { WebSocket, WebSocketServer } from 'ws'
import { NodoxWebSocketServer } from './src/websocket/ws-server.js'

const httpServer = http.createServer((req, res) => { res.writeHead(200); res.end() })

// Attach nodox's WS server (the code under test)
const nodoxWs = new NodoxWebSocketServer({ getState: () => ({ routes: [] }) })
nodoxWs.attach(httpServer)

// User's own WS server on /ws — simulates graphql-ws, socket.io, etc.
const userWss = new WebSocketServer({ noServer: true })
httpServer.on('upgrade', (req, socket, head) => {
  if (req.url.split('?')[0] === '/ws') {
    userWss.handleUpgrade(req, socket, head, (ws) => {
      userWss.emit('connection', ws, req)
    })
  }
})
userWss.on('connection', (ws) => {
  ws.send(JSON.stringify({ ok: true }))
  ws.close()
})

httpServer.listen(0, '127.0.0.1', async () => {
  const port = httpServer.address().port
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)

  let msg = null
  let errorMsg = null

  ws.on('message', (data) => { msg = data.toString() })
  ws.on('error', (e) => { errorMsg = e.message })

  await new Promise(resolve => setTimeout(resolve, 500))
  httpServer.close()

  if (msg) {
    process.stdout.write(`OK: user WS received message — no interference\n`)
    process.exit(0)
  } else {
    process.stdout.write(`FAIL: error=${errorMsg || 'no message received'}\n`)
    process.exit(1)
  }
})
ESMTEST

set +e
node "$TMPFILE" 2>/dev/null

RESULT=$?
if [[ $RESULT -eq 0 ]]; then
  echo -e "$PASS  (nodox passes through unmatched upgrades)"
elif [[ $RESULT -eq 1 ]]; then
  echo -e "$FAIL  (nodox aborts/rejects the socket — interference confirmed)"
else
  echo -e "\033[0;33mUNKNOWN\033[0m  (exit $RESULT)"
fi

INTERFERENCE_RESULT=$RESULT
set -e

# ── Test 2: Check ws upgrade listener count after nodox attaches ───────────────
echo -n "Test 2  upgrade listener count after nodox attach ... "

LISTENER_COUNT=$(node - << 'NODE_TEST_2'
const http = require('http')
const { WebSocketServer } = require('ws')

const server = http.createServer()
const before = server.listenerCount('upgrade')

new WebSocketServer({ server, path: '/__nodox_ws' })

const after = server.listenerCount('upgrade')
console.log(after)
NODE_TEST_2
)

log "upgrade listeners before=0, after=$LISTENER_COUNT"
if [[ "$LISTENER_COUNT" -gt 0 ]]; then
  echo -e "$PASS  ($LISTENER_COUNT upgrade listener(s) registered)"
else
  echo -e "\033[0;33mINFO\033[0m   (0 upgrade listeners — ws may use a different hook)"
fi

# ── Test 3: noServer workaround verification ───────────────────────────────────
echo -n "Test 3  noServer=true workaround allows user WS through ... "

set +e
node - << 'NODE_TEST_3'
const http = require('http')
const { WebSocketServer } = require('ws')

const server = http.createServer((req, res) => {
  res.writeHead(200)
  res.end()
})

// Simulates the FIXED nodox behavior: noServer + manual upgrade routing
const nodoxWss = new WebSocketServer({ noServer: true })
const userWss = new WebSocketServer({ noServer: true })

server.on('upgrade', (req, socket, head) => {
  const path = req.url.split('?')[0]
  if (path === '/__nodox_ws') {
    nodoxWss.handleUpgrade(req, socket, head, (ws) => {
      nodoxWss.emit('connection', ws, req)
    })
  } else if (path === '/ws') {
    userWss.handleUpgrade(req, socket, head, (ws) => {
      userWss.emit('connection', ws, req)
    })
  }
})

userWss.on('connection', (ws) => {
  ws.send(JSON.stringify({ ok: true }))
  ws.close()
})

server.listen(0, '127.0.0.1', async () => {
  const port = server.address().port
  const WebSocket = require('ws')
  const ws = new WebSocket(`ws://127.0.0.1:${port}/ws`)

  let msg = null
  let errorMsg = null

  ws.on('message', (data) => { msg = data.toString() })
  ws.on('error', (e) => { errorMsg = e.message })

  await new Promise(resolve => setTimeout(resolve, 500))
  server.close()

  if (msg) {
    process.stdout.write(`OK: received ${msg}\n`)
    process.exit(0)
  } else {
    process.stdout.write(`FAIL: error=${errorMsg}\n`)
    process.exit(1)
  }
})
NODE_TEST_3

RESULT=$?
set -e
if [[ $RESULT -eq 0 ]]; then
  echo -e "$PASS  (noServer workaround works correctly)"
else
  echo -e "$FAIL  (workaround also failed — unexpected)"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
echo "=== Summary ==="
if [[ $INTERFERENCE_RESULT -eq 0 ]]; then
  echo -e "  ${PASS}  No interference — nodox correctly passes through unmatched upgrade"
  echo "        requests to other WebSocket servers on the same HTTP server."
elif [[ $INTERFERENCE_RESULT -eq 1 ]]; then
  echo -e "  ${FAIL}  Bug present: nodox's WebSocket server DOES interfere with other"
  echo "        WebSocket servers sharing the same HTTP server."
  echo ""
  echo "  Root cause:"
  echo "    ws library calls abortHandshake(socket, 400) for any upgrade request"
  echo "    whose path doesn't match '/__nodox_ws', destroying the socket before"
  echo "    the user's own WS server can handle it."
  echo ""
  echo "  Fix: use noServer:true + manual upgrade routing in ws-server.js."
else
  echo "  Result inconclusive — re-run with --verbose for details."
fi

echo ""
