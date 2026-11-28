<script setup>
import { computed } from 'vue'
import { Play, Shuffle } from 'lucide-vue-next'
import { usePlayerStore } from '../../stores/player'

const props = defineProps({ tracks: { type: Array, required: true } })

const player = usePlayerStore()
const firstPlayable = computed(() => props.tracks.find((track) => !track.isMissing))

function playAll() {
  if (firstPlayable.value) player.playTrack(firstPlayable.value, props.tracks)
}

function shuffleAll() {
  player.playShuffled(props.tracks)
}
</script>

<template>
  <div class="flex items-center gap-3">
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-black transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
      :disabled="!firstPlayable"
      @click="playAll"
    >
      <Play :size="15" fill="currentColor" />
      Play
    </button>
    <button
      type="button"
      class="inline-flex items-center gap-2 rounded-full bg-white/10 px-5 py-2 text-sm font-semibold transition-colors hover:bg-white/15 disabled:pointer-events-none disabled:opacity-40"
      :disabled="!firstPlayable"
      @click="shuffleAll"
    >
      <Shuffle :size="15" />
      Shuffle
    </button>
  </div>
</template>
