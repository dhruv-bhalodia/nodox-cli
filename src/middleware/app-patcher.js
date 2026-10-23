
const ROUTE_METHODS = ['get', 'post', 'put', 'delete', 'del', 'patch', 'options', 'head', 'all']

export function patchApp(app, { onRouteRegistered, onUse } = {}) {
  const originalMethods = {}

  originalMethods.use = app.use.bind(app)
  app.use = function patchedUse(...args) {
    const result = originalMethods.use.apply(app, args)

    const _stack = (app._router || app.router)?.stack
    if (_stack?.length) {
      const lastLayer = _stack[_stack.length - 1]
      const pathArg = typeof args[0] === 'string' ? args[0] : null
      if (pathArg && lastLayer && !lastLayer._nodoxPath) {
        lastLayer._nodoxPath = pathArg
      }

      const fnArgs = args.filter(a => a && typeof a === 'function')
      for (const fn of fnArgs) {
        if (typeof fn.handle === 'function' && typeof fn.set === 'function') {
          if (lastLayer && !lastLayer._nodoxSubApp) {
            lastLayer._nodoxSubApp = fn
          }
          break
        }
      }
    }

    if (typeof onUse === 'function') onUse()

    return result
  }

  for (const method of ROUTE_METHODS) {
    if (typeof app[method] !== 'function') continue

    originalMethods[method] = app[method].bind(app)
    app[method] = function patchedMethod(path, ...handlers) {
      const result = originalMethods[method].call(app, path, ...handlers)

      if (typeof onRouteRegistered === 'function') {
        onRouteRegistered(method.toUpperCase(), path, handlers)
      }

      return result
    }
  }

  return function unpatch() {
    app.use = originalMethods.use
    for (const method of ROUTE_METHODS) {
      if (originalMethods[method]) {
        app[method] = originalMethods[method]
      }
    }
  }
}
