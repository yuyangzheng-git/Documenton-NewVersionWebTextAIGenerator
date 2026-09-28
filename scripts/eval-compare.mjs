/**
 * Evaluation harness: outline-first (chapter-by-chapter) vs one-shot generation.
 *
 * Runs the same tasks through both workflows against a running server and
 * saves full outputs (generated text + exported DOCX) under data/eval/.
 *
 * Offline mode: start the server with MOCK_LLM=1 to run without any API keys
 * (deterministic mock generation). For real LLM runs, configure Dify keys in
 * .env.local and omit MOCK_LLM.
 *
 * Failure semantics: any task error, SSE `error` event, or stream that ends
 * without a `done` event fails the run -> exit code 1.
 *
 * Usage:
 *   MOCK_LLM=1 npm run dev        # terminal 1
 *   node scripts/eval-compare.mjs # terminal 2
 *
 * Outputs:
 *   data/eval/outline-first/<task_id>/   outline.json, chapter_<i>.json, blocks.json, document.docx
 *   data/eval/one-shot/<task_id>/        generation.json, blocks.json, document.docx
 *   data/eval/comparison_summary.json
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
const OUT = join(ROOT, "data", "eval");

const tasks = JSON.parse(readFileSync(join(ROOT, "data", "eval", "tasks.json"), "utf8")).tasks;

async function api(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(300000),
  });
  if (!res.ok) {
    throw new Error(`${path} -> ${res.status}: ${await res.text()}`);
  }
  return res;
}

async function collectSse(res) {
  const text = await res.text();
  const chunks = [];
  let sawDone = false;
  for (const line of text.split("\n")) {
    if (!line.startsWith("data: ")) continue;
    const payload = line.slice(6).trim();
    if (payload === "" || payload === "[DONE]") continue;
    let parsed;
    try {
      parsed = JSON.parse(payload);
    } catch {
      continue;
    }
    if (parsed.event === "done") {
      sawDone = true;
      continue;
    }
    if (parsed.type === "error" || parsed.error) {
      throw new Error(`SSE error event: ${JSON.stringify(parsed)}`);
    }
    if (parsed.text) chunks.push(parsed.text);
  }
  if (!sawDone) {
    throw new Error("stream ended without a done event");
  }
  return chunks.join("");
}

function blocksFromSections(sections, title) {
  const blocks = [{ type: "h1", content: title }];
  for (const section of sections) {
    blocks.push({ type: "h2", content: section.heading });
    for (const paragraph of section.paragraphs) {
      blocks.push({ type: "paragraph", content: paragraph });
    }
  }
  return blocks;
}

async function exportDocx(dir, blocks, outline, documentTitle) {
  const res = await api("/api/export/docx", {
    blocks,
    outline,
    documentTitle,
    usePandoc: false,
  });
  const buffer = Buffer.from(await res.arrayBuffer());
  const path = join(dir, "document.docx");
  writeFileSync(path, buffer);
  return buffer.length;
}

function saveJson(dir, name, data) {
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), JSON.stringify(data, null, 2));
}

async function runOutlineFirst(task) {
  const dir = join(OUT, "outline-first", task.id);
  mkdirSync(dir, { recursive: true });

  const t0 = Date.now();
  const outlineRes = await api("/api/ai/outline", { topic: task.topic, style: task.style });
  const outlineJson = await outlineRes.json();
  const { outline, mock, cached } = outlineJson;
  const runMode = mock ? "mock" : "live";
  saveJson(dir, "outline.json", {
    outline,
    mock: !!mock,
    cached: !!cached,
    run_mode: runMode,
    cache_namespace: `outline:${runMode}:v1:<topic>:<style>`,
  });

  const chapters = [];
  for (const item of outline.filter((i) => i.level === 1)) {
    const gen = await api("/api/ai/generate", {
      sectionTitle: item.title,
      documentTopic: task.topic,
      fullOutline: outline.map((i) => i.title).join("\n"),
      requirements: "",
    });
    const text = await collectSse(gen);
    chapters.push({ heading: item.title, paragraphs: text.split(/\n+/).filter(Boolean) });
    saveJson(dir, `chapter_${chapters.length}.json`, { heading: item.title, text });
  }

  const blocks = blocksFromSections(chapters, task.topic);
  saveJson(dir, "blocks.json", blocks);
  const docxBytes = await exportDocx(dir, blocks, outline, task.topic);
  return {
    elapsed_ms: Date.now() - t0,
    chapters: chapters.length,
    blocks: blocks.length,
    docxBytes,
    run_mode: runMode,
    outline_mock: !!mock,
    outline_cached: !!cached,
  };
}

async function runOneShot(task) {
  const dir = join(OUT, "one-shot", task.id);
  mkdirSync(dir, { recursive: true });

  const t0 = Date.now();
  const gen = await api("/api/ai/generate", {
    sectionTitle: task.topic,
    documentTopic: task.topic,
    fullOutline: "",
    requirements: "一次性生成完整文档",
  });
  const text = await collectSse(gen);
  saveJson(dir, "generation.json", { text });

  const sections = [
    { heading: task.topic, paragraphs: text.split(/\n+/).filter(Boolean) },
  ];
  const blocks = blocksFromSections(sections, task.topic);
  saveJson(dir, "blocks.json", blocks);
  const docxBytes = await exportDocx(dir, blocks, [], task.topic);
  return { elapsed_ms: Date.now() - t0, chapters: 1, blocks: blocks.length, docxBytes };
}

async function main() {
  console.log(`Evaluation harness -> ${BASE_URL}\n`);
  const summary = [];
  let failed = 0;
  for (const task of tasks) {
    console.log(`[${task.id}] ${task.topic}`);
    try {
      const outlineFirst = await runOutlineFirst(task);
      const oneShot = await runOneShot(task);
      summary.push({ task_id: task.id, topic: task.topic, outline_first: outlineFirst, one_shot: oneShot });
      console.log(
        `  outline-first: ${outlineFirst.chapters} chapters, ${outlineFirst.blocks} blocks, ` +
        `${outlineFirst.docxBytes} bytes, ${(outlineFirst.elapsed_ms / 1000).toFixed(1)}s ` +
        `(mode=${outlineFirst.run_mode}, mock=${outlineFirst.outline_mock}, cached=${outlineFirst.outline_cached})`
      );
      console.log(
        `  one-shot:      ${oneShot.blocks} blocks, ${oneShot.docxBytes} bytes, ` +
        `${(oneShot.elapsed_ms / 1000).toFixed(1)}s`
      );
    } catch (err) {
      failed += 1;
      console.log(`  ERROR: ${err.message}`);
      summary.push({ task_id: task.id, topic: task.topic, error: err.message });
    }
  }
  saveJson(OUT, "comparison_summary.json", {
    base_url: BASE_URL,
    generated_at: new Date().toISOString(),
    failed_tasks: failed,
    tasks: summary,
  });
  console.log(`\nSummary written to data/eval/comparison_summary.json`);
  console.log("Full outputs under data/eval/outline-first/ and data/eval/one-shot/");
  if (failed > 0) {
    console.error(`FAILED: ${failed} task(s) did not complete successfully`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
