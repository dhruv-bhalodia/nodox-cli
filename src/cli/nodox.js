#!/usr/bin/env node
/**
 * nodox CLI
 *
 * Commands:
 *   npx nodox init    — detect Jest/Vitest, inject setup file into config
 *   npx nodox prune   — wipe .apicache.json and start fresh
 *   npx nodox status  — show current cache stats
 */

import fs from 'fs'
import path from 'path'
import { pruneCache, readCache, getCacheStats } from '../layer4/cache-manager.js'
import { findCacheFile } from '../layer4/cache-reader.js'

const [, , command, ...args] = process.argv

// ── Colours ───────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
  cyan:   '\x1b[36m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
}

function log(msg)  { console.log(msg) }
function ok(msg)   { console.log(`  ${c.green}✓${c.reset}  ${msg}`) }
function info(msg) { console.log(`  ${c.cyan}◆${c.reset}  ${msg}`) }
function warn(msg) { console.log(`  ${c.yellow}!${c.reset}  ${msg}`) }
function err(msg)  { console.log(`  ${c.red}✗${c.reset}  ${msg}`) }
function dim(msg)  { console.log(`  ${c.dim}${msg}${c.reset}`) }

// ── Command dispatch ───────────────────────────────────────────────────────
;(async () => {
  switch (command) {
    case 'init':
      runInit()
      break
    case 'prune':
      runPrune()
      break
    case 'status':
      await runStatus()
      break
    case 'snapshot':
      await runSnapshot()
      break
    case 'diff':
      await runDiff()
      break
    case 'export':
      await runExport()
      break
    case '--help':
    case '-h':
    case undefined:
      printHelp()
      break
    default:
      err(`Unknown command: ${command}`)
      log('')
      printHelp()
      process.exit(1)
  }
})()

// ── init ──────────────────────────────────────────────────────────────────

function runInit() {
  log('')
  log(`  ${c.cyan}${c.bold}◆ nodox init${c.reset}`)
  log('')

  const cwd = process.cwd()

  // 1. Detect test runner
  const runner = detectTestRunner(cwd)
  if (!runner) {
    err('No Jest or Vitest config found in the current directory.')
    dim('Expected: jest.config.js, jest.config.ts, vitest.config.js, or vitest.config.ts')
    dim('Run this command from your project root.')
    log('')
    process.exit(1)
  }

  info(`Detected test runner: ${c.bold}${runner.name}${c.reset}`)

  // 2. Determine the setup file path to inject
  // We reference the nodox package by package name so it works whether
  // nodox is installed globally or as a devDependency.
  const setupEntry = 'nodox-cli/jest-setup'

  // 3. Inject into config
  const result = injectSetupFile(runner.configFile, setupEntry, runner.name)

  if (result.alreadyPresent) {
    ok(`nodox setup file already present in ${path.basename(runner.configFile)}`)
    log('')
    dim('Nothing to do. Your test suite is already wired.')
  } else {
    // Write updated config
    fs.writeFileSync(runner.configFile, result.content, 'utf8')
    ok(`Added ${c.cyan}${setupEntry}${c.reset} to ${c.bold}${path.basename(runner.configFile)}${c.reset}`)
    log('')
    dim('Next time you run your tests, nodox will record HTTP exchanges')
    dim('and write them to .apicache.json in your project root.')
  }

  // 4. Add .apicache.json to .gitignore if it exists
  ensureGitignore(cwd)

  log('')
  info('Setup complete. Run your tests to populate the schema cache:')
  dim(`  ${runner.testCommand}`)
  log('')
}

// ── prune ─────────────────────────────────────────────────────────────────

function runPrune() {
  log('')
  log(`  ${c.cyan}${c.bold}◆ nodox prune${c.reset}`)
  log('')

  const cacheFile = findCacheFile() || path.resolve(process.cwd(), '.apicache.json')

  if (!fs.existsSync(cacheFile)) {
    warn('No .apicache.json found — nothing to prune.')
    log('')
    dim(`Expected location: ${cacheFile}`)
    log('')
    return
  }

  // Show what's being wiped
  const cache = readCache(cacheFile)
  const stats = getCacheStats(cache)
  info(`Found cache with ${stats.routeCount} routes (${stats.withOutput} with output schemas)`)

  pruneCache(cacheFile)
  ok('Cache pruned. .apicache.json now contains 0 routes.')
  log('')
  dim('Run your test suite to repopulate from scratch:')
  dim('  npx jest  or  npx vitest')
  log('')
}

