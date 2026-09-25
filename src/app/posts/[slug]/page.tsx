import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate, getAllPosts, getPost } from "@/lib/posts";

type Props = { params: { slug: string } };

export function generateStaticParams() {
  return getAllPosts().map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPost(params.slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.description,
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const post = await getPost(params.slug);
  if (!post) notFound();

  return (
    <article>
      <header className="mb-10">
        <p className="text-sm text-zinc-500">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {" · "}
          {post.readingMinutes} min read
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{post.title}</h1>
        {post.description && <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">{post.description}</p>}
      </header>

      <div className="prose prose-zinc max-w-none dark:prose-invert" dangerouslySetInnerHTML={{ __html: post.html }} />

      <footer className="mt-16 border-t border-zinc-200 pt-6 dark:border-zinc-800">
        <Link href="/" className="text-sm text-sky-600 hover:underline dark:text-sky-400">
          ← All articles
        </Link>
      </footer>
    </article>
  );
}
