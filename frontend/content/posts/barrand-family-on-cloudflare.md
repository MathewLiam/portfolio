---
title: Rebuilding a family history site for £0 a month
date: 2026-10-06
description: How I moved the Barrand family history off a £25-a-month VPS and Umbraco, turned a 600MB Word manuscript into Markdown, and built a reusable family tree component along the way.
tags: [cloudflare, react, vite, markdown, side-project]
draft: false
---

For years the Barrand family history lived on a small Umbraco site. It did its job, but it cost **£20 a month for an unmanaged VPS at 20i, plus £5 a month for the database**. That's £300 a year to serve a family tree and a book that hardly ever changes. Being unmanaged, the server's patching and upkeep were also left to me.

The new site costs **£0 a month** to host. It runs on Cloudflare Workers, the book is Markdown in a Git repository, and the interactive tree is a React component I published as its own package. This post covers how each piece works and what I learned along the way.

## Where the money went

|                    | Legacy                          | New                                   |
| ------------------ | ------------------------------- | ------------------------------------- |
| Hosting            | 20i unmanaged VPS: £20/month    | Cloudflare Workers (free plan): £0    |
| Database           | Umbraco DB hosting: £5/month    | None. Content is files in Git: £0     |
| Content editing    | Umbraco back office             | Markdown files + pull requests        |
| Deployments        | Pushed to the server            | GitHub Actions on every push to `master` |
| Server maintenance | OS, runtime and Umbraco upgrades | Nothing to patch                     |
| **Total**          | **£25/month (£300/year)**       | **£0**                                |

A CMS made sense when I expected lots of editing. In practice the content is a finished book and a family tree that gets an occasional correction. For content like that, a database and an admin UI are cost and attack surface with little in return. A text file and `git commit` do the job.

## The stack

