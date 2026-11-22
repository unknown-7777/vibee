<script setup>
import { computed, ref, watch } from 'vue'
import { Music } from 'lucide-vue-next'

const props = defineProps({
  hue: { type: Number, default: 260 },
  src: { type: String, default: null },
})

// If the image is missing or broken, fall back to the gradient instead of a broken-image icon.
const failed = ref(false)
watch(() => props.src, () => { failed.value = false })

const showImage = computed(() => Boolean(props.src) && !failed.value)

const background = computed(
  () =>
    `linear-gradient(135deg, hsl(${props.hue} 65% 58%), hsl(${(props.hue + 45) % 360} 70% 28%))`,
)
</script>

<template>
  <div
    class="grid place-items-center overflow-hidden text-white"
    :style="showImage ? null : { background }"
  >
    <img
      v-if="showImage"
      :src="src"
      alt=""
      loading="lazy"
      decoding="async"
      draggable="false"
      class="size-full object-cover"
      @error="failed = true"
    />
    <Music v-else class="size-[35%] opacity-50" :stroke-width="1.5" />
  </div>
</template>
