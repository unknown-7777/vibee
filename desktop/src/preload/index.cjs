const { contextBridge, ipcRenderer } = require('electron')

// Everything Vue is allowed to do is listed here. Nothing else gets through.
contextBridge.exposeInMainWorld('vibee', {
  platform: process.platform,
  ping: () => ipcRenderer.invoke('app:ping'),
  library: {
    getTracks: () => ipcRenderer.invoke('library:getTracks'),
  },
})
