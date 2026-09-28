# Research Framing

## Research Question

Can AI-assisted outline-first document generation reduce drafting time and improve document quality in business writing tasks?

### Sub-questions

1. How much do users edit AI-proposed outlines before generating content?
2. Does chapter-by-chapter generation improve factual consistency compared to one-shot generation?
3. What is the latency and cost profile of streaming generation under different caching strategies?

## Method

Compare two workflows on the same tasks:

1. **Task selection**: 5 business-writing tasks in `data/eval/tasks.json`.
2. **Condition A (outline-first)**: AI outline → per-chapter streaming generation → DOCX export.
3. **Condition B (one-shot)**: single generation call for the whole document → DOCX export.
4. **Measurement**: full raw outputs are saved per task per workflow; score with a 5-dimension rubric; pull system metrics from `/api/metrics`.

The comparison harness is `scripts/eval-compare.mjs`. It runs fully offline with a
deterministic mock provider (`MOCK_LLM=1`, no API keys) to validate the pipeline,
and against real Dify models once keys are configured. See
[docs/evaluation.md](docs/evaluation.md) for the protocol, rubric, and the latest
offline pipeline-validation run.

## Evaluation Metrics

- Completion time (from task start to DOCX export)
- Human quality rating (1-5 rubric: structure, clarity, completeness, tone)
- Number of factual errors introduced by the LLM
- Number of user edits required after generation
- Structure completeness (share of planned sections that contain content)
- System metrics available in `/api/metrics`: cache hit rate, p95/p99 latency, error rate

## Limitations

- LLM hallucination: generated content may contain fabricated facts; the current system has no automatic fact-checking
- Prompt sensitivity: outline quality varies with the style setting and model provider
- Privacy risks: user prompts are sent to third-party LLM providers; the system does not yet support local models
- Small sample size: pilot study only, results are not generalizable
- Single-language bias: prompts and evaluation were primarily tested in Chinese and English

## How to Run a Pilot Study with This System

1. Start the app (`./dev-start-hotreload.sh`) and configure a model provider in `.env.local`.
2. Run the comparison harness: `node scripts/eval-compare.mjs` (offline pipeline check first with `MOCK_LLM=1`).
3. Rate outputs with the rubric in [docs/evaluation.md](docs/evaluation.md) and record results in a CSV.
4. Pull latency/cache stats from `GET /api/metrics` before and after each task.

## Future Work

- Automatic fact-checking pass against retrieved sources before export
- A/B testing harness for comparing providers and prompt templates
- Fine-grained telemetry on user edits (accept/reject rate per generated paragraph)
