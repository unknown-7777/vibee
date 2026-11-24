<script setup>
import { ArrowDown, ArrowUp, Clock, Play, TriangleAlert } from 'lucide-vue-next'
import ArtworkTile from '../common/ArtworkTile.vue'
import { useTrackMenu } from '../../composables/useTrackMenu'
import { usePlayerStore } from '../../stores/player'
import { formatDate, formatDuration } from '../../utils/format.js'

defineProps({
  tracks: { type: Array, required: true },
  sortKey: { type: String, required: true },
  sortDir: { type: String, required: true },
})
defineEmits(['sort', 'play'])

const player = usePlayerStore()
const { openTrackMenu } = useTrackMenu()

// Header and rows share the same column layout so everything lines up.
const columns =
  'grid grid-cols-[2.5rem_minmax(0,3fr)_minmax(0,2fr)_minmax(0,2fr)_7rem_4rem] items-center gap-4 px-4'

const headers = [
  { key: 'title', label: 'Title' },
  { key: 'artist', label: 'Artist' },
  { key: 'album', label: 'Album' },
  { key: 'addedAt', label: 'Date added' },
]

const isCurrent = (track) => player.currentTrack?.id === track.id
</script>

<template>
  <div>
    <div
      :class="columns"
      class="sticky top-0 z-10 h-10 border-b border-line bg-bg text-xs tracking-wide text-muted uppercase"
    >
      <span class="text-center">#</span>
      <button
        v-for="header in headers"
        :key="header.key"
        type="button"
        class="flex items-center gap-1 text-left uppercase transition-colors hover:text-fg"
        :class="sortKey === header.key ? 'text-fg' : ''"
        @click="$emit('sort', header.key)"
      >
        {{ header.label }}
        <component :is="sortDir === 'asc' ? ArrowUp : ArrowDown" v-if="sortKey === header.key" :size="12" />
      </button>
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
        class="grid place-items-center text-sm tabular-nums text-muted"
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
        <span class="truncate text-sm font-medium" :class="isCurrent(track) ? 'text-accent' : ''">
          {{ track.title }}
        </span>
        <TriangleAlert v-if="track.isMissing" :size="14" class="shrink-0 text-amber-400" />
      </div>
      <span class="truncate text-sm text-muted">{{ track.artist }}</span>
      <span class="truncate text-sm text-muted">{{ track.album }}</span>
      <span class="text-sm text-muted">{{ formatDate(track.addedAt) }}</span>
      <span class="text-right text-sm tabular-nums text-muted">{{ formatDuration(track.durationSec) }}</span>
    </div>
  </div>
</template>
