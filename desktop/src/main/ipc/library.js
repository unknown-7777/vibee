import { BrowserWindow, dialog, ipcMain } from 'electron'
import { countMissingTracks, getAllTracks, recordPlay, removeMissingTracks } from '../db/tracks.js'
import { getArtworkDir } from '../paths.js'
import { importPaths } from '../services/importer.js'
import { AUDIO_EXTENSIONS } from '../services/scanner.js'
import { verifyLibrary } from '../services/verifier.js'

let isImporting = false

export function registerLibraryIpc() {
  ipcMain.handle('library:getTracks', () => getAllTracks())

  // The player calls this once a song has been listened to for a while.
  ipcMain.handle('library:recordPlay', (_event, trackId) =>
    typeof trackId === 'string' ? recordPlay(trackId) : null,
  )

  ipcMain.handle('library:import', async (event) => {
    if (isImporting) return { busy: true }
    isImporting = true

    try {
      const options = {
        title: 'Import music',
        message: 'Choose songs or folders to import',
        buttonLabel: 'Import',
        // On macOS this one dialog lets you pick files AND folders together.
        properties: ['openFile', 'openDirectory', 'multiSelections'],
        filters: [{ name: 'Audio files', extensions: AUDIO_EXTENSIONS }],
      }
      const win = BrowserWindow.fromWebContents(event.sender)
      const { canceled, filePaths } = win
        ? await dialog.showOpenDialog(win, options)
        : await dialog.showOpenDialog(options)

      if (canceled || filePaths.length === 0) return { canceled: true }

      const sendProgress = (progress) => {
        if (!event.sender.isDestroyed()) event.sender.send('library:importProgress', progress)
      }

      const summary = await importPaths(filePaths, {
        artworkDir: getArtworkDir(),
        onProgress: sendProgress,
      })

      for (const failure of summary.failed) {
        console.warn(`[import] skipped ${failure.file}: ${failure.reason}`)
      }

      return {
        canceled: false,
        total: summary.total,
        added: summary.added,
        updated: summary.updated,
        failedCount: summary.failed.length,
        durationMs: summary.durationMs,
      }
    } finally {
      isImporting = false
    }
  })

  // Checks every song's file still exists and updates the missing flags.
  ipcMain.handle('library:verify', async () => {
    if (isImporting) return { skipped: true } // don't race with an import
    return verifyLibrary()
  })

  // Asks first, using a native macOS dialog, then removes all missing songs.
  ipcMain.handle('library:removeMissing', async (event) => {
    const count = countMissingTracks()
    if (count === 0) return { removed: 0 }

    const options = {
      type: 'warning',
      buttons: ['Cancel', 'Remove'],
      defaultId: 0, // Enter key = the safe choice
      cancelId: 0,
      message: `Remove ${count} missing ${count === 1 ? 'song' : 'songs'} from your library?`,
      detail: 'Your files are not touched. If you import them again later, they will come back.',
    }
    const win = BrowserWindow.fromWebContents(event.sender)
    const { response } = win
      ? await dialog.showMessageBox(win, options)
      : await dialog.showMessageBox(options)

    if (response !== 1) return { removed: 0, canceled: true }
    return { removed: removeMissingTracks() }
  })
}
