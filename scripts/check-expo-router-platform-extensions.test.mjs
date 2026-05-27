import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { checkExpoRouterPlatformExtensions } from './check-expo-router-platform-extensions.mjs';

function makeRoot(files) {
  const root = mkdtempSync(join(tmpdir(), 'platext-'));
  const routesDir = join(root, 'app/apps/mobile/app');
  mkdirSync(routesDir, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    const full = join(routesDir, rel);
    mkdirSync(join(full, '..'), { recursive: true });
    writeFileSync(full, content);
  }
  return root;
}

test('passes when every .web.tsx has a sibling .tsx', () => {
  const root = makeRoot({
    'research/[slug].web.tsx': 'export default function W() { return null; }',
    'research/[slug].tsx': 'export default function F() { return null; }',
    'research/_layout.web.tsx': 'export default function W() { return null; }',
    'research/_layout.tsx': 'export default function F() { return null; }',
  });
  try {
    const result = checkExpoRouterPlatformExtensions({ repoRoot: root });
    assert.equal(result.ok, true);
    assert.equal(result.missing.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('fails when a .web.tsx has no sibling .tsx', () => {
  const root = makeRoot({
    'research/[slug].web.tsx': 'export default function W() { return null; }',
    // Intentionally no [slug].tsx sibling
  });
  try {
    const result = checkExpoRouterPlatformExtensions({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.equal(result.missing.length, 1);
    assert.match(result.missing[0].platformFile, /\[slug\]\.web\.tsx$/);
    assert.match(result.missing[0].missingFallback, /\[slug\]\.tsx$/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('reports every missing sibling, not just the first', () => {
  const root = makeRoot({
    'a/[id].web.tsx': '',
    'b/_layout.web.tsx': '',
    'c/page.web.tsx': '',
    'c/page.tsx': '', // this one has a sibling
  });
  try {
    const result = checkExpoRouterPlatformExtensions({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.equal(result.missing.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('catches .ios.tsx and .android.tsx without siblings', () => {
  const root = makeRoot({
    'native/[id].ios.tsx': '',
    'native/[id].android.tsx': '',
  });
  try {
    const result = checkExpoRouterPlatformExtensions({ repoRoot: root });
    assert.equal(result.ok, false);
    assert.equal(result.missing.length, 2);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('ignores non-route files in the same tree', () => {
  const root = makeRoot({
    'research/_layout.web.tsx': '',
    'research/_layout.tsx': '',
    'research/notes.md': 'just a doc',
    'research/util.ts': 'export const x = 1;',
  });
  try {
    const result = checkExpoRouterPlatformExtensions({ repoRoot: root });
    assert.equal(result.ok, true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('handles missing routes directory gracefully', () => {
  const root = mkdtempSync(join(tmpdir(), 'platext-empty-'));
  try {
    const result = checkExpoRouterPlatformExtensions({ repoRoot: root });
    assert.equal(result.ok, true);
    assert.equal(result.missing.length, 0);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
