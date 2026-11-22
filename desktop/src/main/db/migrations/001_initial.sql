CREATE TABLE tracks (
  id            TEXT PRIMARY KEY,
  file_path     TEXT NOT NULL UNIQUE,
  title         TEXT NOT NULL,
  artist        TEXT NOT NULL DEFAULT 'Unknown Artist',
  album         TEXT NOT NULL DEFAULT 'Unknown Album',
  album_artist  TEXT,
  track_number  INTEGER,
  year          INTEGER,
  genre         TEXT,
  duration_sec  REAL NOT NULL DEFAULT 0,
  format        TEXT,
  file_size     INTEGER,
  artwork_path  TEXT,
  is_missing    INTEGER NOT NULL DEFAULT 0,
  added_at      TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);
CREATE INDEX idx_tracks_artist ON tracks(artist);
CREATE INDEX idx_tracks_album  ON tracks(album);
CREATE INDEX idx_tracks_added  ON tracks(added_at);

CREATE TABLE playlists (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE playlist_tracks (
  id          TEXT PRIMARY KEY,
  playlist_id TEXT NOT NULL REFERENCES playlists(id),
  track_id    TEXT NOT NULL REFERENCES tracks(id),
  position    INTEGER NOT NULL,
  created_at  TEXT NOT NULL,
  updated_at  TEXT NOT NULL,
  deleted_at  TEXT
);
CREATE INDEX idx_playlist_tracks_playlist ON playlist_tracks(playlist_id, position);

CREATE TABLE favorites (
  track_id   TEXT PRIMARY KEY REFERENCES tracks(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE TABLE play_history (
  id        TEXT PRIMARY KEY,
  track_id  TEXT NOT NULL REFERENCES tracks(id),
  played_at TEXT NOT NULL
);
CREATE INDEX idx_play_history_track  ON play_history(track_id, played_at);
CREATE INDEX idx_play_history_played ON play_history(played_at);

CREATE TABLE settings (
  key        TEXT PRIMARY KEY,
  value      TEXT,
  updated_at TEXT NOT NULL
);
