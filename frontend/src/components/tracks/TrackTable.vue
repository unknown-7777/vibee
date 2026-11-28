<script setup>
import { ArrowDown, ArrowUp, Clock, Heart, Play, TriangleAlert } from 'lucide-vue-next'
import ArtworkTile from '../common/ArtworkTile.vue'
import { useTrackMenu } from '../../composables/useTrackMenu'
import { useLibraryStore } from '../../stores/library'
import { usePlayerStore } from '../../stores/player'
import { formatDate, formatDuration } from '../../utils/format.js'

defineProps({
  tracks: { type: Array, required: true },
  sortKey: { type: String, required: true },
  sortDir: { type: String, required: true },
})
defineEmits(['sort', 'play'])

const player = usePlayerStore()
const library = useLibraryStore()
const { openTrackMenu } = useTrackMenu()

// The table adapts to the width IT is given, not the window's. Opening the queue panel makes
// the page narrower, and instead of squeezing every column, whole columns drop away:
// Artist from 480px, Album from 720px, Date added from 880px. Below 480px the "#" column goes
// too, and the artist shows under the title. Header and rows use the same template,
// so they always line up.
const columns = [
  'grid items-center gap-3 px-3 @min-[480px]:gap-4 @min-[480px]:px-4',
  'grid-cols-[minmax(0,1fr)_2rem_3.5rem]',
  '@min-[480px]:grid-cols-[2.5rem_minmax(0,3fr)_minmax(0,2fr)_2rem_3.5rem]',
  '@min-[720px]:grid-cols-[2.5rem_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_2rem_3.5rem]',
  '@min-[880px]:grid-cols-[2.5rem_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_7rem_2rem_3.5rem]',
].join(' ')

const headers = [
  { key: 'title', label: 'Title', show: '' },
  { key: 'artist', label: 'Artist', show: 'hidden @min-[480px]:flex' },
  { key: 'album', label: 'Album', show: 'hidden @min-[720px]:flex' },
  { key: 'addedAt', label: 'Date added', show: 'hidden @min-[880px]:flex' },
]

const isCurrent = (track) => player.currentTrack?.id === track.id
</script>

<template>
  <div class="@container">
    <div
      :class="columns"
      class="sticky top-0 z-10 h-10 border-b border-line bg-bg text-xs tracking-wide text-muted uppercase"
    >
      <span class="hidden text-center @min-[480px]:block">#</span>
      <button
        v-for="header in headers"
        :key="header.key"
        type="button"
        class="flex items-center gap-1 text-left uppercase transition-colors hover:text-fg"
        :class="[header.show, sortKey === header.key ? 'text-fg' : '']"
        @click="$emit('sort', header.key)"
      >
        {{ header.label }}
        <component :is="sortDir === 'asc' ? ArrowUp : ArrowDown" v-if="sortKey === header.key" :size="12" />
      </button>
      <span></span>
      <Clock :size="14" class="justify-self-end" />
    </div>

    <div
      v-for="(track, index) in tracks"
      :key="track.id"
      :class="[columns, track.isMissing && 'opacity-45']"
      :title="track.isMissing ? 'File not found' : undefined"
      class="group h-14 rounded-md transition-colors hover:bg-white/5"
      @dblclick="$emit('play', track)"
      @contextmenu.prevent="openTrackMenu(track)"
    >
      <button
        type="button"
        class="hidden place-items-center text-sm tabular-nums text-muted @min-[480px]:grid"
        @click="$emit('play', track)"
      >
        <span
          :class="[isCurrent(track) ? 'text-accent' : '', !track.isMissing && 'group-hover:hidden']"
        >
          {{ index + 1 }}
        </span>
        <Play
          v-if="!track.isMissing"
          :size="14"
          fill="currentColor"
          class="hidden text-fg group-hover:block"
        />
      </button>

      <div class="flex min-w-0 items-center gap-3">
        <ArtworkTile :hue="track.hue" :src="track.artworkUrl" class="size-10 shrink-0 rounded" />
        <div class="min-w-0">
          <p class="truncate text-sm font-medium" :class="isCurrent(track) ? 'text-accent' : ''">
            {{ track.title }}
          </p>
          <!-- Only while the Artist column is hidden -->
          <p class="truncate text-xs text-muted @min-[480px]:hidden">{{ track.artist }}</p>
        </div>
        <TriangleAlert v-if="track.isMissing" :size="14" class="shrink-0 text-amber-400" />
      </div>
      <span class="hidden truncate text-sm text-muted @min-[480px]:block">{{ track.artist }}</span>
      <span class="hidden truncate text-sm text-muted @min-[720px]:block">{{ track.album }}</span>
      <span class="hidden text-sm text-muted @min-[880px]:block">{{ formatDate(track.addedAt) }}</span>

      <button
        type="button"
        class="grid place-items-center rounded-full p-1 transition"
        :class="
          track.isFavorite
            ? 'text-accent'
            : 'text-muted opacity-0 group-hover:opacity-100 hover:text-fg focus-visible:opacity-100'
        "
        :title="track.isFavorite ? 'Remove from Favorites' : 'Add to Favorites'"
        @click.stop="library.toggleFavorite(track)"
        @dblclick.stop
      >
        <Heart :size="16" :fill="track.isFavorite ? 'currentColor' : 'none'" />
      </button>
      <span class="text-right text-sm tabular-nums text-muted">{{ formatDuration(track.durationSec) }}</span>
    </div>
  </div>
</template>