// ── status ────────────────────────────────────────────────────────────────

async function runStatus() {
  log('')
  log(`  ${c.cyan}${c.bold}◆ nodox status${c.reset}`)
  log('')

  const urlArg = parseFlag('--url') || parseFlag('-u')
  const serverUrl = urlArg || 'http://localhost:3000'
  const statusUrl = `${serverUrl.replace(/\/$/, '')}/__nodox/status.json`

  // Try live server first
  let liveRoutes = null
  try {
    const res = await fetch(statusUrl, { signal: AbortSignal.timeout(2000) })
    if (res.ok) {
      const data = await res.json()
      liveRoutes = data.routes
    }
  } catch { /* server not running — fall through to cache */ }

  if (liveRoutes) {
    _printLiveStatus(liveRoutes, serverUrl)
    return
  }

  // Fall back to cache
  if (urlArg) {
    err(`Could not reach server at ${serverUrl}`)
    dim('Make sure your Express server is running with nodox mounted.')
    log('')
    process.exit(1)
  }

  _printCacheStatus()
}

function _printLiveStatus(routes, serverUrl) {
  const total = routes.length
  const confirmed = routes.filter(r => r.inputConfidence === 'confirmed').length
  const inferred  = routes.filter(r => r.inputConfidence === 'inferred').length
  const observed  = routes.filter(r => r.inputConfidence === 'observed').length
  const none      = routes.filter(r => r.inputConfidence === 'none').length

  info(`Server: ${c.dim}${serverUrl}${c.reset}`)
  info(`Routes tracked: ${c.bold}${total}${c.reset}`)
  log('')
  log(`  ${c.dim}Schema coverage:${c.reset}`)
  log('')

  const confLabel = {
    confirmed: c.green + 'confirmed' + c.reset,
    inferred:  c.cyan  + 'inferred'  + c.reset,
    observed:  c.yellow + 'observed' + c.reset,
    none:      c.dim   + '—'         + c.reset,
  }
  const sourceHint = {
    confirmed: c.dim + '(validate)' + c.reset,
    inferred:  c.dim + '(dry-run)'  + c.reset,
    observed:  c.dim + '(traffic)'  + c.reset,
    none:      '',
  }

  for (const route of routes) {
    const method = route.method.padEnd(7)
    const p = route.path.padEnd(38)
    const conf = route.inputConfidence || 'none'
    log(`  ${c.dim}${method}${c.reset} ${p} ${confLabel[conf].padEnd(20)}  ${sourceHint[conf]}`)
  }

  log('')
  const coveredPct = total > 0 ? Math.round(((total - none) / total) * 100) : 0
  info(`Coverage: ${c.bold}${total - none}/${total}${c.reset} routes have schema  ${c.dim}(${coveredPct}%)${c.reset}`)
  if (confirmed > 0) dim(`  ${confirmed} confirmed via validate()`)
  if (inferred > 0)  dim(`  ${inferred} inferred from dry-run`)
  if (observed > 0)  dim(`  ${observed} observed from traffic`)
  log('')
}

function _printCacheStatus() {
  const cacheFile = findCacheFile()

  if (!cacheFile) {
    warn('No running server found and no .apicache.json in this directory tree.')
    dim('Start your server to get live per-route coverage, or run:')
    dim('  npx nodox init  →  run tests  →  npx nodox status')
    log('')
    return
  }

  const cache = readCache(cacheFile)
  const stats = getCacheStats(cache)

  info(`Cache file: ${c.dim}${cacheFile}${c.reset}`)
  info(`Routes tracked: ${c.bold}${stats.routeCount}${c.reset}  ${c.dim}(from .apicache.json — start your server for live confidence levels)${c.reset}`)

  if (cache.generatedAt) {
    const date = new Date(cache.generatedAt)
    info(`Last updated: ${date.toLocaleString()}`)
  }

  if (stats.routeCount > 0) {
    log('')
    log(`  ${c.dim}Schema coverage:${c.reset}`)
    log('')
    for (const [, entry] of Object.entries(cache.routes)) {
      const method = entry.method.padEnd(7)
      const p = entry.path.padEnd(38)
      const conf = entry.input ? c.yellow + 'observed' + c.reset : c.dim + '—' + c.reset
      const hint = entry.input ? c.dim + '(cache)' + c.reset : ''
      log(`  ${c.dim}${method}${c.reset} ${p} ${conf.padEnd(20)}  ${hint}`)
    }
    log('')
    info(`View docs at: ${c.bold}http://localhost:3000/__nodox${c.reset}`)
  }

  log('')
}

