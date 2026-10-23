
import { looksLikeValidator } from './source-screener.js'
import { dryRunValidator, registerForDryRun, _schemaRegistryArray, markSchemaDetectedInDryRun, createNullProbeBody } from './dry-runner.js'
import { patchZod, patchJoi, capturedSchemas } from './schema-patcher.js'
import { toJsonSchema, detectSchemaLibrary, schemaRegistry, registerSchemaForRoute } from './validate.js'
import { createRequire } from 'module'
import { loadCacheEntries } from '../layer4/cache-reader.js'

const require = createRequire(import.meta.url)

const routeSchemas = new Map()

export const parsedValueToSchema = new WeakMap()

const schemaJsonSchemaCache = new WeakMap()

const CONFIDENCE_ORDER = { confirmed: 3, inferred: 2, observed: 1, none: 0 }

let _rawCacheEntries = null

function urlMatchesTemplate(urlPath, templatePath) {
  if (!urlPath || !templatePath) return false
  if (templatePath === '*' || templatePath === '/*') return false

  const url = urlPath.split('?')[0]
  const urlSegs = url.split('/').filter(Boolean)
  const tplSegs = templatePath.split('/').filter(Boolean)

  if (urlSegs.length !== tplSegs.length) return false

  for (let i = 0; i < tplSegs.length; i++) {
    const seg = tplSegs[i]
    if (seg.startsWith(':')) continue
    if (seg.startsWith('(') && seg.endsWith(')')) continue
    if (seg !== urlSegs[i]) return false
  }
  return true
}

function _findMatchingCacheEntry(method, templatePath) {
  if (!_rawCacheEntries) return null
  const upper = method.toUpperCase()
  for (const [key, entry] of Object.entries(_rawCacheEntries)) {
    const colon = key.indexOf(':')
    if (colon === -1) continue
    if (key.slice(0, colon).toUpperCase() !== upper) continue
    if (urlMatchesTemplate(key.slice(colon + 1), templatePath)) return entry
  }
  return null
}

function _isExpressValidatorChain(fn) {
  if (!fn || typeof fn !== 'function') return false
  if (fn.builder?.fields && Array.isArray(fn.builder.fields)) return true
  if (fn._context?.fields && Array.isArray(fn._context.fields)) return true
  return false
}

function _inferEVFieldType(validators) {
  for (const v of validators) {
    const name = typeof v?.validator === 'function' ? v.validator.name
                : typeof v === 'function'            ? v.name
                : ''
    switch (name) {
      case 'isEmail':    return { type: 'string', format: 'email' }
      case 'isURL':      return { type: 'string', format: 'uri' }
      case 'isISO8601':
      case 'isDate':     return { type: 'string', format: 'date-time' }
      case 'isUUID':     return { type: 'string', format: 'uuid' }
      case 'isInt':
      case 'isNumeric':  return { type: 'integer' }
      case 'isFloat':
      case 'isDecimal':  return { type: 'number' }
      case 'isBoolean':  return { type: 'boolean' }
      case 'isArray':    return { type: 'array' }
      case 'isObject':
      case 'isJSON':     return { type: 'object' }
    }
  }
  return { type: 'string' }
}

function _extractExpressValidatorSchema(handlers) {
  const properties = {}

  for (const fn of handlers) {
    if (!_isExpressValidatorChain(fn)) continue

    const ctx = fn.builder ?? fn._context
    const fields     = ctx?.fields     ?? []
    const validators = ctx?.stack      ??
                       ctx?.validators ??
                       []

    for (const field of fields) {
      if (typeof field !== 'string' || !field) continue
      properties[field] = _inferEVFieldType(validators)
    }
  }

  return Object.keys(properties).length > 0
    ? { type: 'object', properties }
    : null
}

function routeKey(method, path) {
  return `${method.toUpperCase()}:${path}`
}

