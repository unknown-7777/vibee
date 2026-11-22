import fs from 'node:fs/promises'
import { upsertTracks } from '../db/tracks.js'
import { saveArtwork } from './artwork.js'
import { readTrackMetadata } from './metadata.js'
import { collectAudioFiles } from './scanner.js'

const CONCURRENCY = 4 // files parsed at the same time
const BATCH_SIZE = 50 // songs saved per database transaction
const PROGRESS_INTERVAL_MS = 100

// Runs `worker` over every item, `limit` at a time.
async function runPool(items, limit, worker) {
  let next = 0
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++] // runs synchronously, so two runners never get the same item
      await worker(item)
    }
  })
  await Promise.all(runners)
}

export async function importPaths(selectedPaths, { artworkDir, onProgress = () => {} }) {
  const startedAt = Date.now()
  onProgress({ stage: 'scanning' })

  const files = await collectAudioFiles(selectedPaths)
  const summary = { total: files.length, added: 0, updated: 0, failed: [], durationMs: 0 }
  if (files.length === 0) return summary

  await fs.mkdir(artworkDir, { recursive: true })

  const addedAt = new Date().toISOString() // one timestamp for the whole import
  let processed = 0
  let lastReport = 0
  let batch = []

  const report = (force = false) => {
    const now = Date.now()
    if (!force && now - lastReport < PROGRESS_INTERVAL_MS) return
    lastReport = now
    onProgress({ stage: 'importing', processed, total: files.length, failed: summary.failed.length })
  }

  const flush = () => {
    if (batch.length === 0) return
    const { added, updated } = upsertTracks(batch, addedAt)
    summary.added += added
    summary.updated += updated
    batch = []
  }

  await runPool(files, CONCURRENCY, async (file) => {
    try {
      const { cover, ...track } = await readTrackMetadata(file)
      const artworkPath = cover ? await saveArtwork(cover, artworkDir) : null
      batch.push({ ...track, artworkPath })
    } catch (err) {
      // One bad file must never abort the import: record it and keep going.
      summary.failed.push({ file, reason: err.message })
    }

    // Outside the try/catch on purpose: a database error is serious and should stop the import.
    if (batch.length >= BATCH_SIZE) flush()

    processed++
    report()
  })

  flush()
  report(true)
  summary.durationMs = Date.now() - startedAt
  return summary
}
