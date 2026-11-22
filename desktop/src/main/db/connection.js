import { app } from 'electron'
import Database from 'better-sqlite3'
import path from 'node:path'
import { runMigrations } from './migrate.js'

let db = null

export function openDatabase() {
  const file = path.join(app.getPath('userData'), 'library.db')
  db = new Database(file)

  db.pragma('journal_mode = WAL')  // faster writes, and safe if the app crashes mid-write
  db.pragma('foreign_keys = ON')   // SQLite ignores foreign keys unless you ask

  runMigrations(db)
  console.log(`[db] ready at ${file}`)
  return db
}

export function getDb() {
  if (!db) throw new Error('Database not opened yet')
  return db
}

export function closeDatabase() {
  db?.close()
  db = null
}
