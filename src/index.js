
import _path from 'path'
import { patchApp } from './middleware/app-patcher.js'
import { extractRoutes, checkExpressCompatibility } from './extractor/route-extractor.js'
import { NodoxWebSocketServer } from './websocket/ws-server.js'
import { attachUiRoutes, createUiHandler } from './ui-server/ui-server.js'
import { createResponseInterceptor } from './schema/response-interceptor.js'
import {
  onRouteRegistered as schemaOnRouteRegistered,
  runDeferredDryRuns,
  enrichRoutesWithSchemas,
  onResponseObserved,
  onInputObserved,
  onQueryObserved,
  initSchemaDetector,
  loadCacheIntoRegistry,
  parsedValueToSchema,
  patchZodWithRegistry,
  patchZodProtoForOutputTracking,
  wasRouteRegistered,
} from './schema/schema-detector.js'
import { findCacheFile } from './layer4/cache-reader.js'

export { validate } from './schema/validate.js'

export default function nodox(appOrOptions, options = {}) {
  let app = null
  if (appOrOptions && typeof appOrOptions.use === 'function') {
    app = appOrOptions
  } else if (appOrOptions && typeof appOrOptions === 'object') {
    options = appOrOptions
  }

  const {
    uiPath = '/__nodox',
    log = true,
    schema = true,
    intercept = true,
    force = false,
    info,
    server: externalServer = null,
  } = options

  if (process.env.NODE_ENV === 'production' && !force) {
    console.warn(
      '[nodox] Disabled in production (NODE_ENV=production).\n' +
      '        Pass { force: true } to override — but do not expose /__nodox publicly.'
    )
    return function nodoxDisabledMiddleware(_req, _res, next) { next() }
  }

  let routes = []
  let wsServer = null
  let serverAttached = false
  let extractionTimer = null
  let appInitDone = false
  let portLogged = false

  if (schema) initSchemaDetector()

  let _userZodEsmPatchPromise = null
  function ensureUserZodEsmPatched() {
    if (_userZodEsmPatchPromise) return _userZodEsmPatchPromise
    _userZodEsmPatchPromise = (async () => {
      try {
        let zodEsmPath = null
        try {
          const searchPaths = [
            process.argv[1] ? _path.dirname(process.argv[1]) : null,
            process.cwd(),
          ].filter(Boolean)
          const cjsPath = require.resolve('zod', { paths: searchPaths })
          zodEsmPath = cjsPath.replace(/index\.cjs$/, 'index.js')
        } catch {  }
        const zodMod = zodEsmPath
          ? await import(zodEsmPath).catch(() => null)
          : await import('zod').catch(() => null)
        if (zodMod) {
          const z = zodMod?.z || zodMod?.default?.z || zodMod
          if (z) {
            patchZodWithRegistry(z)
            patchZodProtoForOutputTracking(z)
          }
        }
      } catch {}
    })()
    return _userZodEsmPatchPromise
  }

  const cacheCount = schema ? loadCacheIntoRegistry() : 0

  function scheduleExtraction() {
    if (extractionTimer) clearTimeout(extractionTimer)
    extractionTimer = setTimeout(doExtraction, 50)
  }

  function doExtraction() {
    if (!app) return
    extractionTimer = null
    const raw = extractRoutes(app)

    if (schema) {
      for (const route of raw) {
        if (!wasRouteRegistered(route.method, route.path) && route.handlers?.length) {
          schemaOnRouteRegistered(route.method, route.path, route.handlers)
        }
      }
    }

    routes = schema ? enrichRoutesWithSchemas(raw) : raw
    wsServer?.broadcastFullSync()
  }

  const logStartup = (port = 'PORT') => {
    if (portLogged) return
    portLogged = true

    if (routes.length === 0) {
      const raw = extractRoutes(app)
      if (schema) {
        for (const route of raw) {
          if (!wasRouteRegistered(route.method, route.path) && route.handlers?.length) {
            schemaOnRouteRegistered(route.method, route.path, route.handlers)
          }
        }
      }
      routes = schema ? enrichRoutesWithSchemas(raw) : raw
    }

    console.log(
      `\n  \x1b[36m◆ nodox\x1b[0m  \x1b[2mUI →\x1b[0m \x1b[4;36mhttp://localhost:${port}${uiPath}\x1b[0m`
    )
    const count = routes.length
    const schemaCount = routes.filter(r =>
      (r.schema?.inputConfidence && r.schema.inputConfidence !== 'none') ||
      (r.schema?.outputConfidence && r.schema.outputConfidence !== 'none') ||
      r.hasValidator
    ).length
    console.log(
      `  \x1b[2m         ${count} route${count !== 1 ? 's' : ''} discovered` +
      (schemaCount > 0 ? `, ${schemaCount} with schema` : '') + `\x1b[0m\n`
    )
  }

  function getState() { return { routes } }

  function _initWithApp(theApp) {
    if (appInitDone) return
    appInitDone = true
    app = theApp

    const compat = checkExpressCompatibility(theApp)
    if (!compat.compatible) console.warn(compat.warning)

    if (typeof theApp.listen === 'function') {
      const originalListen = theApp.listen
      theApp.listen = function nodoxPatchedListen(...args) {
        const server = originalListen.apply(this, args)
        server.once('listening', async () => {
          const addr = server.address()
          const port = typeof addr === 'string' ? addr : addr?.port

          if (schema) await ensureUserZodEsmPatched()
          if (schema) await runDeferredDryRuns()

          if (schema && app) routes = enrichRoutesWithSchemas(extractRoutes(app))

          if (log && port && !portLogged) logStartup(port)

          if (!serverAttached) {
            serverAttached = true
            wsServer = new NodoxWebSocketServer({ getState })
            wsServer.attach(server)
          }
        })
        return server
      }
    }

    patchApp(theApp, {
      onRouteRegistered(method, path, handlers) {
        if (schema) schemaOnRouteRegistered(method, path, handlers)
        scheduleExtraction()
      },
      onUse() {
        scheduleExtraction()
      }
    })

    attachUiRoutes(theApp, { uiPath, getState, info })
  }

  const wasEarlyInit = !!app
  if (wasEarlyInit) _initWithApp(app)

  if (externalServer) {
    const onListening = async () => {
      const addr = externalServer.address()
      const port = typeof addr === 'string' ? addr : addr?.port
      if (schema) await ensureUserZodEsmPatched()
      if (schema) await runDeferredDryRuns()
      if (schema && app) routes = enrichRoutesWithSchemas(extractRoutes(app))
      if (log && port && !portLogged) logStartup(port)
      if (!serverAttached) {
        serverAttached = true
        wsServer = new NodoxWebSocketServer({ getState })
        wsServer.attach(externalServer)
      }
    }
    if (externalServer.listening) {
      onListening()
    } else {
      externalServer.once('listening', onListening)
    }
  }

  setTimeout(async () => {
    if (schema) {
      await ensureUserZodEsmPatched()
      await runDeferredDryRuns()
      if (app) routes = enrichRoutesWithSchemas(extractRoutes(app))
    }
    doExtraction()

    if (log) {
      if (app) _warnIfNoBodyParser(app)

      if (schema && cacheCount === 0 && !findCacheFile()) {
        console.log('[nodox] Run `npx nodox init` once to enable test suite schema seeding.')
      }

      const server = app?._router?.server || app?.server
      if (server?.listening) {
        logStartup(server.address().port)
      } else if (!portLogged && app) {
        logStartup()
      }
    }

    wsServer?.broadcastFullSync()
  }, 0)

  const responseInterceptor = intercept
    ? createResponseInterceptor({
        parsedValueToSchema,
        onRequestBodyShape(method, routePath, shape) {
          if (!schema) return
          onInputObserved(method, routePath, shape, 'observed', () => {
            doExtraction()
            wsServer?.broadcastFullSync()
          })
        },
        onRequestQueryShape(method, routePath, shape) {
          if (!schema) return
          onQueryObserved(method, routePath, shape, () => {
            doExtraction()
            wsServer?.broadcastFullSync()
          })
        },
        onResponseShape(method, routePath, shape, confidence) {
          if (!schema) return
          onResponseObserved(method, routePath, shape, confidence, () => {
            doExtraction()
            wsServer?.broadcastFullSync()
          })
        }
      })
    : null

  const inlineUiHandler = !wasEarlyInit ? createUiHandler({ uiPath, getState, info }) : null

  return function nodoxMiddleware(req, res, next) {
    if (!appInitDone && req.app) {
      _initWithApp(req.app)
      scheduleExtraction()
    }

    if (inlineUiHandler && req.path.startsWith(uiPath)) {
      return inlineUiHandler(req, res, next)
    }

    if (!serverAttached) {
      serverAttached = true
      const httpServer = req.socket?.server
      if (httpServer) {
        wsServer = new NodoxWebSocketServer({ getState })
        wsServer.attach(httpServer)

        if (log && !portLogged) {
          const address = httpServer.address()
          const port = typeof address === 'string' ? address : address?.port
          if (port) logStartup(port)
        }
      } else {
        console.warn('[nodox] Could not obtain HTTP server reference — WebSocket disabled.')
      }
    }

    if (responseInterceptor) responseInterceptor(req, res, () => {})
    next()
  }
}

function _warnIfNoBodyParser(app) {
  if (!app._router?.stack) return
  const hasBodyParser = app._router.stack.some(layer => {
    const name = layer.handle?.name || ''
    return ['jsonParser', 'urlencodedParser', 'json', 'bodyParser'].includes(name)
  })
  if (!hasBodyParser) {
    console.warn(
      '[nodox] Warning: no body parser detected.\n' +
      '        Add express.json() before nodox() for the playground to work.\n'
    )
  }
}
