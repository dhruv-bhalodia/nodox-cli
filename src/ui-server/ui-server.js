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

function _getExpressMajor() {
  try {
    const v = _require('express/package.json').version || '4'
    return parseInt(v.split('.')[0], 10)
  } catch { return 4 }
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
 * @returns {Function} Express-compatible (req, res, next) handler
 */
export function createUiHandler({ uiPath = '/__nodox', getState } = {}) {
  const uiDir = findUiDir()
  const assetsPrefix = `${uiPath}/assets`
  const openApiPath = `${uiPath}/openapi.json`

  return function uiHandler(req, res, next) {
    if (!req.path.startsWith(uiPath)) { return next() }

    _applySecurityHeaders(res)

    // OpenAPI spec endpoint
    if (req.path === openApiPath) {
      const state = typeof getState === 'function' ? getState() : { routes: [] }
      const spec = buildOpenApiSpec(state.routes, req)
      res.setHeader('Content-Type', 'application/json')
      res.setHeader('Access-Control-Allow-Origin', '*')
      return res.json(spec)
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
 */
export function attachUiRoutes(app, { uiPath = '/__nodox', getState } = {}) {
  const uiDir = findUiDir()

  // OpenAPI spec endpoint — must be registered before the SPA catch-all
  app.get(`${uiPath}/openapi.json`, (req, res) => {
    _applySecurityHeaders(res)
    const state = typeof getState === 'function' ? getState() : { routes: [] }
    const spec = buildOpenApiSpec(state.routes, req)
    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.json(spec)
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
  const major = _getExpressMajor()
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

// ── OpenAPI spec generation ───────────────────────────────────────────────────

const _BODY_METHODS = new Set(['post', 'put', 'patch'])
const _PARAM_RE = /:([a-zA-Z_][a-zA-Z0-9_]*)/g

/**
 * Build an OpenAPI 3.1.0 spec object from the current route + schema state.
 * @param {object[]} routes - enriched routes from getState()
 * @param {import('http').IncomingMessage} req - used to derive server URL
 * @returns {object} OpenAPI spec
 */
function buildOpenApiSpec(routes, req) {
  const host = req?.headers?.host || 'localhost'
  const isHttps = req?.connection?.encrypted ||
    req?.headers?.['x-forwarded-proto'] === 'https'
  const protocol = isHttps ? 'https' : 'http'

  const paths = {}

  for (const route of (routes || [])) {
    if (!route.path || route.path.startsWith('/__nodox')) continue

    // Convert Express :param segments → OpenAPI {param}
    const openApiPath = route.path.replace(_PARAM_RE, '{$1}')

    if (!paths[openApiPath]) paths[openApiPath] = {}

    const method = route.method.toLowerCase()
    const schema = route.schema
    const operation = {}

    // Tags
    if (schema?.tags?.length) operation.tags = schema.tags

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
      operation.requestBody = {
        required: true,
        content: { 'application/json': { schema: schema.input } },
      }
    }

    // Responses — per-status map takes priority over single output schema
    const responses = {}

    if (schema?.outputByStatus) {
      for (const [statusCode, resSchema] of Object.entries(schema.outputByStatus)) {
        responses[statusCode] = {
          description: _httpStatusDescription(Number(statusCode)),
          content: { 'application/json': { schema: resSchema } },
        }
      }
    }

    if (schema?.output && !responses['200']) {
      responses['200'] = {
        description: 'Success',
        content: { 'application/json': { schema: schema.output } },
      }
    }

    if (Object.keys(responses).length === 0) {
      responses['200'] = { description: 'Success' }
    }

    operation.responses = responses
    paths[openApiPath][method] = operation
  }

  return {
    openapi: '3.1.0',
    info: { title: 'API', version: '1.0.0' },
    servers: [{ url: `${protocol}://${host}` }],
    paths,
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
