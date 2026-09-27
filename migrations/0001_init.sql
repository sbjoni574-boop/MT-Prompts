-- MT Prompts - initial schema

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',           -- 'user' | 'admin'
  avatar_key TEXT,                              -- R2 object key for DP image
  bio TEXT,
  kyc_status TEXT NOT NULL DEFAULT 'none',      -- 'none' | 'pending' | 'approved' | 'rejected'
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,                          -- random token, stored in cookie
  user_id INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS kyc_requests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  full_name TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  tiktok_id TEXT NOT NULL,
  dob TEXT NOT NULL,                            -- YYYY-MM-DD
  status TEXT NOT NULL DEFAULT 'pending',        -- 'pending' | 'approved' | 'rejected'
  admin_note TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS prompts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,                     -- author (admin or approved user)
  title TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  prompt_type TEXT NOT NULL DEFAULT 'image',     -- 'image' | 'video'
  category TEXT,
  media_key TEXT NOT NULL,                       -- R2 object key of the cover image/video
  media_type TEXT NOT NULL DEFAULT 'image',      -- 'image' | 'video'
  is_admin_post INTEGER NOT NULL DEFAULT 0,      -- 1 if posted from admin panel
  status TEXT NOT NULL DEFAULT 'published',      -- 'published' | 'hidden'
  views INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_prompts_created ON prompts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prompts_user ON prompts(user_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON kyc_requests(status);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
