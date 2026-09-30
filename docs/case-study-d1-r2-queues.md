# Case study: comments with attachments on D1, R2 & Queues

## Context

The blog is a fully static Next.js 16 export deployed to Cloudflare Pages — "nothing runs on the server" is a deliberate, documented constraint (see `CLAUDE.md`). This document plans a case-study feature that exercises Cloudflare D1, R2, and Queues together, built on top of this project, without disturbing that constraint.

Rather than rewriting the blog's hosting model (migrating to OpenNext/Workers), we're adding a **separate, independently-deployed Cloudflare Worker** that owns all three services. The static blog is untouched architecturally — it just gains one client-side widget that talks to the new Worker's API. This keeps the blog cheap/simple as CLAUDE.md intends, and mirrors a pattern Cloudflare itself recommends (static frontend + Workers API).

**The feature:** post comments, with an optional single image attachment, moderated asynchronously.

- **D1** — relational store for comments (`post_slug`, `author_name`, `body`, `status`, `image_key`, `created_at`). Natural fit: structured rows, queried by post slug, filtered by status.
- **R2** — object storage for attached comment images (binary, too large for D1/KV).
- **Queues** — decouples the comment POST (must be fast) from slow work: a naive spam check and flipping the row from `pending` to `approved`/`rejected`. Demonstrates async fan-out from a write path, plus Queues' built-in retry/dead-letter behavior.

No third-party services (no email/SMTP) — moderation results are readable via an admin-only endpoint on the same Worker, keeping the whole case study inside Cloudflare's own stack so it can actually be deployed without extra signups.

## New directory: `worker/`

A standalone TypeScript Worker project, sibling to the Next app, with its own `package.json` and `wrangler.toml` (own `compatibility_date`, own deploy — never touches Pages).

```
worker/
  package.json          # deps: hono (routing), typescript, wrangler, @cloudflare/workers-types
  tsconfig.json
  wrangler.toml          # name = "mm-comments-api"; d1/r2/queue bindings; queue consumer config
  migrations/
    0001_init.sql         # comments table
  src/
    index.ts              # fetch handler (Hono app) — exported default
    queue.ts               # queue consumer — exported as `queue` handler in the same worker
    db.ts                  # typed helpers over the D1 binding (prepared statements)
    moderation.ts          # naive spam heuristic (link count, blocklist)
    types.ts
```

**`wrangler.toml` (worker/)** — bindings:

```toml
name = "mm-comments-api"
main = "src/index.ts"
compatibility_date = "2026-09-25"

[[d1_databases]]
binding = "DB"
database_name = "mm-comments"
database_id = "<set after `wrangler d1 create`>"

[[r2_buckets]]
binding = "COMMENT_IMAGES"
bucket_name = "mm-comment-images"

[[queues.producers]]
binding = "MODERATION_QUEUE"
queue = "mm-comment-moderation"

[[queues.consumers]]
queue = "mm-comment-moderation"
max_batch_size = 10
max_batch_timeout = 5
max_retries = 3
dead_letter_queue = "mm-comment-moderation-dlq"
```

### D1 schema (`migrations/0001_init.sql`)

```sql
CREATE TABLE comments (
  id TEXT PRIMARY KEY,
  post_slug TEXT NOT NULL,
  author_name TEXT NOT NULL,
  body TEXT NOT NULL,
  image_key TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending | approved | rejected
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_comments_post_slug ON comments (post_slug, status, created_at);
```

Applied via `wrangler d1 migrations apply mm-comments --remote` (and `--local` for dev).

### API (Hono app in `src/index.ts`)

- `GET /api/posts/:slug/comments` — approved comments for a slug, newest first. Public, no auth.
- `POST /api/posts/:slug/comments` — multipart form (`author_name`, `body`, optional `image` file). Validates size/type (e.g. ≤2MB, `image/*`), writes the image to R2 (`COMMENT_IMAGES.put`) if present, inserts a `pending` row into D1, enqueues `{ commentId }` onto `MODERATION_QUEUE`, returns 202. Basic per-IP rate limiting via a short-lived counter to keep the demo from being trivially spammable — kept simple, not production hardened.
- `GET /api/admin/comments?status=pending` — lists comments needing review. Protected by a shared-secret header (`X-Admin-Token` checked against an env secret) — simplest possible auth for a case study, documented as not production-grade.
- `POST /api/admin/comments/:id/:action(approve|reject)` — manual override, same auth.
- CORS: allow the Pages origin only (env var `ALLOWED_ORIGIN`).

