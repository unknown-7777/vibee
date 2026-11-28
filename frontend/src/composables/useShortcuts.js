import { onBeforeUnmount, onMounted } from 'vue'
import { usePlayerStore } from '../stores/player'
import { useUiStore } from '../stores/ui'
import { resolveShortcut } from '../utils/shortcuts.js'

// Listens for key presses anywhere in the window and runs the matching player command.
// Which key means what lives in utils/shortcuts.js; this file only connects it to the stores.
export function useShortcuts() {
  const player = usePlayerStore()
  const ui = useUiStore()

  const commands = {
    togglePlay: () => player.togglePlay(),
    next: () => player.next(),
    previous: () => player.previous(),
    seekBy: (seconds) => player.seekBy(seconds),
    changeVolume: (delta) => player.changeVolume(delta),
    toggleMute: () => player.toggleMute(),
    toggleShuffle: () => player.toggleShuffle(),
    cycleRepeat: () => player.cycleRepeat(),
    toggleFavorite: () => player.toggleFavoriteCurrent(),
    toggleQueue: () => ui.toggleQueue(),
    closeQueue: () => ui.closeQueue(),
  }

  function onKeyDown(event) {
    const command = resolveShortcut(event)
    if (!command) return

    // preventDefault matters: without it, pressing Space while a button has focus
    // would also "click" that button, undoing what we just did.
    event.preventDefault()
    commands[command.type](command.amount)
  }

  onMounted(() => window.addEventListener('keydown', onKeyDown))
  onBeforeUnmount(() => window.removeEventListener('keydown', onKeyDown))
}
