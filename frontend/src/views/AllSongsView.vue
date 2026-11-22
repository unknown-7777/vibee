<script setup>
import { computed, ref } from 'vue'
import EmptyLibrary from '../components/common/EmptyLibrary.vue'
import TrackTable from '../components/tracks/TrackTable.vue'
import { useLibraryStore } from '../stores/library'
import { usePlayerStore } from '../stores/player'

const library = useLibraryStore()
const player = usePlayerStore()

const sortKey = ref('addedAt')
const sortDir = ref('desc')

const text = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })

const sortedTracks = computed(() => {
  const direction = sortDir.value === 'asc' ? 1 : -1
  const key = sortKey.value

  return [...library.tracks].sort((a, b) => {
    const primary =
      key === 'addedAt' ? Date.parse(a.addedAt) - Date.parse(b.addedAt) : text(a[key], b[key])
    if (primary !== 0) return primary * direction

    // Ties (e.g. a whole album imported at once) keep album order, in either direction.
    return text(a.album, b.album) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0)
  })
})

function setSort(key) {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = key === 'addedAt' ? 'desc' : 'asc'
  }
}

const play = (track) => player.playTrack(track, sortedTracks.value)
</script>

<template>
  <div class="px-8 pb-6">
    <header class="mb-6 flex items-end justify-between">
      <h1 class="text-3xl font-semibold tracking-tight">All Songs</h1>
      <p class="text-sm text-muted">{{ library.tracks.length }} songs</p>
    </header>

    <EmptyLibrary v-if="library.isEmpty" />
    <TrackTable
      v-else
      :tracks="sortedTracks"
      :sort-key="sortKey"
      :sort-dir="sortDir"
      @sort="setSort"
      @play="play"
    />
  </div>
</template>
