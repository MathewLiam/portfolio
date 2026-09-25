import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeSlug from "rehype-slug";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeStringify from "rehype-stringify";

const POSTS_DIR = path.join(process.cwd(), "content", "posts");

export type PostMeta = {
  slug: string;
  title: string;
  /** ISO date, YYYY-MM-DD */
  date: string;
  description?: string;
  tags: string[];
  draft: boolean;
  readingMinutes: number;
};

export type Post = PostMeta & { html: string };

type RawPost = { meta: PostMeta; body: string };

// Drafts show up in `npm run dev` but are left out of production builds.
const includeDrafts = process.env.NODE_ENV !== "production";

function toIsoDate(value: unknown, file: string): string {
  // YAML parses unquoted dates (2026-09-25) into Date objects at UTC midnight.
  const date = value instanceof Date ? value : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new Error(`${file}: front matter "date" is missing or invalid (use YYYY-MM-DD).`);
  }
  return date.toISOString().slice(0, 10);
}

function readPost(file: string): RawPost {
  const source = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
  const { data, content } = matter(source);

  if (typeof data.title !== "string" || !data.title.trim()) {
    throw new Error(`${file}: front matter "title" is required.`);
  }

  const words = content.trim().split(/\s+/).filter(Boolean).length;

  return {
    meta: {
      slug: file.replace(/\.md$/, ""),
      title: data.title,
      date: toIsoDate(data.date, file),
      description: typeof data.description === "string" ? data.description : undefined,
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
      draft: data.draft === true,
      readingMinutes: Math.max(1, Math.round(words / 200)),
    },
    body: content,
  };
}

function readAllPosts(): RawPost[] {
  if (!fs.existsSync(POSTS_DIR)) return [];

  return fs
    .readdirSync(POSTS_DIR)
    .filter((file) => file.endsWith(".md"))
    .map(readPost)
    .filter((post) => includeDrafts || !post.meta.draft)
    .sort((a, b) => b.meta.date.localeCompare(a.meta.date));
}

/** All published posts, newest first. */
export function getAllPosts(): PostMeta[] {
  return readAllPosts().map((post) => post.meta);
}

export async function getPost(slug: string): Promise<Post | undefined> {
  const post = readAllPosts().find((p) => p.meta.slug === slug);
  if (!post) return undefined;

  const html = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype)
    .use(rehypeSlug)
    .use(rehypePrettyCode, {
      theme: { light: "github-light", dark: "github-dark" },
      keepBackground: false,
    })
    .use(rehypeStringify)
    .process(post.body);

  return { ...post.meta, html: String(html) };
}

export function formatDate(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00Z`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
