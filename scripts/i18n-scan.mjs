#!/usr/bin/env node
/**
 * i18n hardcoded-English scanner.
 *
 * Walks src/**\/*.{ts,tsx} and reports user-facing string literals that
 * still need to be migrated to t()/tv(). Heuristic, not perfect: focused
 * on the slots most likely to be visible to end users.
 *
 * Exits 1 when findings are present so it can gate CI.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = new URL("..", import.meta.url).pathname;
const SRC = join(ROOT, "src");

// Files/dirs we never scan.
const SKIP_DIRS = new Set([
  "node_modules",
  "ui", // shadcn primitives
  "__tests__",
  "test",
  "i18n", // translation source + helpers
  "integrations", // generated supabase types/client
]);
const SKIP_FILES = /\.(test|spec|d)\.(ts|tsx)$/;

// Strings allowed as-is.
const ALLOWLIST = new Set([
  "Tec-You UpSkill", // brand
  "demo123",
  "admin@admin.com",
  "college@institution.com",
  "teacher@teacher.com",
  "student@student.com",
  "sravanthi@student.com",
]);

const ENGLISH_RE = /^[A-Z][A-Za-z0-9 ,.'!?\-/:()&%$#@+]*[A-Za-z.!?]$/;
const HAS_LETTERS = /[A-Za-z]{3,}/;

function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else if (/\.(ts|tsx)$/.test(entry) && !SKIP_FILES.test(entry)) out.push(full);
  }
  return out;
}

function isInterestingLiteral(value) {
  if (!value || ALLOWLIST.has(value)) return false;
  if (!HAS_LETTERS.test(value)) return false;
  if (!ENGLISH_RE.test(value)) return false;
  // Skip obvious non-UI strings.
  if (/^[A-Z_]+$/.test(value)) return false; // SCREAMING_CASE constants
  if (/^https?:\/\//.test(value)) return false;
  if (/^[a-z]+(\.[a-z]+)+$/.test(value)) return false; // translation keys themselves
  return true;
}

function scanFile(file) {
  const src = readFileSync(file, "utf8");
  const lines = src.split(/\r?\n/);
  const findings = [];

  // Strip block comments for noise reduction (line by line is fine).
  const cleaned = src
    .replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, " "));

  const patterns = [
    { name: "placeholder", re: /placeholder=["'`]([^"'`]+)["'`]/g },
    { name: "title-attr", re: /\btitle=["'`]([^"'`]+)["'`]/g },
    { name: "aria-label", re: /aria-label=["'`]([^"'`]+)["'`]/g },
    { name: "alt-attr", re: /\balt=["'`]([^"'`]+)["'`]/g },
    { name: "toast", re: /\btoast(?:\.(?:success|error|warning|info|message))?\(\s*["'`]([^"'`]+)["'`]/g },
    { name: "setError", re: /setError\(\s*["'`]([^"'`]+)["'`]/g },
    { name: "throw Error", re: /throw\s+new\s+Error\(\s*["'`]([^"'`]+)["'`]/g },
  ];

  for (const { name, re } of patterns) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(cleaned))) {
      const value = m[1];
      if (!isInterestingLiteral(value)) continue;
      const idx = m.index;
      const line = cleaned.slice(0, idx).split("\n").length;
      findings.push({ kind: name, line, value });
    }
  }

  // JSX text nodes: >Word Word< on the same line. Skip lines that
  // already contain a translation call to avoid double-counting.
  for (let i = 0; i < lines.length; i++) {
    const ln = lines[i];
    if (/\bt\(|\btv\(|\btranslate\(/.test(ln)) continue;
    const jsx = ln.match(/>\s*([A-Z][A-Za-z][^<{>]{2,})</);
    if (!jsx) continue;
    const value = jsx[1].trim();
    if (!isInterestingLiteral(value)) continue;
    findings.push({ kind: "jsx-text", line: i + 1, value });
  }

  return findings;
}

const files = walk(SRC);
let total = 0;
const byFile = new Map();
for (const f of files) {
  const findings = scanFile(f);
  if (findings.length) {
    byFile.set(f, findings);
    total += findings.length;
  }
}

if (total === 0) {
  console.log("i18n-scan: clean. No hardcoded user-facing English found.");
  process.exit(0);
}

const sorted = [...byFile.entries()].sort((a, b) => b[1].length - a[1].length);
console.log(`i18n-scan: ${total} potential hardcoded strings across ${byFile.size} files.\n`);
for (const [file, findings] of sorted) {
  console.log(relative(ROOT, file));
  for (const f of findings) {
    console.log(`  ${f.line.toString().padStart(4)}  ${f.kind.padEnd(12)} ${JSON.stringify(f.value)}`);
  }
  console.log();
}

console.log(`Top-offender files:`);
for (const [file, findings] of sorted.slice(0, 10)) {
  console.log(`  ${findings.length.toString().padStart(4)}  ${relative(ROOT, file)}`);
}

process.exit(1);