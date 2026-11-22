import { ipcMain } from 'electron'

export function registerAppIpc() {
  ipcMain.handle('app:ping', () => 'pong from the main process 🏓')
}
