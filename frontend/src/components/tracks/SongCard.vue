<script setup>
import { computed } from 'vue'
import { Play } from 'lucide-vue-next'
import ArtworkTile from '../common/ArtworkTile.vue'
import { usePlayerStore } from '../../stores/player'

const props = defineProps({ track: { type: Object, required: true } })
defineEmits(['play'])

const player = usePlayerStore()
const isCurrent = computed(() => player.currentTrack?.id === props.track.id)
</script>

<template>
  <button
    type="button"
    class="group min-w-0 rounded-xl bg-card/60 p-3 text-left transition-colors hover:bg-card"
    @click="$emit('play')"
  >
    <div class="relative">
      <ArtworkTile :hue="track.hue" class="aspect-square w-full rounded-lg" />
      <span
        class="absolute right-2 bottom-2 grid size-10 translate-y-1 place-items-center rounded-full bg-accent text-black opacity-0 shadow-lg transition group-hover:translate-y-0 group-hover:opacity-100"
      >
        <Play :size="18" fill="currentColor" class="translate-x-px" />
      </span>
    </div>
    <p class="mt-3 truncate text-sm font-medium" :class="isCurrent ? 'text-accent' : ''">
      {{ track.title }}
    </p>
    <p class="truncate text-xs text-muted">{{ track.artist }}</p>
  </button>
</template>
