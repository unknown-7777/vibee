import { defineStore } from 'pinia'
import { computed, ref } from 'vue'

// UI-ONLY for now: no audio is played and time doesn't advance.
// Phase 4 puts a real <audio> element behind these same actions.
export const usePlayerStore = defineStore('player', () => {
  const queue = ref([])
  const currentIndex = ref(-1)
  const isPlaying = ref(false)
  const currentTime = ref(0)
  const volume = ref(0.8)
  const shuffle = ref(false)
  const repeat = ref('off') // 'off' | 'all' | 'one'

  const currentTrack = computed(() => queue.value[currentIndex.value] ?? null)

  // Play `track`, using `trackList` as the queue (e.g. the list it was clicked in).
  function playTrack(track, trackList = [track]) {
    const index = trackList.findIndex((item) => item.id === track.id)
    queue.value = index === -1 ? [track] : trackList
    currentIndex.value = index === -1 ? 0 : index
    currentTime.value = 0
    isPlaying.value = true
  }

  function togglePlay() {
    if (currentTrack.value) isPlaying.value = !isPlaying.value
  }

  function next() {
    if (!queue.value.length) return
    currentIndex.value = (currentIndex.value + 1) % queue.value.length
    currentTime.value = 0
  }

  function previous() {
    if (!queue.value.length) return
    currentIndex.value = (currentIndex.value - 1 + queue.value.length) % queue.value.length
    currentTime.value = 0
  }

  function seek(seconds) {
    currentTime.value = seconds
  }

  function setVolume(value) {
    volume.value = value
  }

  function toggleShuffle() {
    shuffle.value = !shuffle.value
  }

  function cycleRepeat() {
    repeat.value = { off: 'all', all: 'one', one: 'off' }[repeat.value]
  }

  return {
    queue, currentIndex, isPlaying, currentTime, volume, shuffle, repeat, currentTrack,
    playTrack, togglePlay, next, previous, seek, setVolume, toggleShuffle, cycleRepeat,
  }
})
