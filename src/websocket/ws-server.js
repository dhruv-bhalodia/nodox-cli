/**
 * WebSocket Server
 *
 * Manages the real-time connection between the nodox middleware and the React UI.
 *
 * Protocol:
 *   FULL_STATE_SYNC  — sent to every new connection and on every server restart.
 *                      Client must OVERWRITE state, not merge, to prevent ghost routes.
 *   route-added      — incremental: a new route was registered (rare after startup)
 *   schema-update    — incremental: schema learned for a route (Phase 2+)
 *   ping             — keepalive from server
 *   pong             — keepalive response from client
 */

import { WebSocketServer, WebSocket } from 'ws'

export class NodoxWebSocketServer {
  /** @type {WebSocketServer|null} */
  #wss = null

  /** @type {Set<WebSocket>} */
  #clients = new Set()

  /** @type {() => object} */
  #getState

  /** @type {import('http').Server|null} */
  #httpServer = null

  /** @type {((req: any, socket: any, head: any) => void)|null} */
  #upgradeHandler = null

  /** @type {Function[]} - the user's own 'upgrade' listeners that we took over */
  #foreignUpgradeListeners = []

  /**
   * @param {object} options
   * @param {Function} options.getState - returns current full state object
   */
  constructor({ getState }) {
    this.#getState = getState
  }

