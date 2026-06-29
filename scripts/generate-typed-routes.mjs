#!/usr/bin/env node
/**
 * Generates app/apps/mobile/.expo/types/router.d.ts (expo-router typed routes).
 *
 * Why this exists: expo-router normally writes this declaration file only while
 * the Metro dev server / `expo export` is running. `tsc --noEmit` (the CI
 * `typecheck` gate) needs it present, but committing a generated file (a) drifts
 * out of sync with the real routes and (b) forces `.expo` to stay tracked, which
 * makes `expo-doctor`'s ProjectSetupCheck (`git check-ignore .expo`) fail. So we
 * regenerate it on demand instead of committing it, and `.expo` stays ignored.
 *
 * Runs before `tsc` via the mobile package's `typecheck` script (local + CI).
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const MOBILE = path.join(REPO_ROOT, 'app/apps/mobile');
const APP_ROOT = path.join(MOBILE, 'app');
const OUT_DIR = path.join(MOBILE, '.expo/types');

// expo-router's typed-route generator reads the routes directory from this env var.
process.env.EXPO_ROUTER_APP_ROOT = APP_ROOT;

const require = createRequire(path.join(MOBILE, 'package.json'));
const requireContext = require('expo-router/build/testing-library/require-context-ponyfill').default;
const { EXPO_ROUTER_CTX_IGNORE } = require('expo-router/_ctx-shared');
const { getTypedRoutesDeclarationFile } = require('expo-router/build/typed-routes/generate');

const ctx = requireContext(APP_ROOT, true, EXPO_ROUTER_CTX_IGNORE);
const file = getTypedRoutesDeclarationFile(ctx);

if (!file || !file.includes('__routes')) {
  console.error('[generate-typed-routes] generation produced no routes — aborting');
  process.exit(1);
}

fs.mkdirSync(OUT_DIR, { recursive: true });
fs.writeFileSync(path.join(OUT_DIR, 'router.d.ts'), file);
console.log(`[generate-typed-routes] wrote ${path.relative(REPO_ROOT, path.join(OUT_DIR, 'router.d.ts'))} (${file.length} bytes)`);
