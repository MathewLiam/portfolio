---
title: Hello, world
date: 2026-09-25
description: The first post on this blog, and a quick tour of how posts are written.
tags: [meta, nextjs]
---

Welcome to the blog. Every post is a Markdown file in `content/posts/`, and the file name becomes the URL, so this file (`hello-world.md`) is served at `/posts/hello-world`.

## Front matter

Each file starts with a YAML block:

```yaml
---
title: Hello, world            # required
date: 2026-09-25               # required, YYYY-MM-DD
description: Shown on the homepage and in link previews.
tags: [meta, nextjs]
draft: true                    # optional: visible in `npm run dev`, excluded from builds
---
```

## Code

Fenced code blocks are syntax highlighted at build time:

```ts
export function greet(name: string): string {
  return `Hello, ${name}!`;
}
```

## Everything else

GitHub-flavoured Markdown works too: **bold**, _italics_, [links](https://nextjs.org), tables and task lists.

| Feature        | Supported |
| -------------- | --------- |
| Tables         | Yes       |
| Task lists     | Yes       |

- [x] Write the first post
- [ ] Write the second one