function getOrCreateSchema(method, path) {
  const key = routeKey(method, path)
  if (!routeSchemas.has(key)) {
    routeSchemas.set(key, {
      input: null,
      output: null,
      outputByStatus: null,
      querySchema: null,
      inputConfidence: 'none',
      outputConfidence: 'none',
      querySchemaConfidence: 'none',
      source: null,
      tags: null,
      meta: null,
      auth: null,
    })
  }
  return routeSchemas.get(key)
}

export function loadCacheIntoRegistry(cacheFile) {
  const entries = loadCacheEntries(cacheFile)
  const keys = Object.keys(entries)
  if (keys.length === 0) return 0

  _rawCacheEntries = entries

  for (const [key, entry] of Object.entries(entries)) {
    const colonIdx = key.indexOf(':')
    if (colonIdx === -1) continue
    const method = key.slice(0, colonIdx)
    const path = key.slice(colonIdx + 1)

    const existing = routeSchemas.get(key)

    const canSetInput = !existing ||
      (existing.inputConfidence === 'none' && entry.input)

    const canSetOutput = !existing ||
      (!existing.output && entry.output)

    if (!canSetInput && !canSetOutput) continue

    const schema = getOrCreateSchema(method, path)

    if (canSetInput && entry.input) {
      schema.input = entry.input
      schema.inputConfidence = 'observed'
    }

    if (canSetOutput && entry.output) {
      schema.output = entry.output
      schema.outputConfidence = 'observed'
    }

    if (entry.seenCount) schema.seenCount = entry.seenCount
    if (entry.lastSeen) schema.lastSeen = entry.lastSeen
  }

  return keys.length
}

let _detectorInitialized = false

export function initSchemaDetector() {
  if (_detectorInitialized) return
  _detectorInitialized = true

  try {
    let zodPath
    try {
      zodPath = require.resolve('zod', { paths: [process.cwd()] })
    } catch {
      zodPath = 'zod'
    }
    const zod = require(zodPath)
    const z = zod?.z || zod?.default?.z || (zod?.object ? zod : zod?.default)
    if (z) {
      patchZodWithRegistry(z)
    }
  } catch {  }

  try {
    const joi = require('joi')
    const j = joi?.object ? joi : joi?.default
    if (j) {
      patchJoiWithRegistry(j)
    }
  } catch {  }

  try {
    const yup = require('yup')
    const y = yup?.object ? yup : yup?.default
    if (y) {
      patchYupWithRegistry(y)
    }
  } catch {  }
}

const _patchedZInstances = new WeakSet()

initSchemaDetector()

function tagParsedValue(value, schema, library) {
  if (value === null || value === undefined || typeof value !== 'object') return
  try {
    let jsonSchema = schemaJsonSchemaCache.get(schema)
    if (!jsonSchema) {
      jsonSchema = toJsonSchema(schema, library)
      if (jsonSchema) schemaJsonSchemaCache.set(schema, jsonSchema)
    }
    if (jsonSchema) parsedValueToSchema.set(value, jsonSchema)
  } catch {}
}

function patchZodInstanceForOutputTracking(schema) {
  const handlers = {
    parse(orig) {
      return function nodoxTrackedParse(...args) {
        const result = orig.apply(this, args)
        tagParsedValue(result, this, 'zod')
        return result
      }
    },
    safeParse(orig) {
      return function nodoxTrackedSafeParse(...args) {
        const result = orig.apply(this, args)
        if (result?.success) tagParsedValue(result.data, this, 'zod')
        return result
      }
    },
    parseAsync(orig) {
      return async function nodoxTrackedParseAsync(...args) {
        const result = await orig.apply(this, args)
        tagParsedValue(result, this, 'zod')
        return result
      }
    },
    safeParseAsync(orig) {
      return async function nodoxTrackedSafeParseAsync(...args) {
        const result = await orig.apply(this, args)
        if (result?.success) tagParsedValue(result.data, this, 'zod')
        return result
      }
    },
  }

  for (const [method, wrap] of Object.entries(handlers)) {
    if (typeof schema[method] !== 'function') continue
    if (schema[method].__nodoxTracked) continue
    const orig = schema[method]
    const patched = wrap(orig)
    patched.__nodoxTracked = true
    try {
      schema[method] = patched
    } catch {
      try { Object.defineProperty(schema, method, { value: patched, writable: true, configurable: false }) } catch {}
    }
  }
}

