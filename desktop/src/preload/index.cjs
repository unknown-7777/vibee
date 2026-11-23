const { contextBridge, ipcRenderer } = require('electron')

// Everything Vue is allowed to do is listed here. Nothing else gets through.
contextBridge.exposeInMainWorld('vibee', {
  platform: process.platform,
  ping: () => ipcRenderer.invoke('app:ping'),
  library: {
    getTracks: () => ipcRenderer.invoke('library:getTracks'),
    importMusic: () => ipcRenderer.invoke('library:import'),
    verify: () => ipcRenderer.invoke('library:verify'),
    removeMissing: () => ipcRenderer.invoke('library:removeMissing'),
    recordPlay: (trackId) => ipcRenderer.invoke('library:recordPlay', trackId),

    // Subscribes to progress updates and returns a function that unsubscribes.
    // The raw IPC event object is deliberately NOT passed to the page.
    onImportProgress: (callback) => {
      const listener = (_event, progress) => callback(progress)
      ipcRenderer.on('library:importProgress', listener)
      return () => ipcRenderer.removeListener('library:importProgress', listener)
    },
  },
})
