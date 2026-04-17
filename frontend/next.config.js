/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  generateBuildId: async () => `build-${Date.now()}`,
  headers: async () => [
    {
      source: "/((?!_next/static|_next/image|logo|favicon).*)",
      headers: [
        { key: "Cache-Control", value: "no-cache, must-revalidate" },
      ],
    },
  ],
};

module.exports = nextConfig;
