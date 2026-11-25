import { net, protocol } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getTrackFilePath } from './db/tracks.js'
import { getArtworkDir } from './paths.js'
import { streamAudioFile } from './services/mediaStream.js'

const SCHEME = 'vibee-media'
// Only names that look exactly like what we generate are served: no "../" tricks possible.
const ARTWORK_FILE = /^[a-f0-9]{40}\.(jpg|png|webp|gif)$/
const TRACK_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/

// Must be called BEFORE the app is ready.
export function registerMediaScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      // stream + supportFetchAPI are what <audio> needs. corsEnabled lets the page read
      // cover images with fetch(), which the Now Playing widget needs (see useMediaSession).
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true },
    },
  ])
}

// Must be called AFTER the app is ready.
//   vibee-media://artwork/<sha1>.<ext>   cover images
//   vibee-media://track/<uuid>           audio, with Range support for seeking
export function registerMediaProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url)
    const name = url.pathname.slice(1)

    if (url.hostname === 'artwork') {
      if (!ARTWORK_FILE.test(name)) return new Response('Bad request', { status: 400 })
      try {
        const file = await net.fetch(pathToFileURL(path.join(getArtworkDir(), name)).toString())
        // fetch() from the page is only allowed when the response says so.
        const headers = new Headers(file.headers)
        headers.set('Access-Control-Allow-Origin', '*')
        return new Response(file.body, { status: file.status, headers })
      } catch {
        return new Response('Not found', { status: 404 })
      }
    }

    if (url.hostname === 'track') {
      if (!TRACK_ID.test(name)) return new Response('Bad request', { status: 400 })
      const filePath = getTrackFilePath(name)
      if (!filePath) return new Response('Not found', { status: 404 })
      return streamAudioFile(filePath, request.headers.get('range'), request.signal)
    }

    return new Response('Not found', { status: 404 })
  })
}
