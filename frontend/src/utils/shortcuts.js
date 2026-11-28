const TEXT_INPUT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', 'number'])

const SEEK_SECONDS = 5
const VOLUME_STEP = 0.05

// True when the user is typing into something: keys should type, not control the player.
export function isTypingTarget(target) {
  if (!target) return false
  if (target.isContentEditable) return true
  if (target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return true
  return target.tagName === 'INPUT' && TEXT_INPUT_TYPES.has(target.type)
}

// Decides which player command a key press means, or null if it means nothing to us.
// A plain function (no Vue, no DOM access) so it can be tested without a browser.
export function resolveShortcut(event) {
  if (event.isComposing || isTypingTarget(event.target)) return null

  const { key, metaKey, ctrlKey, altKey } = event
  if (ctrlKey || altKey) return null

  // A focused slider already uses the arrow keys itself; don't do both.
  const onSlider = event.target?.tagName === 'INPUT' && event.target.type === 'range'

  if (metaKey) {
    if (key === 'ArrowRight') return { type: 'next' }
    if (key === 'ArrowLeft') return { type: 'previous' }
    return null // other Cmd shortcuts (Cmd+R, Cmd+Q, ...) belong to the system
  }

  // Arrow keys may repeat while held (nice for volume and seeking).
  if (key === 'ArrowRight' && !onSlider) return { type: 'seekBy', amount: SEEK_SECONDS }
  if (key === 'ArrowLeft' && !onSlider) return { type: 'seekBy', amount: -SEEK_SECONDS }
  if (key === 'ArrowUp' && !onSlider) return { type: 'changeVolume', amount: VOLUME_STEP }
  if (key === 'ArrowDown' && !onSlider) return { type: 'changeVolume', amount: -VOLUME_STEP }

  // Toggles must not fire again when the key is simply held down.
  if (event.repeat) return null

  switch (key) {
    case ' ': return { type: 'togglePlay' }
    case 'm': case 'M': return { type: 'toggleMute' }
    case 's': case 'S': return { type: 'toggleShuffle' }
    case 'r': case 'R': return { type: 'cycleRepeat' }
    case 'q': case 'Q': return { type: 'toggleQueue' }
    case 'l': case 'L': return { type: 'toggleFavorite' } // L for "love"
    case 'Escape': return { type: 'closeQueue' }
    default: return null
  }
}
