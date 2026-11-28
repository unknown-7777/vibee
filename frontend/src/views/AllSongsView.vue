<script setup>
import { RefreshCw, TriangleAlert } from 'lucide-vue-next'
import EmptyLibrary from '../components/common/EmptyLibrary.vue'
import ListActions from '../components/tracks/ListActions.vue'
import TrackTable from '../components/tracks/TrackTable.vue'
import { useTrackSort } from '../composables/useTrackSort'
import { useLibraryStore } from '../stores/library'
import { usePlayerStore } from '../stores/player'

const library = useLibraryStore()
const player = usePlayerStore()

const { sortKey, sortDir, sortedTracks, setSort } = useTrackSort(() => library.tracks)

// The queue is the list exactly as the user sees it (in the current sort order).
const play = (track) => player.playTrack(track, sortedTracks.value)
</script>

<template>
  <div class="@container px-8 pb-6">
    <header class="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
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

    <ListActions v-if="!library.isEmpty" :tracks="sortedTracks" class="mb-5" />

    <div
      v-if="library.missingCount > 0"
      class="mb-4 flex flex-col items-start gap-3 rounded-lg border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm @min-[560px]:flex-row @min-[560px]:items-center"
    >
      <div class="flex flex-1 items-start gap-3">
        <TriangleAlert :size="16" class="mt-0.5 shrink-0 text-amber-400" />
        <p>
          {{ library.missingCount }}
          {{ library.missingCount === 1 ? 'song' : 'songs' }} can't be found on disk.
          <span class="text-muted">If they're on an external drive, connect it and rescan.</span>
        </p>
      </div>
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
