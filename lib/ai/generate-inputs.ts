/**
 * Pure input mapping for the content-generation route.
 *
 * Extracted from app/api/ai/generate/route.ts so the mapping of user input
 * to the Dify workflow inputs can be unit-tested without spinning up Next.js.
 * All four request fields (sectionTitle, documentTopic, fullOutline,
 * requirements) must reach the workflow — not only `requirements`.
 */

export interface GenerateInputs {
  sectionTitle: string;
  documentTopic?: string;
  fullOutline?: string;
  requirements?: string;
}

export function buildDifyInputs(input: GenerateInputs): Record<string, string> {
  return {
    sectionTitle: input.sectionTitle,
    documentTopic: input.documentTopic ?? '',
    fullOutline: input.fullOutline ?? '',
    requirements: input.requirements ?? '',
  };
}
