import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { mockPlaylists, mockTracks } from '../data/mockData.js'

const SHELF_SIZE = 6
const time = (iso) => Date.parse(iso)

export const useLibraryStore = defineStore('library', () => {
  const tracks = ref(mockTracks)
  const playlists = ref(mockPlaylists)

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

  return { tracks, playlists, recentlyAdded, recentlyPlayed, favorites, recentPlaylists }
})
