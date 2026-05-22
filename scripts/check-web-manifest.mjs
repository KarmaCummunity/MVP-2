#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DEFAULT_REPO_ROOT = join(__dirname, '..');

export function checkWebManifest({ repoRoot = DEFAULT_REPO_ROOT } = {}) {
  const localeFile = join(repoRoot, 'app/apps/mobile/src/i18n/locales/he/index.ts');
  let localeContent;
  try {
    localeContent = readFileSync(localeFile, 'utf8');
  } catch (err) {
    return { ok: false, errors: [`Could not read ${localeFile}: ${err.message}`], appName: null };
  }
  const nameMatch = localeContent.match(/appName:\s*['"](.+?)['"]/);
  if (!nameMatch) {
    return { ok: false, errors: [`Could not find appName in ${localeFile}`], appName: null };
  }
  const appName = nameMatch[1];
  if (!appName.trim()) {
    return { ok: false, errors: ['appName is empty'], appName };
  }
  return { ok: true, errors: [], appName };
}

function main() {
  const result = checkWebManifest();
  if (!result.ok) {
    console.error('✗ Web manifest parity check failed:');
    for (const err of result.errors) console.error(`  • ${err}`);
    process.exit(1);
  }
  console.log(`✓ Web manifest parity check passed — appName: "${result.appName}"`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
