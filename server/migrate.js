// Applies all SQL files in /migrations against the given better-sqlite3 instance.
// All migration SQL uses CREATE TABLE/INDEX ... IF NOT EXISTS, so re-running
// this on every server start is safe and idempotent.

import fs from 'fs'
import path from 'path'

export function runMigrations(sqliteDb, migrationsDir) {
  if (!fs.existsSync(migrationsDir)) return

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
    sqliteDb.exec(sql)
    console.log(`[migrate] applied ${file}`)
  }
}
