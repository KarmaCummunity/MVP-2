#!/usr/bin/env node
/**
 * Hebrew literal guard (product code). See docs/SSOT/DECISIONS.md **D-24**.
 *
 * **Product policy (D-24, target architecture — not fully enforced here yet):**
 * - MVP is bilingual: Hebrew + English; user-facing copy lives in locale bundles
 *   (`apps/mobile/src/i18n/locales/he/`, `.../locales/en/`) via stable keys, not inline in TS/TSX.
 * - Migrations / PL/pgSQL / triggers must eventually use **indirection** (message keys + parameters,
 *   text resolved from the same locale SSOT or Edge `i18n.json`), not raw natural-language literals
 *   in SQL as the long-term pattern.
 *
 * **What this script does today:** scans text files for Hebrew codepoints; writes a Markdown report;
 * with `--check`, exits non-zero if any match remains **outside** the skip rules below. Hebrew inside
 * skipped trees is ignored so CI stays practical while D-24 refactors are phased in.
 *
 * **Skips (transitional / technical):**
 * - `docs/`, `PRD_V2_NOT_FOR_MVP/`, `app/apps/mobile/app.json` (Expo metadata).
 * - `app/apps/mobile/src/i18n/**` — canonical locale bundles (`he`, future `en`, etc.).
 * - `supabase/migrations/**`, `supabase/seed.sql` — excluded until SQL adopts D-24 indirection.
 * - `supabase/functions/**` — Edge bundles (including `i18n.json`).
 * - `__tests__/**`, `*.test.ts(x)` — fixtures.
 * - `app/apps/mobile/ios/**` + `.plist` suffix — native permission copy (to be aligned with D-24 / InfoPlist.strings).
 * - Repo-root `CLAUDE.md` — agent-facing Hebrew examples.
 * - `SKIP_HEBREW_SCAN_EXACT_RELS` — narrow ASCII-path exceptions until moved to locale-backed data.
 *
 * Usage:
 *   node scripts/extract-hebrew-text.mjs [outputPath]
 *   node scripts/extract-hebrew-text.mjs --check [outputPath]   # exit 1 if any violation remains
 */

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_OUT = path.join(REPO_ROOT, "scripts", "hebrew-text-report.md");

/**
 * Exact repo-relative POSIX paths skipped by the scan (ASCII paths only).
 * Transitional: remove entries as they are replaced by locale-backed or key-only sources (D-24).
 */
const SKIP_HEBREW_SCAN_EXACT_RELS = new Set([
  "app/packages/infrastructure-supabase/src/search/searchConstants.ts",
]);

function parseArgs(argv) {
  const user = argv.slice(2);
  const check = user.includes("--check");
  const rest = user.filter((a) => a !== "--check");
  const outArg = rest[0] || null;
  return { check, outArg };
}

const SKIP_DIR_NAMES = new Set([
  "node_modules",
  ".git",
  "Pods",
  "build",
  "dist",
  ".next",
  "coverage",
  ".turbo",
  ".expo",
  "DerivedData",
  ".gradle",
  "__pycache__",
  ".cache",
  "mcps",
]);

const SKIP_FILE_NAMES = new Set([".DS_Store", "package-lock.json", "yarn.lock"]);

const TEXT_EXT = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
  ".json",
  ".md",
  ".mdx",
  ".sql",
  ".yml",
  ".yaml",
  ".toml",
  ".html",
  ".css",
  ".scss",
  ".txt",
  ".svg",
  ".xml",
  ".plist",
  ".gradle",
  ".properties",
  ".env.example",
]);

// Hebrew + Hebrew presentation forms + niqqud / punctuation in block
const HEBREW_RE = /[\u0590-\u05FF\uFB1D-\uFB4F]/;

function shouldSkipDir(name) {
  return SKIP_DIR_NAMES.has(name) || name.startsWith(".");
}

