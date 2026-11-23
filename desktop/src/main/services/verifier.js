import { constants } from 'node:fs'
import fs from 'node:fs/promises'
import { applyMissingStates, getTrackFileStates } from '../db/tracks.js'
import { runPool } from './pool.js'

const CONCURRENCY = 32

// 'missing' only when the OS says the path does not exist (ENOENT / ENOTDIR).
// Anything else (e.g. macOS denying access to a protected folder) is 'unknown':
// we must NOT mark a song missing just because we weren't allowed to look.
async function checkFile(filePath) {
  try {
    await fs.access(filePath, constants.R_OK)
    return 'present'
  } catch (err) {
    return err.code === 'ENOENT' || err.code === 'ENOTDIR' ? 'missing' : 'unknown'
  }
}

export async function verifyLibrary() {
  const rows = getTrackFileStates()
  const markMissing = []
  const markPresent = []
  let totalMissing = 0
  let unreadable = 0

  await runPool(rows, CONCURRENCY, async (row) => {
    const state = await checkFile(row.filePath)

    if (state === 'unknown') {
      unreadable++
      if (row.isMissing) totalMissing++ // keep counting what we already knew was missing
      return
    }
    if (state === 'missing') {
      totalMissing++
      if (!row.isMissing) markMissing.push(row.id)
    } else if (row.isMissing) {
      markPresent.push(row.id)
    }
  })

  applyMissingStates({ markMissing, markPresent })

  return {
    checked: rows.length,
    nowMissing: markMissing.length,
    restored: markPresent.length,
    totalMissing,
    unreadable,
  }
}