export function patchZodProtoForOutputTracking(z) {
  let baseProto
  try {
    let proto = Object.getPrototypeOf(z.string())
    while (proto && proto !== Object.prototype) {
      const parent = Object.getPrototypeOf(proto)
      if (!parent || parent === Object.prototype || typeof parent.parse !== 'function') {
        baseProto = proto
        break
      }
      proto = parent
    }
  } catch { return }

  if (!baseProto || typeof baseProto.parse !== 'function' || baseProto.__nodoxZodProtoPatched) return
  baseProto.__nodoxZodProtoPatched = true

  const handlers = {
    parse: (orig) => function nodoxTrackedParse(...args) {
      const result = orig.apply(this, args)
      tagParsedValue(result, this, 'zod')
      markSchemaDetectedInDryRun(this, 'zod')
      return result
    },
    safeParse: (orig) => function nodoxTrackedSafeParse(...args) {
      const result = orig.apply(this, args)
      if (result?.success) {
        tagParsedValue(result.data, this, 'zod')
        markSchemaDetectedInDryRun(this, 'zod')
      }
      return result
    },
    parseAsync: (orig) => async function nodoxTrackedParseAsync(...args) {
      const result = await orig.apply(this, args)
      tagParsedValue(result, this, 'zod')
      markSchemaDetectedInDryRun(this, 'zod')
      return result
    },
    safeParseAsync: (orig) => async function nodoxTrackedSafeParseAsync(...args) {
      const result = await orig.apply(this, args)
      if (result?.success) {
        tagParsedValue(result.data, this, 'zod')
        markSchemaDetectedInDryRun(this, 'zod')
      }
      return result
    },
    _parseSync: (orig) => function nodoxTracked_parseSync(...args) {
      markSchemaDetectedInDryRun(this, 'zod')
      return orig.apply(this, args)
    },
    _parseAsync: (orig) => async function nodoxTracked_parseAsync(...args) {
      markSchemaDetectedInDryRun(this, 'zod')
      return orig.apply(this, args)
    },
  }

  for (const [method, wrap] of Object.entries(handlers)) {
    if (typeof baseProto[method] !== 'function') continue
    baseProto[method] = wrap(baseProto[method])
  }
}

function patchJoiProtoForOutputTracking(joi) {
  let baseProto
  try {
    let proto = Object.getPrototypeOf(joi.any())
    while (proto && proto !== Object.prototype) {
      const parent = Object.getPrototypeOf(proto)
      if (!parent || parent === Object.prototype || typeof parent.validate !== 'function') {
        baseProto = proto
        break
      }
      proto = parent
    }
  } catch { return }

  if (!baseProto || baseProto.__nodoxJoiProtoPatched) return
  baseProto.__nodoxJoiProtoPatched = true

  if (typeof baseProto.validate === 'function') {
    const orig = baseProto.validate
    baseProto.validate = function nodoxTrackedJoiValidate(...args) {
      const result = orig.apply(this, args)
      if (!result?.error) tagParsedValue(result?.value, this, 'joi')
      return result
    }
  }
}

