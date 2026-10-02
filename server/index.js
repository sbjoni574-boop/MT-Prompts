// Render / plain Node.js entry point for MT Prompts.
// Runs the same Hono app (src/index.tsx) that was originally written for
// Cloudflare Workers, but backed by:
//   - better-sqlite3 (a local file) instead of D1
//   - local filesystem storage (via a tiny R2-compatible shim) instead of R2
//
// This file is loaded with `tsx` so it can `import` the .tsx sources
// directly without a separate TypeScript build step.

import path from 'path'
import { fileURLToPath } from 'url'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { createD1 } from './db.js'
import { createLocalR2 } from './r2.js'
import { runMigrations } from './migrate.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DATA_DIR = process.env.DATA_DIR || path.join(ROOT, 'data')
const DB_PATH = process.env.DB_PATH || path.join(DATA_DIR, 'mt-prompts.sqlite')
const MEDIA_DIR = process.env.MEDIA_DIR || path.join(DATA_DIR, 'media')
const PORT = Number(process.env.PORT) || 3000

async function main() {
  // 1. Set up local SQLite (D1-compatible) and run migrations.
  const d1 = createD1(DB_PATH)
  runMigrations(d1.raw, path.join(ROOT, 'migrations'))

  // 2. Set up local disk storage (R2-compatible).
  const r2 = createLocalR2(MEDIA_DIR)

  // 3. Load the Hono app (written against Cloudflare bindings `c.env.DB` / `c.env.R2`).
  const { default: app } = await import('../src/index.tsx')

  // Serve /static/* from the public/static folder (CSS, JS, default avatar).
  app.use('/static/*', serveStatic({ root: path.join(ROOT, 'public') }))

  const env = { DB: d1, R2: r2 }

  serve(
    {
      fetch: (request, connInfo) => app.fetch(request, env, connInfo),
      port: PORT,
      hostname: '0.0.0.0',
    },
    (info) => {
      console.log(`🚀 MT Prompts server running on http://0.0.0.0:${info.port}`)
      console.log(`   SQLite DB: ${DB_PATH}`)
      console.log(`   Media dir: ${MEDIA_DIR}`)
    }
  )
}

main().catch((err) => {
  console.error('Fatal startup error:', err)
  process.exit(1)
})
