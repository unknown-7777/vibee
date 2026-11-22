import { app, BrowserWindow } from 'electron'
import { createMainWindow } from './window.js'
import { registerAppIpc } from './ipc/app.js'

app.whenReady().then(() => {
  registerAppIpc()
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createMainWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
