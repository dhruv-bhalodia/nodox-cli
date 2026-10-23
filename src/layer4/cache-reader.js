
import fs from 'fs'
import path from 'path'

export function findCacheFile(startDir = process.cwd()) {
  let dir = startDir
  for (let i = 0; i < 5; i++) {
    const candidate = path.join(dir, '.apicache.json')
    if (fs.existsSync(candidate)) return candidate
    const parent = path.dirname(dir)
    if (parent === dir) break
    dir = parent
  }
  return null
}

export function loadCacheEntries(cacheFile) {
  const filePath = cacheFile || findCacheFile()
  if (!filePath) return {}

  try {
    const raw = fs.readFileSync(filePath, 'utf8')
    const parsed = JSON.parse(raw)
    return parsed?.routes || {}
  } catch {
    return {}
  }
}
