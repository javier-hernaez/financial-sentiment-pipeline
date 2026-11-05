const backendHost = process.env.INTERNAL_API_HOST || "127.0.0.1";
const backendPort = process.env.INTERNAL_API_PORT || "8080";

const nextConfig = {
  reactStrictMode: true,
  // The Docker build sets NEXT_STANDALONE=1 to emit a minimal self-contained server (.next/standalone).
  // Local `next start` keeps the default output. Rewrites below are resolved at build time.
  output: process.env.NEXT_STANDALONE === "1" ? "standalone" : undefined,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `http://${backendHost}:${backendPort}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
