CREATE TABLE IF NOT EXISTS garmin_snapshots (
  category TEXT NOT NULL PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
