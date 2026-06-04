
import http from 'http'
import { WebSocket, WebSocketServer } from 'ws'
import { NodoxWebSocketServer } from './src/websocket/ws-server.js'

const httpServer = http.createServer((req, res) => { res.writeHead(200); res.end() })

const nodoxWs = new NodoxWebSocketServer({ getState: () => ({ routes: [] }) })
nodoxWs.attach(httpServer)

const userWss = new WebSocketServer({ noServer: true })
httpServer.on('upgrade', (req, socket, head) => {
  if (req.url.split('?')[0] === '/graphql') {
    userWss.handleUpgrade(req, socket, head, ws => userWss.emit('connection', ws, req))
  }
})
userWss.on('connection', ws => { ws.send(JSON.stringify({ graphql: true })); ws.close() })

httpServer.listen(0, '127.0.0.1', async () => {
  const port = httpServer.address().port

  const wsNodox  = new WebSocket('ws://127.0.0.1:' + port + '/__nodox_ws')
  const wsUser   = new WebSocket('ws://127.0.0.1:' + port + '/graphql')

  let nodoxMsg = null, userMsg = null

  wsNodox.on('message', d => { nodoxMsg = d.toString() })
  wsUser.on('message',  d => { userMsg  = d.toString() })

  await new Promise(r => setTimeout(r, 500))
  httpServer.close()

  const nodoxOk = nodoxMsg && JSON.parse(nodoxMsg).type === 'FULL_STATE_SYNC'
  const userOk  = userMsg  && JSON.parse(userMsg).graphql === true
  process.exit(nodoxOk && userOk ? 0 : 1)
})

