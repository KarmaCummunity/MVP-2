#!/usr/bin/env node
// Post-process the Expo web export.
//
// Two outputs:
//   1. `_redirects` — Cloudflare Pages SPA fallback (unknown paths → index.html).
//      See: https://developers.cloudflare.com/pages/configuration/redirects/
//   2. `serve.json` — config consumed by `serve` (Railway / `pnpm preview:web`)
//      and the `serve-handler` library. Adds two things on top of the
//      `--single` SPA fallback already provided by the runtime:
//        a. `redirects[].source = "/p/:id"` → `${EXPO_PUBLIC_SUPABASE_URL}/functions/v1/share-post/:id`.
//           Lets us hand recipients the branded `karma-community-kc.com/p/<id>`
//           URL (FR-POST-023 AC3) instead of the raw Supabase project URL.
//           WhatsApp / Telegram / Twitter follow the 302 to the Edge Function
//           and read its OG card; humans get a second 302 from the function
//           to `karma-community-kc.com/post/<id>` (the AASA/assetlinks path).
//        b. SPA fallback for unknown paths (same as `_redirects`).
//      `serve.json` schema: https://github.com/vercel/serve-handler#configuration

import { writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const distDir = resolve(here, '..', 'apps', 'mobile', 'dist');
const redirectsPath = resolve(distDir, '_redirects');
const serveJsonPath = resolve(distDir, 'serve.json');

if (!existsSync(distDir)) {
  console.error(`[web-postbuild] dist not found at ${distDir} — did expo export run?`);
  process.exit(1);
}

writeFileSync(redirectsPath, '/*    /index.html   200\n', 'utf8');
console.log(`[web-postbuild] wrote ${redirectsPath}`);

// `serve.json` requires the Supabase URL to know where to forward `/p/:id`.
// Falls back to the dev project so the file is always well-formed; the live
// deployment overrides it via the `EXPO_PUBLIC_SUPABASE_URL` build arg.
const supabaseUrl = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').replace(/\/+$/, '');
if (supabaseUrl === '') {
  console.warn(
    '[web-postbuild] EXPO_PUBLIC_SUPABASE_URL is unset — /p/:id redirect will be omitted.',
  );
}

const redirects = supabaseUrl
  ? [{ source: '/p/:id', destination: `${supabaseUrl}/functions/v1/share-post/:id`, type: 302 }]
  : [];

const serveJson = {
  // `--single` already does this on the CLI flag, but `serve-handler` honors
  // the JSON form too — keeps the contract explicit for any consumer.
  rewrites: [{ source: '**', destination: '/index.html' }],
  redirects,
};

writeFileSync(serveJsonPath, `${JSON.stringify(serveJson, null, 2)}\n`, 'utf8');
console.log(
  `[web-postbuild] wrote ${serveJsonPath} (share-redirect: ${supabaseUrl ? 'on' : 'off'})`,
);