### Queue consumer (`src/queue.ts`)

For each message `{ commentId }`:

1. Load the comment row from D1.
2. Run `moderation.ts`'s heuristic (reject if body has >2 URLs, hits a blocklist word, or is empty after trim).
3. Update `status` to `approved` or `rejected` in D1.
4. Malformed/failing messages are retried per `max_retries`, then land in the configured dead-letter queue — demonstrates Queues' reliability story without needing external infra.

## Next.js frontend integration

One new file, `src/components/comments.tsx` (client component, `"use client"`), rendered from `src/app/posts/[slug]/page.tsx` below the existing `<footer>`. It:

- Fetches `GET {NEXT_PUBLIC_COMMENTS_API_URL}/api/posts/{slug}/comments` on mount, renders the list.
- Renders a small form (name, body, optional file input) that POSTs `multipart/form-data` to the same base URL, shows a "submitted — awaiting review" state on success.

`NEXT_PUBLIC_COMMENTS_API_URL` is a build-time env var (documented in the README), defaulting to the deployed Worker's `*.workers.dev` URL or a custom route. Because this is a plain client-side `fetch` in a client component, it requires **no changes** to `next.config.mjs` / `output: "export"` — the static HTML ships as-is and the widget activates in the browser, consistent with how CLAUDE.md describes the site's constraints.

## Infra (Terraform, `infra/`)

Add three new resources alongside the existing `cloudflare_pages_project` (same pattern — Terraform provisions the resource shells, Wrangler/CI does code + schema deploy, exactly like Pages does today):

- `cloudflare_d1_database.comments` (name `mm-comments`)
- `cloudflare_r2_bucket.comment_images` (name `mm-comment-images`)
- `cloudflare_queue.moderation` + `cloudflare_queue.moderation_dlq`

New outputs for the D1 `database_id` and bucket/queue names so they can be copied into `worker/wrangler.toml` (mirroring how `wrangler.toml`'s `name` already has to match `infra/variables.tf`'s `project_name` per the existing convention). Exact Terraform provider v5 argument names will be verified against the provider's generated docs at implementation time (the provider is generated from Cloudflare's OpenAPI spec, so attribute names are authoritative there, not from memory).

## CI (`azure-pipelines.yml`)

Add a second stage/job (after the existing Pages deploy steps) that:

1. `npm ci` inside `worker/`
2. `npx wrangler d1 migrations apply mm-comments --remote` (idempotent)
3. `npx wrangler deploy` (worker)

Runs on the same trigger (`master` → deploy; PRs → skip worker deploy, since Workers previews aren't part of the existing Pages-preview-per-branch flow — keep it simple and only deploy the worker on `master` pushes).

## What's explicitly out of scope

- No real spam ML/service — heuristic only, clearly commented as a demo.
- No email notifications — admin endpoint instead, to avoid new third-party dependencies/secrets.
- No migration of the blog itself off static export.
- No auth system beyond a shared-secret admin header.

## Verification

1. `cd worker && npm install && npx wrangler dev` — exercise the API against local D1/R2/Queue emulation (`wrangler dev` supports local Queues since Wrangler 3.x+).
2. `curl -X POST http://localhost:8787/api/posts/some-post/comments -F author_name=test -F body="hello"` → expect `202`, row appears via `wrangler d1 execute mm-comments --local --command "select * from comments"` as `pending`, then flips to `approved`/`rejected` after the local queue consumer runs.
3. Attach an image via `-F image=@test.png`, confirm it lands in the local R2 bucket (`wrangler r2 object get` or `wrangler dev` R2 emulation listing) and `image_key` is set on the row.
4. `GET /api/posts/some-post/comments` only returns `approved` rows.
5. `npm run dev` in the Next app with `NEXT_PUBLIC_COMMENTS_API_URL=http://localhost:8787` pointed at the running `wrangler dev`; open a post page in a browser, submit a comment, confirm it appears after moderation runs (may need a manual refresh since there's no polling/websocket — acceptable for a demo).
6. `npm run build` in the Next app still succeeds (static export unaffected) and `npm run lint` passes for both projects.
7. Terraform: `terraform plan` in `infra/` to confirm the new resources are valid against the actual provider schema before `apply` (apply only with explicit user go-ahead, since it touches real Cloudflare account resources).
