/**
 * UI Server
 *
 * Serves the built React UI at /__nodox.
 * The UI bundle is embedded in the package at dist/ui/.
 *
 * In development (when running from source), serves from ui/dist/.
 * In production (installed from npm), serves from dist/ui/.
 */

import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const _require = createRequire(import.meta.url)

function _getExpressMajor(app) {
  // Detect from the user's app instance — lazyrouter exists in Express 4, was
  // removed in Express 5. Using require() here would resolve nodox's own express
  // dependency, not the user's, so it would always return 4.
  if (app && typeof app.lazyrouter !== 'function') return 5
  return 4
}

/**
 * Find the UI dist directory.
 * Tries multiple locations to support both dev and installed scenarios.
 */
function findUiDir() {
  const candidates = [
    // Installed from npm, CJS bundle: __dirname = nodox-cli/dist/
    path.resolve(__dirname, '../ui/dist'),
    // Installed from npm, ESM source: __dirname = nodox-cli/src/ui-server/
    path.resolve(__dirname, '../../ui/dist'),
    // Running from source
    path.resolve(__dirname, './ui'),
    path.resolve(__dirname, '../ui'),
    path.resolve(__dirname, '../../dist/ui'),
  ]

  for (const candidate of candidates) {
    if (fs.existsSync(path.join(candidate, 'index.html'))) {
      return candidate
    }
  }

  return null
}

/**
 * Create a self-contained UI handler that can be called directly from middleware.
 * Used by the no-app code path (when app wasn't provided to nodox() at construction).
 *
 * @param {object} options
 * @param {string} [options.uiPath='/__nodox']
 * @param {Function} [options.getState] - returns current { routes } state for OpenAPI generation
 * @param {object} [options.info] - OpenAPI info overrides (title, version, description)
 * @returns {Function} Express-compatible (req, res, next) handler
 */
export function createUiHandler({ uiPath = '/__nodox', getState, info } = {}) {
  const uiDir = findUiDir()
  const assetsPrefix = `${uiPath}/assets`
  const openApiPath = `${uiPath}/openapi.json`
  const openApiYamlPath = `${uiPath}/openapi.yaml`
  const statusPath = `${uiPath}/status.json`

  return function uiHandler(req, res, next) {
    if (!req.path.startsWith(uiPath)) { return next() }

    _applySecurityHeaders(res)

    // OpenAPI JSON spec endpoint
    if (req.path === openApiPath) {
      const state = typeof getState === 'function' ? getState() : { routes: [] }
      const spec = buildOpenApiSpec(state.routes, req, { info })
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.json(spec)
    }

    // OpenAPI YAML spec endpoint
    if (req.path === openApiYamlPath) {
      const state = typeof getState === 'function' ? getState() : { routes: [] }
      const spec = buildOpenApiSpec(state.routes, req, { info })
      res.setHeader('Content-Type', 'application/x-yaml')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.send(_toYaml(spec))
    }

    // Per-route status endpoint — consumed by `npx nodox status`
    if (req.path === statusPath) {
      const state = typeof getState === 'function' ? getState() : { routes: [] }
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.json(_buildStatusPayload(state.routes))
    }

    if (!uiDir) {
      res.setHeader('Content-Type', 'text/html')
      res.send(_notBuiltHtml(uiPath))
      return
    }

    if (req.path.startsWith(assetsPrefix)) {
      const filename = req.path.slice(assetsPrefix.length).replace(/^\//, '')
      const assetsDir = path.join(uiDir, 'assets')
      const filePath = path.resolve(assetsDir, filename)
      // Use path.sep suffix so /assets-evil doesn't bypass a plain startsWith('/assets') check
      if (!filePath.startsWith(assetsDir + path.sep) && filePath !== assetsDir) {
        res.status(403).end(); return
      }
      if (!fs.existsSync(filePath)) { return next() }
      _sendAsset(res, filePath)
    } else {
      _serveIndexHtml(res, uiDir, uiPath)
    }
  }
}

/**
 * Attach nodox UI routes to an Express app.
 * Serves the React SPA at /__nodox and all its assets.
 *
 * @param {import('express').Application} app
 * @param {object} options
 * @param {string} [options.uiPath='/__nodox'] - URL prefix for the UI
 * @param {Function} [options.getState] - returns current { routes } state for OpenAPI generation
 * @param {object} [options.info] - OpenAPI info overrides (title, version, description)
 */
export function attachUiRoutes(app, { uiPath = '/__nodox', getState, info } = {}) {
  const uiDir = findUiDir()

  // OpenAPI JSON spec endpoint — must be registered before the SPA catch-all
  app.get(`${uiPath}/openapi.json`, (req, res) => {
    _applySecurityHeaders(res)
    const state = typeof getState === 'function' ? getState() : { routes: [] }
    const spec = buildOpenApiSpec(state.routes, req, { info })
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(spec)
  })

  // OpenAPI YAML spec endpoint
  app.get(`${uiPath}/openapi.yaml`, (req, res) => {
    _applySecurityHeaders(res)
    const state = typeof getState === 'function' ? getState() : { routes: [] }
    const spec = buildOpenApiSpec(state.routes, req, { info })
    res.setHeader('Content-Type', 'application/x-yaml')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.send(_toYaml(spec))
  })

  // Per-route status endpoint — consumed by `npx nodox status`
  app.get(`${uiPath}/status.json`, (req, res) => {
    _applySecurityHeaders(res)
    const state = typeof getState === 'function' ? getState() : { routes: [] }
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(_buildStatusPayload(state.routes))
  })

  if (!uiDir) {
    _registerCatchAll(app, uiPath, (req, res) => {
      _applySecurityHeaders(res)
      res.send(_notBuiltHtml(uiPath))
    })
    return
  }

  // Serve static assets (JS chunks, CSS, icons)
  // Must come before the SPA catch-all
  app.use(`${uiPath}/assets`, (req, res, next) => {
    _applySecurityHeaders(res)
    createStaticHandler(path.join(uiDir, 'assets'))(req, res, next)
  })

  // SPA catch-all: every /__nodox/* request serves index.html
  // The React router handles client-side navigation
  _registerCatchAll(app, uiPath, (req, res) => {
    _applySecurityHeaders(res)
    _serveIndexHtml(res, uiDir, uiPath)
  })
}

/** Cache patched HTML per uiPath to avoid re-reading on every request. */
const _indexHtmlCache = new Map()

/**
 * Serve index.html, rewriting the hardcoded /__nodox base path to the
 * configured uiPath so custom paths (e.g. /docs) load assets correctly.
 */
function _serveIndexHtml(res, uiDir, uiPath) {
  let html = _indexHtmlCache.get(uiPath)
  if (!html) {
    html = fs.readFileSync(path.join(uiDir, 'index.html'), 'utf8')
    if (uiPath !== '/__nodox') {
      html = html.replaceAll('/__nodox/', `${uiPath}/`)
    }
    _indexHtmlCache.set(uiPath, html)
  }
  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 'no-cache')
  res.send(html)
}

