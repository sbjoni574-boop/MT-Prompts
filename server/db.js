// Minimal Cloudflare D1-compatible wrapper around better-sqlite3.
// This lets all existing `c.env.DB.prepare(sql).bind(...).first()/.all()/.run()`
// calls in src/ work unmodified on a plain Node.js + SQLite backend (Render-ready).

import Database from 'better-sqlite3'
import fs from 'fs'
import path from 'path'

export function createD1(dbFilePath) {
  const dir = path.dirname(dbFilePath)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  const sqlite = new Database(dbFilePath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  function prepare(sql) {
    let boundArgs = []
    const stmt = sqlite.prepare(sql)

    const api = {
      bind(...args) {
        boundArgs = args
        return api
      },
      async first(colName) {
        try {
          const row = boundArgs.length ? stmt.get(...boundArgs) : stmt.get()
          if (!row) return null
          if (colName) return row[colName] ?? null
          return row
        } catch (err) {
          throw wrapError(err)
        }
      },
      async all() {
        try {
          const results = boundArgs.length ? stmt.all(...boundArgs) : stmt.all()
          return { results, success: true }
        } catch (err) {
          throw wrapError(err)
        }
      },
      async run() {
        try {
          const info = boundArgs.length ? stmt.run(...boundArgs) : stmt.run()
          return {
            success: true,
            meta: {
              last_row_id: info.lastInsertRowid,
              changes: info.changes,
            },
          }
        } catch (err) {
          throw wrapError(err)
        }
      },
    }
    return api
  }

  function wrapError(err) {
    const e = new Error(`D1_ERROR: ${err.message}`)
    e.cause = err
    return e
  }

  return {
    prepare,
    raw: sqlite,
    exec(sql) {
      sqlite.exec(sql)
    },
  }
}
