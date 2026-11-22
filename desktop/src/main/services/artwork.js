import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'

const EXTENSION_BY_MIME = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

// Saves cover art as <sha1-of-the-image>.<ext> and returns that file name.
// Naming by content hash means an album's 12 songs share ONE file on disk.
export async function saveArtwork(cover, artworkDir) {
  const ext = EXTENSION_BY_MIME[cover.mime?.toLowerCase()]
  if (!ext) return null // unknown image type: skip the art, keep the song

  const fileName = `${crypto.createHash('sha1').update(cover.data).digest('hex')}.${ext}`
  try {
    // 'wx' = create only if it doesn't exist yet
    await fs.writeFile(path.join(artworkDir, fileName), cover.data, { flag: 'wx' })
  } catch (err) {
    if (err.code !== 'EEXIST') throw err
  }
  return fileName
}
