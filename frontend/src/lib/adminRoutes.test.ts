import { describe, expect, it } from 'vitest';
import { isAllowedAdminPath } from './adminRoutes';

describe('isAllowedAdminPath', () => {
  it('allows the views the demo reads', () => {
    for (const path of ['metrics', 'diagnostics', 'lineage', 'runs', 'table-data', 'bronze-tree']) {
      expect(isAllowedAdminPath('GET', [path])).toBe(true);
    }
    expect(isAllowedAdminPath('GET', ['runs', 'abc123abc123'])).toBe(true);
  });

  it('allows the actions the demo offers', () => {
    expect(isAllowedAdminPath('POST', ['run-stage'])).toBe(true);
    expect(isAllowedAdminPath('POST', ['warehouse-ops'])).toBe(true);
  });

  it('rejects everything else', () => {
    expect(isAllowedAdminPath('GET', [])).toBe(false);
    expect(isAllowedAdminPath('GET', ['secrets'])).toBe(false);
    expect(isAllowedAdminPath('GET', ['run-stage'])).toBe(false);
    expect(isAllowedAdminPath('POST', ['metrics'])).toBe(false);
    expect(isAllowedAdminPath('POST', ['runs', 'abc123abc123'])).toBe(false);
  });

  it('rejects attempts to walk out of the admin API', () => {
    expect(isAllowedAdminPath('GET', ['..', '..', 'docs'])).toBe(false);
    expect(isAllowedAdminPath('GET', ['runs', '..'])).toBe(false);
    expect(isAllowedAdminPath('GET', ['runs', '../../health'])).toBe(false);
    expect(isAllowedAdminPath('GET', ['metrics', 'extra'])).toBe(false);
  });
});