// ── snapshot ──────────────────────────────────────────────────────────────

async function runSnapshot() {
  log('')
  log(`  ${c.cyan}${c.bold}◆ nodox snapshot${c.reset}`)
  log('')

  const urlArg = parseFlag('--url') || parseFlag('-u')
  const outArg = parseFlag('--out') || parseFlag('-o')
  const serverUrl = urlArg || 'http://localhost:3000'
  const specUrl = `${serverUrl.replace(/\/$/, '')}/__nodox/openapi.json`
  const outFile = outArg || path.resolve(process.cwd(), '.nodox-snapshot.json')

  info(`Fetching spec from ${c.dim}${specUrl}${c.reset}`)

  let spec
  try {
    const res = await fetch(specUrl)
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
    spec = await res.json()
  } catch (e) {
    err(`Could not reach server: ${e.message}`)
    dim('Make sure your Express server is running with nodox mounted.')
    log('')
    process.exit(1)
  }

  const routeCount = Object.values(spec.paths || {})
    .reduce((n, ops) => n + Object.keys(ops).length, 0)

  const snapshot = {
    savedAt: new Date().toISOString(),
    serverUrl,
    spec,
  }

  fs.writeFileSync(outFile, JSON.stringify(snapshot, null, 2), 'utf8')
  ok(`Snapshot saved to ${c.bold}${path.relative(process.cwd(), outFile)}${c.reset}`)
  info(`Captured ${c.bold}${routeCount}${c.reset} operations`)
  log('')
  dim('Run `npx nodox diff` to compare against a future snapshot.')
  log('')
}

// ── diff ──────────────────────────────────────────────────────────────────

async function runDiff() {
  log('')
  log(`  ${c.cyan}${c.bold}◆ nodox diff${c.reset}`)
  log('')

  let oldSpec, newSpec

  // Two-file mode: nodox diff old.json new.json
  if (args.length >= 2 && !args[0].startsWith('-')) {
    const [oldFile, newFile] = args
    try {
      oldSpec = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), oldFile), 'utf8')).spec
        ?? JSON.parse(fs.readFileSync(path.resolve(process.cwd(), oldFile), 'utf8'))
    } catch (e) { err(`Cannot read ${oldFile}: ${e.message}`); process.exit(1) }
    try {
      newSpec = JSON.parse(fs.readFileSync(path.resolve(process.cwd(), newFile), 'utf8')).spec
        ?? JSON.parse(fs.readFileSync(path.resolve(process.cwd(), newFile), 'utf8'))
    } catch (e) { err(`Cannot read ${newFile}: ${e.message}`); process.exit(1) }
  } else {
    // Snapshot-to-server mode: compare saved snapshot against live server
    const snapshotFile = parseFlag('--snapshot') || path.resolve(process.cwd(), '.nodox-snapshot.json')
    const urlArg = parseFlag('--url') || parseFlag('-u')

    if (!fs.existsSync(snapshotFile)) {
      err(`Snapshot not found: ${snapshotFile}`)
      dim('Run `npx nodox snapshot` first to capture a baseline.')
      log('')
      process.exit(1)
    }

    const saved = JSON.parse(fs.readFileSync(snapshotFile, 'utf8'))
    oldSpec = saved.spec
    const serverUrl = urlArg || saved.serverUrl || 'http://localhost:3000'
    const specUrl = `${serverUrl.replace(/\/$/, '')}/__nodox/openapi.json`

    info(`Baseline: ${c.dim}${snapshotFile}${c.reset} (saved ${_relTime(saved.savedAt)})`)
    info(`Comparing against: ${c.dim}${specUrl}${c.reset}`)
    log('')

    try {
      const res = await fetch(specUrl)
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      newSpec = await res.json()
    } catch (e) {
      err(`Could not reach server: ${e.message}`)
      process.exit(1)
    }
  }

  const { breaking, additions, changes } = _diffSpecs(oldSpec, newSpec)

  if (breaking.length === 0 && additions.length === 0 && changes.length === 0) {
    ok('No changes detected — specs are identical.')
    log('')
    return
  }

  if (breaking.length > 0) {
    log(`  ${c.red}${c.bold}Breaking changes (${breaking.length})${c.reset}`)
    for (const msg of breaking) log(`  ${c.red}✗${c.reset}  ${msg}`)
    log('')
  }

  if (changes.length > 0) {
    log(`  ${c.yellow}${c.bold}Non-breaking changes (${changes.length})${c.reset}`)
    for (const msg of changes) log(`  ${c.yellow}~${c.reset}  ${msg}`)
    log('')
  }

  if (additions.length > 0) {
    log(`  ${c.green}${c.bold}Additions (${additions.length})${c.reset}`)
    for (const msg of additions) log(`  ${c.green}+${c.reset}  ${msg}`)
    log('')
  }

  if (breaking.length > 0) {
    err(`${breaking.length} breaking change${breaking.length > 1 ? 's' : ''} detected.`)
    log('')
    process.exit(1)
  }

  ok('No breaking changes.')
  log('')
}

