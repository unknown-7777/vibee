import { BrowserWindow, dialog, ipcMain } from 'electron'
import path from 'node:path'
import { getAllTracks } from '../db/tracks.js'
import { getArtworkDir } from '../paths.js'
import { importPaths } from '../services/importer.js'
import { AUDIO_EXTENSIONS } from '../services/scanner.js'

let isImporting = false

export function registerLibraryIpc() {
  ipcMain.handle('library:getTracks', () => getAllTracks())

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
}
