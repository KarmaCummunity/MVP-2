#!/usr/bin/env node
// Post-process the Expo web export for Cloudflare Pages.
// - Copies the GloWe static frontend into `dist/glowe/` so it is served at the
//   `/glowe` sub-path of the main domain, alongside the KC web app (one domain,
//   two frontends, shared Supabase backend). See FR-GLOWE-001 / DECISIONS D-61.
// - Writes a `_redirects` file so KC client-side routes fall back to index.html
//   (otherwise a refresh on /donations or a direct deep-link returns 404).
//   Cloudflare Pages serves existing static files (including everything under
//   /glowe/) before applying this catch-all, so GloWe's real files win.
// See: https://developers.cloudflare.com/pages/configuration/redirects/

import { writeFileSync, existsSync, cpSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'apps', 'mobile', 'dist');
const redirectsPath = resolve(distDir, '_redirects');

if (!existsSync(distDir)) {
  console.error(`[web-postbuild] dist not found at ${distDir} — did expo export run?`);
  process.exit(1);
}

// Mount the GloWe static site at /glowe (skip dev-only tooling files).
const gloweSrc = resolve(here, '..', 'apps', 'glowe-web');
const gloweDest = resolve(distDir, 'glowe');
const skip = new Set(['node_modules', 'package.json', 'README.md']);
if (existsSync(gloweSrc)) {
  cpSync(gloweSrc, gloweDest, {
    recursive: true,
    filter: (src) => !skip.has(src.split('/').pop()),
  });
  console.log(`[web-postbuild] copied GloWe → ${gloweDest}`);
} else {
  console.warn(`[web-postbuild] GloWe source not found at ${gloweSrc} — skipping /glowe mount`);
}

writeFileSync(redirectsPath, '/*    /index.html   200\n', 'utf8');
console.log(`[web-postbuild] wrote ${redirectsPath}`);
