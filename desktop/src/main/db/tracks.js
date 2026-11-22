import { getDb } from './connection.js'

// Column aliases are camelCase so rows already match what the Vue app expects.
const SELECT_TRACKS = `
  SELECT
    t.id,
    t.title,
    t.artist,
    t.album,
    t.duration_sec AS durationSec,
    t.format,
    t.artwork_path AS artworkPath,
    t.is_missing   AS isMissing,
    t.added_at     AS addedAt,
    (SELECT MAX(h.played_at) FROM play_history h WHERE h.track_id = t.id) AS lastPlayedAt,
    EXISTS (
      SELECT 1 FROM favorites f WHERE f.track_id = t.id AND f.deleted_at IS NULL
    ) AS isFavorite
  FROM tracks t
  WHERE t.deleted_at IS NULL
`

export function getAllTracks() {
  return getDb()
    .prepare(`${SELECT_TRACKS} ORDER BY t.added_at DESC`)
    .all()
    .map((row) => ({
      ...row,
      isMissing: Boolean(row.isMissing), // SQLite stores booleans as 0 / 1
      isFavorite: Boolean(row.isFavorite),
    }))
}
