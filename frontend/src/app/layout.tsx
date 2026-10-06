import type { Metadata } from "next";
import Link from "next/link";
import { Inter } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: site.title,
    template: `%s | ${site.title}`,
  },
  description: site.description,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} flex min-h-screen flex-col`}>
        <header className="border-b border-zinc-200 dark:border-zinc-800">
          <nav className="mx-auto flex max-w-2xl items-center justify-between px-4 py-5">
            <Link href="/" className="font-semibold tracking-tight hover:text-sky-600 dark:hover:text-sky-400">
              {site.title}
            </Link>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">{children}</main>
        <footer className="border-t border-zinc-200 dark:border-zinc-800">
          <div className="mx-auto flex max-w-2xl flex-wrap items-center justify-between gap-2 px-4 py-6 text-sm text-zinc-500">
            <p>
              © {new Date().getFullYear()} {site.author}
            </p>
            <a
              href={site.buyMeACoffeeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-sky-600 dark:hover:text-sky-400"
            >
              ☕ Buy me a coffee
            </a>
          </div>
        </footer>
      </body>
    </html>
  );
}