/**
 * Apply security headers to all /__nodox responses.
 * CSP allows: scripts/styles from same origin, WebSocket to same origin,
 * inline styles (Vite injects some), data URIs for fonts/icons.
 * @param {import('http').ServerResponse} res
 */
function _applySecurityHeaders(res) {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "connect-src 'self' ws: wss: http: https:; " +
    "img-src 'self' data: blob:; " +
    "font-src 'self' data: https://fonts.gstatic.com; " +
    "frame-ancestors 'none'"
  )
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'same-origin')
}

function _escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function _notBuiltHtml(uiPath) {
  const safeUiPath = _escapeHtml(uiPath)
  return `<!DOCTYPE html><html><head><title>nodox — UI not built</title>
  <style>body{font-family:monospace;padding:40px;background:#0a0a0a;color:#888}h1{color:#fff}
  code{background:#1a1a1a;padding:4px 8px;border-radius:4px;color:#7dd3fc}</style></head>
  <body><h1>nodox</h1>
  <p>UI bundle not found. Run <code>npm run build:ui</code> to build the interface.</p>
  <p>Then open <code>${safeUiPath}</code></p></body></html>`
}

const MIME_TYPES = {
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.html': 'text/html',
  '.json': 'application/json',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
}

/**
 * Send a static asset file with appropriate headers.
 * @param {import('http').ServerResponse} res
 * @param {string} filePath - absolute path to the file
 */
function _sendAsset(res, filePath) {
  const ext = path.extname(filePath)
  const filename = path.basename(filePath)
  res.setHeader('Content-Type', MIME_TYPES[ext] || 'application/octet-stream')
  // Vite produces content-hashed filenames — safe to cache aggressively
  if (filename.match(/\.[a-f0-9]{8,}\./)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
  } else {
    res.setHeader('Cache-Control', 'no-cache')
  }
  res.sendFile(filePath)
}

