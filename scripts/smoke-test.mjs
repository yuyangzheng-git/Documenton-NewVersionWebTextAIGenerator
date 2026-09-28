import { readFileSync, existsSync } from "node:fs";

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

const onlineMode = process.argv.includes("--online");

let failures = 0;
const ok = (msg) => console.log(`${GREEN}  PASS${RESET} ${msg}`);
const fail = (msg) => {
  failures += 1;
  console.log(`${RED}  FAIL${RESET} ${msg}`);
};

function resolvePort() {
  if (process.env.PORT) return process.env.PORT;
  if (existsSync(".env.local")) {
    const local = readFileSync(".env.local", "utf8");
    const match = local.match(/^PORT=(\d+)$/m);
    if (match) return match[1];
  }
  return "3000";
}

function checkStatic() {
  console.log("Static configuration check\n");
  console.log("[1] Environment files");
  if (!existsSync(".env.example")) {
    fail(".env.example missing");
  } else {
    ok(".env.example present");
    const example = readFileSync(".env.example", "utf8");
    const required = [
      "NEXT_PUBLIC_DIFY_BASE_URL",
      "NEXT_PUBLIC_DIFY_OUTLINE_KEY",
      "NEXT_PUBLIC_DIFY_CHAPTER_KEY",
      "NEXT_PUBLIC_DIFY_LLM_KEY",
    ];
    for (const key of required) {
      if (example.includes(key)) ok(`${key} documented in .env.example`);
      else fail(`${key} missing from .env.example`);
    }
  }

  console.log("\n[2] Local configuration (.env.local)");
  if (!existsSync(".env.local")) {
    fail(".env.local not found - create it before starting the app (cp .env.example .env.local)");
  } else {
    const local = readFileSync(".env.local", "utf8");
    const url = local.match(/^NEXT_PUBLIC_DIFY_BASE_URL=(.+)$/m)?.[1] ?? "";
    if (/^https?:\/\//.test(url)) ok(`DIFY base URL set: ${url}`);
    else fail("NEXT_PUBLIC_DIFY_BASE_URL is not a valid HTTP(S) URL");
  }
}

async function checkOnline() {
  const port = resolvePort();
  const base = `http://localhost:${port}`;
  console.log(`Online smoke test (base URL: ${base})\n`);

  console.log("[3] Health endpoint");
  let healthOk = false;
  try {
    const res = await fetch(`${base}/api/health`, { signal: AbortSignal.timeout(3000) });
    healthOk = res.ok;
    if (res.ok) {
      ok(`GET /api/health -> ${res.status}`);
      const json = await res.json().catch(() => null);
      if (json && json.status) ok(`health payload: status=${json.status}`);
      else fail("health payload missing 'status' field");
    } else {
      fail(`GET /api/health returned ${res.status}`);
    }
  } catch (err) {
    fail(`cannot connect to ${base}/api/health: ${err.cause?.code || err.message}`);
  }

  if (!healthOk) return; // metrics check would fail for the same reason

  console.log("\n[4] Metrics endpoint");
  try {
    const res = await fetch(`${base}/api/metrics`, { signal: AbortSignal.timeout(3000) });
    if (res.ok) {
      ok(`GET /api/metrics -> ${res.status}`);
    } else {
      fail(`GET /api/metrics returned ${res.status}`);
    }
  } catch (err) {
    fail(`cannot connect to ${base}/api/metrics: ${err.cause?.code || err.message}`);
  }
}

async function main() {
  if (onlineMode) {
    await checkOnline();
  } else {
    checkStatic();
    console.log(
      `\n${YELLOW}Note${RESET}: this checks configuration only. Run \`npm run smoke:test:online\` ` +
        `to test a running server (fails if it cannot connect).`
    );
  }

  console.log("");
  if (failures > 0) {
    console.log(`${RED}Smoke test failed with ${failures} error(s).${RESET}`);
    process.exit(1);
  }
  console.log(`${GREEN}Smoke test passed.${RESET}`);
}

main();
