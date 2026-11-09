import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nextEnv from '@next/env';

// Local runs share the repository's .env with the API, so both agree on API_SECRET_KEY.
// In Docker that file does not exist and the variables come from the environment.
nextEnv.loadEnvConfig(path.dirname(path.dirname(fileURLToPath(import.meta.url))));

const backendHost = process.env.INTERNAL_API_HOST || '127.0.0.1';
const backendPort = process.env.INTERNAL_API_PORT || '8080';

export const API_REWRITE_SOURCE = '/api/:path((?!admin(?:/|$)).*)';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  {
    // Hugging Face Spaces shows the app inside an iframe, so framing stays open to it and nobody else
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'self' https://huggingface.co https://*.hf.space; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // The Docker build sets NEXT_STANDALONE=1 to emit a minimal self-contained server (.next/standalone).
  // Local `next start` keeps the default output. Rewrites below are resolved at build time.
  output: process.env.NEXT_STANDALONE === '1' ? 'standalone' : undefined,
  experimental: {
    // Rewrites drop a request after 30 s by default, and the first /api/analyze-text may wait for the model to load
    proxyTimeout: 2 * 60 * 1000,
  },
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
  async rewrites() {
    return [
      {
        // Rewrites run before dynamic routes, so /api/admin must be left out or it would never
        // reach app/api/admin/[...slug]/route.ts, the only place that holds the API secret
        source: API_REWRITE_SOURCE,
        destination: `http://${backendHost}:${backendPort}/api/:path*`,
      },
      // Swagger UI and its schema, so the "API" link works from the same origin
      {
        source: '/docs',
        destination: `http://${backendHost}:${backendPort}/docs`,
      },
      {
        source: '/openapi.json',
        destination: `http://${backendHost}:${backendPort}/openapi.json`,
      },
    ];
  },
};

export default nextConfig;
