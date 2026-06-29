#!/usr/bin/env node
// Post-process the Expo web export for Cloudflare Pages.
// - Copies the GloWe static frontend into `dist/glowe/` so it is served at the
//   `/glowe` sub-path of the main domain, alongside the KC web app (one domain,
//   two frontends, shared Supabase backend). See FR-GLOWE-001 / DECISIONS D-61.
// - Writes a `_redirects` file that gates the root KC app behind /glowe/. All
//   traffic to non-/glowe paths is redirected to /glowe/ (302). Traffic within
//   /glowe/* falls back to /glowe/index.html so deep-links and refreshes work.
//   Cloudflare Pages serves existing static files before applying _redirects, so
//   GloWe's real files (pages/, assets/, css/, js/) are served directly.
// - Replaces dist/index.html with a redirect shim so that Cloudflare's directory
//   index for "/" (which skips _redirects) also redirects to /glowe/.
// See: https://developers.cloudflare.com/pages/configuration/redirects/
//
// TO RESTORE KC ACCESS: revert this file to the previous _redirects content and
// remove the index.html replacement block.

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

// _redirects: /glowe/* paths fall back to glowe index for SPA-style routing;
// everything else is redirected (302) to /glowe/.
// Note: Cloudflare serves real static files before checking _redirects, so
// actual files under /glowe/ (HTML pages, assets) are always served directly.
writeFileSync(
  redirectsPath,
  '/glowe/*  /glowe/index.html  200\n/*        /glowe/           302\n',
  'utf8',
);
console.log(`[web-postbuild] wrote ${redirectsPath}`);

// Replace dist/index.html with a redirect shim.
// Cloudflare Pages serves the directory index (index.html) for "/" before
// evaluating _redirects, so without this the Expo SPA would still be reachable
// at the root. The shim immediately forwards the browser to /glowe/.
const rootIndexPath = resolve(distDir, 'index.html');
writeFileSync(
  rootIndexPath,
  `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="refresh" content="0; url=/glowe/">
<title>Redirecting…</title>
<script>window.location.replace('/glowe/');</script>
</head>
<body><a href="/glowe/">Click here if not redirected automatically</a></body>
</html>
`,
  'utf8',
);
console.log(`[web-postbuild] replaced ${rootIndexPath} with /glowe/ redirect shim`);
