
export function inferShape(value, depth = 0) {
  if (depth > 8) return { type: 'object', description: '(depth limit)' }

  if (value === null) return { type: 'null' }
  if (value === undefined) return { type: 'null' }
  if (value instanceof Date) return { type: 'string', format: 'date-time' }

  const type = typeof value

  if (type === 'boolean') return { type: 'boolean' }
  if (type === 'number') {
    return Number.isInteger(value)
      ? { type: 'integer' }
      : { type: 'number' }
  }
  if (type === 'string') {
    if (/^\d{4}-\d{2}-\d{2}T/.test(value)) return { type: 'string', format: 'date-time' }
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return { type: 'string', format: 'date' }
    if (/^[a-f0-9-]{36}$/i.test(value)) return { type: 'string', format: 'uuid' }
    if (/^https?:\/\//.test(value)) return { type: 'string', format: 'uri' }
    return { type: 'string' }
  }

  if (Array.isArray(value)) {
    if (value.length === 0) return { type: 'array', items: {} }
    const itemShape = inferShape(value[0], depth + 1)
    if (value.length > 1) {
      const secondShape = inferShape(value[1], depth + 1)
      return { type: 'array', items: mergeShapes(itemShape, secondShape) }
    }
    return { type: 'array', items: itemShape }
  }

  if (type === 'object') {
    const properties = {}
    const keys = Object.keys(value)

    const limitedKeys = keys.slice(0, 50)
    for (const key of limitedKeys) {
      properties[key] = inferShape(value[key], depth + 1)
    }

    const result = { type: 'object', properties }
    if (keys.length > 50) {
      result.description = `(showing 50 of ${keys.length} fields)`
    }
    return result
  }

  return { type: 'any' }
}

export function mergeShapes(a, b) {
  if (!a) return b
  if (!b) return a

  if (a.type !== b.type && a.type && b.type) {
    if (
      (a.type === 'integer' && b.type === 'number') ||
      (a.type === 'number' && b.type === 'integer')
    ) {
      return { type: 'number' }
    }
    return { anyOf: [a, b] }
  }

  if (a.type === 'object' && b.type === 'object') {
    const allKeys = new Set([
      ...Object.keys(a.properties || {}),
      ...Object.keys(b.properties || {}),
    ])
    const properties = {}
    for (const key of allKeys) {
      if (a.properties?.[key] && b.properties?.[key]) {
        properties[key] = mergeShapes(a.properties[key], b.properties[key])
      } else {
        properties[key] = a.properties?.[key] || b.properties?.[key]
      }
    }
    return { type: 'object', properties }
  }

  if (a.type === 'array' && b.type === 'array') {
    return {
      type: 'array',
      items: mergeShapes(a.items, b.items),
    }
  }

  if (a.type === b.type) {
    if (a.format !== b.format) {
      const merged = { ...a }
      delete merged.format
      return merged
    }
    return a
  }

  return a
}

function isWildcardRoute(path) {
  if (!path) return true
  return path === '*' ||
    path === '/*' ||
    path.startsWith('/__nodox') ||
    path === '/favicon.ico' ||
    /\*/.test(path)
}

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH'])

const QUERY_METHODS = new Set(['GET', 'DELETE', 'HEAD', 'OPTIONS'])

export function createResponseInterceptor({ onResponseShape, parsedValueToSchema, onRequestBodyShape, onRequestQueryShape }) {
  return function responseInterceptorMiddleware(req, res, next) {
    const originalJson = res.json.bind(res)

    res.json = function interceptedJson(body) {
      const routePath = req.route
        ? ((req.baseUrl || '') + req.route.path).replace(/\/+/g, '/').replace(/\/$/, '') || '/'
        : null

      if (routePath && !isWildcardRoute(routePath)) {
        const method = req.method?.toUpperCase() ?? ''

        if (typeof onRequestBodyShape === 'function' &&
            BODY_METHODS.has(method) &&
            req.body !== null && req.body !== undefined &&
            typeof req.body === 'object' &&
            Object.keys(req.body).length > 0) {
          try {
            onRequestBodyShape(method, routePath, inferShape(req.body))
          } catch {}
        }

        if (typeof onRequestQueryShape === 'function' &&
            QUERY_METHODS.has(method) &&
            req.query !== null && req.query !== undefined &&
            typeof req.query === 'object' &&
            Object.keys(req.query).length > 0) {
          try {
            onRequestQueryShape(method, routePath, inferShape(req.query))
          } catch {}
        }

        if (body !== undefined) {
          try {
            let shape, confidence
            if (parsedValueToSchema && body !== null && typeof body === 'object') {
              const knownSchema = parsedValueToSchema.get(body)
              if (knownSchema) {
                shape = knownSchema
                confidence = 'inferred'
              }
            }

            if (!shape) {
              shape = inferShape(body)
              confidence = 'observed'
            }

            onResponseShape(method, routePath, shape, confidence)
          } catch {
          }
        }
      }

      return originalJson(body)
    }

    next()
  }
}
