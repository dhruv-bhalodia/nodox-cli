
import http from 'http'
import https from 'https'
import path from 'path'

let inferShape, mergeShapes, readCache, writeCache, mergeCacheEntry, findCacheFile

async function loadInternals() {
  const interceptor = await import('./response-interceptor-compat.js')
  inferShape = interceptor.inferShape
  mergeShapes = interceptor.mergeShapes
  const manager = await import('./cache-manager.js')
  readCache = manager.readCache
  writeCache = manager.writeCache
  mergeCacheEntry = manager.mergeCacheEntry
  const reader = await import('./cache-reader.js')
  findCacheFile = reader.findCacheFile
}

const _ready = loadInternals().catch(err => {
  console.warn('[nodox] jest-setup: failed to load internals:', err.message)
})

const exchanges = new Map()

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '::1', '0.0.0.0'])
function isLocalHost(hostname) {
  return LOCAL_HOSTS.has(hostname) || hostname?.endsWith('.localhost')
}

const originalHttpRequest  = http.request.bind(http)
const originalHttpsRequest = https.request.bind(https)

function makePatched(originalFn) {
  return function patchedRequest(input, options, callback) {
    if (typeof options === 'function') { callback = options; options = {} }

    let method = 'GET', urlPath = '/', hostname = ''

    if (typeof input === 'string' || input instanceof URL) {
      try {
        const u = input instanceof URL ? input : new URL(input)
        method    = ((options && options.method) || 'GET').toUpperCase()
        urlPath   = u.pathname + (u.search || '')
        hostname  = u.hostname
      } catch {  }
    } else if (input && typeof input === 'object') {
      method   = (input.method || 'GET').toUpperCase()
      urlPath  = input.path || '/'
      hostname = input.hostname || (input.host ? input.host.split(':')[0] : '')
    }

    if (!isLocalHost(hostname)) {
      return originalFn(input, options, callback)
    }

    const reqBodyChunks = []

    const wrappedCallback = callback
      ? (res) => {
          const resChunks = []

          res.on('data', (chunk) => {
            if (chunk) resChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
          })

          res.on('end', () => {
            if (!inferShape) return

            try {
              const contentType = res.headers?.['content-type'] || ''
              const rawBody     = Buffer.concat(resChunks).toString()

              let parsed = null
              if (contentType.includes('application/json') && rawBody.trim()) {
                try { parsed = JSON.parse(rawBody) } catch {  }
              }

              if (parsed !== null && res.statusCode < 500) {
                const key      = `${method}:${urlPath}`
                const resShape = inferShape(parsed)
                const existing = exchanges.get(key)

                if (existing) {
                  exchanges.set(key, {
                    ...existing,
                    resShape:   mergeShapes(existing.resShape, resShape),
                    resStatus:  res.statusCode,
                  })
                } else {
                  exchanges.set(key, {
                    method, path: urlPath,
                    reqShape: null, resShape, resStatus: res.statusCode,
                  })
                }
              }
            } catch {  }
          })

          callback(res)
        }
      : null

    const req = originalFn(input, options, wrappedCallback)

    const origWrite = req.write.bind(req)
    req.write = function interceptedWrite(chunk, encoding, cb) {
      if (chunk) reqBodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      return origWrite(chunk, encoding, cb)
    }

    const origEnd = req.end.bind(req)
    req.end = function interceptedEnd(chunk, encoding, cb) {
      if (chunk) reqBodyChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))

      if (reqBodyChunks.length > 0 && inferShape) {
        try {
          const raw    = Buffer.concat(reqBodyChunks).toString()
          const parsed = JSON.parse(raw)
          const key    = `${method}:${urlPath}`
          const reqShape = inferShape(parsed)
          const existing = exchanges.get(key)

          if (existing) {
            exchanges.set(key, { ...existing, reqShape: mergeShapes(existing.reqShape, reqShape) })
          } else {
            exchanges.set(key, { method, path: urlPath, reqShape, resShape: null, resStatus: null })
          }
        } catch {  }
      }

      return origEnd(chunk, encoding, cb)
    }

    return req
  }
}

http.request = makePatched(originalHttpRequest)
http.get = function patchedGet(input, options, callback) {
  if (typeof options === 'function') { callback = options; options = {} }
  const req = http.request(input, { ...(options || {}), method: 'GET' }, callback)
  req.end()
  return req
}

https.request = makePatched(originalHttpsRequest)
https.get = function patchedHttpsGet(input, options, callback) {
  if (typeof options === 'function') { callback = options; options = {} }
  const req = https.request(input, { ...(options || {}), method: 'GET' }, callback)
  req.end()
  return req
}

process.on('exit', () => {
  if (exchanges.size === 0) return
  if (!writeCache || !readCache || !mergeCacheEntry || !findCacheFile) return

  try {
    const cacheFile = findCacheFile() ?? path.resolve(process.cwd(), '.apicache.json')
    const existing  = readCache(cacheFile)

    let merged = { ...existing }
    for (const [key, exchange] of exchanges) {
      merged = mergeCacheEntry(merged, key, exchange)
    }

    writeCache(cacheFile, merged)
  } catch (err) {
    console.warn('[nodox] Failed to write .apicache.json:', err.message)
  }
})
