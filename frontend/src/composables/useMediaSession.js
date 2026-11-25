import { watch } from 'vue'
import { usePlayerStore } from '../stores/player'

const ARTWORK_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' }
const DEFAULT_SEEK_SECONDS = 10
const DRIFT_TOLERANCE_SECONDS = 1.5
const MAX_CACHED_ARTWORK = 10

// The system only accepts artwork from http, https, data or blob URLs, not from our own
// vibee-media:// scheme. So we download the image ourselves and hand over a blob: URL.
// Kept in a small cache, because all the songs of an album share the same cover.
const artworkCache = new Map() // vibee-media URL -> { url: 'blob:...', type }

async function loadArtwork(artworkUrl) {
  if (artworkCache.has(artworkUrl)) return artworkCache.get(artworkUrl)

  const response = await fetch(artworkUrl)
  if (!response.ok) throw new Error(`Artwork request failed (${response.status})`)
  const blob = await response.blob()
  const entry = {
    url: URL.createObjectURL(blob),
    type: blob.type || ARTWORK_TYPES[artworkUrl.split('.').pop()] || 'image/jpeg',
  }

  artworkCache.set(artworkUrl, entry)
  if (artworkCache.size > MAX_CACHED_ARTWORK) {
    const [oldest] = artworkCache.keys()
    URL.revokeObjectURL(artworkCache.get(oldest).url) // free the memory behind the oldest cover
    artworkCache.delete(oldest)
  }
  return entry
}

// Connects the player to macOS: hardware media keys (F7/F8/F9, AirPods, ...) and the
// "Now Playing" widget in Control Center. The browser's Media Session API does the talking;
// this file only tells it what is playing and what to do when a button is pressed.
export function useMediaSession() {
  if (!('mediaSession' in navigator)) return

  const player = usePlayerStore()
  const session = navigator.mediaSession

  // ---- What the system can ask us to do ----

  const actions = {
    play: () => player.play(),
    pause: () => player.pause(),
    previoustrack: () => player.previous(),
    nexttrack: () => player.next(),
    seekto: (details) => {
      if (Number.isFinite(details.seekTime)) player.seek(details.seekTime)
    },
    seekbackward: (details) => player.seekBy(-(details.seekOffset || DEFAULT_SEEK_SECONDS)),
    seekforward: (details) => player.seekBy(details.seekOffset || DEFAULT_SEEK_SECONDS),
  }

  for (const [action, handler] of Object.entries(actions)) {
    try {
      session.setActionHandler(action, handler)
    } catch {
      // this action isn't supported on this platform: skip it
    }
  }

  // ---- What we tell the system ----

  async function applyMetadata() {
    const track = player.currentTrack
    if (!track) {
      session.metadata = null
      return
    }

    // Show the text straight away; the cover follows once it has been loaded.
    const info = { title: track.title, artist: track.artist, album: track.album }
    session.metadata = new MediaMetadata(info)
    if (!track.artworkUrl) return

    try {
      const art = await loadArtwork(track.artworkUrl)
      if (player.currentTrack?.id === track.id) {
        session.metadata = new MediaMetadata({ ...info, artwork: [{ src: art.url, type: art.type }] })
      }
    } catch {
      // no cover available: the text alone is fine
    }
  }

  let lastState = 'none'
  watch(
    () => [player.currentTrack, player.isPlaying],
    ([track, playing]) => {
      const state = !track ? 'none' : playing ? 'playing' : 'paused'
      session.playbackState = state
      // Some Chromium versions ignore metadata that was set while the state was "none",
      // so when playback begins, send it again.
      if (lastState === 'none' && state !== 'none') applyMetadata()
      lastState = state
    },
    { immediate: true },
  )

  watch(() => player.currentTrack, applyMetadata, { immediate: true })

  // The system moves the little progress bar by itself between updates, so we only
  // report the position when something changed: a new song, play/pause, or a seek.
  let reported = { position: 0, at: 0 }

  function reportPosition(force = false) {
    const { currentTrack, duration, currentTime, isPlaying } = player
    if (!currentTrack || !Number.isFinite(duration) || duration <= 0) return

    const now = performance.now()
    const expected = reported.position + (isPlaying ? (now - reported.at) / 1000 : 0)
    if (!force && Math.abs(currentTime - expected) < DRIFT_TOLERANCE_SECONDS) return

    try {
      session.setPositionState({
        duration,
        playbackRate: 1,
        position: Math.min(Math.max(0, currentTime), duration),
      })
      reported = { position: currentTime, at: now }
    } catch {
      // the browser rejected the numbers; the next change will try again
    }
  }

  watch(() => [player.currentTrack, player.duration, player.isPlaying], () => reportPosition(true))
  watch(() => player.currentTime, () => reportPosition())
}
