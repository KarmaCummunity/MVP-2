#!/usr/bin/env node
// Enforces Expo Router's "platform-extension routes need a non-platform fallback
// sibling" rule. Without the fallback, route enumeration crashes at runtime on
// every platform — including the platform the platform-file was meant for —
// with:
//
//   Error: The file ./<route>.web.tsx does not have a fallback sibling file
//   without a platform extension.
//
// This is a runtime check in Expo Router, so typecheck/test/lint do not catch
// it. We catch it statically here.
//
// Scope: `app/apps/mobile/app/**/*.{web,ios,android,native}.{ts,tsx}`.
// For each such file we require a sibling `*.{ts,tsx}` (same directory + same
// base name without the platform infix).
//
// Run from repo root: `node scripts/check-expo-router-platform-extensions.mjs`.

import { readdirSync, statSync, existsSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = join(__dirname, '..');

// Platform extensions Expo Router resolves before falling back to the bare file.
// Adding native extensions here is forward-compatible.
const PLATFORM_EXTENSIONS = ['web', 'ios', 'android', 'native'];

function walk(dir, files = []) {
  try {
    for (const entry of readdirSync(dir)) {
      const full = join(dir, entry);
      if (statSync(full).isDirectory()) walk(full, files);
      else files.push(full);
    }
  } catch {
    // Directory missing — caller's problem.
  }
  return files;
}

function fallbackPathFor(filePath) {
  for (const ext of PLATFORM_EXTENSIONS) {
    const needle = `.${ext}.`;
    const idx = filePath.lastIndexOf(needle);
    if (idx > -1) {
      // Replace `.web.` with `.` to keep the trailing `tsx` / `ts`.
      return filePath.slice(0, idx) + filePath.slice(idx + needle.length - 1);
    }
  }
  return null;
}

function isPlatformRouteFile(filePath) {
  return PLATFORM_EXTENSIONS.some(
    (ext) => filePath.endsWith(`.${ext}.ts`) || filePath.endsWith(`.${ext}.tsx`),
  );
}

export function checkExpoRouterPlatformExtensions({ repoRoot = DEFAULT_REPO_ROOT } = {}) {
  const routesRoot = join(repoRoot, 'app/apps/mobile/app');
  const missing = [];
  for (const file of walk(routesRoot)) {
    if (!isPlatformRouteFile(file)) continue;
    const fallback = fallbackPathFor(file);
    if (fallback && !existsSync(fallback)) {
      missing.push({
        platformFile: relative(repoRoot, file),
        missingFallback: relative(repoRoot, fallback),
      });
    }
  }
  return { ok: missing.length === 0, missing };
}

function main() {
  const result = checkExpoRouterPlatformExtensions();
  if (!result.ok) {
    console.error(
      `✗ Expo Router platform-extension check failed (${result.missing.length} route(s)):`,
    );
    console.error('');
    for (const { platformFile, missingFallback } of result.missing) {
      console.error(`  • ${platformFile}`);
      console.error(`    missing fallback: ${missingFallback}`);
    }
    console.error('');
    console.error('Every *.web.tsx / *.ios.tsx / *.android.tsx / *.native.tsx');
    console.error('route file in app/apps/mobile/app/** needs a non-platform');
    console.error('sibling. Without it, Expo Router crashes at runtime — even');
    console.error('on the platform the platform-file was meant for — with:');
    console.error('');
    console.error('  "does not have a fallback sibling file without a platform');
    console.error('   extension"');
    console.error('');
    console.error('Quickest fix: create the sibling as a stub returning null.');
    process.exit(1);
  }
  console.log(
    '✓ Expo Router platform-extension check passed — all platform-route files have non-platform siblings',
  );
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
