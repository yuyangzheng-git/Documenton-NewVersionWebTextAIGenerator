# Evaluation: Outline-First vs One-Shot Generation

Two workflows are compared on the same tasks:

- **Outline-first (chapter-by-chapter)**: AI outline → per-chapter streaming generation → DOCX export
- **One-shot**: single generation call for the whole document → DOCX export

## Offline pipeline validation (no API keys, mock provider)

The app has a deterministic mock mode (`MOCK_LLM=1`) that exercises the real
routes (sanitization, SSE streaming, export) without any external LLM:

```bash
# terminal 1
MOCK_LLM=1 npm run dev

# terminal 2
node scripts/eval-compare.mjs
```

Outputs (complete raw outputs are kept):

- `data/eval/outline-first/<task_id>/` — outline.json, chapter_*.json, blocks.json, document.docx
- `data/eval/one-shot/<task_id>/` — generation.json, blocks.json, document.docx
- `data/eval/comparison_summary.json` — per-task timing, block counts, DOCX sizes,
  plus the run mode (`mock` vs `live`) and outline `mock`/`cached` flags

Failure semantics: any task error, SSE `error` event, or stream that ends
without a `done` event fails the run (non-zero exit). Verified by
`scripts/test-eval-compare.mjs`.

The outline cache key embeds the run mode and workflow version
(`outline:<mock|live>:<vN>:<topic>:<style>`, see
`scripts/test-outline-cache-key.mjs`), so mock output is never served to
live requests. The generate route forwards all four fields
(`sectionTitle`, `documentTopic`, `fullOutline`, `requirements`) to the
workflow; verified by `scripts/test-generate-inputs.mjs`.

Latest offline run (2026-09-28, mock provider): all 5 tasks completed both
workflows; outline-first produced 7 blocks across 3 chapters per task,
one-shot produced 3 blocks; DOCX exports are valid Word files (~9 KB each).
This validates the generate → edit-ready blocks → export pipeline; it is
**not** an evaluation of LLM output quality.

## Real LLM run (requires Dify API keys)

1. Configure `.env.local` with `NEXT_PUBLIC_DIFY_BASE_URL` and the outline/chapter keys.
2. Start normally (no `MOCK_LLM`): `./dev-start-hotreload.sh`
3. Run the same harness: `node scripts/eval-compare.mjs`
4. Score outputs with the rubric below; record results in `data/eval/scoring.csv`.

## Task set

`data/eval/tasks.json` — 5 business-writing tasks (healthcare AI, quarterly
review, onboarding guide, remote-work policy, EV market analysis).

## Quality rubric (1-5)

| Dimension | 1 | 3 | 5 |
|-----------|-----|-----|-----|
| Structure completeness | Missing most expected sections | Most sections present | All expected sections, logical order |
| Clarity | Confusing, redundant | Readable with minor issues | Clear, concise, well-signposted |
| Accuracy | Contains obvious factual errors | Minor unsupported claims | Factual claims are plausible/verifiable |
| Tone | Wrong register for the task | Mostly appropriate | Consistently matches the requested style |
| Usability | Needs a full rewrite | Needs light editing | Usable after minor polish |

## Recording results

```csv
task_id,workflow,structure,clarity,accuracy,tone,usability,elapsed_s,edits_required,factual_errors,notes
t1,outline_first,,,,,,,,
t1,one_shot,,,,,,,,
```

## Suggested analysis

1. **Structure**: outline-first should score higher on structure completeness
   (the outline enforces section coverage).
2. **Efficiency**: compare wall-clock time (`elapsed_ms` in the summary).
3. **Editing burden**: count edits required per workflow before export.
4. **Factual errors**: outline-first chapters get narrower context per
   generation; check whether that reduces or increases hallucination.

## Limitations

- Mock runs validate the pipeline only, not LLM quality
- Small task set (5); pilot study, not conclusive
- Single rater unless multiple people score the rubric
- Privacy: prompts are sent to Dify/LLM providers — do not use confidential topics