function patchYupProtoForOutputTracking(yup) {
  let baseProto
  try {
    let proto = Object.getPrototypeOf(yup.mixed ? yup.mixed() : yup.string())
    while (proto && proto !== Object.prototype) {
      const parent = Object.getPrototypeOf(proto)
      if (!parent || parent === Object.prototype ||
          (typeof parent.validateSync !== 'function' && typeof parent.validate !== 'function')) {
        baseProto = proto
        break
      }
      proto = parent
    }
  } catch { return }

  if (!baseProto || baseProto.__nodoxYupProtoPatched) return
  baseProto.__nodoxYupProtoPatched = true

  if (typeof baseProto.validateSync === 'function') {
    const orig = baseProto.validateSync
    baseProto.validateSync = function nodoxTrackedYupValidateSync(...args) {
      const result = orig.apply(this, args)
      tagParsedValue(result, this, 'yup')
      return result
    }
  }

  if (typeof baseProto.validate === 'function') {
    const orig = baseProto.validate
    baseProto.validate = async function nodoxTrackedYupValidate(...args) {
      const result = await orig.apply(this, args)
      tagParsedValue(result, this, 'yup')
      return result
    }
  }
}

export function patchZodWithRegistry(z) {
  if (!z || _patchedZInstances.has(z)) return
  _patchedZInstances.add(z)

  const methodsToWrap = ['object', 'string', 'number', 'boolean', 'array',
    'union', 'intersection', 'tuple', 'record', 'literal', 'enum',
    'nativeEnum', 'any', 'unknown', 'date', 'bigint', 'discriminatedUnion']

  for (const method of methodsToWrap) {
    if (typeof z[method] !== 'function') continue
    const original = z[method].bind(z)
    const wrapped = function nodoxPatchedZodFactory(...args) {
      const schema = original(...args)
      if (schema && typeof schema === 'object') {
        const meta = { type: 'zod', zodType: method }
        capturedSchemas.set(schema, meta)
        registerForDryRun(schema, meta)
        patchZodInstanceForOutputTracking(schema)
      }
      return schema
    }

    try {
      z[method] = wrapped
    } catch {
      try { Object.defineProperty(z, method, { value: wrapped, writable: true }) } catch {}
    }
  }

  patchZodProtoForOutputTracking(z)
}

function patchJoiWithRegistry(joi) {
  const methodsToWrap = ['object', 'string', 'number', 'boolean', 'array',
    'any', 'date', 'alternatives', 'binary']

  for (const method of methodsToWrap) {
    if (typeof joi[method] !== 'function') continue
    const original = joi[method].bind(joi)
    joi[method] = function(...args) {
      const schema = original(...args)
      if (schema && typeof schema === 'object') {
        const meta = { type: 'joi', joiType: method }
        capturedSchemas.set(schema, meta)
        registerForDryRun(schema, meta)
      }
      return schema
    }
  }

  patchJoiProtoForOutputTracking(joi)
}

function patchYupWithRegistry(yup) {
  const methodsToWrap = ['object', 'string', 'number', 'boolean', 'array', 'mixed', 'date']

  for (const method of methodsToWrap) {
    if (typeof yup[method] !== 'function') continue
    const original = yup[method].bind(yup)
    yup[method] = function(...args) {
      const schema = original(...args)
      if (schema && typeof schema === 'object') {
        const meta = { type: 'yup', yupType: method }
        capturedSchemas.set(schema, meta)
        registerForDryRun(schema, meta)
      }
      return schema
    }
  }

  patchYupProtoForOutputTracking(yup)
}

const _registeredRoutePaths = new Set()

export function wasRouteRegistered(method, path) {
  return _registeredRoutePaths.has(routeKey(method, path))
}

export function onQueryObserved(method, path, shape, onUpdate) {
  const entry = getOrCreateSchema(method, path)
  if (entry.querySchemaConfidence !== 'none') return
  entry.querySchema = shape
  entry.querySchemaConfidence = 'observed'
  if (typeof onUpdate === 'function') onUpdate()
}

