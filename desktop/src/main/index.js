import { app, BrowserWindow } from 'electron'
import path from 'node:path'
import { createMainWindow } from './window.js'
import { registerAppIpc } from './ipc/app.js'
import { registerLibraryIpc } from './ipc/library.js'
import { registerUiIpc } from './ipc/ui.js'
import { openDatabase, closeDatabase } from './db/connection.js'
import { registerMediaProtocol, registerMediaScheme } from './protocol.js'

// Use ~/Library/Application Support/Vibee regardless of how the app is launched.
// These lines must run BEFORE the app is ready.
app.setPath('userData', path.join(app.getPath('appData'), 'Vibee'))
registerMediaScheme()

// Chromium's connection to the operating system's media controls: the keyboard's media
// keys and the "Now Playing" widget. Recent Electron versions may already switch this on;
// naming it explicitly makes sure. (Do NOT also register media keys with globalShortcut:
// that can break this mechanism.)
app.commandLine.appendSwitch('enable-features', 'HardwareMediaKeyHandling,MediaSessionService')

app.whenReady().then(() => {
  openDatabase()
  registerMediaProtocol()
  registerAppIpc()
  registerLibraryIpc()
  registerUiIpc()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('before-quit', closeDatabase)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
