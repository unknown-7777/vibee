import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { bridge } from '../services/bridge'
import { hueFromString } from '../utils/format.js'

const SHELF_SIZE = 6
const time = (iso) => Date.parse(iso)

export const useLibraryStore = defineStore('library', () => {
  const tracks = ref([])
  const playlists = ref([]) // real playlists arrive in Phase 5
  const isLoading = ref(false)
  const error = ref(null)

  // Import state
  const isImporting = ref(false)
  const importProgress = ref(null) // { stage, processed, total, failed } while running
  const lastImport = ref(null) // summary of the last finished import
  const importError = ref(null)

  // Missing-file state
  const isVerifying = ref(false)
  const rescanNote = ref(null) // short result message after a manual rescan

  const isEmpty = computed(() => !isLoading.value && !error.value && tracks.value.length === 0)
  const missingCount = computed(() => tracks.value.filter((track) => track.isMissing).length)

  async function load() {
    if (!bridge) return // opened in a plain browser, not inside Electron
    isLoading.value = true
    error.value = null
    try {
      const rows = await bridge.library.getTracks()
      tracks.value = rows.map((row) => ({
        ...row,
        hue: hueFromString(row.album),
        artworkUrl: row.artworkPath ? `vibee-media://artwork/${row.artworkPath}` : null,
      }))
    } catch (err) {
      console.error('Failed to load library', err)
      error.value = 'Could not load your library.'
    } finally {
      isLoading.value = false
    }
  }

  async function importMusic() {
    if (!bridge || isImporting.value) return
    isImporting.value = true
    lastImport.value = null
    importError.value = null

    const stopListening = bridge.library.onImportProgress((progress) => {
      importProgress.value = progress
    })

    try {
      const result = await bridge.library.importMusic()
      if (result.canceled || result.busy) return // finally{} below still cleans up
      lastImport.value = result
      await load()
    } catch (err) {
      console.error('Import failed', err)
      importError.value = 'Import failed. Check the terminal for details.'
    } finally {
      stopListening()
      importProgress.value = null
      isImporting.value = false
    }
  }

  function dismissImportSummary() {
    lastImport.value = null
    importError.value = null
  }

  // ---- Missing files ----

  let noteTimer
  function showNote(text) {
    rescanNote.value = text
    clearTimeout(noteTimer)
    noteTimer = setTimeout(() => { rescanNote.value = null }, 6000)
  }

  function describeCheck(result) {
    if (result.checked === 0) return 'Nothing to check yet'
    const parts = []
    if (result.restored > 0) parts.push(`${result.restored} found again`)
    if (result.nowMissing > 0) parts.push(`${result.nowMissing} newly missing`)
    if (parts.length === 0) {
      parts.push(result.totalMissing > 0 ? 'No changes' : `All ${result.checked} songs found`)
    }
    if (result.unreadable > 0) parts.push(`${result.unreadable} could not be checked (no permission)`)
    return parts.join(' · ')
  }

  // Checks that every file still exists. Silent by default (used at startup);
  // pass { announce: true } for the manual Rescan button.
  async function verify({ announce = false } = {}) {
    if (!bridge || isVerifying.value) return
    isVerifying.value = true
    try {
      const result = await bridge.library.verify()
      if (result.skipped) return
      if (result.nowMissing > 0 || result.restored > 0) await load()
      if (announce) showNote(describeCheck(result))
    } catch (err) {
      console.error('Library check failed', err)
      if (announce) showNote('Could not check the library')
    } finally {
      isVerifying.value = false
    }
  }

  async function removeMissing() {
    if (!bridge) return
    try {
      const result = await bridge.library.removeMissing()
      if (result.removed > 0) await load()
    } catch (err) {
      console.error('Failed to remove missing songs', err)
    }
  }

  // Called by the player once a song has been listened to for a while,
  // so "Recently played" updates instantly without reloading the library.
  function markPlayed(trackId, playedAt) {
    const track = tracks.value.find((item) => item.id === trackId)
    if (track) track.lastPlayedAt = playedAt
  }

  // ---- Favorites ----

  const byId = computed(() => new Map(tracks.value.map((track) => [track.id, track])))

  // The heart changes at once; if saving fails, it changes back.
  async function setFavorite(track, isFavorite) {
    if (!bridge) return
    const before = { isFavorite: track.isFavorite, favoritedAt: track.favoritedAt }
    track.isFavorite = isFavorite
    track.favoritedAt = isFavorite ? new Date().toISOString() : null
    try {
      const saved = await bridge.library.setFavorite(track.id, isFavorite)
      if (saved === null) throw new Error('That song no longer exists')
    } catch (err) {
      console.error('Could not save favorite', err)
      Object.assign(track, before)
    }
  }

  function toggleFavorite(track) {
    return setFavorite(track, !track.isFavorite)
  }

  const recentlyAdded = computed(() =>
    [...tracks.value].sort((a, b) => time(b.addedAt) - time(a.addedAt)).slice(0, SHELF_SIZE),
  )

  const recentlyPlayed = computed(() =>
    tracks.value
      .filter((track) => track.lastPlayedAt)
      .sort((a, b) => time(b.lastPlayedAt) - time(a.lastPlayedAt))
      .slice(0, SHELF_SIZE),
  )

  const favoriteTracks = computed(() => tracks.value.filter((track) => track.isFavorite))

  // The Home shelf: newest favorite first.
  const favorites = computed(() =>
    [...favoriteTracks.value].sort((a, b) => time(b.favoritedAt) - time(a.favoritedAt)).slice(0, SHELF_SIZE),
  )

  const recentPlaylists = computed(() =>
    [...playlists.value].sort((a, b) => time(b.createdAt) - time(a.createdAt)).slice(0, 4),
  )

  return {
    tracks, playlists, isLoading, error, isEmpty, missingCount, load,
    isImporting, importProgress, lastImport, importError, importMusic, dismissImportSummary,
    isVerifying, rescanNote, verify, removeMissing, markPlayed, byId, setFavorite, toggleFavorite, favoriteTracks,
    recentlyAdded, recentlyPlayed, favorites, recentPlaylists,
  }
})
