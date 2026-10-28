-- LUTEO14 V5.1.1 - Nutrition cross-device (Cloudflare D1)
CREATE TABLE IF NOT EXISTS sport_nutrition_plans (
  owner_email TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
