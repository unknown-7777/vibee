const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('vibee', {
  platform: process.platform,
  ping: () => ipcRenderer.invoke('app:ping'),
})
