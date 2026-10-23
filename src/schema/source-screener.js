
const ZOD_PATTERNS = [
  /\.safeParse\(/,
  /\.parseAsync\(/,
  /\.safeParseAsync\(/,
  /\bz\.(object|string|number|boolean|array|union|enum)\b/,
  /_zod\.z\./,
  /zod_1\.z\./,
  /[a-zA-Z]{2,}\.parse\(/,
  /[a-zA-Z]{2,}\.safeParse\(/,
  /\.parse\(req[.,\s)]/,
  /\w+[Ss]chema\.parse\(/,
  /\w+[Vv]alidator\.parse\(/,
]

const JOI_PATTERNS = [
  /\.validate\(req\b/,
  /\.validate\(\w+\.body\b/,
  /joi\.(object|string|number|boolean|array)\(/,
  /_joi\.(default|joi)\b/i,
  /Joi\.(object|string|number|boolean|array)\(/,
]

const YUP_PATTERNS = [
  /yup\.(object|string|number|boolean|array|mixed)\(/,
  /\.validateSync\(req\b/,
  /\.validateSync\(req\.body\b/,
  /yup_1\.(object|string|number|boolean)/,
  /schema\.validateSync\b/,
]

const VALIBOT_PATTERNS = []

const TYPEBOX_PATTERNS = []

const KNOWN_NON_VALIDATORS = new Set([
  'router', 'bound dispatch', 'bound ',
  'jsonParser', 'urlencodedParser', 'rawParser', 'textParser',
  'json', 'urlencoded', 'raw', 'text', 'query',
  'init', 'expressInit',

  'nodoxMiddleware', 'nodoxValidateMiddleware', 'responseInterceptorMiddleware',
  'uiHandler',

  'corsMiddleware', 'cors', 'corsPreflight',
  'helmet',
  'morgan', 'logger', 'accessLogger', 'requestLogger',
  'compression',
  'responseTime',
  'timeout', 'connectTimeout',
  'methodOverride',

  'rateLimit', 'slowDown', 'expressRateLimit',

  'session', 'expressSession', 'cookieParser', 'cookieSession',
  'passport', 'initialize', 'passportInitialize', 'passportSession',
  'authenticate', 'jwtMiddleware', 'bearerStrategy',

  'multer', 'upload', 'single', 'array', 'fields', 'none', 'any',
  'busboy', 'multipart',

  'cache', 'apicache', 'expressCache',

  'bodyParser',

  'serveStatic', 'staticMiddleware', 'sendFile',

  'errorHandler', 'notFound', 'notFoundHandler',
  'finalhandler',

  'checkSchema', 'check', 'param', 'query', 'header', 'cookie', 'validationResult',

  'pinoHttp', 'winstonMiddleware',

  'device', 'userAgent', 'responseCompression',
  'requestId', 'correlationId',
  'i18n', 'locale',
])

const NODE_MODULES_SOURCE_PATTERNS = [
  /Object\.defineProperty\(exports,\s*["']__esModule["']/,
  /exports\.__esModule\s*=\s*true/,
  /__webpack_require__\(/,
  /\/\*\*\s*@license\b/,
  /\/\*\s*!\s*Copyright\s/i,
  /function\s*\(\s*module\s*,\s*exports\s*,\s*__webpack/,
]

function isLikelyNodeModuleCode(src) {
  return NODE_MODULES_SOURCE_PATTERNS.some(p => p.test(src))
}

export function looksLikeValidator(fn) {
  if (typeof fn !== 'function') return false

  const name = fn.name || ''
  if (KNOWN_NON_VALIDATORS.has(name)) return false

  if (fn.__isNodoxValidate) return false

  let src
  try {
    src = fn.toString()
  } catch {
    return false
  }

  if (src.length < 20) return false

  if (src.length > 500 && !src.includes('\n') && !src.includes('  ')) {
    return false
  }

  if (isLikelyNodeModuleCode(src)) return false

  const compressed = src.replace(/\s+/g, '')

  return ZOD_PATTERNS.some(p => p.test(compressed)) ||
         JOI_PATTERNS.some(p => p.test(compressed)) ||
         YUP_PATTERNS.some(p => p.test(compressed)) ||
         VALIBOT_PATTERNS.some(p => p.test(compressed)) ||
         TYPEBOX_PATTERNS.some(p => p.test(compressed))
}

export function flagValidatorsInHandlers(handlers) {
  return handlers.filter(looksLikeValidator)
}
