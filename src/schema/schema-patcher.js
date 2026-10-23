
import { createRequire } from 'module'

const require = createRequire(import.meta.url)

export const capturedSchemas = new WeakMap()

let zodPatched = false
let joiPatched = false

export function patchZod(z) {
  if (zodPatched || !z) return z
  zodPatched = true

  const methodsToWrap = ['object', 'string', 'number', 'boolean', 'array',
    'union', 'intersection', 'tuple', 'record', 'map', 'set', 'literal',
    'enum', 'nativeEnum', 'optional', 'nullable', 'any', 'unknown', 'never',
    'void', 'date', 'bigint', 'symbol', 'undefined', 'null', 'nan',
    'promise', 'function', 'lazy', 'discriminatedUnion', 'effects']

  for (const method of methodsToWrap) {
    if (typeof z[method] !== 'function') continue

    const original = z[method].bind(z)
    z[method] = function patchedZodMethod(...args) {
      const schema = original(...args)
      if (schema && typeof schema === 'object') {
        capturedSchemas.set(schema, {
          type: 'zod',
          zodType: method,
          shape: method === 'object' ? args[0] : null,
          source: captureCallsite(),
        })
      }
      return schema
    }
    Object.defineProperty(z[method], 'name', { value: `patched_${method}` })
  }

  return z
}

export function patchJoi(joi) {
  if (joiPatched || !joi) return joi
  joiPatched = true

  const methodsToWrap = ['object', 'string', 'number', 'boolean', 'array',
    'any', 'alternatives', 'binary', 'date', 'func', 'link', 'symbol']

  for (const method of methodsToWrap) {
    if (typeof joi[method] !== 'function') continue

    const original = joi[method].bind(joi)
    joi[method] = function patchedJoiMethod(...args) {
      const schema = original(...args)
      if (schema && typeof schema === 'object') {
        capturedSchemas.set(schema, {
          type: 'joi',
          joiType: method,
          source: captureCallsite(),
        })
      }
      return schema
    }
  }

  return joi
}

export function patchAvailableSchemaLibraries() {
  try {
    const zod = require('zod')
    if (zod?.z) patchZod(zod.z)
    else if (zod?.default?.z) patchZod(zod.default.z)
    else if (zod?.object) patchZod(zod)
    else if (zod?.default?.object) patchZod(zod.default)
  } catch {
  }

  try {
    const joi = require('joi')
    if (joi?.object) patchJoi(joi)
    else if (joi?.default?.object) patchJoi(joi.default)
  } catch {
  }
}

function captureCallsite() {
  try {
    const err = new Error()
    const lines = err.stack?.split('\n') || []
    for (const line of lines.slice(3)) {
      const match = line.match(/\((.+?):(\d+):\d+\)/) ||
                    line.match(/at (.+?):(\d+):\d+/)
      if (!match) continue
      const file = match[1]
      if (file.includes('nodox-cli/src') || file.includes('node_modules/nodox-cli')) continue
      if (file.includes('node:internal')) continue
      const cwd = process.cwd()
      const relative = file.startsWith(cwd)
        ? file.slice(cwd.length).replace(/^[\\/]/, '')
        : file.split(/[\\/]node_modules[\\/]/).pop() ?? file
      return `${relative}:${match[2]}`
    }
    return null
  } catch {
    return null
  }
}
