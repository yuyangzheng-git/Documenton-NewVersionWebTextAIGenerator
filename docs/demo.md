# Step-by-Step Demo

This guide walks through the full workflow of the AI Document Generator.
All payloads below match the real API routes (verified against
`app/api/ai/*/route.ts`).

## Prerequisites

1. A running instance: `./dev-start-hotreload.sh` (or `docker-compose up -d`)
2. Valid provider keys in `.env.local` (`NEXT_PUBLIC_DIFY_BASE_URL` and at least one API key)
3. Static config check: `npm run smoke:test`
4. Online check (requires the server): `npm run smoke:test:online`

## Workflow

### 1. Health check

```bash
curl http://localhost:3000/api/health
# expect: {"status":"healthy","services":{"redis":{...},"dify":{...}}}
```

### 2. Generate an outline

```bash
curl -X POST http://localhost:3000/api/ai/outline \
  -H "Content-Type: application/json" \
  -d '{"topic":"AI in Healthcare","style":"专业严肃"}'
```

Fields: `topic` (required, ≤500 chars), `style` (whitelist: 专业严肃 | 轻松活泼 |
学术严谨 | 商务正式; anything else falls back to 专业严肃).

The response contains `{ "outline": [...] }` — an array of
`{ id, level (1|2|3), title }` items. Identical (topic, style) requests are
served from Redis when `CACHE_ENABLED=1` (response then includes
`"cached": true`).

### 3. Generate a chapter (streaming)

`sectionTitle` is **required**; `documentTopic`, `fullOutline`, `requirements`
are optional context:

```bash
curl -N -X POST http://localhost:3000/api/ai/generate \
  -H "Content-Type: application/json" \
  -d '{
    "sectionTitle": "Medical AI Applications",
    "documentTopic": "AI in Healthcare",
    "fullOutline": "1. Introduction\n2. Applications\n3. Risks",
    "requirements": "Keep it under 500 words"
  }'
```

Tokens arrive as an SSE stream:

```
data: {"text":"AI has revolutionized"}
data: {"event":"done"}
```

### 4. Edit in the Notion-style editor

Open http://localhost:3000/word-editor and refine the generated blocks:

- Drag blocks with the sortable editor (dnd-kit)
- Edit text inline with Tiptap
- Add images and tables

Blocks use `{ type: "h1"|"h2"|"h3"|"paragraph"|"image"|"table", content: "..." }`.

### 5. Export to DOCX

`blocks` (array of `{type, content}`) is **required**; `outline`, `documentTitle`,
`templateId`, `usePandoc` are optional:

```bash
curl -X POST http://localhost:3000/api/export/docx \
  -H "Content-Type: application/json" \
  -d '{
    "documentTitle": "My Document",
    "blocks": [
      {"type": "h1", "content": "Introduction"},
      {"type": "paragraph", "content": "AI is transforming healthcare."}
    ],
    "outline": [{"id": "1", "level": 1, "title": "Introduction"}],
    "usePandoc": true
  }' \
  --output document.docx
```

Two export modes:

| Mode | Engine | Quality | Speed |
|------|--------|---------|-------|
| `usePandoc: true` | Pandoc (server-side Python) | High (styles, headings, cover page) | Slower |
| `usePandoc: false` (default) | Built-in docx or custom template | Good | Fast |

### 6. Observe metrics

```bash
curl http://localhost:3000/api/metrics | jq
```

Shows cache hit rate, per-endpoint p95/p99 latency, and error rates.

## Expected Demo Script (for a reviewer)

1. Enter the topic "Quarterly Business Review" in the home page.
2. Show the AI-generated outline; delete one section and reorder another.
3. Generate each chapter and watch the streaming output.
4. Edit one paragraph by hand to show the editor.
5. Export to DOCX and open the file.
6. Show `/api/metrics` to display latency and cache statistics.
