/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  /**
   * SERVER BUILD — this was `output: "export"` (a static site).
   *
   * It cannot be any more. The Superadmin portal needs a real login,
   * orders need to be stored somewhere a customer cannot edit, and a
   * payment can only be trusted if its signature is verified away from
   * the browser. None of that exists in a static export.
   *
   * DEPLOYMENT CHANGES WITH THIS LINE GONE:
   *   Vercel  — works as-is, it runs Next.js natively. Nothing to do.
   *   Render  — switch the service from "Static Site" to "Web Service"
   *             (build: npm run build, start: npm start).
   * See DEPLOYMENT.md.
   */
  images: { unoptimized: true },
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