/**
 * Minimal static file handler — serves files from a directory.
 * @param {string} dir
 * @returns {Function} Express middleware
 */
/**
 * Register the SPA catch-all route using the correct wildcard syntax for the
 * installed Express version.
 *   Express 4: bare * wildcard  — /__nodox*
 *   Express 5: named wildcard  — /__nodox and /__nodox/*path (two routes)
 * Using a string path (not RegExp) ensures the route extractor can filter it
 * out correctly via the startsWith('/__nodox') check.
 */
function _registerCatchAll(app, uiPath, handler) {
  const major = _getExpressMajor(app)
  if (major >= 5) {
    app.get(uiPath, handler)
    app.get(`${uiPath}/*path`, handler)
  } else {
    app.get(`${uiPath}*`, handler)
  }
}

function createStaticHandler(dir) {
  return (req, res, next) => {
    const filename = req.path.replace(/^\/+/, '')
    const filePath = path.resolve(dir, filename)

    // Use path.sep suffix so /assets-evil doesn't bypass a plain startsWith('/assets') check
    if (!filePath.startsWith(dir + path.sep) && filePath !== dir) { return res.status(403).end() }
    if (!fs.existsSync(filePath)) { return next() }

    _sendAsset(res, filePath)
  }
}

// ── YAML serializer ──────────────────────────────────────────────────────────

/**
 * Convert a JSON-compatible value to a YAML string.
 * Handles OpenAPI spec objects: strings, numbers, booleans, null, arrays, objects.
 * No anchors, multi-document, or binary — just what the spec needs.
 */
function _toYaml(value, indent = 0) {
  const pad = '  '.repeat(indent)
  if (value === null || value === undefined) return 'null'
  if (typeof value === 'boolean') return String(value)
  if (typeof value === 'number') return isFinite(value) ? String(value) : 'null'
  if (typeof value === 'string') return _yamlStr(value)
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    return value.map(item => {
      const rendered = _toYaml(item, indent + 1)
      const isBlock = typeof item === 'object' && item !== null && !Array.isArray(item) && Object.keys(item).length > 0
      return isBlock ? `${pad}-\n${rendered}` : `${pad}- ${rendered}`
    }).join('\n')
  }
  const entries = Object.entries(value)
  if (entries.length === 0) return '{}'
  return entries.map(([k, v]) => {
    const key = /^[a-zA-Z0-9_$][a-zA-Z0-9_$/-]*$/.test(k) ? k : `"${k.replace(/"/g, '\\"')}"`
    if (v === null || v === undefined) return `${pad}${key}: null`
    if (typeof v === 'object') {
      const rendered = _toYaml(v, indent + 1)
      if (rendered === '[]' || rendered === '{}') return `${pad}${key}: ${rendered}`
      return `${pad}${key}:\n${rendered}`
    }
    return `${pad}${key}: ${_toYaml(v, indent + 1)}`
  }).join('\n')
}

function _yamlStr(s) {
  if (s === '') return '""'
  const needsQuote = /[:#{}[\]|>&*!,'"@`]/.test(s) ||
    /^(true|false|null|yes|no|on|off|\d)/.test(s) ||
    s.startsWith(' ') || s.endsWith(' ') || s.includes('\n')
  return needsQuote ? JSON.stringify(s) : s
}

// ── Status payload ────────────────────────────────────────────────────────────

/**
 * Build the payload for /__nodox/status.json — consumed by `npx nodox status`.
 * Returns per-route confidence levels so the CLI can show a rich coverage report.
 */
function _buildStatusPayload(routes) {
  const items = (routes || [])
    .filter(r => r.path && !r.path.startsWith('/__nodox'))
    .map(r => ({
      method: r.method,
      path: r.path,
      inputConfidence: r.schema?.inputConfidence ?? 'none',
      outputConfidence: r.schema?.outputConfidence ?? 'none',
      tags: r.schema?.tags ?? null,
    }))
  return { routes: items, generatedAt: new Date().toISOString() }
}

// ── OpenAPI spec generation ───────────────────────────────────────────────────

const _BODY_METHODS = new Set(['post', 'put', 'patch'])
const _PARAM_RE = /:([a-zA-Z_][a-zA-Z0-9_]*)/g

/**
 * Derive a PascalCase component name from method + path + suffix.
 * e.g. POST /api/users/:id → "PostApiUsersByIdBody"
 */
function _schemaName(method, path, suffix) {
  const parts = [method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()]
  for (const seg of path.split('/').filter(Boolean)) {
    if (seg.startsWith(':')) {
      parts.push('By' + seg.charAt(1).toUpperCase() + seg.slice(2))
    } else {
      parts.push(seg.charAt(0).toUpperCase() + seg.slice(1).replace(/[^a-zA-Z0-9]/g, ''))
    }
  }
  return parts.join('') + suffix
}

/** JSON fingerprint with sorted keys for deduplication. Circular-reference safe. */
function _fingerprint(schema) {
  try {
    const seen = new WeakSet()
    return JSON.stringify(schema, (_, v) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) {
        if (seen.has(v)) return '[Circular]'
        seen.add(v)
        return Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]]))
      }
      return v
    })
  } catch { return null }
}

