import fs from 'node:fs'
import path from 'node:path'
import { Readable } from 'node:stream'

const MIME_TYPES = {
  '.mp3': 'audio/mpeg',
  '.flac': 'audio/flac',
  '.wav': 'audio/wav',
  '.m4a': 'audio/mp4',
  '.aac': 'audio/aac',
  '.ogg': 'audio/ogg',
}

// Understands a single range like "bytes=0-", "bytes=100-199" or "bytes=-500".
// Returns { start, end } (inclusive), null if there is no usable range header,
// or 'invalid' if the range lies outside the file.
function parseRange(header, size) {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header ?? '')
  if (!match) return null
  const [, startText, endText] = match

  let start
  let end
  if (startText === '' && endText === '') return 'invalid'
  if (startText === '') {
    // Suffix range: the LAST n bytes.
    const count = Number(endText)
    if (count === 0) return 'invalid'
    start = Math.max(0, size - count)
    end = size - 1
  } else {
    start = Number(startText)
    end = endText === '' ? size - 1 : Math.min(Number(endText), size - 1)
  }

  if (start >= size || start > end) return 'invalid'
  return { start, end }
}

// Answers a request for an audio file, honouring HTTP Range requests.
// Seeking in an <audio> element works by asking for "bytes from here on",
// so without correct 206 responses you could play a song but never seek.
export async function streamAudioFile(filePath, rangeHeader, signal) {
  let stat
  try {
    stat = await fs.promises.stat(filePath)
  } catch {
    return new Response('Not found', { status: 404 })
  }
  if (!stat.isFile()) return new Response('Not found', { status: 404 })

  const size = stat.size
  const headers = {
    'Content-Type': MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream',
    'Accept-Ranges': 'bytes',
  }

  const range = parseRange(rangeHeader, size)
  if (range === 'invalid') {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${size}` } })
  }

  if (size === 0) return new Response(null, { status: 200, headers: { ...headers, 'Content-Length': '0' } })

  const start = range ? range.start : 0
  const end = range ? range.end : size - 1
  headers['Content-Length'] = String(end - start + 1)
  if (range) headers['Content-Range'] = `bytes ${start}-${end}/${size}`

  const stream = fs.createReadStream(filePath, { start, end })
  // If the player abandons the request (e.g. you seek elsewhere), close the file.
  signal?.addEventListener('abort', () => stream.destroy(), { once: true })

  return new Response(Readable.toWeb(stream), { status: range ? 206 : 200, headers })
}