  /**
   * Attach the WebSocket server to an existing HTTP server.
   * @param {import('http').Server} httpServer
   */
  attach(httpServer) {
    // noServer:true prevents ws from registering its own 'upgrade' listener on
    // the HTTP server. Without this, ws calls abortHandshake(socket, 400) for
    // any upgrade request whose path doesn't match '/__nodox_ws', destroying
    // sockets before the user's own WebSocket server can handle them.
    this.#wss = new WebSocketServer({
      noServer: true,
      // Only accept connections from the same host (localhost/127.0.0.1).
      // This blocks cross-origin reads from malicious third-party web pages
      // while still allowing the nodox UI served on the same server to connect.
      verifyClient({ origin, req }) {
        if (!origin) return true // non-browser clients (curl, tests) have no Origin
        try {
          const url = new URL(origin)
          const host = req.headers.host || ''
          // Allow if the origin host matches the server host exactly,
          // or if it's any localhost variant (127.x.x.x, ::1, *.localhost)
          if (url.host === host) return true
          const hostname = url.hostname
          if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') return true
          if (hostname.endsWith('.localhost')) return true

          console.warn(`[nodox] WebSocket connection rejected from origin: ${origin} (server host: ${host})`)
          return false
        } catch {
          return false
        }
      },
    })

    // Take over the 'upgrade' event entirely instead of just appending a listener.
    //
    // Appending is not safe when the user runs their own WebSocket server in the
    // default `new WebSocketServer({ server })` mode (graphql-ws, socket.io, plain
    // ws, etc.). That server registers its OWN 'upgrade' listener which calls
    // abortHandshake(socket, 400) for every path it doesn't own — including
    // '/__nodox_ws' — destroying our handshake whether it runs before us (kills the
    // socket first) or after us (writes a 400 into our already-upgraded socket).
    //
    // So we capture whatever 'upgrade' listeners already exist, remove them, and
    // install a single dispatcher: '/__nodox_ws' is handled ONLY by us; every other
    // path is forwarded to the original listeners exactly as before. The user's own
    // WebSocket server keeps working and never sees our path.
    this.#httpServer = httpServer
    this.#foreignUpgradeListeners = httpServer.listeners('upgrade')
    httpServer.removeAllListeners('upgrade')

    this.#upgradeHandler = (req, socket, head) => {
      // Snapshot the listeners we already own BEFORE absorbing any that were
      // registered after we took over (e.g. a WS server spun up lazily once the
      // app is already serving). A late listener is still independently
      // subscribed for THIS emission, so it runs on its own — we absorb it for
      // next time but must not also forward to it here, or the socket would be
      // handled twice.
      const forwardTargets = this.#foreignUpgradeListeners.slice()
      this.#absorbLateUpgradeListeners()

      const path = req.url.split('?')[0]
      if (path === '/__nodox_ws') {
        this.#wss.handleUpgrade(req, socket, head, (ws) => {
          this.#wss.emit('connection', ws, req)
        })
        return
      }
      // Not ours — hand off to the user's own upgrade listeners untouched.
      for (const listener of forwardTargets) {
        listener.call(httpServer, req, socket, head)
      }
    }
    httpServer.on('upgrade', this.#upgradeHandler)

    this.#wss.on('connection', (ws) => {
      this.#clients.add(ws)

      // Send full state immediately on connect.
      // Client MUST overwrite its state on receiving this — not merge.
      this.#sendFullSync(ws)

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString())
          if (msg.type === 'pong') return // keepalive, ignore
        } catch {
          // Ignore malformed messages
        }
      })

      ws.on('close', () => {
        this.#clients.delete(ws)
      })

      ws.on('error', (err) => {
        // Log but don't crash — client errors should never take down the dev server
        console.warn('[nodox] WebSocket client error:', err.message)
        this.#clients.delete(ws)
      })
    })

    this.#wss.on('error', (err) => {
      console.warn('[nodox] WebSocket server error:', err.message)
    })

    // Keepalive ping every 30 seconds
    this.#startKeepalive()

    return this
  }

  /**
   * Self-healing: pull in any 'upgrade' listeners that were registered after we
   * took over (a WS server created lazily once the app is already serving) and
   * re-assert ourselves as the sole dispatcher. Without this, a late listener
   * would sit alongside ours and abort '/__nodox_ws' all over again. Idempotent
   * and cheap — the common case (no late listeners) is a single length check.
   *
   * Known limit: we never prune a captured listener after its WS server closes,
   * so an in-process teardown+recreate (rare; some HMR setups) leaves a dead
   * listener we still forward to. Harmless for nodemon-style full restarts.
   */
  #absorbLateUpgradeListeners() {
    if (!this.#httpServer) return
    const current = this.#httpServer.listeners('upgrade')
    // Fast path: we're the only listener, nothing was added behind our back.
    if (current.length === 1 && current[0] === this.#upgradeHandler) return

    let changed = false
    for (const listener of current) {
      if (listener !== this.#upgradeHandler && !this.#foreignUpgradeListeners.includes(listener)) {
        this.#foreignUpgradeListeners.push(listener)
        changed = true
      }
    }
    if (changed) {
      this.#httpServer.removeAllListeners('upgrade')
      this.#httpServer.on('upgrade', this.#upgradeHandler)
    }
  }

  /**
   * Send full state to one specific client.
   * @param {WebSocket} ws
   */
  #sendFullSync(ws) {
    this.#send(ws, {
      type: 'FULL_STATE_SYNC',
      ...this.#getState(),
      timestamp: Date.now(),
    })
  }

  /**
   * Broadcast full state to ALL connected clients.
   * Called when routes change significantly (e.g. after deferred extraction).
   */
  broadcastFullSync() {
    const state = {
      type: 'FULL_STATE_SYNC',
      ...this.#getState(),
      timestamp: Date.now(),
    }
    for (const ws of this.#clients) {
      this.#send(ws, state)
    }
  }

  /**
   * Broadcast an incremental update to all clients.
   * @param {object} message
   */
  broadcast(message) {
    for (const ws of this.#clients) {
      this.#send(ws, message)
    }
  }

  /**
   * Safe JSON send — swallows errors on closed connections.
   * @param {WebSocket} ws
   * @param {object} data
   */
  #send(ws, data) {
    if (ws.readyState !== WebSocket.OPEN) return
    try {
      ws.send(JSON.stringify(data))
    } catch {
      // Client disconnected mid-send — remove and move on
      this.#clients.delete(ws)
    }
  }

  #startKeepalive() {
    const interval = setInterval(() => {
      for (const ws of this.#clients) {
        if (ws.readyState === WebSocket.OPEN) {
          this.#send(ws, { type: 'ping' })
        } else {
          this.#clients.delete(ws)
        }
      }
    }, 30_000)

    // Don't hold the process open just for keepalives
    interval.unref?.()
  }

  /**
   * Gracefully close the WebSocket server.
   */
  close() {
    for (const ws of this.#clients) {
      try { ws.close() } catch {}
    }
    this.#clients.clear()
    this.#wss?.close()

    // Relinquish the 'upgrade' event: remove our dispatcher and restore the
    // user's own listeners so their WebSocket server keeps working after us.
    if (this.#httpServer && this.#upgradeHandler) {
      this.#httpServer.removeListener('upgrade', this.#upgradeHandler)
      for (const listener of this.#foreignUpgradeListeners) {
        this.#httpServer.on('upgrade', listener)
      }
    }
    this.#upgradeHandler = null
    this.#foreignUpgradeListeners = []
    this.#httpServer = null
  }

  get clientCount() {
    return this.#clients.size
  }
}