/** True for schemas worth putting in components (object shapes, arrays with items). */
function _isComplex(schema) {
  return schema && typeof schema === 'object' &&
    (schema.properties || schema.items?.properties || schema.anyOf?.length || schema.oneOf?.length || schema.allOf?.length)
}

/**
 * Register a schema in components/schemas and return a $ref, or return the schema inline
 * if it is too simple to bother registering.
 */
function _asRef(schema, proposedName, components, fingerprints) {
  if (!_isComplex(schema)) return schema
  const fp = _fingerprint(schema)
  if (fp && fingerprints.has(fp)) {
    return { '$ref': `#/components/schemas/${fingerprints.get(fp)}` }
  }
  let name = proposedName
  let counter = 2
  while (components[name]) { name = proposedName + counter++ }
  components[name] = schema
  if (fp) fingerprints.set(fp, name)
  return { '$ref': `#/components/schemas/${name}` }
}

/**
 * Build an OpenAPI 3.1.0 spec object from the current route + schema state.
 * @param {object[]} routes - enriched routes from getState()
 * @param {import('http').IncomingMessage} req - used to derive server URL
 * @param {object} [opts]
 * @param {object} [opts.info] - overrides for the info block (title, version, description)
 * @returns {object} OpenAPI spec
 */
function buildOpenApiSpec(routes, req, { info } = {}) {
  const host = req?.headers?.host || 'localhost'
  const isHttps = req?.connection?.encrypted ||
    req?.headers?.['x-forwarded-proto'] === 'https'
  const protocol = isHttps ? 'https' : 'http'

  const paths = {}
  const securitySchemes = {}
  const schemaComponents = {}
  const schemaFingerprints = new Map()

  for (const route of (routes || [])) {
    if (!route.path || route.path.startsWith('/__nodox')) continue

    // Convert Express :param segments → OpenAPI {param}
    const openApiPath = route.path.replace(_PARAM_RE, '{$1}')

    if (!paths[openApiPath]) paths[openApiPath] = {}

    const method = route.method.toLowerCase()
    const schema = route.schema
    const operation = {}

    // Tags — explicit tags take precedence; fall back to auto-detected API version
    if (schema?.tags?.length) {
      operation.tags = schema.tags
    } else if (route.version) {
      operation.tags = [route.version]
    }

    // Metadata
    if (schema?.meta?.summary) operation.summary = schema.meta.summary
    if (schema?.meta?.description) operation.description = schema.meta.description
    if (schema?.meta?.deprecated === true) operation.deprecated = true
    if (schema?.externalDocs?.url) operation.externalDocs = schema.externalDocs

    // Path parameters — extracted from the original Express path
    const pathParams = []
    _PARAM_RE.lastIndex = 0
    let m
    while ((m = _PARAM_RE.exec(route.path)) !== null) {
      pathParams.push({ name: m[1], in: 'path', required: true, schema: { type: 'string' } })
    }

    // Query parameters — from querySchema (observed on GET/DELETE/HEAD/OPTIONS)
    const queryParams = []
    if (schema?.querySchema?.properties) {
      for (const [name, def] of Object.entries(schema.querySchema.properties)) {
        queryParams.push({ name, in: 'query', required: false, schema: def })
      }
    }

    const parameters = [...pathParams, ...queryParams]
    if (parameters.length) operation.parameters = parameters

    // Request body — POST, PUT, PATCH only
    if (_BODY_METHODS.has(method) && schema?.input) {
      const bodyRef = _asRef(schema.input,
        _schemaName(method, route.path, 'Body'),
        schemaComponents, schemaFingerprints)
      const bodyContent = { schema: bodyRef }
      if (schema?.meta?.examples?.body) {
        bodyContent.examples = { default: { value: schema.meta.examples.body } }
      }
      operation.requestBody = {
        required: true,
        content: { 'application/json': bodyContent },
      }
    }

    // Responses — per-status map takes priority over single output schema
    const responses = {}

    if (schema?.outputByStatus) {
      for (const [statusCode, resSchema] of Object.entries(schema.outputByStatus)) {
        const resRef = _asRef(resSchema,
          _schemaName(method, route.path, `Response${statusCode}`),
          schemaComponents, schemaFingerprints)
        const resContent = { schema: resRef }
        if (schema?.meta?.examples?.responses?.[statusCode]) {
          resContent.examples = { default: { value: schema.meta.examples.responses[statusCode] } }
        }
        responses[statusCode] = {
          description: _httpStatusDescription(Number(statusCode)),
          content: { 'application/json': resContent },
        }
      }
    }

    if (schema?.output && !responses['200']) {
      const resRef = _asRef(schema.output,
        _schemaName(method, route.path, 'Response'),
        schemaComponents, schemaFingerprints)
      const resContent = { schema: resRef }
      if (schema?.meta?.examples?.response) {
        resContent.examples = { default: { value: schema.meta.examples.response } }
      }
      responses['200'] = {
        description: 'Success',
        content: { 'application/json': resContent },
      }
    }

    if (Object.keys(responses).length === 0) {
      responses['200'] = { description: 'Success' }
    }

    operation.responses = responses

    // Auth → security on this operation + collect scheme for components
    if (schema?.auth) {
      const schemeResult = _buildSecurityScheme(schema.auth)
      if (schemeResult) {
        const [schemeName, schemeObj] = schemeResult
        securitySchemes[schemeName] = schemeObj
        const scopes = schema.auth.type === 'oauth2' ? (schema.auth.scopes || []) : []
        operation.security = [{ [schemeName]: scopes }]
      }
    }

    paths[openApiPath][method] = operation
  }

  const specInfo = {
    title: info?.title || 'API',
    version: info?.version || '1.0.0',
    ...(info?.description ? { description: info.description } : {}),
    ...(info?.contact ? { contact: info.contact } : {}),
    ...(info?.license ? { license: info.license } : {}),
    ...(info?.termsOfService ? { termsOfService: info.termsOfService } : {}),
  }

  const spec = {
    openapi: '3.1.0',
    info: specInfo,
    servers: [{ url: `${protocol}://${host}` }],
    paths,
  }

  const hasSchemaComponents = Object.keys(schemaComponents).length > 0
  const hasSecuritySchemes = Object.keys(securitySchemes).length > 0
  if (hasSchemaComponents || hasSecuritySchemes) {
    spec.components = {}
    if (hasSchemaComponents) spec.components.schemas = schemaComponents
    if (hasSecuritySchemes) spec.components.securitySchemes = securitySchemes
  }

  return spec
}

