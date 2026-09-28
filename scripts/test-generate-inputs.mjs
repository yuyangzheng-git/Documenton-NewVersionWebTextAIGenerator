/**
 * Unit test for the generate-route input mapping.
 *
 * Verifies that all four request fields (sectionTitle, documentTopic,
 * fullOutline, requirements) are forwarded to the Dify workflow inputs, and
 * that different tasks produce different workflow inputs (regression: the
 * route previously sent only `requirements`).
 *
 * Run: node scripts/test-generate-inputs.mjs
 */
import assert from 'node:assert/strict';
import { buildDifyInputs } from '../lib/ai/generate-inputs.ts';

const taskA = buildDifyInputs({
  sectionTitle: 'Medical AI Applications',
  documentTopic: 'AI in Healthcare',
  fullOutline: '1. Introduction\n2. Applications',
  requirements: 'Keep it under 500 words',
});

assert.deepEqual(taskA, {
  sectionTitle: 'Medical AI Applications',
  documentTopic: 'AI in Healthcare',
  fullOutline: '1. Introduction\n2. Applications',
  requirements: 'Keep it under 500 words',
}, 'all four fields must be forwarded to the workflow');

const taskB = buildDifyInputs({
  sectionTitle: 'Remote Work Policy',
  documentTopic: 'Team Handbook',
  fullOutline: '1. Scope\n2. Eligibility',
  requirements: '',
});

assert.notDeepEqual(taskA, taskB, 'different tasks must send different inputs');
assert.notEqual(taskA.sectionTitle, taskB.sectionTitle);
assert.notEqual(taskA.fullOutline, taskB.fullOutline);

const minimal = buildDifyInputs({ sectionTitle: 'Only Title' });
assert.equal(minimal.documentTopic, '');
assert.equal(minimal.fullOutline, '');
assert.equal(minimal.requirements, '');
assert.equal(minimal.sectionTitle, 'Only Title');

console.log('OK: generate input mapping sends topic/title/outline/requirements');
