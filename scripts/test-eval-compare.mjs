/**
 * Failure-path tests for scripts/eval-compare.mjs.
 *
 * The harness must exit non-zero when tasks fail:
 *   1. server unreachable (connection refused) -> exit 1
 *   2. stream ends without a `done` event -> exit 1
 *
 * Run: node scripts/test-eval-compare.mjs
 */
import { spawn, spawnSync } from "node:child_process";
import http from "node:http";
import assert from "node:assert/strict";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SCRIPT = join(__dirname, "eval-compare.mjs");

function runHarnessSync(baseUrl, timeoutMs = 30000) {
  return spawnSync(
    process.execPath,
    [SCRIPT],
    {
      env: { ...process.env, BASE_URL: baseUrl },
      encoding: "utf8",
      timeout: timeoutMs,
    }
  );
}

async function runHarnessAsync(baseUrl, timeoutMs = 30000) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT], {
      env: { ...process.env, BASE_URL: baseUrl },
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => child.kill("SIGKILL"), timeoutMs);
    child.stdout.on("data", (d) => (stdout += d));
    child.stderr.on("data", (d) => (stderr += d));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

// 1) Unreachable server must fail the run
{
  const res = runHarnessSync("http://127.0.0.1:1");
  assert.notEqual(res.status, 0, "unreachable server must produce non-zero exit");
  const output = `${res.stdout}\n${res.stderr}`;
  assert.match(output, /FAILED|ERROR/, output);
  console.log("OK: unreachable server -> non-zero exit");
}

// 2) SSE stream without a done event must fail the run
{
  const server = http.createServer((req, res) => {
    if (req.url.startsWith("/api/ai/outline")) {
      const outline = [
        { id: "1", level: 1, title: "Section A" },
        { id: "2", level: 1, title: "Section B" },
      ];
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ outline }));
      return;
    }
    // generate/export: SSE chunk without done
    res.writeHead(200, { "Content-Type": "text/event-stream" });
    res.end('data: {"text":"incomplete stream"}\n\n');
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;

  const res = await runHarnessAsync(`http://127.0.0.1:${port}`);
  server.close();

  assert.notEqual(res.code, 0, "missing done event must produce non-zero exit");
  const output = `${res.stdout}\n${res.stderr}`;
  assert.match(output, /done event/, output);
  console.log("OK: missing done event -> non-zero exit");
}

console.log("OK: eval-compare failure semantics verified");
