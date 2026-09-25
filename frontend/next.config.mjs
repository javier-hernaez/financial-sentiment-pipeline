const backendHost = process.env.INTERNAL_API_HOST || "127.0.0.1";
const backendPort = process.env.INTERNAL_API_PORT || "8080";

const nextConfig = {
  reactStrictMode: true,
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