- **[vinext](https://github.com/cloudflare/vinext)**: a Vite-based implementation of the Next.js App Router API that builds to a Cloudflare Worker. I write the familiar `app/` directory, with `generateStaticParams`, `generateMetadata` and `params` as a Promise, and Vite does the bundling.
- **Cloudflare Workers with static assets**: the Worker renders pages, and everything in `dist/client` (JS, CSS, fonts and about 1,500 scanned images) is served as static assets.
- **Tailwind CSS 4**, with `Cormorant Garamond` and `Source Serif 4` for a "printed book" look.
- **`@mathewliam/family-tree`**: my own React component for the tree (more on that below).
- **Terraform** for the Worker and its custom domain, and **GitHub Actions** for build and deploy.

The Wrangler config is very small. There's no database, no KV and no R2, only the assets directory and an Images binding:

```jsonc
{
  "name": "barrand-family",
  "compatibility_date": "2026-10-03",
  "main": "vinext/server/fetch-handler",
  "assets": {
    "directory": "dist/client",
    "not_found_handling": "none",
    "binding": "ASSETS"
  },
  "images": { "binding": "IMAGES" },
  "observability": { "enabled": true }
}
```

## Digitising the book: 600MB of Word to Markdown

The hardest part wasn't the website. It was the book. The family history existed as a pair of **Word documents totalling around 600MB**, full of scanned parish records, census returns, photographs and hand-built family tree diagrams. Files that size are slow to open, awkward to share, and impossible to diff.

The goal was to turn them into plain Markdown chapters that could be read, searched, version-controlled and compiled into web pages.

### Step 1: Word to HTML

Both halves went to HTML first, but not in the same way. Part 1 was exported straight from Word with every image embedded as a `data:` URI. Part 2 went through [mammoth](https://github.com/mwilliamson/mammoth.js) with `--output-dir`, which writes the images out as separate files. The import script handles both.

### Step 2: a plan file per part

Word's HTML can't be trusted to mark chapters. The source used heading tags for ordinary body text, so headings were useless as markers. Instead, each part has a small JSON "plan" that names each chapter and the opening words of its first paragraph:

```json
{
  "part": 1,
  "source": "D:/Barrand family tree/barraud-part-1.html",
  "chapters": [
    { "slug": "the-barrands", "title": "The Barrands", "start": "The Barrands" },
    { "slug": "isabelle-of-angouleme", "title": "Isabelle of Angoulême and the Huguenots", "start": "The story of Isabelle" },
    { "slug": "philip-barraud", "title": "Philip Barraud in London", "start": "Now, Back to Phillip Barraud" }
  ]
}
```

The script searches forward for each `start` from where the previous chapter began. If a start can't be found, it stops loudly rather than guessing. Giving the chapter titles by hand also let me tidy them up: "6. JOHN BARRAND" in the manuscript becomes "John Barrand (1791–1871)" on the site.

### Step 3: HTML to Markdown with BeautifulSoup

`scripts/import-book.py` walks the HTML blocks for each chapter and writes `book/<slug>.md`. Most of the work went into Word's quirks:

- **Section headings are inferred**, not read. A short paragraph that is entirely bold, has no digits and is in capitals (like `FRANCES`) becomes a `## Frances` heading.
- **Bold and italic runs** that touch punctuation (`Moor's-yard***.`) won't parse as Markdown emphasis, so those fall back to `<strong>`/`<em>` tags.
- **Word field codes** leak into links (`http://x" \o "Tooltip`) and get trimmed off.
- **Empty footnote brackets** (`<sup>[</sup><a></a><sup>]</sup>`) are dropped.
- **Numbered paragraphs** become plain paragraphs, because Word's numbering wasn't continuous across lists anyway.
- **Body text that starts with `1.` or `-`** is escaped so it doesn't turn into a list by accident.
- **Captions**: most images are captioned by the short paragraph next to them, so that text becomes the image's alt text.
- **Tables** used for the hand-drawn family tree diagrams stay as HTML tables, because Markdown tables can't do `rowspan`/`colspan`.

### Step 4: images, deduplicated and resized

Images were where most of the 600MB lived. Each one is hashed (SHA-1, first 12 characters) so a scan reused across chapters is only stored once. Anything wider than 1,400px is resized. Line art stays PNG if it comes in under 350KB, and everything else becomes a progressive JPEG at quality 80. Old Windows metafiles (EMF/WMF) are rasterised at 144 DPI, which only works on Windows, as Pillow uses the OS to render them.

The result: **45 chapters totalling 1.7MB of Markdown**, plus **1,526 unique images (about 231MB)** in `public/images/book/`. Every chapter can now be diffed in a pull request, and the whole book can be searched with `grep`.

A chapter now looks like this:

```markdown
---
title: "Alfred Barrand (1833–1854)"
part: 2
order: 9
---

**Alfred**, the 10<sup>th</sup> and last child of John Barrand and Nancy Ann Routeledge
was born in 1833, and baptised on the 20<sup>th</sup> October, 1833 in St. Giles, London.
```

## Compiling the book at build time

I didn't want to ship a Markdown parser to the browser, or run one on every request. So a small Vite plugin turns each `.md` import into a ready-rendered chapter at build time:

```ts
export function bookMarkdown(): Plugin {
  return {
    name: "book-markdown",
    enforce: "pre",
    transform(source, id) {
      if (!id.endsWith(".md")) return null;
      const { data, body } = parseFrontMatter(source);
      const chapter = {
        slug: path.basename(id, ".md"),
        title: data.title ?? path.basename(id, ".md"),
        part: Number(data.part ?? 1),
        order: Number(data.order ?? 0),
        html: marked.parse(body, { async: false }),
      };
      return { code: `export default ${JSON.stringify(chapter)};`, map: null };
    },
  };
}
```

The `marked` renderer is overridden so every image gets `loading="lazy"` and `decoding="async"`. Some chapters carry dozens of scanned records, so lazy loading matters.

On the app side, `import.meta.glob` pulls in every chapter at once, sorted by part and then order:

```ts
const modules = import.meta.glob<Chapter>("/book/*.md", { eager: true, import: "default" });

export const chapters: Chapter[] = Object.values(modules).sort(
  (a, b) => a.part - b.part || a.order - b.order,
);
```

The chapter route uses `generateStaticParams` over that list, so every chapter is known at build time. Previous/next links and a chapter picker come from the same sorted array. Adding a chapter means dropping a Markdown file in `book/` and nothing else.

## The family tree component

The old site's tree was the part I least wanted to carry over, so I rebuilt it from scratch as a standalone library: **[`@mathewliam/family-tree`](https://github.com/MathewLiam/family-tree)**. I deliberately used no graphing library. It's React, a layout algorithm written in plain TypeScript, and CSS.

### Data model

The data model follows GEDCOM. There are people, and there are families, where a family is one or two partners plus their children. Someone with several partners has one family per partnership.

```ts
const people: Person[] = [
  { id: "margaret", name: "Margaret Barrand", dateOfBirth: "1920-03-12", dateOfDeath: "c. 1999" },
  { id: "arthur", name: "Arthur Barrand", dateOfBirth: "1918-07-02" },
  { id: "june", name: "June Barrand", dateOfBirth: new Date(1946, 5, 1) },
];

const families: Family[] = [{ id: "f1", partnerIds: ["margaret", "arthur"], childIds: ["june"] }];
```

Dates were important to get right for genealogy. An ISO string or `Date` is formatted for the reader's locale, but anything else, such as `"bap. 13/04/1733"`, `"c 1753"` or `"1830-1840"`, **is shown exactly as written**. Eighteenth-century records are full of baptisms, burials and approximations, and I didn't want the component to invent precision the sources don't have.

### Layout

`layoutFamilyTree()` is a pure function with no React, so it can be used on its own. It works in two passes:

1. **Measure.** Starting from the root, it builds a "unit" for each descendant: the person, the partners shown beside them, and their children's subtrees. Each unit's width is the wider of its own row of partners or its children's combined widths.
2. **Place.** It walks the units again, giving each subtree its own column. Because every column is as wide as its widest generation, **subtrees never overlap**.

Some details that took a few attempts:

- With one partner, the partner sits to the right. With several, the first sits to the left and the rest to the right, and the families are sorted by where their children hang from, so the lines don't cross.
- When one person has children in more than one family, each family's horizontal "bus" line is offset by a few pixels so they stay readable.
- Anyone reachable twice, for example through cousin marriage, is drawn once.

### Interaction

The `FamilyTree` component adds drag-to-pan, wheel-to-zoom around the pointer, zoom and fit buttons, and keyboard controls (arrow keys pan, `+`/`-` zoom, `0` fits). There's a 4px drag threshold so a click on a person isn't mistaken for a pan. `focusSelected` pans to the selected person when the selection changes from outside the tree, which is how the site's search box works.

### Theming with CSS custom properties

The library makes no assumptions about the host site's design. Everything visual is a `--ft-*` custom property, so the Barrand site maps it onto its own parchment and gold palette:

```tsx
<div
  style={{
    "--ft-tree-height": "min(70vh, 40rem)",
    "--ft-tree-bg": "var(--color-parchment)",
    "--ft-node-font": "var(--font-serif)",
    "--ft-node-accent": "var(--color-gold)",
    "--ft-connector-color": "var(--color-gold-soft)",
  } as React.CSSProperties}
>
  <FamilyTree
    people={people}
    families={families}
    rootId={rootId}
    selectedId={selectedId}
    onSelect={(p) => setSelectedId(p.id)}
    focusSelected
    aria-label="Barrand family tree"
  />
</div>
```

On the Barrand site the tree holds **253 people in 86 families**. The data was rebuilt from the hand-drawn "Barrands London" spreadsheet and stored as a JSON file next to the page. A side panel lists the selected person's parents, partners, children and siblings, and each name is a link that moves the tree to that person.

### Publishing

The package builds with webpack and Babel into ESM, CommonJS, a CSS file and `.d.ts` types. Storybook serves as the development playground. Creating a GitHub release with a tag like `v1.2.0` publishes that version to GitHub Packages, and pre-releases go out under the `next` tag. Consumers need an `.npmrc` that points the `@mathewliam` scope at `npm.pkg.github.com`:

```
@mathewliam:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GH_PACKAGES_TOKEN}
```

Then it's an ordinary `npm install @mathewliam/family-tree`.

## Infrastructure and deployment

Terraform (Cloudflare provider v5) owns the Worker itself, its observability setting, the `workers.dev` subdomain and an optional custom domain. It doesn't upload code. That's left to `vinext-cloudflare deploy`, which adds new versions to the Worker by name. With that split, Terraform describes what exists and the pipeline ships what runs.

The GitHub Actions workflow has two jobs:

1. **Build** on every push and pull request: `npm ci`, a `tsc --noEmit` type check, `npm run build`, then upload `dist/` as an artifact. The workflow's own `GITHUB_TOKEN` with `packages: read` is enough to install the family tree package.
2. **Deploy** on pushes to `master` only: download the exact artifact that was built and run `npm run deploy -- --skip-build`, so what was tested is what goes live.

Concurrency is set so a newer push waits for an in-flight deploy instead of cancelling it mid-upload.

## Why it's free, and what to watch

Cloudflare's free Workers plan covers this site comfortably. Requests for static assets (JS, CSS, fonts and the book's images) don't count against the Worker request allowance at all. Only page renders invoke the Worker, and a family history site gets nowhere near the daily free limit. There's no database to pay for because there's no database.

Some caveats if you're thinking of doing the same:

- **Asset limits.** Workers static assets have per-file and file-count limits. Resizing and deduplicating the scans kept every file small and the total count around 1,500, well inside them.
- **Image transformations.** The Images binding is metered separately. Because the import script already resizes everything to sensible web sizes, the site mostly serves the files as they are.
- **No CMS.** Content changes go through Git. That's fine for me. If a non-technical relative needed to edit pages, I'd look at a Git-backed CMS before going back to a database.

## Wrapping up

Moving off the VPS saved £300 a year, but I value the other changes more. There's no server to patch, deploys are automatic, and a 600MB pair of Word documents is now a searchable, diffable book. The family tree is now a reusable component instead of code locked inside one CMS.

If you're running a small, mostly static site on a VPS out of habit, it's worth checking how much of that stack you still need.
