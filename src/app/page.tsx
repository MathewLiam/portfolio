import Link from "next/link";
import { formatDate, getAllPosts } from "@/lib/posts";
import { site } from "@/lib/site";

export default function Home() {
  const posts = getAllPosts();

  return (
    <>
      <section className="mb-12">
        <h1 className="text-3xl font-bold tracking-tight hidden">{site.title}</h1>
        <p className="mt-3 text-lg text-zinc-600 dark:text-zinc-400">{site.description}</p>
      </section>

      <section>
        <h2 className="mb-6 text-sm font-semibold uppercase tracking-wider text-zinc-500">Articles</h2>

        {posts.length === 0 ? (
          <p className="text-zinc-500">No posts yet.</p>
        ) : (
          <ul className="space-y-10">
            {posts.map((post) => (
              <li key={post.slug}>
                <article>
                  <p className="text-sm text-zinc-500">
                    <time dateTime={post.date}>{formatDate(post.date)}</time>
                    {" · "}
                    {post.readingMinutes} min read
                    {post.draft && <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">Draft</span>}
                  </p>
                  <h3 className="mt-1 text-xl font-semibold tracking-tight">
                    <Link href={`/posts/${post.slug}`} className="hover:text-sky-600 dark:hover:text-sky-400">
                      {post.title}
                    </Link>
                  </h3>
                  {post.description && <p className="mt-2 text-zinc-600 dark:text-zinc-400">{post.description}</p>}
                  {post.tags.length > 0 && (
                    <ul className="mt-3 flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <li key={tag} className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                          {tag}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