export function onRouteRegistered(method, path, handlers) {
  _registeredRoutePaths.add(routeKey(method, path))
  for (const handler of handlers) {
    if (handler?.__isNodoxValidate && handler?.__nodoxSchema) {
      const entry = getOrCreateSchema(method, path)
      entry.input = handler.__nodoxSchema.jsonSchema
      entry.inputConfidence = 'confirmed'
      entry.source = handler.__nodoxSchema.source

      if (handler.__nodoxSchema.outputJsonSchema) {
        entry.output = handler.__nodoxSchema.outputJsonSchema
        entry.outputConfidence = 'confirmed'
      }

      if (handler.__nodoxSchema.outputByStatus) {
        entry.outputByStatus = handler.__nodoxSchema.outputByStatus
      }

      if (handler.__nodoxSchema.tags) {
        entry.tags = handler.__nodoxSchema.tags
      }

      if (handler.__nodoxSchema.meta) {
        entry.meta = handler.__nodoxSchema.meta
      }

      if (handler.__nodoxSchema.auth) {
        entry.auth = handler.__nodoxSchema.auth
      }

      registerSchemaForRoute(method, path, handler.__nodoxSchema)
      return
    }
  }

  const evSchema = _extractExpressValidatorSchema(handlers)
  if (evSchema) {
    const entry = getOrCreateSchema(method, path)
    if (CONFIDENCE_ORDER[entry.inputConfidence] < CONFIDENCE_ORDER.inferred) {
      entry.input = evSchema
      entry.inputConfidence = 'inferred'
    }
  }

  const flagged = handlers.filter(fn => typeof fn === 'function' && looksLikeValidator(fn))
  if (flagged.length > 0) {
    if (_dryRunStartupComplete) {
      _dryRunRoute(method, path, flagged).catch(() => {})
    } else {
      pendingDryRuns.push({ method, path, handlers: flagged })
    }
  }
}

const pendingDryRuns = []

let _dryRunStartupComplete = false

function _reconstructSchemaFromZodError(error) {
  if (!Array.isArray(error?.issues) || error.issues.length === 0) return null

  const properties = {}
  const required = []

  for (const issue of error.issues) {
    if (!issue.path || issue.path.length !== 1) continue
    const field = String(issue.path[0])
    if (!field) continue

    if (issue.code === 'invalid_type') {
      const typeMap = {
        string: 'string', number: 'number', integer: 'integer',
        boolean: 'boolean', object: 'object', array: 'array',
        date: 'string', bigint: 'integer', null: 'null',
        undefined: 'null',
      }
      const jsType = typeMap[issue.expected] ?? 'string'
      properties[field] = issue.expected === 'date'
        ? { type: 'string', format: 'date-time' }
        : { type: jsType }

      required.push(field)
    }
  }

  if (Object.keys(properties).length === 0) return null

  const schema = { type: 'object', properties }
  if (required.length > 0) schema.required = [...new Set(required)]
  schema.description = '(inferred from validation errors — optional fields may be absent)'
  return schema
}

function _reconstructSchemaFromTwoPasses(emptyBodyError, nullProbeError) {
  if (!nullProbeError || !Array.isArray(nullProbeError.issues) || nullProbeError.issues.length === 0) return null

  const requiredFields = new Set()
  for (const issue of emptyBodyError?.issues ?? []) {
    if (issue.path?.length === 1) requiredFields.add(String(issue.path[0]))
  }

  const properties = {}
  const required = []

  for (const issue of nullProbeError.issues) {
    if (!issue.path || issue.path.length !== 1) continue
    const field = String(issue.path[0])
    if (!field) continue

    if (issue.code === 'invalid_type') {
      const typeMap = {
        string: 'string', number: 'number', integer: 'integer',
        boolean: 'boolean', object: 'object', array: 'array',
        date: 'string', bigint: 'integer', null: 'null',
        undefined: 'null',
      }
      properties[field] = issue.expected === 'date'
        ? { type: 'string', format: 'date-time' }
        : { type: typeMap[issue.expected] ?? 'string' }

      if (requiredFields.has(field)) required.push(field)
    }
  }

  if (Object.keys(properties).length === 0) return null

  const schema = { type: 'object', properties }
  if (required.length > 0) schema.required = [...new Set(required)]
  return schema
}