function _diffSpecs(oldSpec, newSpec) {
  const breaking = []
  const additions = []
  const changes = []

  const oldPaths = oldSpec.paths || {}
  const newPaths = newSpec.paths || {}

  // Check for removed or changed routes
  for (const [urlPath, oldOps] of Object.entries(oldPaths)) {
    for (const [method, oldOp] of Object.entries(oldOps)) {
      const newOp = newPaths[urlPath]?.[method]

      if (!newOp) {
        breaking.push(`Removed: ${method.toUpperCase()} ${urlPath}`)
        continue
      }

      // Check request body schema changes
      const oldBody = oldOp.requestBody?.content?.['application/json']?.schema
      const newBody = newOp.requestBody?.content?.['application/json']?.schema

      if (oldBody && newBody) {
        const bodyBreaking = _diffSchemas(oldBody, newBody, `${method.toUpperCase()} ${urlPath} body`)
        breaking.push(...bodyBreaking)
      } else if (oldBody && !newBody) {
        breaking.push(`${method.toUpperCase()} ${urlPath}: request body removed`)
      }

      // Check newly deprecated
      if (!oldOp.deprecated && newOp.deprecated) {
        changes.push(`Deprecated: ${method.toUpperCase()} ${urlPath}`)
      }
    }
  }

  // Check for added routes
  for (const [urlPath, newOps] of Object.entries(newPaths)) {
    for (const method of Object.keys(newOps)) {
      if (!oldPaths[urlPath]?.[method]) {
        additions.push(`Added: ${method.toUpperCase()} ${urlPath}`)
      }
    }
  }

  return { breaking, additions, changes }
}

function _diffSchemas(oldSchema, newSchema, label) {
  const breaking = []
  const oldProps = oldSchema.properties || {}
  const newProps = newSchema.properties || {}
  const oldRequired = new Set(oldSchema.required || [])
  const newRequired = new Set(newSchema.required || [])

  // Required field removed → breaking (callers that relied on it being present may break)
  // Actually: removing a field that was required in the *request* schema is non-breaking for
  // callers (they no longer need to send it). But removing a required *response* field is
  // breaking. We don't distinguish here, so we flag required field removal as breaking.
  for (const field of oldRequired) {
    if (!newRequired.has(field)) {
      breaking.push(`${label}: required field '${field}' is no longer required`)
    }
  }

  // Field removed entirely → breaking
  for (const field of Object.keys(oldProps)) {
    if (!newProps[field]) {
      breaking.push(`${label}: field '${field}' removed`)
    } else {
      // Type changed → breaking
      const oldType = _typeStr(oldProps[field])
      const newType = _typeStr(newProps[field])
      if (oldType && newType && oldType !== newType) {
        breaking.push(`${label}: field '${field}' type changed from '${oldType}' to '${newType}'`)
      }
    }
  }

  return breaking
}

