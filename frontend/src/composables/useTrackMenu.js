import { bridge } from '../services/bridge'
import { useLibraryStore } from '../stores/library'
import { usePlayerStore } from '../stores/player'

// Right-click menu for a song. The menu itself is a native macOS menu built by the
// main process; this just opens it and carries out whatever the user picked.
export function useTrackMenu() {
  const player = usePlayerStore()
  const library = useLibraryStore()

  async function openTrackMenu(track) {
    if (!bridge) return
    const action = await bridge.ui.showTrackMenu({
      isMissing: track.isMissing,
      isFavorite: track.isFavorite,
    })
    if (action === 'toggle-favorite') library.toggleFavorite(library.byId.get(track.id) ?? track)
    else if (action === 'play-next') player.playNext(track)
    else if (action === 'add-to-queue') player.addToQueue(track)
  }

  return { openTrackMenu }
}
