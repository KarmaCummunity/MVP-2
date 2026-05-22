import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkWebManifest } from './check-web-manifest.mjs';

test('passes when generated manifest name matches locale appName', () => {
  const root = mkdtempSync(join(tmpdir(), 'manifest-'));
  try {
    const localeDir = join(root, 'app/apps/mobile/src/i18n/locales/he');
    mkdirSync(localeDir, { recursive: true });
    writeFileSync(join(localeDir, 'index.ts'), `export default { appName: 'KC - קהילת קארמה' };`);
    const result = checkWebManifest({ repoRoot: root });
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.equal(result.appName, 'KC - קהילת קארמה');
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when appName is missing', () => {
  const root = mkdtempSync(join(tmpdir(), 'manifest-missing-'));
  try {
    const localeDir = join(root, 'app/apps/mobile/src/i18n/locales/he');
    mkdirSync(localeDir, { recursive: true });
    writeFileSync(join(localeDir, 'index.ts'), `export default { other: 'x' };`);
    const result = checkWebManifest({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /appName/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when appName is empty', () => {
  const root = mkdtempSync(join(tmpdir(), 'manifest-empty-'));
  try {
    const localeDir = join(root, 'app/apps/mobile/src/i18n/locales/he');
    mkdirSync(localeDir, { recursive: true });
    writeFileSync(join(localeDir, 'index.ts'), `export default { appName: '   ' };`);
    const result = checkWebManifest({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /empty/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
