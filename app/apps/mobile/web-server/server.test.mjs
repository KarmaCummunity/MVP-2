// Node-native test runner. Spins the Hono app instance directly (no socket
// server) and asserts UA branching + OG-meta rendering.

import { describe, it, before, after, mock } from 'node:test';
import assert from 'node:assert/strict';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

let DIST_DIR;
let app;
let fetchMock;

async function bootstrap(distDir) {
  process.env.SUPABASE_URL = 'https://example.supabase.co';
  process.env.SUPABASE_ANON_KEY = 'anon-test';
  process.env.APP_BASE_URL = 'https://karma-community-kc.com';
  process.env.WEB_DIST_DIR = distDir;
  const mod = await import(`./server.mjs?t=${Date.now()}`);
  return mod.createApp({ fetch: fetchMock });
}

before(async () => {
  DIST_DIR = join(tmpdir(), `kc-test-${Date.now()}`);
  await mkdir(DIST_DIR, { recursive: true });
  await writeFile(join(DIST_DIR, 'index.html'), '<!doctype html><html><body>SPA</body></html>', 'utf8');
  await writeFile(join(DIST_DIR, 'favicon.ico'), 'icon-bytes', 'utf8');
});

after(async () => {
  await rm(DIST_DIR, { recursive: true, force: true });
});

describe('GET /post/:id', () => {
  it('returns OG HTML with the post image for a WhatsApp crawler (open)', async () => {
    fetchMock = mock.fn(async () =>
      new Response(
        JSON.stringify([
          {
            post_id: 'a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042',
            title: 'שולחן עץ',
            description: 'במצב מצוין',
            visibility: 'Public',
            status: 'open',
            media_assets: [{ path: 'foo/bar.jpg', ordinal: 0 }],
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /og:image/);
    assert.match(body, /foo\/bar\.jpg/);
    assert.match(body, /שולחן עץ/);
    assert.match(body, /https:\/\/karma-community-kc\.com\/post\/a3ee6f9d/);
    assert.doesNotMatch(body, /supabase\.co\/functions/);
  });

  it('returns OG HTML for a closed_delivered post when RLS admits the row', async () => {
    fetchMock = mock.fn(async (url) => {
      assert.match(String(url), /post_id=eq\./);
      assert.doesNotMatch(String(url), /status=eq\.open/);
      return new Response(
        JSON.stringify([
          {
            post_id: 'b4ff7a0e-8e29-51a9-0a7b-23e62ce4a153',
            title: 'כיסא מעוצב',
            description: 'נמסר',
            visibility: 'Public',
            status: 'closed_delivered',
            media_assets: [{ path: 'closed/chair.jpg', ordinal: 0 }],
          },
        ]),
        { status: 200, headers: { 'content-type': 'application/json' } },
      );
    });
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/b4ff7a0e-8e29-51a9-0a7b-23e62ce4a153', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /כיסא מעוצב/);
    assert.match(body, /closed\/chair\.jpg/);
  });

  it('returns the SPA index for a browser UA', async () => {
    fetchMock = mock.fn();
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'Mozilla/5.0 (Macintosh)' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /SPA/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('returns the generic OG card on invalid UUID', async () => {
    fetchMock = mock.fn();
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/not-a-uuid', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /og:image/);
    assert.match(body, /pwa-icon-512/);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  it('returns the generic OG card when Supabase returns no rows', async () => {
    fetchMock = mock.fn(async () =>
      new Response('[]', { status: 200, headers: { 'content-type': 'application/json' } }),
    );
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    const body = await res.text();
    assert.match(body, /pwa-icon-512/);
  });

  it('returns the generic OG card when Supabase times out', async () => {
    fetchMock = mock.fn(async () => {
      throw Object.assign(new Error('aborted'), { name: 'AbortError' });
    });
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/post/a3ee6f9d-7d18-40f8-9f6a-12d51bd3f042', {
      headers: { 'user-agent': 'WhatsApp/2.0' },
    });
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /pwa-icon-512/);
  });
});

describe('static + SPA fallback', () => {
  it('serves a static file when present', async () => {
    fetchMock = mock.fn();
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/favicon.ico');
    assert.equal(res.status, 200);
  });

  it('falls back to index.html for unknown routes (SPA refresh)', async () => {
    fetchMock = mock.fn();
    app = await bootstrap(DIST_DIR);
    const res = await app.request('/donations');
    assert.equal(res.status, 200);
    const body = await res.text();
    assert.match(body, /SPA/);
  });
});
