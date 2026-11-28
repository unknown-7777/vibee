<script setup>
import { Heart } from 'lucide-vue-next'
import ListActions from '../components/tracks/ListActions.vue'
import TrackTable from '../components/tracks/TrackTable.vue'
import { useTrackSort } from '../composables/useTrackSort'
import { useLibraryStore } from '../stores/library'
import { usePlayerStore } from '../stores/player'

const library = useLibraryStore()
const player = usePlayerStore()

// Newest favorite first, until you pick another column.
const { sortKey, sortDir, sortedTracks, setSort } = useTrackSort(() => library.favoriteTracks, {
  key: 'favoritedAt',
  dir: 'desc',
})

const play = (track) => player.playTrack(track, sortedTracks.value)
</script>

<template>
  <div class="@container px-8 pb-6">
    <header class="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <h1 class="text-3xl font-semibold tracking-tight">Favorites</h1>
      <p class="text-sm text-muted">{{ library.favoriteTracks.length }} songs</p>
    </header>

    <div v-if="library.favoriteTracks.length === 0" class="grid place-items-center py-24 text-center">
      <div class="max-w-sm">
        <div class="mx-auto mb-5 grid size-16 place-items-center rounded-2xl bg-card text-muted">
          <Heart :size="28" :stroke-width="1.5" />
        </div>
        <h2 class="text-lg font-semibold">No favorites yet</h2>
        <p class="mt-2 text-sm text-muted">
          Click the heart next to a song, or press L while it plays, and it will show up here.
        </p>
      </div>
    </div>

    <template v-else>
      <ListActions :tracks="sortedTracks" class="mb-5" />
      <TrackTable
        :tracks="sortedTracks"
        :sort-key="sortKey"
        :sort-dir="sortDir"
        @sort="setSort"
        @play="play"
      />
    </template>
  </div>
</template>
