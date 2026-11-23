<script setup>
import { computed, ref } from 'vue'
import { RefreshCw, TriangleAlert } from 'lucide-vue-next'
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

      <div class="flex items-center gap-4 text-sm text-muted">
        <span v-if="library.rescanNote">{{ library.rescanNote }}</span>
        <button
          type="button"
          class="inline-flex items-center gap-1.5 transition-colors hover:text-fg disabled:pointer-events-none disabled:opacity-60"
          title="Check that all your files still exist"
          :disabled="library.isVerifying"
          @click="library.verify({ announce: true })"
        >
          <RefreshCw :size="14" :class="library.isVerifying ? 'animate-spin' : ''" />
          {{ library.isVerifying ? 'Checking…' : 'Rescan' }}
        </button>
        <span>{{ library.tracks.length }} songs</span>
      </div>
    </header>

    <div
      v-if="library.missingCount > 0"
      class="mb-4 flex items-center gap-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm"
    >
      <TriangleAlert :size="16" class="shrink-0 text-amber-400" />
      <p class="flex-1">
        {{ library.missingCount }}
        {{ library.missingCount === 1 ? 'song' : 'songs' }} can't be found on disk.
        <span class="text-muted">If they're on an external drive, connect it and rescan.</span>
      </p>
      <button
        type="button"
        class="shrink-0 rounded-md bg-white/10 px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/15"
        @click="library.removeMissing()"
      >
        Remove from library
      </button>
    </div>

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
