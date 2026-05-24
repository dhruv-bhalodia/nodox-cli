/**
 * validate() — Primary Schema Registration Path
 *
 * The recommended way to get complete, reliable schema documentation in nodox.
 * Developers use this in place of writing their own validation middleware.
 *
 * Usage:
 *   import { validate } from 'nodox-cli'
 *   import { z } from 'zod'
 *
 *   const createUserSchema = z.object({
 *     name: z.string(),
 *     email: z.string().email(),
 *   })
 *
 *   app.post('/users', validate(createUserSchema), (req, res) => {
 *     // req.body is validated and typed
 *     res.status(201).json(req.body)
 *   })
 *
 * Why use validate() instead of inline validation?
 *   - Schema is registered at route-registration time — not at request time
 *   - Works through any bundler, minifier, or transpiler
 *   - Produces a complete JSON Schema in the UI immediately on startup
 *   - The validate() call IS your validation — no duplication
 *
 * Supports: Zod schemas, Joi schemas, yup schemas, Valibot schemas,
 *           TypeBox schemas, plain JSON Schema objects
 */

import { zodToJsonSchema } from 'zod-to-json-schema'
import { createRequire } from 'module'

const _require = createRequire(import.meta.url)

// TypeBox uses a well-known Symbol to tag its schema objects
const _TYPEBOX_KIND = Symbol.for('TypeBox.Kind')

// Lazy-loaded module cache for optional peer deps
let _valibotModule = null
let _typeboxValueModule = null

async function _getValibot() {
  if (_valibotModule !== undefined) return _valibotModule
  try { _valibotModule = await import('valibot') } catch { _valibotModule = null }
  return _valibotModule
}

async function _getTypeBoxValue() {
  if (_typeboxValueModule !== undefined) return _typeboxValueModule
  try { _typeboxValueModule = await import('@sinclair/typebox/value') } catch { _typeboxValueModule = null }
  return _typeboxValueModule
}

/**
 * Internal registry: route key → registered schema info
 * Route key format: "METHOD:path" e.g. "POST:/api/users"
 *
 * @type {Map<string, RegisteredSchema>}
 */
export const schemaRegistry = new Map()

/**
 * @typedef {Object} RegisteredSchema
 * @property {'zod'|'joi'|'jsonschema'} library
 * @property {object} rawSchema - The original schema object
 * @property {object} jsonSchema - Converted to JSON Schema format
 * @property {string|null} source - File:line where schema was defined
 * @property {'confirmed'} confidence - Always 'confirmed' for validate()
 */

/**
 * Create a validation middleware that also registers the schema with nodox.
 *
 * @param {object} schema - A Zod schema, Joi schema, or JSON Schema object
 * @param {object} [options]
 * @param {boolean} [options.strict=false] - Reject unknown fields (Zod: strip vs strict)
 * @param {object} [options.response] - Zod schema, Joi schema, or JSON Schema describing the response body
 * @returns {Function} Express middleware
 */
