CREATE TABLE IF NOT EXISTS running_albums (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, date TEXT, place TEXT, description TEXT, strava TEXT,
 visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('public','private')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS running_photos (
 id TEXT PRIMARY KEY, album_id TEXT NOT NULL REFERENCES running_albums(id),
 caption TEXT NOT NULL, object_key TEXT NOT NULL UNIQUE, mime TEXT NOT NULL,
 visibility TEXT NOT NULL DEFAULT 'private' CHECK(visibility IN ('public','private')),
 created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_running_photos_album ON running_photos(album_id);
