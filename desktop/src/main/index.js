import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { createMainWindow } from './window.js'
import { registerAppIpc } from './ipc/app.js'
import { registerLibraryIpc } from './ipc/library.js'
import { openDatabase, closeDatabase } from './db/connection.js'
import { registerMediaProtocol, registerMediaScheme } from './protocol.js'

// Use ~/Library/Application Support/Vibee regardless of how the app is launched.
// Both lines below must run BEFORE the app is ready.
app.setPath('userData', path.join(app.getPath('appData'), 'Vibee'))
registerMediaScheme()

app.whenReady().then(() => {
  openDatabase()
  registerMediaProtocol()
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