function _typeStr(schema) {
  if (!schema) return null
  if (Array.isArray(schema.type)) return schema.type.filter(t => t !== 'null').sort().join('|')
  return schema.type || null
}

function _relTime(isoStr) {
  if (!isoStr) return 'unknown time'
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function parseFlag(name) {
  const idx = args.indexOf(name)
  if (idx === -1) return null
  return args[idx + 1] || null
}

// ── export ────────────────────────────────────────────────────────────────

async function runExport() {
  log('')
  log(`  ${c.cyan}${c.bold}◆ nodox export${c.reset}`)
  log('')

  const urlArg    = parseFlag('--url') || parseFlag('-u')
  const outArg    = parseFlag('--out') || parseFlag('-o')
  const formatArg = parseFlag('--format') || parseFlag('-f') || 'both'
  const serverUrl = urlArg || 'http://localhost:3000'
  const base      = outArg ? outArg.replace(/\.(json|yaml|yml)$/, '') : 'openapi'

  const wantJson = formatArg === 'json' || formatArg === 'both'
  const wantYaml = formatArg === 'yaml' || formatArg === 'yml' || formatArg === 'both'

  if (!wantJson && !wantYaml) {
    err(`Unknown format: ${formatArg}. Use json, yaml, or both.`)
    log('')
    process.exit(1)
  }

  info(`Server: ${c.dim}${serverUrl}${c.reset}`)
  log('')

  if (wantJson) {
    const url  = `${serverUrl.replace(/\/$/, '')}/__nodox/openapi.json`
    const file = path.resolve(process.cwd(), `${base}.json`)
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const text = await res.text()
      fs.writeFileSync(file, text, 'utf8')
      const count = _countOps(JSON.parse(text))
      ok(`${c.bold}${path.relative(process.cwd(), file)}${c.reset}  ${c.dim}(${count} operations)${c.reset}`)
    } catch (e) {
      err(`JSON export failed: ${e.message}`)
      dim('Make sure your Express server is running with nodox mounted.')
      log('')
      process.exit(1)
    }
  }

  if (wantYaml) {
    const url  = `${serverUrl.replace(/\/$/, '')}/__nodox/openapi.yaml`
    const file = path.resolve(process.cwd(), `${base}.yaml`)
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(3000) })
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`)
      const text = await res.text()
      fs.writeFileSync(file, text, 'utf8')
      ok(`${c.bold}${path.relative(process.cwd(), file)}${c.reset}`)
    } catch (e) {
      err(`YAML export failed: ${e.message}`)
      dim('Make sure your Express server is running with nodox mounted.')
      log('')
      process.exit(1)
    }
  }

  log('')
  dim('Paste either file into Swagger UI, Redocly, Scalar, or any OpenAPI viewer.')
  dim('SDK generators (Speakeasy, Fern) can consume them without extra configuration.')
  log('')
}

function _countOps(spec) {
  return Object.values(spec.paths || {}).reduce((n, ops) => n + Object.keys(ops).length, 0)
}

// ── help ──────────────────────────────────────────────────────────────────

function printHelp() {
  log('')
  log(`  ${c.cyan}${c.bold}◆ nodox${c.reset}`)
  log('')
  log(`  ${c.bold}Commands:${c.reset}`)
  log(`    ${c.cyan}npx nodox init${c.reset}       Wire test suite seeding into Jest or Vitest`)
  log(`    ${c.cyan}npx nodox prune${c.reset}      Wipe .apicache.json and start fresh`)
  log(`    ${c.cyan}npx nodox status${c.reset}     Show per-route schema coverage (live server or cache)`)
  log(`    ${c.cyan}npx nodox snapshot${c.reset}   Save a baseline OpenAPI snapshot`)
  log(`    ${c.cyan}npx nodox diff${c.reset}       Compare snapshots and detect breaking changes`)
  log(`    ${c.cyan}npx nodox export${c.reset}     Export OpenAPI spec as JSON and/or YAML`)
  log('')
  log(`  ${c.bold}status options:${c.reset}`)
  log(`    ${c.dim}--url <url>${c.reset}   Server URL  ${c.dim}(default: http://localhost:3000)${c.reset}`)
  log('')
  log(`  ${c.bold}snapshot options:${c.reset}`)
  log(`    ${c.dim}--url <url>${c.reset}   Server URL  ${c.dim}(default: http://localhost:3000)${c.reset}`)
  log(`    ${c.dim}--out <file>${c.reset}  Output file ${c.dim}(default: .nodox-snapshot.json)${c.reset}`)
  log('')
  log(`  ${c.bold}export options:${c.reset}`)
  log(`    ${c.dim}--url <url>${c.reset}      Server URL           ${c.dim}(default: http://localhost:3000)${c.reset}`)
  log(`    ${c.dim}--format <fmt>${c.reset}   json | yaml | both   ${c.dim}(default: both)${c.reset}`)
  log(`    ${c.dim}--out <base>${c.reset}     Output basename      ${c.dim}(default: openapi → openapi.json / openapi.yaml)${c.reset}`)
  log('')
  log(`  ${c.bold}diff options:${c.reset}`)
  log(`    ${c.dim}npx nodox diff old.json new.json${c.reset}   Compare two snapshot files`)
  log(`    ${c.dim}--url <url>${c.reset}           Live server to compare against snapshot`)
  log(`    ${c.dim}--snapshot <file>${c.reset}     Baseline snapshot file ${c.dim}(default: .nodox-snapshot.json)${c.reset}`)
  log('')
  log(`  ${c.bold}Docs:${c.reset} https://github.com/dhruv-bhalodia/nodox`)
  log('')
}

