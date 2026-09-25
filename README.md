# Developer blog

A static developer blog built with [Next.js](https://nextjs.org/) and deployed to Cloudflare Pages.

## Writing a post

Add a Markdown file to `content/posts/`. The file name is the URL slug: `my-post.md` is served at `/posts/my-post`.

```markdown
---
title: My post                  # required
date: 2026-09-25                # required, YYYY-MM-DD
description: One-line summary shown on the homepage.
tags: [dotnet, azure]
draft: true                     # optional: shown in `npm run dev`, left out of builds
---

Post content in GitHub-flavoured Markdown. Fenced code blocks are syntax highlighted.
```

Posts are rendered at build time, so a new post goes live when the site is next deployed (push to `master`). See `content/posts/hello-world.md` for an example.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Deploying to Cloudflare Pages

The site builds as a static export to `out/` and is deployed with Wrangler (config in `wrangler.toml`).

One-time setup: create the Pages project with Terraform (`infra/`):

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # set account_id (and optionally custom_domain/zone_id)
export CLOUDFLARE_API_TOKEN=...                # token with Pages: Edit (+ DNS: Edit for a custom domain)
terraform init
terraform apply
```

Terraform state is stored locally in `infra/` by default. Keep it safe, or configure a remote backend in `infra/versions.tf`.

Then deploy with `npm run deploy`, or preview locally with `npm run preview`.

CI (`azure-pipelines.yml`) deploys automatically: `master` goes to production, and other branches and PRs get preview deployments. Add these pipeline variables in Azure DevOps:

- `CLOUDFLARE_API_TOKEN`: secret; an API token with the **Cloudflare Pages: Edit** permission
- `CLOUDFLARE_ACCOUNT_ID`: your Cloudflare account ID

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!
