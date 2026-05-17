#!/usr/bin/env node
/**
 * Generates app/apps/mobile/public/manifest.json from the he locale file.
 * Run as part of the web build so Hebrew lives only in the locale bundle (D-24).
 *
 * Source of truth for app name: app/apps/mobile/src/i18n/locales/he/index.ts → appName
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const LOCALE_FILE = path.join(REPO_ROOT, 'app/apps/mobile/src/i18n/locales/he/index.ts');
const OUT_FILE = path.join(REPO_ROOT, 'app/apps/mobile/public/manifest.json');

const localeContent = fs.readFileSync(LOCALE_FILE, 'utf8');
const nameMatch = localeContent.match(/appName:\s*['"](.+?)['"]/);
if (!nameMatch) {
  console.error('ERROR: Could not find appName in', LOCALE_FILE);
  process.exit(1);
}
const appName = nameMatch[1];

const manifest = {
  name: appName,
  short_name: 'KC',
  start_url: '/',
  scope: '/',
  display: 'standalone',
  background_color: '#ffffff',
  theme_color: '#F97316',
  lang: 'he',
  dir: 'rtl',
  icons: [
    { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/pwa-icon-192-maskable.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
    { src: '/pwa-icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

fs.writeFileSync(OUT_FILE, JSON.stringify(manifest, null, 2) + '\n');
console.log(`Generated ${path.relative(REPO_ROOT, OUT_FILE)} — name: "${appName}"`);
