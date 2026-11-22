<script setup>
import { computed } from 'vue'
import { Music } from 'lucide-vue-next'

const props = defineProps({ hue: { type: Number, default: 260 } })

const background = computed(
  () =>
    `linear-gradient(135deg, hsl(${props.hue} 65% 58%), hsl(${(props.hue + 45) % 360} 70% 28%))`,
)
</script>

<template>
  <div class="grid place-items-center overflow-hidden text-white" :style="{ background }">
    <Music class="size-[35%] opacity-50" :stroke-width="1.5" />
  </div>
</template>
