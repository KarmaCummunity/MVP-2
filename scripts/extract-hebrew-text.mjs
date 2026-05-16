#!/usr/bin/env node
/**
 * Scans the repo for Hebrew characters, groups matches by file, writes a report.
 * Usage: node scripts/extract-hebrew-text.mjs [outputPath]
 */

import fs from "node:fs";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");
const DEFAULT_OUT = path.join(REPO_ROOT, "scripts", "hebrew-text-report.md");

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

function isProbablyTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXT.has(ext)) return true;
  const base = path.basename(filePath);
  if (base === "Dockerfile" || base.endsWith(".env.example")) return true;
  return false;
}

function* walk(dir) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const ent of entries) {
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (shouldSkipDir(ent.name)) continue;
      yield* walk(full);
    } else if (ent.isFile()) {
      if (SKIP_FILE_NAMES.has(ent.name)) continue;
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
    return [];
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
  const outPath = path.resolve(process.argv[2] || DEFAULT_OUT);
  const byFile = [];
  for (const abs of walk(REPO_ROOT)) {
    const row = extractFromFile(abs);
    if (row) byFile.push(row);
  }
  byFile.sort((a, b) => a.rel.localeCompare(b.rel));

  const iso = new Date().toISOString();
  let md = `# Hebrew text scan\n\n`;
  md += `Generated: ${iso}\n\n`;
  md += `Root: \`${REPO_ROOT}\`\n\n`;
  md += `Files with at least one line containing Hebrew: **${byFile.length}**\n\n`;
  md += `---\n\n`;

  for (const { rel, hits } of byFile) {
    md += `## \`${rel.replace(/\\/g, "/")}\`\n\n`;
    for (const { line, text } of hits) {
      md += `**L${line}**\n\n`;
      md += "```\n" + text + "\n```\n\n";
    }
    md += `---\n\n`;
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, md, "utf8");
  console.log(`Wrote ${byFile.length} files with Hebrew → ${outPath}`);
}

main();
