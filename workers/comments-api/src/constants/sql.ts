
const COMMENT_COLUMNS: string = "id, post_slug AS postSlug, author, title, body, status, created_at AS createdAt";

export const CREATE_COMMENT_SQL: string = "INSERT INTO comment (id, post_slug, author, title, body) VALUES (?, ?, ?, ?, ?)";

export const GET_COMMENT_SQL: string = `SELECT ${COMMENT_COLUMNS} FROM comment WHERE id = ?`;

// Public projection: no status or slug, and only approved rows. Served by the idx_comment_post_slug_status index.
export const LIST_APPROVED_COMMENTS_SQL: string = "SELECT id, author, title, body, created_at AS createdAt FROM comment WHERE post_slug = ? AND status = 'approved' ORDER BY created_at DESC LIMIT 100";

export const UPDATE_COMMENT_STATUS_SQL: string = `UPDATE comment SET status = ? WHERE id = ? RETURNING ${COMMENT_COLUMNS}`;

// Only moves a comment out of 'pending', so a queue redelivery never overrides an admin's decision.
export const MODERATE_PENDING_COMMENT_SQL: string = "UPDATE comment SET status = ? WHERE id = ? AND status = 'pending'";
