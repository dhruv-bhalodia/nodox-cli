
import { AsyncLocalStorage } from 'async_hooks'
import http from 'http'
import https from 'https'
import net from 'net'
import fs from 'fs'
import cp from 'child_process'
import { capturedSchemas } from './schema-patcher.js'

const dryRunContext = new AsyncLocalStorage()

const ABORT_ERROR_MESSAGE = '__NODOC_DRY_RUN_ABORT__'

function isDryRun() {
  return dryRunContext.getStore()?.active === true
}

export function markSchemaDetectedInDryRun(schema, library) {
  const store = dryRunContext.getStore()
  if (store?.active && !store.protoDetectedSchema) {
    store.protoDetectedSchema = schema
    store.protoDetectedLibrary = library
  }
}

let _sideEffectPatchesApplied = false
function applySideEffectPatches() {
  if (_sideEffectPatchesApplied) return
  _sideEffectPatchesApplied = true

  const patchNetwork = (mod) => {
    const orig = mod.request
    mod.request = function(...args) {
      if (isDryRun()) {
        const err = new Error('Network call blocked during nodox dry-run')
        err.code = 'ENETBLOCK'
        throw err
      }
      return orig.apply(this, args)
    }
  }
  patchNetwork(http)
  patchNetwork(https)

  const origConnect = net.Socket.prototype.connect
  net.Socket.prototype.connect = function(...args) {
    if (isDryRun()) {
      process.nextTick(() =>
        this.destroy(Object.assign(
          new Error('Network connection blocked during nodox dry-run'),
          { code: 'ENETBLOCK' }
        ))
      )
      return this
    }
    return origConnect.apply(this, args)
  }

  const blockFs = (method) => {
    const orig = fs[method]
    if (typeof orig !== 'function') return
    const patched = function(...args) {
      if (isDryRun()) {
        throw new Error(`fs.${method} blocked during nodox dry-run`)
      }
      return orig.apply(this, args)
    }
    fs[method] = patched
    if (fs.default && fs.default[method]) {
      fs.default[method] = patched
    }
  }
  ['writeFile', 'writeFileSync', 'appendFile', 'appendFileSync', 'mkdir', 'mkdirSync'].forEach(blockFs)

  const blockCp = (method) => {
    const orig = cp[method]
    if (typeof orig !== 'function') return
    cp[method] = function(...args) {
      if (isDryRun()) {
        throw new Error(`child_process.${method} blocked during nodox dry-run`)
      }
      return orig.apply(this, args)
    }
  }
  ['spawn', 'spawnSync', 'exec', 'execSync', 'execFile', 'execFileSync', 'fork'].forEach(blockCp)
}

export function createInfiniteProxy(overrides = {}) {
  function handler(target) {
    return {
      get(obj, prop) {
        if (prop in overrides) return overrides[prop]

        if (typeof prop === 'symbol') return undefined
        if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
        if (prop === 'toJSON') return undefined
        if (prop === 'valueOf') return () => null
        if (prop === 'toString') return () => '[nodox mock]'

        if (prop === 'constructor') return Object
        if (prop in obj) return obj[prop]

        return createInfiniteProxy()
      },
      apply() {
        return createInfiniteProxy()
      },
      set() {
        return true
      },
    }
  }

  const target = typeof overrides === 'function' ? overrides : function() {}
  return new Proxy(target, handler(target))
}

export function createNullProbeBody() {
  return new Proxy({}, {
    get(_, prop) {
      if (typeof prop === 'symbol') return undefined
      if (prop === 'then' || prop === 'catch' || prop === 'finally') return undefined
      if (prop === 'toJSON' || prop === 'valueOf' || prop === 'toString') return undefined
      if (prop === 'constructor') return Object
      return null
    },
    has(_, prop) { return typeof prop === 'string' },
  })
}