export function validate(schema, options = {}) {
  const { strict = false, response: responseSchema, responses, tags, meta, auth, externalDocs, problemDetails = false } = options

  // Detect schema type
  const library = detectSchemaLibrary(schema)
  if (!library) {
    throw new Error(
      '[nodox] validate() received an unrecognized schema type. ' +
      'Pass a Zod schema, Joi schema, or a plain JSON Schema object.'
    )
  }

  // Convert to JSON Schema for UI display
  const jsonSchema = toJsonSchema(schema, library)

  // Convert optional response schema to JSON Schema
  let outputJsonSchema = null
  if (responseSchema) {
    const responseLibrary = detectSchemaLibrary(responseSchema)
    if (responseLibrary) {
      outputJsonSchema = toJsonSchema(responseSchema, responseLibrary)
    } else {
      throw new Error(
        '[nodox] validate() options.response received an unrecognized schema type. ' +
        'Pass a Zod schema, Joi schema, or a plain JSON Schema object.'
      )
    }
  }

  // Convert responses map { [status]: schema } → { [status]: jsonSchema }
  let outputByStatus = null
  if (responses && typeof responses === 'object') {
    outputByStatus = {}
    for (const [statusCode, resSchema] of Object.entries(responses)) {
      const resLib = detectSchemaLibrary(resSchema)
      if (resLib) {
        const resJson = toJsonSchema(resSchema, resLib)
        if (resJson) outputByStatus[String(statusCode)] = resJson
      }
    }
    if (Object.keys(outputByStatus).length === 0) outputByStatus = null
  }

  const normalizedTags = Array.isArray(tags) && tags.length > 0
    ? tags.filter(t => typeof t === 'string' && t.length > 0)
    : null

  // Normalize meta — only keep known keys with correct types
  let normalizedMeta = null
  if (meta && typeof meta === 'object') {
    const m = {}
    if (typeof meta.summary === 'string' && meta.summary.trim()) m.summary = meta.summary.trim()
    if (typeof meta.description === 'string' && meta.description.trim()) m.description = meta.description.trim()
    if (meta.examples && typeof meta.examples === 'object') m.examples = meta.examples
    if (meta.deprecated === true) m.deprecated = true
    if (Object.keys(m).length > 0) normalizedMeta = m
  }

  // Normalize auth — validate type and type-specific fields
  const _VALID_AUTH_TYPES = new Set(['bearer', 'apiKey', 'basic', 'oauth2'])
  let normalizedAuth = null
  if (auth && typeof auth === 'object' && _VALID_AUTH_TYPES.has(auth.type)) {
    const a = { type: auth.type }
    if (typeof auth.description === 'string' && auth.description.trim()) {
      a.description = auth.description.trim()
    }
    if (auth.type === 'apiKey') {
      a.name = typeof auth.name === 'string' && auth.name.trim() ? auth.name.trim() : 'X-API-Key'
      a.in = ['header', 'query', 'cookie'].includes(auth.in) ? auth.in : 'header'
    }
    if (auth.type === 'oauth2' && Array.isArray(auth.scopes)) {
      a.scopes = auth.scopes.filter(s => typeof s === 'string' && s.length > 0)
    }
    normalizedAuth = a
  }

  // Normalize externalDocs — must have a valid URL string
  let normalizedExternalDocs = null
  if (externalDocs && typeof externalDocs === 'object' && typeof externalDocs.url === 'string' && externalDocs.url.trim()) {
    normalizedExternalDocs = { url: externalDocs.url.trim() }
    if (typeof externalDocs.description === 'string' && externalDocs.description.trim()) {
      normalizedExternalDocs.description = externalDocs.description.trim()
    }
  }

  // Capture callsite so UI can show "defined in src/routes/users.js:12"
  const source = captureValidateCallsite()

  // The route key isn't known until this middleware is attached to a route.
  // We use a deferred registration approach: the middleware function carries
  // the schema, and the app-patcher reads it from the handler array when
  // a route is registered.
  const registeredSchema = {
    library,
    rawSchema: schema,
    jsonSchema,
    outputJsonSchema,
    outputByStatus,
    tags: normalizedTags,
    meta: normalizedMeta,
    auth: normalizedAuth,
    externalDocs: normalizedExternalDocs,
    problemDetails,
    source,
    confidence: 'confirmed',
  }

  /**
   * The actual Express middleware.
   * Runs schema.safeParse (Zod) or schema.validate (Joi) on req.body.
   * On failure: 400 with validation error detail (or RFC 7807 Problem Details if problemDetails: true).
   * On success: replaces req.body with parsed/coerced value and calls next().
   */
  async function nodoxValidateMiddleware(req, res, next) {
    let result

    const _sendError = (details) => {
      if (problemDetails) {
        return res.status(400).json({
          type: 'about:blank',
          title: 'Validation Failed',
          status: 400,
          detail: 'One or more fields failed validation.',
          errors: details.map(d => ({
            pointer: d.path ? `/${d.path.replace(/\./g, '/')}` : '/',
            detail: d.message,
          })),
        })
      }
      return res.status(400).json({ error: 'Validation failed', details })
    }

    try {
      if (library === 'zod') {
        result = strict
          ? schema.strict().safeParse(req.body)
          : schema.safeParse(req.body)

        if (!result.success) {
          const issues = result.error.issues ?? result.error.errors ?? []
          return _sendError(issues.map(e => ({
            path: Array.isArray(e.path) ? e.path.join('.') : String(e.path ?? ''),
            message: e.message,
            code: e.code,
          })))
        }
        req.body = result.data

      } else if (library === 'joi') {
        const { error, value } = schema.validate(req.body, {
          abortEarly: false,
          allowUnknown: !strict,
        })

        if (error) {
          return _sendError(error.details.map(d => ({
            path: d.path.join('.'),
            message: d.message,
            type: d.type,
          })))
        }
        req.body = value

      } else if (library === 'yup') {
        req.body = schema.validateSync(req.body, {
          abortEarly: false,
          stripUnknown: !strict,
        })

      } else if (library === 'valibot') {
        const v = await _getValibot()
        if (v && typeof v.safeParse === 'function') {
          const vResult = v.safeParse(schema, req.body)
          if (!vResult.success) {
            return _sendError((vResult.issues || []).map(issue => ({
              path: issue.path?.map(p => String(p.key ?? p)).join('.') ?? '',
              message: issue.message,
              code: issue.type,
            })))
          }
          req.body = vResult.output
        }

      } else if (library === 'typebox') {
        const tbv = await _getTypeBoxValue()
        if (tbv?.Value && typeof tbv.Value.Check === 'function') {
          if (!tbv.Value.Check(schema, req.body)) {
            const errors = [...tbv.Value.Errors(schema, req.body)]
            return _sendError(errors.map(e => ({
              path: e.path?.replace(/^\//, '').replace(/\//g, '.') ?? '',
              message: e.message,
              code: 'invalid_value',
            })))
          }
          // TypeBox doesn't coerce by default — pass through as-is
        }

      } else if (library === 'jsonschema') {
        // Display-only — no runtime validation
        req.body = req.body
      }
    } catch (err) {
      if (err?.name === 'ValidationError' && err?.inner) {
        return _sendError((err.inner.length ? err.inner : [err]).map(e => ({
          path: e.path || '',
          message: e.message,
          type: e.type,
        })))
      }
      console.error('[nodox] validate() middleware threw unexpectedly:', err)
      return res.status(500).json({ error: 'Internal validation error' })
    }

    next()
  }

  // Attach the schema to the middleware function so app-patcher can read it
  nodoxValidateMiddleware.__nodoxSchema = registeredSchema
  nodoxValidateMiddleware.__isNodoxValidate = true

  return nodoxValidateMiddleware
}

/**
 * Detect which schema library produced a given schema object.
 * @param {any} schema
 * @returns {'zod'|'joi'|'yup'|'valibot'|'typebox'|'jsonschema'|null}
 */
export function detectSchemaLibrary(schema) {
  if (!schema || typeof schema !== 'object') return null

  // Zod v3: _def.typeName, Zod v4: .def.type + .safeParse + .toJSONSchema
  if (schema._def?.typeName) return 'zod'
  if (typeof schema.safeParse === 'function' && typeof schema.toJSONSchema === 'function') return 'zod'
  if (schema.def?.type && typeof schema.safeParse === 'function') return 'zod'

  // Joi schemas have an isJoi flag or $_root
  if (schema.isJoi || schema.$_root) return 'joi'
  if (schema.type && typeof schema.type === 'string' && schema.$_terms) return 'joi'

  // yup v1: has _type string + validateSync; yup v0: __isYupSchema__
  if (schema._type && typeof schema.validateSync === 'function') return 'yup'
  if (schema.__isYupSchema__ && typeof schema.validate === 'function') return 'yup'

  // Valibot v1: '~standard' interface with vendor tag; older: kind='schema' + _run
  if (schema['~standard']?.vendor === 'valibot') return 'valibot'
  if (schema.kind === 'schema' && typeof schema._run === 'function') return 'valibot'

  // TypeBox: tagged with Symbol.for('TypeBox.Kind') — schemas are already JSON Schema
  if (_TYPEBOX_KIND in schema) return 'typebox'

  // Plain JSON Schema: has type/properties but not zod-like methods
  if ((schema.type || schema.properties || schema.$schema || schema.anyOf) &&
      typeof schema.safeParse !== 'function') return 'jsonschema'

  return null
}

/**
 * Convert any supported schema to JSON Schema format.
 * @param {object} schema
 * @param {'zod'|'joi'|'yup'|'valibot'|'typebox'|'jsonschema'} library
 * @returns {object} JSON Schema object
 */
export function toJsonSchema(schema, library) {
  try {
    if (library === 'zod') {
      // Zod v4 has a native toJSONSchema() method — prefer it
      if (typeof schema.toJSONSchema === 'function') {
        const result = schema.toJSONSchema()
        const { $schema, ...rest } = result
        return rest
      }
      // Zod v3 fallback: use zod-to-json-schema package
      return zodToJsonSchema(schema, {
        name: undefined,
        $refStrategy: 'none',
      })
    }

    if (library === 'joi') {
      return joiToJsonSchema(schema)
    }

    if (library === 'yup') {
      return yupToJsonSchema(schema)
    }

    if (library === 'valibot') {
      // Try the official converter first (valibot ≥ 1.0 ships @valibot/to-json-schema or a built-in)
      try {
        const v = _require('valibot')
        if (typeof v.toJsonSchema === 'function') {
          return v.toJsonSchema(schema)
        }
      } catch { /* not available — fall through to structural extraction */ }
      return valibotToJsonSchema(schema)
    }

    if (library === 'typebox') {
      // TypeBox schemas ARE JSON Schema objects — strip TypeBox-only Symbol keys (they
      // don't serialize anyway) and pass through. Remove $schema to match our other converters.
      const { $schema, ...rest } = schema
      return rest
    }

    if (library === 'jsonschema') {
      return schema
    }
  } catch (err) {
    console.warn('[nodox] Failed to convert schema to JSON Schema:', err.message)
  }

  return { type: 'object' }
}

/**
 * Best-effort yup → JSON Schema conversion via schema.describe().
 * @param {object} yupSchema
 * @returns {object}
 */
function yupToJsonSchema(yupSchema) {
  try {
    const desc = yupSchema.describe()
    return yupDescToJsonSchema(desc)
  } catch {
    return { type: 'object', description: 'yup schema (conversion failed)' }
  }
}

function yupDescToJsonSchema(desc) {
  if (!desc) return {}
  const out = {}

  switch (desc.type) {
    case 'object': {
      out.type = 'object'
      if (desc.fields) {
        out.properties = {}
        const required = []
        for (const [key, val] of Object.entries(desc.fields)) {
          out.properties[key] = yupDescToJsonSchema(val)
          // yup fields without optional/nullable flag are required
          const isOptional = val.optional === true || val.nullable === true
          if (!isOptional) required.push(key)
        }
        if (required.length) out.required = required
      }
      break
    }
    case 'string':
      out.type = 'string'
      break
    case 'number':
      out.type = 'number'
      break
    case 'boolean':
      out.type = 'boolean'
      break
    case 'array':
      out.type = 'array'
      if (desc.innerType) out.items = yupDescToJsonSchema(desc.innerType)
      break
    case 'date':
      out.type = 'string'
      out.format = 'date-time'
      break
    default:
      out.type = desc.type || 'any'
  }

  if (desc.label) out.description = desc.label

  // yup .nullable() sets desc.nullable = true
  if (desc.nullable === true && out.type && out.type !== 'null') {
    out.type = [out.type, 'null']
  }

  return out
}

/**
 * Best-effort Joi → JSON Schema conversion.
 * Handles the common cases (object, string, number, boolean, array).
 * For complex Joi schemas, output is approximate.
 * @param {object} joiSchema
 * @returns {object}
 */
function joiToJsonSchema(joiSchema) {
  try {
    const desc = joiSchema.describe()
    return joiDescToJsonSchema(desc)
  } catch {
    return { type: 'object', description: 'Joi schema (conversion failed)' }
  }
}

function joiDescToJsonSchema(desc) {
  if (!desc) return {}

  const out = {}

  switch (desc.type) {
    case 'object': {
      out.type = 'object'
      if (desc.keys) {
        out.properties = {}
        const required = []
        for (const [key, val] of Object.entries(desc.keys)) {
          out.properties[key] = joiDescToJsonSchema(val)
          if (!val.flags?.presence || val.flags.presence === 'required') {
            required.push(key)
          }
        }
        if (required.length) out.required = required
      }
      break
    }
    case 'string':
      out.type = 'string'
      if (desc.flags?.only && desc.allow?.length) {
        out.enum = desc.allow
      }
      break
    case 'number':
    case 'integer':
      out.type = desc.type
      break
    case 'boolean':
      out.type = 'boolean'
      break
    case 'array':
      out.type = 'array'
      if (desc.items?.length) {
        out.items = joiDescToJsonSchema(desc.items[0])
      }
      break
    case 'date':
      out.type = 'string'
      out.format = 'date-time'
      break
    default:
      out.type = desc.type || 'any'
  }

  if (desc.flags?.description) {
    out.description = desc.flags.description
  }

  // Nullable: Joi's .allow(null) sets allow array containing null
  if (Array.isArray(desc.allow) && desc.allow.includes(null) && out.type && out.type !== 'null') {
    out.type = [out.type, 'null']
  }

  return out
}

/**
 * Register a schema for a specific route.
 * Called by the app-patcher when it finds a validate() middleware in a handler chain.
 *
 * @param {string} method
 * @param {string} path
 * @param {RegisteredSchema} schema
 */
export function registerSchemaForRoute(method, path, schema) {
  const key = `${method.toUpperCase()}:${path}`
  schemaRegistry.set(key, schema)
}

/**
 * Get the registered schema for a route, if any.
 * @param {string} method
 * @param {string} path
 * @returns {RegisteredSchema|null}
 */
export function getSchemaForRoute(method, path) {
  return schemaRegistry.get(`${method.toUpperCase()}:${path}`) ?? null
}

/**
 * Best-effort Valibot → JSON Schema structural extraction.
 * Used when the valibot package's own toJsonSchema is unavailable.
 * Handles object, string, number, boolean, array, optional, nullable, union.
 * @param {object} schema - valibot schema object
 * @param {number} [depth=0] - recursion guard
 * @returns {object} JSON Schema object
 */
function valibotToJsonSchema(schema, depth = 0) {
  if (depth > 12 || !schema || typeof schema !== 'object') return {}
  const type = schema.type

  if (type === 'object' && schema.entries) {
    const properties = {}
    const required = []
    for (const [key, field] of Object.entries(schema.entries)) {
      properties[key] = valibotToJsonSchema(field, depth + 1)
      if (field.type !== 'optional' && field.type !== 'nullish') required.push(key)
    }
    const out = { type: 'object', properties }
    if (required.length) out.required = required
    return out
  }

  if ((type === 'optional' || type === 'nullish') && schema.wrapped) {
    const inner = valibotToJsonSchema(schema.wrapped, depth + 1)
    if (type === 'nullish') return { ...inner, type: [inner.type || 'string', 'null'] }
    return inner
  }

  if (type === 'nullable' && schema.wrapped) {
    const inner = valibotToJsonSchema(schema.wrapped, depth + 1)
    return { ...inner, type: [inner.type || 'string', 'null'] }
  }

  if (type === 'array') {
    const out = { type: 'array' }
    if (schema.item) out.items = valibotToJsonSchema(schema.item, depth + 1)
    return out
  }

  if (type === 'union' && Array.isArray(schema.options)) {
    return { anyOf: schema.options.map(o => valibotToJsonSchema(o, depth + 1)) }
  }

  if (type === 'picklist' && Array.isArray(schema.options)) {
    return { type: 'string', enum: schema.options }
  }

  const primitive = { string: 'string', number: 'number', boolean: 'boolean', null: 'null' }
  if (primitive[type]) return { type: primitive[type] }

  return { type: 'object' }
}

function captureValidateCallsite() {
  try {
    const err = new Error()
    const lines = err.stack?.split('\n') || []
    for (const line of lines.slice(2)) {
      const match = line.match(/\((.+?):(\d+):\d+\)/) ||
                    line.match(/at (.+?):(\d+):\d+/)
      if (!match) continue
      const file = match[1]
      if (file.includes('nodox-cli/src') || file.includes('node_modules/nodox-cli')) continue
      if (file.includes('node:internal')) continue
      // Return a project-relative path instead of the full absolute path.
      // Avoids leaking the server's filesystem layout to the browser UI.
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
