/**
 * Unit test for the outline cache-key namespace isolation.
 *
 * Regression: mock and live modes previously shared one cache key, so a mock
 * outline could be returned for a real request (and vice versa) without any
 * `mock`/`cached` marker distinguishing them.
 *
 * Run: node scripts/test-outline-cache-key.mjs
 */
import assert from 'node:assert/strict';
import { buildOutlineCacheKey } from '../lib/ai/outline-cache-key.ts';

const parts = { topic: 'AI in Healthcare', style: '专业严肃' };

const mockKey = buildOutlineCacheKey({ ...parts, mode: 'mock' });
const liveKey = buildOutlineCacheKey({ ...parts, mode: 'live' });

assert.notEqual(mockKey, liveKey, 'mock and live must use different cache namespaces');
assert.ok(mockKey.startsWith('outline:mock:v1:'), mockKey);
assert.ok(liveKey.startsWith('outline:live:v1:'), liveKey);

const v2Key = buildOutlineCacheKey({ ...parts, mode: 'live', workflowVersion: 'v2' });
assert.notEqual(v2Key, liveKey, 'workflow version must change the key');

const sameMock = buildOutlineCacheKey({ ...parts, mode: 'mock' });
assert.equal(sameMock, mockKey, 'same inputs + mode => same key (cache hit path)');

console.log('OK: outline cache keys are isolated by mode and workflow version');
