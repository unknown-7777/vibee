import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'
import { bridge } from '../services/bridge'
import { useLibraryStore } from './library'

const PREFS_KEY = 'vibee:player-prefs'
const COUNT_AS_PLAYED_AFTER = 10 // seconds of playback (or half the song, if it is shorter)
const RESTART_IF_PLAYED_LONGER_THAN = 3 // seconds: "Previous" restarts the song instead of going back
const ERROR_VISIBLE_MS = 6000

const trackUrl = (id) => `vibee-media://track/${id}`

function readPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) ?? {}
  } catch {
    return {}
  }
}

function writePrefs(prefs) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
  } catch {
    // storage unavailable: preferences just won't be remembered
  }
}

// Fisher-Yates: an unbiased shuffle (sorting with Math.random() is NOT unbiased).
function shuffled(list) {
  const copy = [...list]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export const usePlayerStore = defineStore('player', () => {
  const saved = readPrefs()

  // The one and only audio element. It lives here, not in a page component,
  // so navigating between pages never interrupts playback.
  const audio = new Audio()

  const sourceQueue = ref([]) // the songs in their normal order
  const queue = ref([]) // the songs in the order they will actually play
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(Number.isFinite(saved.volume) ? Math.min(1, Math.max(0, saved.volume)) : 0.8)
  const shuffle = ref(Boolean(saved.shuffle))
  const repeat = ref(['off', 'all', 'one'].includes(saved.repeat) ? saved.repeat : 'off')
  const error = ref(null)

  const failedIds = new Set() // songs that failed to load in this listening session
  let countedCurrent = false // has the current song been added to the history yet?
  let errorTimer

  const currentTrack = computed(() => queue.value[currentIndex.value] ?? null)
  const canNext = computed(
    () =>
      currentTrack.value !== null &&
      (repeat.value !== 'off' || currentIndex.value < queue.value.length - 1),
  )

  // ---- Preferences ----

  // Humans hear loudness logarithmically, so squaring makes the slider feel natural:
  // the bottom half of the slider is no longer "already too loud".
  watch(volume, (value) => { audio.volume = value * value }, { immediate: true })
  watch([volume, shuffle, repeat], () => {
    writePrefs({ volume: volume.value, shuffle: shuffle.value, repeat: repeat.value })
  })

  // ---- Errors ----

  function showError(message) {
    error.value = message
    clearTimeout(errorTimer)
    errorTimer = setTimeout(() => { error.value = null }, ERROR_VISIBLE_MS)
  }

  function clearError() {
    clearTimeout(errorTimer)
    error.value = null
  }

  // ---- Loading and playing ----

  async function startPlayback() {
    try {
      await audio.play()
    } catch (err) {
      // AbortError: another song was loaded before this one started (fast clicking).
      // NotSupportedError: the file can't be loaded; the 'error' event handles that.
      if (err.name !== 'AbortError' && err.name !== 'NotSupportedError') {
        showError('Playback could not start.')
      }
    }
  }

  function load(index) {
    const track = queue.value[index]
    currentIndex.value = index
    currentTime.value = 0
    duration.value = track.durationSec // replaced by the real value once the file loads
    countedCurrent = false
    audio.src = trackUrl(track.id)
    return startPlayback()
  }

  // Next/previous song that has not failed to load, or -1 if there is none.
  // With `wrap`, going past either end continues from the other end.
  function findIndex(from, direction, wrap) {
    const count = queue.value.length
    for (let step = 1; step <= count; step++) {
      let index = from + step * direction
      if (index >= count || index < 0) {
        if (!wrap) return -1
        index = (index + count) % count
      }
      if (!failedIds.has(queue.value[index].id)) return index
    }
    return -1
  }

  // ---- Actions ----

  // Play `track`, using `trackList` as the queue (e.g. the list it was clicked in).
  // Missing songs can't play, so they never enter the queue.
  function playTrack(track, trackList = [track]) {
    if (track.isMissing) return

    const playable = trackList.filter((item) => !item.isMissing)
    const list = playable.some((item) => item.id === track.id) ? playable : [track]

    failedIds.clear() // a fresh session: give songs that failed earlier another chance
    clearError()
    sourceQueue.value = list
    queue.value = shuffle.value
      ? [track, ...shuffled(list.filter((item) => item.id !== track.id))]
      : list
    load(queue.value.findIndex((item) => item.id === track.id))
  }

  function togglePlay() {
    if (!currentTrack.value) return
    if (audio.paused) startPlayback()
    else audio.pause()
  }

  function next() {
    if (!currentTrack.value) return
    const index = findIndex(currentIndex.value, 1, repeat.value !== 'off')
    if (index !== -1) load(index)
  }

  function previous() {
    if (!currentTrack.value) return
    // Like every music player: a few seconds in, "previous" restarts the song.
    if (audio.currentTime > RESTART_IF_PLAYED_LONGER_THAN) {
      seek(0)
      return
    }
    const index = findIndex(currentIndex.value, -1, repeat.value !== 'off')
    if (index !== -1) load(index)
    else seek(0)
  }

  function seek(seconds) {
    if (!currentTrack.value) return
    const max = duration.value || currentTrack.value.durationSec
    const target = Math.min(Math.max(0, seconds), max)
    audio.currentTime = target
    currentTime.value = target
  }

  function setVolume(value) {
    volume.value = Math.min(1, Math.max(0, value))
  }

  function toggleShuffle() {
    shuffle.value = !shuffle.value
    const current = currentTrack.value
    if (!current) return

    if (shuffle.value) {
      // Keep the current song playing; shuffle everything else after it.
      queue.value = [current, ...shuffled(sourceQueue.value.filter((item) => item.id !== current.id))]
      currentIndex.value = 0
    } else {
      // Go back to the normal order, continuing from the current song.
      queue.value = [...sourceQueue.value]
      currentIndex.value = queue.value.findIndex((item) => item.id === current.id)
    }
  }

  function cycleRepeat() {
    repeat.value = { off: 'all', all: 'one', one: 'off' }[repeat.value]
  }

  // ---- Audio element events ----

  async function recordPlay(trackId) {
    if (!bridge) return
    try {
      const playedAt = await bridge.library.recordPlay(trackId)
      if (playedAt) useLibraryStore().markPlayed(trackId, playedAt)
    } catch (err) {
      console.error('Could not record play', err)
    }
  }

  audio.addEventListener('play', () => { isPlaying.value = true })

  // When a song ends the browser fires "pause" and then "ended". Ignoring that
  // pause keeps the button from flickering to "Play" between songs.
  audio.addEventListener('pause', () => { if (!audio.ended) isPlaying.value = false })

  audio.addEventListener('durationchange', () => {
    if (Number.isFinite(audio.duration)) duration.value = audio.duration
  })

  audio.addEventListener('timeupdate', () => {
    currentTime.value = audio.currentTime
    if (countedCurrent || !currentTrack.value) return

    const threshold = Math.min(COUNT_AS_PLAYED_AFTER, (duration.value || Infinity) / 2)
    if (audio.currentTime >= threshold) {
      countedCurrent = true
      recordPlay(currentTrack.value.id)
    }
  })

  audio.addEventListener('ended', () => {
    if (!currentTrack.value) return

    if (repeat.value === 'one') {
      countedCurrent = false // each loop counts as another listen
      audio.currentTime = 0
      startPlayback()
      return
    }

    const index = findIndex(currentIndex.value, 1, repeat.value === 'all')
    if (index !== -1) {
      load(index)
    } else {
      // End of the queue: stop, and rewind so Play starts the song again.
      isPlaying.value = false
      audio.currentTime = 0
      currentTime.value = 0
    }
  })

  audio.addEventListener('error', async () => {
    const track = currentTrack.value
    if (!track) return
    failedIds.add(track.id)

    // Find out whether the file is gone (then the library marks it missing and
    // the UI greys it out) or exists but can't be decoded.
    const library = useLibraryStore()
    await library.verify()
    const isGone = library.tracks.find((item) => item.id === track.id)?.isMissing

    showError(
      isGone
        ? `"${track.title}" was not found on disk.`
        : `"${track.title}" can't be played (unsupported or damaged file).`,
    )

    if (currentTrack.value?.id !== track.id) return // the user already moved on

    const index = findIndex(currentIndex.value, 1, repeat.value !== 'off')
    if (index !== -1) {
      load(index)
    } else {
      isPlaying.value = false
    }
  })

  return {
    queue, currentIndex, currentTrack, isPlaying, currentTime, duration,
    volume, shuffle, repeat, error, canNext,
    playTrack, togglePlay, next, previous, seek, setVolume, toggleShuffle, cycleRepeat,
  }
})
