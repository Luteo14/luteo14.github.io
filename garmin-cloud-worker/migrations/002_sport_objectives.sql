-- V4.3 PREPARATION ONLY: do not run until authenticated API is deployed.
CREATE TABLE IF NOT EXISTS sport_objectives (
 id TEXT PRIMARY KEY,
 owner_email TEXT NOT NULL,
 payload TEXT NOT NULL,
 updated_at TEXT NOT NULL,
 deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_sport_objectives_owner ON sport_objectives(owner_email, updated_at);
