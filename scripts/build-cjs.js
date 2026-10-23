
import { build } from 'esbuild'
import { mkdir } from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const outDir = path.join(root, 'dist')

const external = [
  'express',
  'ws',
  'zod',
  'joi',
  'zod-to-json-schema',
  'path',
  'fs',
  'fs/promises',
  'http',
  'https',
  'url',
  'module',
  'child_process',
  'os',
  'crypto',
]

async function main() {
  await mkdir(outDir, { recursive: true })

  const importMetaShimBanner =
    `const __importMetaUrl = require('url').pathToFileURL(__filename).href;`

  const shared = {
    bundle: true,
    platform: 'node',
    format: 'cjs',
    target: 'node18',
    external,
    define: { 'import.meta.url': '__importMetaUrl' },
    banner: { js: importMetaShimBanner },
  }

  await Promise.all([
    build({
      ...shared,
      entryPoints: [path.join(root, 'src/index.js')],
      outfile: path.join(outDir, 'index.cjs'),
    }),
    build({
      ...shared,
      entryPoints: [path.join(root, 'src/layer4/jest-setup.js')],
      outfile: path.join(outDir, 'jest-setup.cjs'),
    }),
  ])

  console.log('✓ CJS build complete → dist/index.cjs + dist/jest-setup.cjs')
}

main().catch(err => {
  console.error('CJS build failed:', err.message)
  process.exit(1)
})
