#!/usr/bin/env node
// Post-process the Expo web export for Cloudflare Pages.
// - Writes a `_redirects` file so client-side routes fall back to index.html
//   (otherwise a refresh on /donations or a direct deep-link returns 404).
// See: https://developers.cloudflare.com/pages/configuration/redirects/

import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'apps', 'mobile', 'dist');
const redirectsPath = resolve(distDir, '_redirects');

if (!existsSync(distDir)) {
  console.error(`[web-postbuild] dist not found at ${distDir} — did expo export run?`);
  process.exit(1);
}

writeFileSync(redirectsPath, '/*    /index.html   200\n', 'utf8');
console.log(`[web-postbuild] wrote ${redirectsPath}`);
