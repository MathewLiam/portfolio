import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-3xl font-bold tracking-tight">Page not found</h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">That page doesn&apos;t exist.</p>
      <Link href="/" className="mt-6 inline-block text-sky-600 hover:underline dark:text-sky-400">
        ← Back to articles
      </Link>
    </div>
  );
}
