import { describe, expect, it } from 'vitest';
import { API_REWRITE_SOURCE } from '../../next.config.mjs';

const pattern = new RegExp(`^${API_REWRITE_SOURCE.replace('/api/:path', '/api/')}$`);

describe('API rewrite', () => {
  it('sends public endpoints straight to the backend', () => {
    for (const path of ['/api/gold', '/api/analyze-text', '/api/project/quality', '/api/administrator']) {
      expect(pattern.test(path)).toBe(true);
    }
  });

  it('leaves the admin API to the route handler that holds the secret', () => {
    // Rewrites run before dynamic routes: matching these would bypass the proxy and its allowlist
    for (const path of ['/api/admin', '/api/admin/lineage', '/api/admin/runs/abc123']) {
      expect(pattern.test(path)).toBe(false);
    }
  });
});