/**
 * Convert a nodox auth config to an [schemeName, OpenAPI Security Scheme] pair.
 * @param {{type: string, name?: string, in?: string, scopes?: string[], description?: string}} auth
 * @returns {[string, object]|null}
 */
function _buildSecurityScheme(auth) {
  const desc = auth.description ? { description: auth.description } : {}
  switch (auth.type) {
    case 'bearer':
      return ['BearerAuth', { type: 'http', scheme: 'bearer', bearerFormat: 'JWT', ...desc }]
    case 'basic':
      return ['BasicAuth', { type: 'http', scheme: 'basic', ...desc }]
    case 'apiKey':
      return ['ApiKeyAuth', { type: 'apiKey', name: auth.name || 'X-API-Key', in: auth.in || 'header', ...desc }]
    case 'oauth2':
      return ['OAuth2Auth', {
        type: 'oauth2',
        flows: {
          implicit: {
            authorizationUrl: '',
            scopes: Object.fromEntries((auth.scopes || []).map(s => [s, ''])),
          },
        },
        ...desc,
      }]
    default:
      return null
  }
}

function _httpStatusDescription(code) {
  const map = {
    200: 'OK', 201: 'Created', 202: 'Accepted', 204: 'No Content',
    301: 'Moved Permanently', 302: 'Found', 304: 'Not Modified',
    400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden',
    404: 'Not Found', 405: 'Method Not Allowed', 409: 'Conflict',
    410: 'Gone', 422: 'Unprocessable Entity', 429: 'Too Many Requests',
    500: 'Internal Server Error', 502: 'Bad Gateway', 503: 'Service Unavailable',
  }
  return map[code] || 'Response'
}
