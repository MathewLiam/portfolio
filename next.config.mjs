/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export to ./out for Cloudflare Pages (see wrangler.toml).
  output: "export",
  // Pages has no Next.js image optimization server.
  images: { unoptimized: true },
};

export default nextConfig;
