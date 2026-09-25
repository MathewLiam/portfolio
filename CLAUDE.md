# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Personal portfolio website (package name `portfolio`). It's still close to the stock `create-next-app` scaffold: `src/app/page.tsx` and the metadata in `src/app/layout.tsx` are the template placeholders.

## Stack

- Next.js 14.2 using the **App Router** (`src/app/`), React 18, TypeScript (strict)
- Tailwind CSS 3. Global styles and CSS variables are in `src/app/globals.css`. `tailwind.config.ts` only scans `src/pages`, `src/components` and `src/app`, so a new top-level source directory has to be added to `content` there, or its classes will be purged.
- Fonts load through `next/font/google` (Inter) in the root layout.
- Path alias: `@/*` → `./src/*`
- ESLint: `next/core-web-vitals`

## Commands

```bash
npm run dev      # dev server at http://localhost:3000
npm run build    # static export to ./out (the same step CI runs)
npm run lint     # next lint
npm run preview  # build, then serve ./out locally with wrangler pages dev
npm run deploy   # build, then deploy ./out to Cloudflare Pages (needs wrangler login or CLOUDFLARE_* env vars)
```

The project has no test framework and no test script.

## Hosting: Cloudflare Pages (static export)

`next.config.mjs` sets `output: "export"`, and `wrangler.toml` points Pages at `./out` (project name `mm-website`). The whole site is static HTML/JS, and **nothing runs on the server**. That means no API routes, server actions, middleware, ISR, dynamic routes without `generateStaticParams`, or `cookies()`/`headers()`. `next build` fails if any of these are used. `next/image` works only because `images.unoptimized` is set. Adding server features would mean moving to the OpenNext Cloudflare adapter (Workers) instead.

## Infrastructure

`infra/` is Terraform (Cloudflare provider v5) that creates the Pages project as a direct-upload project, with no Git integration. It can also attach an optional custom domain and its proxied CNAME. Terraform only creates the project; deployments are done by Wrangler. `project_name` in `infra/variables.tf` must match `name` in `wrangler.toml`. `.terraform.lock.hcl` is locked for windows/linux/darwin; if you change the provider version, re-lock with `terraform providers lock -platform=...` for all of them.

## CI / Deployment

`azure-pipelines.yml` runs on pushes and PRs to `master`. With Node 22, it runs `npm ci`, lint, build, then `wrangler pages deploy`. Pushes to `master` go to production; any other branch or PR gets a Pages preview deployment named after its source branch. The pipeline needs the `CLOUDFLARE_API_TOKEN` (secret) and `CLOUDFLARE_ACCOUNT_ID` pipeline variables. The `out/` directory is also published as the `site` build artifact.
