
import { WebSocketServer, WebSocket } from 'ws'

export class NodoxWebSocketServer {
  #wss = null

  #clients = new Set()

  #getState

  #httpServer = null

  #upgradeHandler = null

  #foreignUpgradeListeners = []

  constructor({ getState }) {
    this.#getState = getState
  }

  attach(httpServer) {
    this.#wss = new WebSocketServer({
      noServer: true,
      verifyClient({ origin, req }) {
        if (!origin) return true
        try {
          const url = new URL(origin)
          const host = req.headers.host || ''
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

    this.#httpServer = httpServer
    this.#foreignUpgradeListeners = httpServer.listeners('upgrade')
    httpServer.removeAllListeners('upgrade')

    this.#upgradeHandler = (req, socket, head) => {
      const forwardTargets = this.#foreignUpgradeListeners.slice()
      this.#absorbLateUpgradeListeners()

      const path = req.url.split('?')[0]
      if (path === '/__nodox_ws') {
        this.#wss.handleUpgrade(req, socket, head, (ws) => {
          this.#wss.emit('connection', ws, req)
        })
        return
      }
      for (const listener of forwardTargets) {
        listener.call(httpServer, req, socket, head)
      }
    }
    httpServer.on('upgrade', this.#upgradeHandler)

    this.#wss.on('connection', (ws) => {
      this.#clients.add(ws)

      this.#sendFullSync(ws)

      ws.on('message', (data) => {
        try {
          const msg = JSON.parse(data.toString())
          if (msg.type === 'pong') return
        } catch {
        }
      })

      ws.on('close', () => {
        this.#clients.delete(ws)
      })

      ws.on('error', (err) => {
        console.warn('[nodox] WebSocket client error:', err.message)
        this.#clients.delete(ws)
      })
    })

    this.#wss.on('error', (err) => {
      console.warn('[nodox] WebSocket server error:', err.message)
    })

    this.#startKeepalive()

    return this
  }

  #absorbLateUpgradeListeners() {
    if (!this.#httpServer) return
    const current = this.#httpServer.listeners('upgrade')
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

  #sendFullSync(ws) {
    this.#send(ws, {
      type: 'FULL_STATE_SYNC',
      ...this.#getState(),
      timestamp: Date.now(),
    })
  }

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

  broadcast(message) {
    for (const ws of this.#clients) {
      this.#send(ws, message)
    }
  }

  #send(ws, data) {
    if (ws.readyState !== WebSocket.OPEN) return
    try {
      ws.send(JSON.stringify(data))
    } catch {
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

    interval.unref?.()
  }

  close() {
    for (const ws of this.#clients) {
      try { ws.close() } catch {}
    }
    this.#clients.clear()
    this.#wss?.close()

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
