
import { createRequire } from 'module'
const _require = createRequire(import.meta.url)

function getExpressVersion() {
  try {
    return _require('express/package.json').version || null
  } catch {
    return null
  }
}

export function extractRoutes(app) {
  const routes = []

  const router = _getRouter(app)
  if (!router) return routes

  walkStack(router.stack, '', routes)

  const seen = new Set()
  return routes.filter(r => {
    const key = `${r.method}:${r.path}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function _getRouter(app) {
  if (typeof app.lazyrouter === 'function') {
    try { app.lazyrouter() } catch {}
  }

  if (app._router?.stack) return app._router

  if (app.router?.stack) return app.router

  return null
}

function walkStack(stack, prefix, routes) {
  if (!Array.isArray(stack)) return

  for (const layer of stack) {
    if (!layer) continue

    if (layer.route) {
      extractFromRoute(layer.route, prefix, routes)
    } else {
      let childStack = layer.handle?.stack ?? null

      if (!childStack && layer.handle) {
        if (typeof layer.handle.lazyrouter === 'function') {
          try { layer.handle.lazyrouter() } catch {}
        }
        childStack = layer.handle._router?.stack ?? null
      }

      if (!childStack && layer._nodoxSubApp) {
        const subApp = layer._nodoxSubApp
        if (typeof subApp.lazyrouter === 'function') {
          try { subApp.lazyrouter() } catch {}
        }
        childStack = subApp._router?.stack ?? null
      }

      if (childStack) {
        const mountPath = extractMountPath(layer)
        walkStack(childStack, prefix + mountPath, routes)
      }
    }
  }
}

function extractMountPath(layer) {
  if (layer._nodoxPath) return layer._nodoxPath

  if (!layer.regexp) {
    return layer.slash ? '' : ''
  }

  if (layer.regexp.fast_slash) return ''
  if (layer.regexp.fast_star) return '*'

  const src = layer.regexp.source

  const match = src.match(/^\^\\\/(.+?)\\\/\?/)
  if (match) {
    return '/' + match[1].replace(/\\\//g, '/')
  }

  const matchGeneral = src.match(
    /^\^(?:\\\/|\/)((?:[a-zA-Z0-9\-_.~@%!$&'*+,;=:]+(?:(?:\\\/|\/)[a-zA-Z0-9\-_.~@%!$&'*+,;=:]+)*)?)(?:[^a-zA-Z0-9\-_.~@%!$&'*+,;=:\\/]|$)/
  )
  if (matchGeneral?.[1]) {
    return '/' + matchGeneral[1].replace(/\\\//g, '/')
  }

  return ''
}

function isWildcardPath(routePath) {
  if (!routePath) return true
  if (routePath.startsWith('/__nodox')) return true

  const catchAlls = ['*', '/*', '(.*)', '/(.*)']
  return catchAlls.includes(routePath)
}

function extractFromRoute(route, prefix, routes) {
  const path = normalizePath(prefix + route.path)

  if (isWildcardPath(path)) return

  const middlewareNames = route.stack
    .map(l => l.handle?.name || 'anonymous')
    .filter(Boolean)

  const handlers = route.stack
    .map(l => l.handle)
    .filter(h => typeof h === 'function')

  for (const layer of route.stack) {
    const method = layer.method?.toUpperCase()
    if (!method) continue

    routes.push({
      method,
      path,
      middlewareNames,
      handlers,
      hasValidator: false,
    })
  }
}

function normalizePath(path) {
  return ('/' + path).replace(/\/+/g, '/').replace(/\/$/, '') || '/'
}

export function checkExpressCompatibility(app) {
  const version = getExpressVersion()
  const major = version ? parseInt(version.split('.')[0], 10) : null

  if (major !== null && (major < 4 || major > 5)) {
    return {
      compatible: false,
      warning: `[nodox] Express ${version} is not supported. nodox requires Express 4.x or 5.x.`,
    }
  }

  const isExpressApp = app != null &&
    typeof app.use === 'function' &&
    typeof app.get === 'function' &&
    typeof app.listen === 'function'

  if (!isExpressApp) {
    return {
      compatible: false,
      warning: '[nodox] The first argument to nodox() must be an Express app instance.',
    }
  }

  if (typeof app.lazyrouter === 'function') {
    try { app.lazyrouter() } catch {}
  }

  return { compatible: true, version: version || 'unknown' }
}
