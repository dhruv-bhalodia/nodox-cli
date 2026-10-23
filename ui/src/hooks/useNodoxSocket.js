
import { useState, useEffect, useRef, useCallback } from 'react'

const BACKOFF_STEPS = [500, 1000, 2000, 4000, 8000]

export function useNodoxSocket() {
  const [routes, setRoutes] = useState([])
  const [status, setStatus] = useState('connecting')
  const [lastSync, setLastSync] = useState(null)

  const wsRef = useRef(null)
  const attemptRef = useRef(0)
  const unmountedRef = useRef(false)
  const timerRef = useRef(null)

  const connect = useCallback(() => {
    if (unmountedRef.current) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const wsUrl = `${protocol}//${window.location.host}/__nodox_ws`

    const ws = new WebSocket(wsUrl)
    wsRef.current = ws

    ws.onopen = () => {
      if (unmountedRef.current) { ws.close(); return }
      attemptRef.current = 0
      setStatus('connected')
    }

    ws.onmessage = (event) => {
      if (unmountedRef.current) return

      try {
        const msg = JSON.parse(event.data)

        switch (msg.type) {
          case 'FULL_STATE_SYNC':
            setRoutes(msg.routes ?? [])
            setLastSync(msg.timestamp)
            break

          case 'route-added':
            setRoutes(prev => {
              const exists = prev.some(r => r.method === msg.route.method && r.path === msg.route.path)
              return exists ? prev : [...prev, msg.route]
            })
            break

          case 'schema-update':
            setRoutes(prev => prev.map(r =>
              r.method === msg.method && r.path === msg.path
                ? { ...r, schema: msg.schema }
                : r
            ))
            break

          case 'ping':
            ws.send(JSON.stringify({ type: 'pong' }))
            break

          default:
            break
        }
      } catch {
      }
    }

    ws.onclose = () => {
      if (unmountedRef.current) return

      const attempt = attemptRef.current
      const delay = BACKOFF_STEPS[Math.min(attempt, BACKOFF_STEPS.length - 1)]
      attemptRef.current = attempt + 1

      setStatus(attempt === 0 ? 'disconnected' : 'reconnecting')

      timerRef.current = setTimeout(() => {
        if (!unmountedRef.current) {
          setStatus('reconnecting')
          connect()
        }
      }, delay)
    }

    ws.onerror = () => {
    }
  }, [])

  useEffect(() => {
    unmountedRef.current = false
    connect()

    return () => {
      unmountedRef.current = true
      clearTimeout(timerRef.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { routes, status, lastSync }
}
