<script setup>
import { computed, ref } from 'vue'
import {
  Heart, ListMusic, Pause, Play, Repeat, Repeat1, Shuffle, SkipBack, SkipForward, Volume2, VolumeX,
} from 'lucide-vue-next'
import ArtworkTile from '../common/ArtworkTile.vue'
import IconButton from '../common/IconButton.vue'
import Slider from '../common/Slider.vue'
import { usePlayerStore } from '../../stores/player'
import { useUiStore } from '../../stores/ui'
import { formatDuration } from '../../utils/format.js'

const player = usePlayerStore()
const ui = useUiStore()

const hasTrack = computed(() => player.currentTrack !== null)
const duration = computed(() => player.duration || player.currentTrack?.durationSec || 0)
const repeatIcon = computed(() => (player.repeat === 'one' ? Repeat1 : Repeat))
const repeatTitle = computed(
  () => ({ off: 'Repeat: off (R)', all: 'Repeat: all (R)', one: 'Repeat: one (R)' })[player.repeat],
)
const volumeIcon = computed(() => (player.volume === 0 ? VolumeX : Volume2))

// While dragging the progress bar only the knob moves; the song jumps when you let go.
const isScrubbing = ref(false)
const scrubTime = ref(0)
const shownTime = computed(() => (isScrubbing.value ? scrubTime.value : player.currentTime))

function onScrub(value) {
  isScrubbing.value = true
  scrubTime.value = value
}

function onScrubEnd(value) {
  player.seek(value)
  isScrubbing.value = false
}
</script>

<template>
  <footer
    class="grid h-24 shrink-0 grid-cols-[1fr_minmax(0,2fr)_1fr] items-center gap-6 border-t border-line bg-sidebar px-5"
  >
    <!-- Now playing -->
    <div class="flex min-w-0 items-center gap-3">
      <template v-if="hasTrack">
        <ArtworkTile
          :hue="player.currentTrack.hue"
          :src="player.currentTrack.artworkUrl"
          class="size-14 shrink-0 rounded-md"
        />
        <div class="min-w-0">
          <p class="truncate text-sm font-medium">{{ player.currentTrack.title }}</p>
          <p class="truncate text-xs" :class="player.error ? 'text-amber-400' : 'text-muted'">
            {{ player.error ?? player.currentTrack.artist }}
          </p>
        </div>
        <button
          type="button"
          class="shrink-0 rounded-full p-1.5 transition-colors"
          :class="player.isCurrentFavorite ? 'text-accent' : 'text-muted hover:text-fg'"
          :title="player.isCurrentFavorite ? 'Remove from Favorites (L)' : 'Add to Favorites (L)'"
          @click="player.toggleFavoriteCurrent()"
        >
          <Heart :size="16" :fill="player.isCurrentFavorite ? 'currentColor' : 'none'" />
        </button>
      </template>
      <p v-else class="text-sm text-muted">Nothing playing</p>
    </div>

    <!-- Controls + progress -->
    <div class="flex flex-col items-center gap-2">
      <div class="flex items-center gap-4">
        <IconButton :active="player.shuffle" title="Shuffle (S)" @click="player.toggleShuffle()">
          <Shuffle :size="18" />
        </IconButton>
        <IconButton :disabled="!hasTrack" title="Previous (⌘←)" @click="player.previous()">
          <SkipBack :size="20" fill="currentColor" />
        </IconButton>
        <button
          type="button"
          class="grid size-10 place-items-center rounded-full bg-fg text-black transition hover:scale-105 disabled:pointer-events-none disabled:opacity-40"
          :disabled="!hasTrack"
          :title="player.isPlaying ? 'Pause (Space)' : 'Play (Space)'"
          @click="player.togglePlay()"
        >
          <Pause v-if="player.isPlaying" :size="18" fill="currentColor" />
          <Play v-else :size="18" fill="currentColor" class="translate-x-px" />
        </button>
        <IconButton :disabled="!player.canNext" title="Next (⌘→)" @click="player.next()">
          <SkipForward :size="20" fill="currentColor" />
        </IconButton>
        <IconButton :active="player.repeat !== 'off'" :title="repeatTitle" @click="player.cycleRepeat()">
          <component :is="repeatIcon" :size="18" />
        </IconButton>
      </div>

      <div class="flex w-full max-w-xl items-center gap-3 text-xs tabular-nums text-muted">
        <span class="w-10 text-right">{{ formatDuration(shownTime) }}</span>
        <Slider
          class="flex-1"
          :model-value="shownTime"
          :max="duration || 1"
          :step="0.25"
          :disabled="!hasTrack"
          @update:model-value="onScrub"
          @commit="onScrubEnd"
        />
        <span class="w-10">{{ formatDuration(duration) }}</span>
      </div>
    </div>

    <!-- Queue + volume -->
    <div class="flex items-center justify-end gap-3">
      <IconButton :active="ui.isQueueOpen" title="Queue (Q)" @click="ui.toggleQueue()">
        <ListMusic :size="18" />
      </IconButton>
      <component :is="volumeIcon" :size="18" class="shrink-0 text-muted" />
      <Slider
        class="w-28"
        :model-value="player.volume"
        :min="0"
        :max="1"
        :step="0.01"
        @update:model-value="player.setVolume"
      />
    </div>
  </footer>
</template>