/** Whole subtrees excluded from the scan (repo-relative POSIX paths). See file header (D-24). */
function isSkippedContentTreeRel(relPosix) {
  if (relPosix === "docs" || relPosix.startsWith("docs/")) return true;
  if (relPosix === "PRD_V2_NOT_FOR_MVP" || relPosix.startsWith("PRD_V2_NOT_FOR_MVP/")) {
    return true;
  }
  if (relPosix === "supabase/migrations" || relPosix.startsWith("supabase/migrations/")) {
    return true;
  }
  if (relPosix === "supabase/seed.sql") return true;
  if (relPosix === "app/apps/mobile/src/i18n" || relPosix.startsWith("app/apps/mobile/src/i18n/")) {
    return true;
  }
  if (relPosix === "app/apps/mobile/app.json") return true;
  return false;
}

/** Per-path skips: tests, edge functions, native plist copy, agent doc, explicit path exceptions. */
function isSkippedHebrewScanRel(relPosix) {
  if (isSkippedContentTreeRel(relPosix)) return true;
  if (SKIP_HEBREW_SCAN_EXACT_RELS.has(relPosix)) return true;
  if (relPosix === "CLAUDE.md") return true;
  if (relPosix.includes("/__tests__/")) return true;
  if (relPosix.endsWith(".test.ts") || relPosix.endsWith(".test.tsx")) return true;
  if (relPosix === "supabase/functions" || relPosix.startsWith("supabase/functions/")) return true;
  if (relPosix.startsWith("app/apps/mobile/ios/") && relPosix.endsWith(".plist")) return true;
  return false;
}

function isProbablyTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXT.has(ext)) return true;
  const base = path.basename(filePath);
  if (base === "Dockerfile" || base.endsWith(".env.example")) return true;
  return false;
}

function* walk(dir, skipScanAbs) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    const relPosix = path.relative(REPO_ROOT, full).replace(/\\/g, "/");
    if (isSkippedHebrewScanRel(relPosix)) continue;
    if (ent.isDirectory()) {
      if (shouldSkipDir(ent.name)) continue;
      yield* walk(full, skipScanAbs);
    } else if (ent.isFile()) {
      if (SKIP_FILE_NAMES.has(ent.name)) continue;
      const resolved = path.resolve(full);
      if (resolved === skipScanAbs) continue;
      if (!isProbablyTextFile(full)) continue;
      yield full;
    }
  }
}

function extractFromFile(absPath) {
  let content;
  try {
    content = fs.readFileSync(absPath, "utf8");
  } catch {
    return null;
  }
  const rel = path.relative(REPO_ROOT, absPath);
  const hits = [];
  const lines = content.split(/\r?\n/);
  lines.forEach((line, idx) => {
    if (!HEBREW_RE.test(line)) return;
    hits.push({ line: idx + 1, text: line.trimEnd() });
  });
  return hits.length ? { rel, hits } : null;
}

function main() {
  const { check, outArg } = parseArgs(process.argv);
  const outPath = path.resolve(outArg || DEFAULT_OUT);
  const byFile = [];
  const skipScanAbs = path.normalize(outPath);
  for (const abs of walk(REPO_ROOT, skipScanAbs)) {
    const row = extractFromFile(abs);
    if (row) byFile.push(row);
  }
  byFile.sort((a, b) => a.rel.localeCompare(b.rel));

  const iso = new Date().toISOString();
  let md = `# Hebrew text scan\nGenerated: ${iso}\nFiles: **${byFile.length}**\n`;
  byFile.forEach(({ rel, hits }) => {
    md += `## \`${rel.replace(/\\/g, "/")}\`\n`;
    for (const { line, text } of hits) {
      const oneLine = text.replace(/\t/g, " ");
      md += `${line}\t${oneLine}\n`;
    }
    md += "\n";
  });

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, "utf8");
  console.log(`Wrote ${byFile.length} files with Hebrew → ${outPath}`);

  if (check) {
    if (byFile.length > 0) {
      console.error(
        `Hebrew scan failed: ${byFile.length} file(s) outside allowed locations. See ${outPath}`,
      );
      for (const { rel } of byFile) console.error(`  - ${rel.replace(/\\/g, "/")}`);
      process.exitCode = 1;
    } else {
      console.log("Hebrew scan OK: 0 violations.");
    }
  }
}

main();