async function _dryRunRoute(method, path, handlers) {
  const existing = routeSchemas.get(routeKey(method, path))
  if (existing?.inputConfidence === 'confirmed') return false

  for (const handler of handlers) {
    const result = await dryRunValidator(handler, method)

    if (result.schema) {
      const meta = capturedSchemas.get(result.schema)
      const library = result.library || meta?.type
      if (!library) continue

      const jsonSchema = toJsonSchema(result.schema, library)
      if (!jsonSchema) continue

      const entry = getOrCreateSchema(method, path)
      entry.input = jsonSchema
      entry.inputConfidence = 'inferred'
      return true
    }

    const nullResult = await dryRunValidator(handler, method, createNullProbeBody())

    if (nullResult.zodError || result.zodError) {
      const jsonSchema = _reconstructSchemaFromTwoPasses(result.zodError, nullResult.zodError)
      if (jsonSchema && !existing?.input) {
        const entry = getOrCreateSchema(method, path)
        entry.input = jsonSchema
        entry.inputConfidence = 'inferred'
        return true
      }
    }

    if (result.zodError && !existing?.input) {
      const jsonSchema = _reconstructSchemaFromZodError(result.zodError)
      if (jsonSchema) {
        const entry = getOrCreateSchema(method, path)
        entry.input = jsonSchema
        entry.inputConfidence = 'inferred'
        return true
      }
    }
  }
  return false
}

let _userZodProtoPatchApplied = false

function _patchUserZodProtoFromRegistry() {
  if (_userZodProtoPatchApplied) return
  const sources = [
    ..._schemaRegistryArray.map(e => e.schema),
    ...[...schemaRegistry.values()].map(e => e?.rawSchema || e).filter(Boolean),
  ]
  for (const schema of sources) {
    if (!schema || typeof schema !== 'object') continue
    let p = Object.getPrototypeOf(schema)
    while (p && p !== Object.prototype) {
      if (typeof p._parseSync === 'function' && !p.__nodoxZodProtoPatched) {
        p.__nodoxZodProtoPatched = true
        const origSync = p._parseSync
        p._parseSync = function nodoxTracked_parseSync(...args) {
          markSchemaDetectedInDryRun(this, 'zod')
          return origSync.apply(this, args)
        }
        if (typeof p._parseAsync === 'function') {
          const origAsync = p._parseAsync
          p._parseAsync = async function nodoxTracked_parseAsync(...args) {
            markSchemaDetectedInDryRun(this, 'zod')
            return origAsync.apply(this, args)
          }
        }
        _userZodProtoPatchApplied = true
        return
      }
      p = Object.getPrototypeOf(p)
    }
  }
}

export async function runDeferredDryRuns() {
  try {
    const esmMod = await import('zod')
    const esmZ = esmMod?.z || esmMod?.default?.z || (esmMod?.object ? esmMod : esmMod?.default)
    if (esmZ) patchZodWithRegistry(esmZ)
  } catch {  }

  _patchUserZodProtoFromRegistry()
  for (const { method, path, handlers } of pendingDryRuns) {
    const success = await _dryRunRoute(method, path, handlers)
    if (success) {
      console.log(`\x1b[32m  ✓ nodox\x1b[0m \x1b[2mInferred schema for ${method} ${path}\x1b[0m`)
    } else {
    }
  }

  pendingDryRuns.length = 0
  _dryRunStartupComplete = true
}

export function onInputObserved(method, path, shape, confidence = 'observed', onUpdate) {
  const entry = getOrCreateSchema(method, path)

  const existing = CONFIDENCE_ORDER[entry.inputConfidence] ?? 0
  const incoming = CONFIDENCE_ORDER[confidence] ?? 0
  if (incoming <= existing) return

  entry.input = shape
  entry.inputConfidence = confidence

  if (typeof onUpdate === 'function') {
    onUpdate(method, path, { input: shape, inputConfidence: confidence })
  }
}