// ── Helpers ───────────────────────────────────────────────────────────────

/**
 * Detect the test runner and its config file in cwd.
 * Returns { name, configFile, testCommand } or null.
 */
function detectTestRunner(cwd) {
  // Jest configs (check before vitest — projects more commonly use Jest)
  const jestConfigs = [
    'jest.config.js', 'jest.config.ts', 'jest.config.mjs',
    'jest.config.cjs', 'jest.config.json',
  ]
  for (const f of jestConfigs) {
    const full = path.join(cwd, f)
    if (fs.existsSync(full)) {
      return { name: 'Jest', configFile: full, testCommand: 'npx jest' }
    }
  }

  // Also check package.json for "jest" key
  const pkgJson = path.join(cwd, 'package.json')
  if (fs.existsSync(pkgJson)) {
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgJson, 'utf8'))
      if (pkg.jest) {
        return { name: 'Jest (package.json)', configFile: pkgJson, testCommand: 'npx jest' }
      }
    } catch { /* ignore */ }
  }

  // Vitest configs
  const vitestConfigs = [
    'vitest.config.js', 'vitest.config.ts', 'vitest.config.mjs',
  ]
  for (const f of vitestConfigs) {
    const full = path.join(cwd, f)
    if (fs.existsSync(full)) {
      return { name: 'Vitest', configFile: full, testCommand: 'npx vitest' }
    }
  }

  return null
}

/**
 * Inject the nodox setup file into a Jest or Vitest config.
 * Returns { content: string, alreadyPresent: boolean }.
 *
 * Jest:   setupFiles goes at top-level of the config object
 * Vitest: setupFiles must be nested inside test: {}
 */
