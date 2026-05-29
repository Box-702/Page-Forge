import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const distDir = 'dist'
const assetsDir = join(distDir, 'assets')

assert(existsSync(join(distDir, 'index.html')), 'dist/index.html is missing')
assert(existsSync(assetsDir), 'dist/assets is missing')

const assets = readdirSync(assetsDir)
assert(assets.some((file) => file.endsWith('.js')), 'built JavaScript asset is missing')
assert(assets.some((file) => file.endsWith('.css')), 'built CSS asset is missing')

const htmlSize = statSync(join(distDir, 'index.html')).size
assert(htmlSize > 100, 'dist/index.html looks too small')

console.log('Smoke check passed.')

function assert(condition, message) {
  if (!condition) {
    console.error(`Smoke check failed: ${message}`)
    process.exit(1)
  }
}
