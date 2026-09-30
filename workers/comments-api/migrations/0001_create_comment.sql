-- Migration number: 0001
CREATE TABLE comment (
  id          TEXT PRIMARY KEY,
  post_slug   TEXT NOT NULL,
  author      TEXT NOT NULL,
  title       TEXT NOT NULL,
  body        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX idx_comment_post_slug_status ON comment (post_slug, status, created_at);
