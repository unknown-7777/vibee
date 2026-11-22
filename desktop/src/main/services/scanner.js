import fs from 'node:fs/promises'
import path from 'node:path'

export const AUDIO_EXTENSIONS = ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg']
const SUPPORTED = new Set(AUDIO_EXTENSIONS.map((ext) => `.${ext}`))

// Hidden files are skipped: that includes .DS_Store and the "._song.mp3"
// resource-fork copies macOS leaves on external drives (they look like audio but aren't).
function isWantedFile(filePath) {
  const name = path.basename(filePath)
  return !name.startsWith('.') && SUPPORTED.has(path.extname(name).toLowerCase())
}

// Takes the files/folders the user picked and returns every supported audio file,
// searching folders recursively. Returns absolute paths, sorted, without duplicates.
export async function collectAudioFiles(selectedPaths) {
  const found = new Set() // a Set removes duplicates if selections overlap
  const visitedDirs = new Set() // real paths, so symlink loops can't run forever

  async function visit(target) {
    if (path.basename(target).startsWith('.')) return

    let stat
    try {
      stat = await fs.stat(target) // follows symlinks
    } catch {
      return // vanished or unreadable: skip it rather than abort the whole import
    }

    if (stat.isFile()) {
      if (isWantedFile(target)) found.add(target)
      return
    }

    if (stat.isDirectory()) {
      const real = await fs.realpath(target)
      if (visitedDirs.has(real)) return
      visitedDirs.add(real)

      let names
      try {
        names = await fs.readdir(target)
      } catch {
        return // e.g. permission denied
      }
      for (const name of names) await visit(path.join(target, name))
    }
  }

  for (const selected of selectedPaths) await visit(selected)
  return [...found].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}
