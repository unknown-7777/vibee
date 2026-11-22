<script setup>
import { computed, ref } from 'vue'
import TrackTable from '../components/tracks/TrackTable.vue'
import { useLibraryStore } from '../stores/library'
import { usePlayerStore } from '../stores/player'

const library = useLibraryStore()
const player = usePlayerStore()

const sortKey = ref('addedAt')
const sortDir = ref('desc')

const sortedTracks = computed(() => {
  const direction = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value

  return [...library.tracks].sort((a, b) => {
    const result =
      key === 'addedAt'
        ? Date.parse(a.addedAt) - Date.parse(b.addedAt)
        : a[key].localeCompare(b[key], undefined, { sensitivity: 'base' })
    return result * direction
  })
})

function setSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'addedAt' ? 'desc' : 'asc' // newest first, A-Z for text
  }
}

// The queue is the list exactly as the user sees it (in the current sort order).
const play = (track) => player.playTrack(track, sortedTracks.value)
</script>

<template>
  <div class="px-8 pb-6">
    <header class="mb-6 flex items-end justify-between">
      <h1 class="text-3xl font-semibold tracking-tight">All Songs</h1>
      <p class="text-sm text-muted">{{ library.tracks.length }} songs</p>
    </header>

    <TrackTable
      :tracks="sortedTracks"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      @sort="setSort"
      @play="play"
    />
  </div>
</template>
