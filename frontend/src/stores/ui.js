import { defineStore } from 'pinia'
import { ref } from 'vue'

// Interface state that isn't about music or the library.
export const useUiStore = defineStore('ui', () => {
  const isQueueOpen = ref(false)

  function toggleQueue() {
    isQueueOpen.value = !isQueueOpen.value
  }

  function closeQueue() {
    isQueueOpen.value = false
  }

  return { isQueueOpen, toggleQueue, closeQueue }
})
