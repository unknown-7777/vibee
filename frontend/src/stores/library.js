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

  const isEmpty = computed(() => !isLoading.value && !error.value && tracks.value.length === 0)

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

  const recentlyAdded = computed(() =>
    [...tracks.value].sort((a, b) => time(b.addedAt) - time(a.addedAt)).slice(0, SHELF_SIZE),
  )

  const recentlyPlayed = computed(() =>
    tracks.value
      .filter((track) => track.lastPlayedAt)
      .sort((a, b) => time(b.lastPlayedAt) - time(a.lastPlayedAt))
      .slice(0, SHELF_SIZE),
  )

  const favorites = computed(() => tracks.value.filter((track) => track.isFavorite).slice(0, SHELF_SIZE))

  const recentPlaylists = computed(() =>
    [...playlists.value].sort((a, b) => time(b.createdAt) - time(a.createdAt)).slice(0, 4),
  )

  return {
    tracks, playlists, isLoading, error, isEmpty, load,
    isImporting, importProgress, lastImport, importError, importMusic, dismissImportSummary,
    recentlyAdded, recentlyPlayed, favorites, recentPlaylists,
  }
})
