#!/usr/bin/env node
// Keeps the Supabase project (used by the Chess online rooms in index.html)
// from auto-pausing. Supabase pauses free projects after ~7 days without API
// activity, so this sends lightweight read-only requests every few days.
// Run by .github/workflows/supabase-keepalive.yml (cron) or manually:
//
//   node scripts/supabase-keepalive.mjs
//
// Configuration (first source that provides a value wins):
//   1. SUPABASE_URL / SUPABASE_ANON_KEY env vars (GitHub secrets in CI).
//   2. The SUPABASE_URL / SUPABASE_KEY constants in index.html, so the
//      keep-alive always targets whatever project the app itself uses.
//      Just update the constants in index.html and the cron follows.
//
// The anon key is public by design (it ships in the page); Row Level
// Security still applies.
//
// Exit code: 0 = a full ping cycle succeeded, 1 = all attempts failed.

import { readFile } from "node:fs/promises";

const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 5000;
const REQUEST_TIMEOUT_MS = 15000;

// Lightweight, read-only endpoints. Hitting these counts as project activity.
const TARGETS = [
  { name: "PostgREST", path: "/rest/v1/" },
  { name: "GoTrue health", path: "/auth/v1/health" },
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const stamp = () => new Date().toISOString();

async function readAppConfig() {
  const htmlUrl = new URL("../index.html", import.meta.url);
  const html = await readFile(htmlUrl, "utf8");
  const url = html.match(/const SUPABASE_URL\s*=\s*'([^']+)'/)?.[1];
  const key = html.match(/const SUPABASE_KEY\s*=\s*'([^']+)'/)?.[1];
  return { url, key };
}

async function pingOnce(baseUrl, anonKey) {
  for (const { name, path } of TARGETS) {
    const url = `${baseUrl}${path}`;
    const res = await fetch(url, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    // Drain the body so the socket can be reused/closed cleanly.
    await res.arrayBuffer().catch(() => {});
    if (!res.ok) {
      throw new Error(`${name} answered HTTP ${res.status} (${url})`);
    }
    console.log(`[${stamp()}] ok: ${name} -> HTTP ${res.status}`);
  }
}

async function main() {
  const app = await readAppConfig().catch((err) => {
    console.error(`[${stamp()}] error: cannot read index.html: ${err.message}`);
    process.exit(1);
  });
  const baseUrl = (process.env.SUPABASE_URL || app.url || "").replace(/\/+$/, "");
  const anonKey = process.env.SUPABASE_ANON_KEY || app.key || "";
  if (!/^https?:\/\//.test(baseUrl)) {
    console.error(`[${stamp()}] error: no usable SUPABASE_URL (env or index.html)`);
    process.exit(1);
  }
  if (!anonKey || anonKey.includes("YOUR_PROJECT")) {
    console.error(`[${stamp()}] error: no usable SUPABASE_ANON_KEY (env or index.html)`);
    process.exit(1);
  }
  console.log(`[${stamp()}] pinging ${baseUrl}`);
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await pingOnce(baseUrl, anonKey);
      console.log(`[${stamp()}] keep-alive succeeded (attempt ${attempt})`);
      return;
    } catch (err) {
      lastError = err;
      console.error(`[${stamp()}] attempt ${attempt} failed: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
    }
  }
  console.error(`[${stamp()}] keep-alive FAILED after ${MAX_ATTEMPTS} attempts`);
  if (String(lastError && lastError.message).includes("401")) {
    console.error(
      `[${stamp()}] hint: HTTP 401 means the anon key was rejected. ` +
        `Copy the current "anon public" key from Supabase dashboard > Project Settings > API ` +
        `into the SUPABASE_KEY constant in index.html (the cron reads it from there).`
    );
  }
  process.exit(1);
}

await main();
