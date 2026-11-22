import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { createMainWindow } from './window.js'
import { registerAppIpc } from './ipc/app.js'
import { registerLibraryIpc } from './ipc/library.js'
import { openDatabase, closeDatabase } from './db/connection.js'

// Use ~/Library/Application Support/Vibee regardless of how the app is launched.
// Must run BEFORE the app is ready, because paths are resolved on first use.
app.setPath('userData', path.join(app.getPath('appData'), 'Vibee'))

app.whenReady().then(() => {
  openDatabase()
  registerAppIpc()
  registerLibraryIpc()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('before-quit', closeDatabase)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