function injectSetupFile(configFile, setupEntry, runnerName) {
  // Special case: package.json with "jest" key
  if (path.basename(configFile) === 'package.json') {
    return injectIntoPackageJson(configFile, setupEntry)
  }

  const content = fs.readFileSync(configFile, 'utf8')

  if (content.includes(setupEntry)) {
    return { content, alreadyPresent: true }
  }

  if (runnerName.startsWith('Vitest')) {
    return injectIntoVitestConfig(content, setupEntry)
  }

  // Jest: already has setupFiles at top level?
  if (/setupFiles\s*:/.test(content)) {
    const updated = content.replace(
      /setupFiles\s*:\s*\[/,
      `setupFiles: ['${setupEntry}', `
    )
    return { content: updated, alreadyPresent: false }
  }

  // Jest: no setupFiles — inject into the exported config object
  const updated = injectIntoExport(content, `  setupFiles: ['${setupEntry}'],`)
  return { content: updated, alreadyPresent: false }
}

/**
 * Inject setupFiles into a Vitest config under the test: {} block.
 * Vitest requires setupFiles to be inside test: {}, not at top level.
 */
function injectIntoVitestConfig(content, setupEntry) {
  const testBlockMatch = content.match(/\btest\s*:\s*\{/)

  if (testBlockMatch) {
    // test: {} block exists — check if setupFiles is already inside it
    if (/\btest\s*:\s*\{[^]*?setupFiles\s*:/.test(content)) {
      // Already has setupFiles inside test block — prepend to it
      const updated = content.replace(
        /(\btest\s*:\s*\{[^]*?setupFiles\s*:\s*\[)/,
        `$1'${setupEntry}', `
      )
      return { content: updated, alreadyPresent: false }
    }

    // Inject setupFiles right after the opening brace of test: {
    const insertAt = testBlockMatch.index + testBlockMatch[0].length
    const before = content.slice(0, insertAt)
    const after = content.slice(insertAt)
    const needsComma = after.trimStart()[0] !== '}'
    return {
      content: `${before}\n    setupFiles: ['${setupEntry}'],${needsComma ? '\n' : ''}${after}`,
      alreadyPresent: false,
    }
  }

  // No test: {} block — inject one into the top-level config object
  const line = `  test: {\n    setupFiles: ['${setupEntry}'],\n  },`
  return { content: injectIntoExport(content, line), alreadyPresent: false }
}

/**
 * Inject into package.json "jest" config key.
 */
function injectIntoPackageJson(pkgFile, setupEntry) {
  const raw = fs.readFileSync(pkgFile, 'utf8')
  const pkg = JSON.parse(raw)

  if (!pkg.jest) return { content: raw, alreadyPresent: false }

  if (pkg.jest.setupFiles?.includes(setupEntry)) {
    return { content: raw, alreadyPresent: true }
  }

  pkg.jest.setupFiles = [setupEntry, ...(pkg.jest.setupFiles || [])]
  return { content: JSON.stringify(pkg, null, 2) + '\n', alreadyPresent: false }
}

/**
 * Inject a line into the first exported object literal in a JS config file.
 * Works for: export default { }, module.exports = { }, defineConfig({ })
 */
function injectIntoExport(content, lineToInject) {
  // Strategy: find the last closing brace of the top-level export and insert before it
  // This is deliberately naive — it handles the 99% case without a full AST parser.

  // Find the opening of the config object
  // Match: export default {, module.exports = {, defineConfig({
  const openMatch = content.match(/(export\s+default\s*\{|module\.exports\s*=\s*\{|defineConfig\s*\(\s*\{)/)
  if (!openMatch) {
    // Can't find the config object — append a warning comment
    return content + `\n// TODO: add setupFiles: ['${lineToInject}'] manually\n`
  }

  // Find the matching closing brace by counting braces
  let depth = 0
  let lastClose = -1
  const start = openMatch.index + openMatch[0].lastIndexOf('{')

  for (let i = start; i < content.length; i++) {
    if (content[i] === '{') depth++
    else if (content[i] === '}') {
      depth--
      if (depth === 0) { lastClose = i; break }
    }
  }

  if (lastClose === -1) return content

  // Insert the line before the closing brace
  const before = content.slice(0, lastClose)
  const after = content.slice(lastClose)

  // Add comma after last real entry if needed
  const trimmed = before.trimEnd()
  const needsComma = trimmed.length > 0 &&
    !trimmed.endsWith(',') &&
    !trimmed.endsWith('{')

  return `${trimmed}${needsComma ? ',' : ''}\n${lineToInject}\n${after}`
}

/**
 * Add .apicache.json to .gitignore if a .gitignore exists and doesn't already include it.
 */
function ensureGitignore(cwd) {
  const gitignorePath = path.join(cwd, '.gitignore')
  if (!fs.existsSync(gitignorePath)) return

  const content = fs.readFileSync(gitignorePath, 'utf8')
  if (content.includes('.apicache.json')) return

  fs.appendFileSync(gitignorePath, '\n# nodox schema cache\n.apicache.json\n')
  ok(`Added .apicache.json to .gitignore`)
}
