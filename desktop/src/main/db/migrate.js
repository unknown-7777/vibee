import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const MIGRATIONS_DIR = path.join(__dirname, 'migrations')

// Runs every migration newer than the database's current version.
// SQLite keeps that version in a built-in field: PRAGMA user_version.
export function runMigrations(db) {
  const current = db.pragma('user_version', { simple: true })

  const pending = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => /^\d+_.+\.sql$/.test(file))
    .map((file) => ({ file, version: parseInt(file, 10) }))
    .filter((migration) => migration.version > current)
    .sort((a, b) => a.version - b.version)

  for (const { file, version } of pending) {
    const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), 'utf8')

    // One transaction per migration: if any statement fails, nothing is applied.
    db.transaction(() => {
      db.exec(sql)
      db.pragma(`user_version = ${version}`)
    })()

    console.log(`[db] applied migration ${file}`)
  }
}
