-- ── Users ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id           TEXT PRIMARY KEY,
  username     TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  salt         TEXT NOT NULL,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch()),
  last_login_at INTEGER
);

-- ── Articles (lightweight registry, keyed by slug) ──────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  slug       TEXT PRIMARY KEY,
  title      TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- ── Comments (top-level + replies via parent_id) ───────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id           TEXT PRIMARY KEY,
  article_slug TEXT NOT NULL REFERENCES articles(slug) ON DELETE CASCADE,
  user_id      TEXT NOT NULL REFERENCES users(id)      ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK(length(content) >= 1 AND length(content) <= 2000),
  parent_id    TEXT REFERENCES comments(id) ON DELETE CASCADE,
  created_at   INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comments_slug   ON comments(article_slug, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
