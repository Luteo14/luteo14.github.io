CREATE TABLE IF NOT EXISTS sport_training_sessions (owner_email TEXT NOT NULL, id TEXT NOT NULL, session_date TEXT NOT NULL, payload TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY(owner_email,id));
CREATE INDEX IF NOT EXISTS idx_sport_training_sessions_owner_date ON sport_training_sessions(owner_email,session_date);
