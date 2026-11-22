import { parseFile, selectCover } from 'music-metadata'
import fs from 'node:fs/promises'
import path from 'node:path'

const clean = (value) => (typeof value === 'string' ? value.trim() || null : null)

// Reads one audio file and returns exactly the fields our library stores.
// Throws if the file can't be parsed: the importer catches that per file.
export async function readTrackMetadata(filePath) {
  // duration: true scans the whole file when needed, so VBR MP3s get an exact length.
  const [meta, stat] = await Promise.all([
    parseFile(filePath, { duration: true }),
    fs.stat(filePath),
  ])
  const { common, format } = meta

  // A file that parses but contains no audio (corrupt, truncated, or not really audio)
  // would show up in the library and then fail on play. Reject it here instead.
  if (!(format.duration > 0)) throw new Error('No readable audio data')

  const ext = path.extname(filePath)
  const cover = selectCover(common.picture)

  return {
    filePath,
    title: clean(common.title) ?? path.basename(filePath, ext),
    artist: clean(common.artist) ?? clean(common.albumartist) ?? 'Unknown Artist',
    album: clean(common.album) ?? 'Unknown Album',
    albumArtist: clean(common.albumartist),
    trackNumber: common.track?.no ?? null,
    year: common.year ?? null,
    genre: clean(common.genre?.[0]),
    durationSec: format.duration,
    format: ext.slice(1).toLowerCase(),
    fileSize: stat.size,
    cover: cover ? { data: cover.data, mime: cover.format } : null,
  }
}
