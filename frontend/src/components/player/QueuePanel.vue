<script setup>
import { computed } from 'vue'
import { X } from 'lucide-vue-next'
import ArtworkTile from '../common/ArtworkTile.vue'
import { usePlayerStore } from '../../stores/player'
import { useUiStore } from '../../stores/ui'

const MAX_SHOWN = 200 // plenty to scroll through, and keeps the panel fast with a huge queue

const player = usePlayerStore()
const ui = useUiStore()

// Songs after the current one, each with its position in the real queue
// (needed to jump to it or remove it).
const upNext = computed(() => {
  const start = player.currentIndex + 1
  return player.queue
    .slice(start, start + MAX_SHOWN)
    .map((track, offset) => ({ track, index: start + offset }))
})

const remaining = computed(() => Math.max(0, player.queue.length - player.currentIndex - 1))
const hidden = computed(() => Math.max(0, remaining.value - MAX_SHOWN))
</script>

<template>
  <aside class="flex h-full w-80 flex-col border-l border-line bg-sidebar">
    <header class="drag flex h-14 shrink-0 items-center justify-between px-5">
      <h2 class="text-sm font-semibold">Queue</h2>
      <div class="no-drag flex items-center gap-3">
        <button
          v-if="remaining > 0"
          type="button"
          class="text-xs text-muted transition-colors hover:text-fg"
          @click="player.clearUpcoming()"
        >
          Clear
        </button>
        <button
          type="button"
          class="text-muted transition-colors hover:text-fg"
          title="Close"
          @click="ui.closeQueue()"
        >
          <X :size="16" />
        </button>
      </div>
    </header>

    <!-- The list is only built while the panel is open, so a huge queue costs nothing otherwise. -->
    <div v-if="ui.isQueueOpen" class="min-h-0 flex-1 overflow-y-auto px-3 pb-4">
      <template v-if="player.currentTrack">
        <p class="px-2 pb-2 text-xs font-medium tracking-wide text-muted uppercase">Now playing</p>
        <div class="flex items-center gap-3 rounded-md px-2 py-1.5">
          <ArtworkTile
            :hue="player.currentTrack.hue"
            :src="player.currentTrack.artworkUrl"
            class="size-10 shrink-0 rounded"
          />
          <div class="min-w-0">
            <p class="truncate text-sm font-medium text-accent">{{ player.currentTrack.title }}</p>
            <p class="truncate text-xs text-muted">{{ player.currentTrack.artist }}</p>
          </div>
        </div>

        <p class="px-2 pt-5 pb-2 text-xs font-medium tracking-wide text-muted uppercase">
          Up next · {{ remaining }}
        </p>
        <p v-if="remaining === 0" class="px-2 text-sm text-muted">
          Nothing queued after this song. Right-click a song to add it.
        </p>

        <div
          v-for="item in upNext"
          :key="`${item.index}-${item.track.id}`"
          class="group flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-white/5"
          @click="player.jumpTo(item.index)"
        >
          <ArtworkTile
            :hue="item.track.hue"
            :src="item.track.artworkUrl"
            class="size-10 shrink-0 rounded"
          />
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-medium">{{ item.track.title }}</p>
            <p class="truncate text-xs text-muted">{{ item.track.artist }}</p>
          </div>
          <button
            type="button"
            class="rounded-full p-1 text-muted opacity-0 transition hover:text-fg group-hover:opacity-100"
            title="Remove from queue"
            @click.stop="player.removeFromQueue(item.index)"
          >
            <X :size="14" />
          </button>
        </div>

        <p v-if="hidden > 0" class="px-2 pt-2 text-xs text-muted">+ {{ hidden }} more</p>
      </template>

      <p v-else class="px-2 pt-2 text-sm text-muted">
        Nothing is playing. Play a song and it will show up here.
      </p>
    </div>
  </aside>
</template>
