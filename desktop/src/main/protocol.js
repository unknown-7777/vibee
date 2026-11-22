import { net, protocol } from 'electron'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { getArtworkDir } from './paths.js'

const SCHEME = 'vibee-media'
// Only names that look exactly like what we generate are served: no "../" tricks possible.
const ARTWORK_FILE = /^[a-f0-9]{40}\.(jpg|png|webp|gif)$/

// Must be called BEFORE the app is ready.
export function registerMediaScheme() {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: SCHEME,
      // stream + supportFetchAPI are what <audio> needs in Phase 4.
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true },
    },
  ])
}

// Must be called AFTER the app is ready.
export function registerMediaProtocol() {
  protocol.handle(SCHEME, async (request) => {
    const url = new URL(request.url)

    if (url.hostname === 'artwork') {
      const fileName = decodeURIComponent(url.pathname.slice(1))
      if (!ARTWORK_FILE.test(fileName)) return new Response('Bad request', { status: 400 })
      try {
        return await net.fetch(pathToFileURL(path.join(getArtworkDir(), fileName)).toString())
      } catch {
        return new Response('Not found', { status: 404 })
      }
    }

    return new Response('Not found', { status: 404 })
  })
}
