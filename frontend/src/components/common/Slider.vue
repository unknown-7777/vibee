<script setup>
import { computed } from 'vue'

const model = defineModel({ type: Number, default: 0 })
const props = defineProps({
  min: { type: Number, default: 0 },
  max: { type: Number, default: 100 },
  step: { type: Number, default: 1 },
})

// The CSS paints the filled part of the track up to --fill.
const fill = computed(() => {
  const range = props.max - props.min
  return `${range > 0 ? ((model.value - props.min) / range) * 100 : 0}%`
})
</script>

<template>
  <input
    v-model.number="model"
    type="range"
    class="slider"
    :min="min"
    :max="max"
    :step="step"
    :style="{ '--fill': fill }"
  />
</template>
