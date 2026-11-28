import { randomUUID } from 'node:crypto'
import { getDb } from './connection.js'

const SELECT_TRACKS = `
  SELECT
    t.id,
    t.title,
    t.artist,
    t.album,
    t.track_number AS trackNumber,
    t.duration_sec AS durationSec,
    t.format,
    t.artwork_path AS artworkPath,
    t.is_missing   AS isMissing,
    t.added_at     AS addedAt,
    (SELECT MAX(h.played_at) FROM play_history h WHERE h.track_id = t.id) AS lastPlayedAt,
    (SELECT f.created_at FROM favorites f WHERE f.track_id = t.id AND f.deleted_at IS NULL) AS favoritedAt
  FROM tracks t
  WHERE t.deleted_at IS NULL
`

export function getAllTracks() {
  return getDb()
    .prepare(`${SELECT_TRACKS} ORDER BY t.added_at DESC`)
    .all()
    .map((row) => ({
      ...row,
      isMissing: Boolean(row.isMissing),
      isFavorite: row.favoritedAt !== null, // favoritedAt: when the song became a favorite
    }))
}

// Inserts new tracks and refreshes existing ones (matched by file path),
// all inside ONE transaction: it is much faster than one commit per song,
// and a batch is either saved completely or not at all.
export function upsertTracks(tracks, addedAt) {
  const db = getDb()
  const now = new Date().toISOString()

  const findByPath = db.prepare('SELECT id FROM tracks WHERE file_path = ?')

  const insert = db.prepare(`
    INSERT INTO tracks (
      id, file_path, title, artist, album, album_artist, track_number, year, genre,
      duration_sec, format, file_size, artwork_path, is_missing, added_at, updated_at
    ) VALUES (
      @id, @filePath, @title, @artist, @album, @albumArtist, @trackNumber, @year, @genre,
      @durationSec, @format, @fileSize, @artworkPath, 0, @addedAt, @now
    )
  `)

  // Re-importing a known file refreshes its tags, brings back a missing or
  // deleted track, and keeps the original id and added_at.
  const update = db.prepare(`
    UPDATE tracks SET
      title = @title, artist = @artist, album = @album, album_artist = @albumArtist,
      track_number = @trackNumber, year = @year, genre = @genre,
      duration_sec = @durationSec, format = @format, file_size = @fileSize,
      artwork_path = @artworkPath, is_missing = 0, deleted_at = NULL, updated_at = @now
    WHERE id = @id
  `)

  let added = 0
  let updated = 0

  db.transaction(() => {
    for (const track of tracks) {
      const existing = findByPath.get(track.filePath)
      if (existing) {
        update.run({ ...track, id: existing.id, now })
        updated++
      } else {
        insert.run({ ...track, id: randomUUID(), addedAt, now })
        added++
      }
    }
  })()

  return { added, updated }
}

// ---- Missing-file support -------------------------------------------------

export function getTrackFileStates() {
  return getDb()
    .prepare('SELECT id, file_path AS filePath, is_missing AS isMissing FROM tracks WHERE deleted_at IS NULL')
    .all()
}

// Only rows whose state actually changes are touched, so updated_at stays meaningful.
export function applyMissingStates({ markMissing, markPresent }) {
  const db = getDb()
  const now = new Date().toISOString()
  const setFlag = db.prepare('UPDATE tracks SET is_missing = ?, updated_at = ? WHERE id = ?')

  db.transaction(() => {
    for (const id of markMissing) setFlag.run(1, now, id)
    for (const id of markPresent) setFlag.run(0, now, id)
  })()
}

export function countMissingTracks() {
  return getDb()
    .prepare('SELECT COUNT(*) AS count FROM tracks WHERE is_missing = 1 AND deleted_at IS NULL')
    .get().count
}

// "Removing" is a soft delete: the row stays (stamped with deleted_at) so sync can
// tell Laravel about it later. Importing the file again brings the track back.
export function removeMissingTracks() {
  const now = new Date().toISOString()
  return getDb()
    .prepare('UPDATE tracks SET deleted_at = ?, updated_at = ? WHERE is_missing = 1 AND deleted_at IS NULL')
    .run(now, now).changes
}

// ---- Playback support -----------------------------------------------------

// Used by the vibee-media:// protocol: the renderer asks for a track ID, never a path.
export function getTrackFilePath(id) {
  const row = getDb()
    .prepare('SELECT file_path AS filePath FROM tracks WHERE id = ? AND deleted_at IS NULL')
    .get(id)
  return row?.filePath ?? null
}

// Adds a listening-history entry. Returns the timestamp, or null if the track doesn't exist.
export function recordPlay(trackId) {
  const playedAt = new Date().toISOString()
  const { changes } = getDb()
    .prepare(
      `INSERT INTO play_history (id, track_id, played_at)
       SELECT ?, id, ? FROM tracks WHERE id = ? AND deleted_at IS NULL`,
    )
    .run(randomUUID(), playedAt, trackId)
  return changes > 0 ? playedAt : null
}

// ---- Favorites ------------------------------------------------------------

// Sets whether a song is a favorite. Safe to call repeatedly with the same value.
// Returns the new state, or null if the song doesn't exist.
export function setFavorite(trackId, isFavorite) {
  const db = getDb()
  const exists = db.prepare('SELECT 1 FROM tracks WHERE id = ? AND deleted_at IS NULL').get(trackId)
  if (!exists) return null

  const now = new Date().toISOString()
  if (isFavorite) {
    // Insert, or bring back a favorite that was removed earlier. Already being a
    // favorite changes nothing (so timestamps stay put).
    db.prepare(
      `INSERT INTO favorites (track_id, created_at, updated_at, deleted_at) VALUES (?, ?, ?, NULL)
       ON CONFLICT(track_id) DO UPDATE SET
         created_at = excluded.created_at, updated_at = excluded.updated_at, deleted_at = NULL
       WHERE favorites.deleted_at IS NOT NULL`,
    ).run(trackId, now, now)
  } else {
    // A soft delete, like everywhere else, so sync can learn about it later.
    db.prepare(
      'UPDATE favorites SET deleted_at = ?, updated_at = ? WHERE track_id = ? AND deleted_at IS NULL',
    ).run(now, now, trackId)
  }
  return isFavorite
}
