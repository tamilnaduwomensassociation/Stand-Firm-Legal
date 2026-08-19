/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Static export — deploy on Render as a Static Site (publish dir: out)
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
