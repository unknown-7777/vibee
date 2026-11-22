import { ipcMain } from 'electron'
import { getAllTracks } from '../db/tracks.js'

export function registerLibraryIpc() {
  ipcMain.handle('library:getTracks', () => getAllTracks())
}
