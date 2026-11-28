import { computed, ref, toValue } from 'vue'

const DATE_KEYS = new Set(['addedAt', 'favoritedAt'])
const text = (a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })
const date = (value) => (value ? Date.parse(value) : 0)

// Sorting for any list of songs (All Songs, Favorites, later playlists and albums).
// Remembers the column and direction. When the main column ties (e.g. a whole album
// imported at once), songs keep album order, whichever direction is chosen.
export function useTrackSort(tracks, initial = { key: 'addedAt', dir: 'desc' }) {
  const sortKey = ref(initial.key)
  const sortDir = ref(initial.dir)

  const sortedTracks = computed(() => {
    const direction = sortDir.value === 'asc' ? 1 : -1
    const key = sortKey.value

    return [...toValue(tracks)].sort((a, b) => {
      const primary = DATE_KEYS.has(key) ? date(a[key]) - date(b[key]) : text(a[key], b[key])
      if (primary !== 0) return primary * direction
      return text(a.album, b.album) || (a.trackNumber ?? 0) - (b.trackNumber ?? 0)
    })
  })

  function setSort(key) {
    if (sortKey.value === key) {
      sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
      sortKey.value = key
      sortDir.value = DATE_KEYS.has(key) ? 'desc' : 'asc' // newest first, A-Z for text
    }
  }

  return { sortKey, sortDir, sortedTracks, setSort }
}