export function onResponseObserved(method, path, shape, confidence = 'observed', onUpdate) {
  const entry = getOrCreateSchema(method, path)

  const existing = CONFIDENCE_ORDER[entry.outputConfidence] ?? 0
  const incoming = CONFIDENCE_ORDER[confidence] ?? 0
  if (incoming <= existing) return

  entry.output = shape
  entry.outputConfidence = confidence

  if (typeof onUpdate === 'function') {
    onUpdate(method, path, { output: shape, outputConfidence: confidence })
  }
}

export function getRouteSchema(method, path) {
  return routeSchemas.get(routeKey(method, path)) ?? null
}

export function getAllSchemas() {
  const result = {}
  for (const [key, schema] of routeSchemas) {
    result[key] = schema
  }
  return result
}

export function enrichRoutesWithSchemas(routes) {
  return routes.map(route => {
    let schema = getRouteSchema(route.method, route.path)

    if (!schema && _rawCacheEntries) {
      const cacheEntry = _findMatchingCacheEntry(route.method, route.path)
      if (cacheEntry) {
        const s = getOrCreateSchema(route.method, route.path)
        if (cacheEntry.input && s.inputConfidence === 'none') {
          s.input  = cacheEntry.input
          s.inputConfidence = 'observed'
        }
        if (cacheEntry.output && !s.output) {
          s.output = cacheEntry.output
          s.outputConfidence = 'observed'
        }
        if (cacheEntry.seenCount) s.seenCount = cacheEntry.seenCount
        schema = s
      }
    }

    if (schema && !schema.auth && route.handlers?.length) {
      const inferred = _inferAuthFromHandlers(route.handlers)
      if (inferred) schema.auth = inferred
    }

    return {
      ...route,
      hasValidator: schema?.inputConfidence === 'confirmed' || schema?.inputConfidence === 'inferred',
      schema: schema ?? null,
      version: _detectVersion(route.path),
      handlers: undefined,
    }
  })
}

function _detectVersion(routePath) {
  const m = routePath.match(/\/v(\d+)\b/i)
  return m ? `v${m[1]}` : null
}

const _AUTH_BEARER_RE = /^(bearer|jwt|jwtauth|verifyjwt|checkjwt|authjwt|jwtmiddleware|verifytoken|checktoken|authtoken)$/i
const _AUTH_APIKEY_RE = /^(apikey|checkapikey|apikeyauth|apikeymiddleware)$/i
const _AUTH_BASIC_RE  = /^(basic|basicauth|checkbasic)$/i
const _AUTH_OAUTH_RE  = /^(oauth|oauth2|checkoauth)$/i
const _AUTH_GENERIC_RE = /^(authenticate|requireauth|isAuthenticated|ensureAuthenticated|requirelogin|authcheck|checkauth|verifyauth|authmiddleware|protectedroute|needsauth|authorized|authorization)$/i

function _inferAuthFromHandlers(handlers) {
  for (const fn of handlers) {
    if (!fn || typeof fn !== 'function') continue
    const name = (fn.name || '').toLowerCase()
    if (!name || name === 'anonymous' || name === 'bound ') continue
    if (_AUTH_APIKEY_RE.test(name)) return { type: 'apiKey', name: 'X-API-Key', in: 'header' }
    if (_AUTH_BASIC_RE.test(name)) return { type: 'basic' }
    if (_AUTH_OAUTH_RE.test(name)) return { type: 'oauth2' }
    if (_AUTH_BEARER_RE.test(name) || _AUTH_GENERIC_RE.test(fn.name || '')) return { type: 'bearer' }
  }
  return null
}

export { tagParsedValue }
