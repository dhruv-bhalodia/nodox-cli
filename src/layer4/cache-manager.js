
import fs from 'fs'
import { mergeShapes } from '../schema/response-interceptor.js'

const CACHE_VERSION = 1

export function readCache(cacheFile) {
  try {
    if (!fs.existsSync(cacheFile)) {
      return { version: CACHE_VERSION, routes: {} }
    }

    const raw = fs.readFileSync(cacheFile, 'utf8')
    const parsed = JSON.parse(raw)

    if (!parsed || typeof parsed !== 'object') {
      return { version: CACHE_VERSION, routes: {} }
    }

    if (!parsed.routes || typeof parsed.routes !== 'object') {
      parsed.routes = {}
    }

    return parsed
  } catch {
    return { version: CACHE_VERSION, routes: {} }
  }
}

export function writeCache(cacheFile, cache) {
  const updated = {
    ...cache,
    version: CACHE_VERSION,
    generatedAt: new Date().toISOString(),
  }

  const json = JSON.stringify(updated, null, 2)
  const tmpFile = cacheFile + '.tmp'

  fs.writeFileSync(tmpFile, json, 'utf8')

  fs.renameSync(tmpFile, cacheFile)
}

export function mergeCacheEntry(cache, key, exchange) {
  const routes = { ...cache.routes }
  const existing = routes[key]
  const now = new Date().toISOString()

  if (!existing) {
    routes[key] = {
      method: exchange.method,
      path: exchange.path,
      input: exchange.reqShape ?? null,
      output: exchange.resShape ?? null,
      inputConfidence: exchange.reqShape ? 'observed' : 'none',
      outputConfidence: exchange.resShape ? 'observed' : 'none',
      seenCount: 1,
      lastSeen: now,
    }
  } else {
    const mergedInput = exchange.reqShape
      ? mergeShapes(existing.input, exchange.reqShape)
      : existing.input

    const mergedOutput = exchange.resShape
      ? mergeShapes(existing.output, exchange.resShape)
      : existing.output

    routes[key] = {
      ...existing,
      input: mergedInput,
      output: mergedOutput,
      inputConfidence: mergedInput ? 'observed' : existing.inputConfidence,
      outputConfidence: mergedOutput ? 'observed' : existing.outputConfidence,
      seenCount: (existing.seenCount || 0) + 1,
      lastSeen: now,
    }
  }

  return { ...cache, routes }
}

export function pruneCache(cacheFile) {
  writeCache(cacheFile, { version: CACHE_VERSION, routes: {} })
}

export function getCacheStats(cache) {
  const routes = Object.values(cache.routes || {})
  return {
    routeCount: routes.length,
    withInput: routes.filter(r => r.input).length,
    withOutput: routes.filter(r => r.output).length,
  }
}
