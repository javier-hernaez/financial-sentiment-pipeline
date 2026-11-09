/**
 * What the browser may reach through the admin proxy. The proxy adds the API secret on behalf of anonymous
 * visitors, so everything listed here is effectively public: only the read-only views and the actions the
 * demo itself offers. Anything else in the admin API keeps requiring the secret.
 */
const READS = new Set(['metrics', 'diagnostics', 'lineage', 'runs', 'table-data', 'bronze-tree']);
const ACTIONS = new Set(['run-stage', 'warehouse-ops']);
const RUN_ID = /^[0-9a-f]{6,32}$/;

export function isAllowedAdminPath(method: 'GET' | 'POST', segments: string[]): boolean {
  if (method === 'POST') return segments.length === 1 && ACTIONS.has(segments[0]);
  if (segments.length === 1) return READS.has(segments[0]);
  return segments.length === 2 && segments[0] === 'runs' && RUN_ID.test(segments[1]);
}
