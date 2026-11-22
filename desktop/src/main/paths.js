import { app } from 'electron'
import path from 'node:path'

export const getArtworkDir = () => path.join(app.getPath('userData'), 'artwork')