export async function dryRunValidator(fn, method = 'POST', bodyOverride = undefined) {
  applySideEffectPatches()

  const mockReq = createInfiniteProxy({
    body: bodyOverride !== undefined ? bodyOverride : {},
    params: {},
    query: {},
    cookies: {},
    session: {},
    locals: {},
    headers: {
      'content-type': 'application/json',
      'accept': 'application/json',
    },
    method: method.toUpperCase(),
    path: '/',
    url: '/',
    get(header) {
      return { 'content-type': 'application/json' }[header.toLowerCase()] || null
    },
  })

  const _capturedJsonBodies = []
  const _captureBody = (body) => { try { _capturedJsonBodies.push(body) } catch {} }
  const _statusResult = createInfiniteProxy({ json: _captureBody, send: _captureBody })
  const mockRes = createInfiniteProxy({
    json: _captureBody,
    send: _captureBody,
    status: () => _statusResult,
  })
  const mockNext = (err) => {
    if (!caughtZodError && Array.isArray(err?.issues) && err.issues.length > 0) {
      caughtZodError = err
    }
  }

  let detectedSchema = null
  let detectedLibrary = null
  let caughtZodError = null
  let _protoDetectedSchema = null
  let _protoDetectedLibrary = null
  const patchedSchemas = new Map()

  const schemasToWatch = getWatchableSchemas()

  for (const { schema, meta } of schemasToWatch) {
    const patches = patchSchemaForDryRun(schema, meta, (s, lib) => {
      if (!detectedSchema) {
        detectedSchema = s
        detectedLibrary = lib
      }
    })
    if (patches) patchedSchemas.set(schema, patches)
  }

  try {
    await dryRunContext.run({ active: true, protoDetectedSchema: null, protoDetectedLibrary: null }, async () => {
      const maybePromise = fn(mockReq, mockRes, mockNext)

      if (maybePromise && typeof maybePromise.then === 'function') {
        await new Promise(resolve => {
          const t = setTimeout(resolve, 0)
          maybePromise.then(
            () => { clearTimeout(t); resolve() },
            (err) => {
              clearTimeout(t)
              if (!caughtZodError && Array.isArray(err?.issues) && err.issues.length > 0) {
                caughtZodError = err
              }
              resolve()
            }
          )
        })
      }

      const store = dryRunContext.getStore()
      _protoDetectedSchema = store?.protoDetectedSchema ?? null
      _protoDetectedLibrary = store?.protoDetectedLibrary ?? null
    })
  } catch (err) {
    if (err.message === ABORT_ERROR_MESSAGE) {
    } else if (!detectedSchema && Array.isArray(err?.issues) && err.issues.length > 0) {
      caughtZodError = err
    }
  }

  for (const [schema, patches] of patchedSchemas) {
    for (const [method, original] of Object.entries(patches)) {
      try { schema[method] = original } catch {}
    }
  }

  if (!detectedSchema && !caughtZodError) {
    for (const body of _capturedJsonBodies) {
      const issues = _extractZodIssues(body)
      if (issues) {
        caughtZodError = { issues }
        break
      }
    }
  }

  if (!detectedSchema && _protoDetectedSchema) {
    detectedSchema = _protoDetectedSchema
    detectedLibrary = _protoDetectedLibrary || 'zod'
  }

  return {
    schema: detectedSchema,
    library: detectedLibrary,
    zodError: caughtZodError,
    jsonSchema: null,
  }
}

function _extractZodIssues(body) {
  if (!body || typeof body !== 'object') return null

  const candidates = [
    body.issues,
    body.details,
    body.errors,
    body.validationErrors,
    body.error?.issues,
  ]

  for (const c of candidates) {
    if (
      Array.isArray(c) && c.length > 0 &&
      Array.isArray(c[0]?.path) &&
      typeof c[0]?.code === 'string'
    ) {
      return c
    }
  }

  return null
}

function patchSchemaForDryRun(schema, meta, onDetected) {
  const originals = {}
  const methodsToWatch = meta.type === 'zod'
    ? ['parse', 'safeParse', 'parseAsync', 'safeParseAsync']
    : meta.type === 'yup'
      ? ['validateSync']
      : ['validate', 'validateAsync']

  let patched = false
  for (const method of methodsToWatch) {
    if (typeof schema[method] !== 'function') continue

    originals[method] = schema[method]
    schema[method] = function interceptedParse(...args) {
      onDetected(schema, meta.type)
      schema[method] = originals[method]

      if (isDryRun()) {
        throw new Error(ABORT_ERROR_MESSAGE)
      }

      return originals[method].apply(this, args)
    }
    patched = true
  }

  return patched ? originals : null
}

function getWatchableSchemas() {
  return _schemaRegistryArray
}

export const _schemaRegistryArray = []

const registryCleanup = new FinalizationRegistry((schema) => {
  const index = _schemaRegistryArray.findIndex(entry => entry.schema === schema)
  if (index !== -1) _schemaRegistryArray.splice(index, 1)
})

export function registerForDryRun(schema, meta) {
  _schemaRegistryArray.push({ schema, meta })
  try {
    registryCleanup.register(schema, schema)
  } catch {
  }
}
