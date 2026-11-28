import { BrowserWindow, Menu, ipcMain } from 'electron'

// The native right-click menu for a song. `choose` is called with the action id.
export function buildTrackMenu({ isMissing, isFavorite }, choose) {
  return Menu.buildFromTemplate([
    {
      label: isFavorite ? 'Remove from Favorites' : 'Add to Favorites',
      click: () => choose('toggle-favorite'),
    },
    { type: 'separator' },
    { label: 'Play Next', enabled: !isMissing, click: () => choose('play-next') },
    { label: 'Add to Queue', enabled: !isMissing, click: () => choose('add-to-queue') },
  ])
}

export function registerUiIpc() {
  // Shows the menu and resolves with the chosen action id, or null if it was dismissed.
  ipcMain.handle('ui:trackMenu', (event, options) =>
    new Promise((resolve) => {
      const menu = buildTrackMenu(
        { isMissing: Boolean(options?.isMissing), isFavorite: Boolean(options?.isFavorite) },
        resolve,
      )
      menu.popup({
        window: BrowserWindow.fromWebContents(event.sender) ?? undefined,
        // Called when the menu closes. A click handler runs around the same moment,
        // so wait briefly before deciding that nothing was chosen.
        callback: () => setTimeout(() => resolve(null), 100),
      })
    }),
  )
}
