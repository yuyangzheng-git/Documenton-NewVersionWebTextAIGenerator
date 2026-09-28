/**
 * Pure cache-key builder for the outline route.
 *
 * The key embeds the run mode (mock vs live) and the workflow version so
 * that mock output can never be returned for live requests (and cache
 * entries are invalidated when the workflow changes).
 */

export interface OutlineCacheKeyParts {
  topic: string;
  style: string;
  mode: 'mock' | 'live';
  workflowVersion?: string;
}

export function buildOutlineCacheKey(parts: OutlineCacheKeyParts): string {
  const version = parts.workflowVersion ?? 'v1';
  return `outline:${parts.mode}:${version}:${parts.topic}:${parts.style}`;
}
