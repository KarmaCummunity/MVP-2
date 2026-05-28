// backfill-image-thumbs — PERF-4 part 2 of 2
//
// Generates 400px post thumbnails and 96px avatar thumbnails for objects
// uploaded before the PR-1a thumb pipeline shipped. New uploads after PR-1a
// always include their own -thumb sibling; this function fills in the rest.
//
// For each full-size object missing its `-thumb` sibling, downloads the
// original, resizes via ImageMagick WASM, and uploads the thumb with
// `cache-control: public, max-age=31536000, immutable`. Idempotent: existing
// thumbs are skipped.
//
// Triggered manually (or via cron) with optional body:
//   { "bucket"?: "post-images" | "avatars" | "both",
//     "pageLimit"?: number,        // max objects to process per invocation; default 100
//     "lookbackHours"?: number,    // only objects newer than N hours; default null (all)
//     "dryRun"?: boolean }
//
// POST → 200 { ok: true, bucket, scanned, generated, skipped_existing, errors, more }
//      → 401 { ok: false, error: "unauthenticated" }
//      → 500 { ok: false, error: string }
//
// Runbook entry: docs/SSOT/OPERATOR_RUNBOOK.md → "Backfill image thumbs".

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { ImageMagick, initialize, MagickFormat } from 'https://deno.land/x/imagemagick_deno@0.0.30/mod.ts';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LIST_PAGE = 100;
const IMMUTABLE_CACHE_CONTROL = 'public, max-age=31536000, immutable';

// Bucket-specific thumb sizing.
const THUMB_CONFIG: Record<string, { maxEdge: number; quality: number }> = {
  'post-images': { maxEdge: 400, quality: 75 },
  'avatars': { maxEdge: 96, quality: 75 },
};

let imagemagickReady = false;
async function ensureImageMagick(): Promise<void> {
  if (imagemagickReady) return;
  await initialize();
  imagemagickReady = true;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

type AdminClient = ReturnType<typeof createClient>;

/** `a/b/c.jpg` → `a/b/c-thumb.jpg`. Mirrors the FE helper in `apps/mobile/src/lib/imageUrl.ts`. */
function deriveThumbPath(path: string): string {
  if (!path) return path;
  const dotIdx = path.lastIndexOf('.');
  const slashIdx = path.lastIndexOf('/');
  if (dotIdx === -1 || dotIdx < slashIdx) return `${path}-thumb`;
  return `${path.slice(0, dotIdx)}-thumb${path.slice(dotIdx)}`;
}

function isThumbPath(name: string): boolean {
  return /-thumb(\.[a-zA-Z0-9]+)?$/.test(name);
}

async function listRecentPaths(
  admin: AdminClient,
  bucket: string,
  sinceIso: string | null,
  prefix = '',
): Promise<string[]> {
  const paths: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await admin.storage
      .from(bucket)
      .list(prefix, { limit: LIST_PAGE, offset, sortBy: { column: 'created_at', order: 'desc' } });
    if (error) throw new Error(`list(${bucket}/${prefix}): ${error.message}`);
    if (!data || data.length === 0) break;

    let hasOld = false;
    for (const obj of data) {
      const fullPath = prefix ? `${prefix}/${obj.name}` : obj.name;
      if (obj.metadata) {
        // File: skip thumbs themselves; check freshness window.
        if (isThumbPath(obj.name)) continue;
        if (sinceIso) {
          const created = obj.created_at ?? obj.updated_at ?? '';
          if (created < sinceIso) {
            hasOld = true;
            continue;
          }
        }
        paths.push(fullPath);
      } else {
        // Folder — recurse.
        const nested = await listRecentPaths(admin, bucket, sinceIso, fullPath);
        paths.push(...nested);
      }
    }
    if (hasOld || data.length < LIST_PAGE) break;
    offset += LIST_PAGE;
  }
  return paths;
}

async function thumbExists(admin: AdminClient, bucket: string, thumbPath: string): Promise<boolean> {
  const lastSlash = thumbPath.lastIndexOf('/');
  const prefix = lastSlash === -1 ? '' : thumbPath.slice(0, lastSlash);
  const name = lastSlash === -1 ? thumbPath : thumbPath.slice(lastSlash + 1);
  const { data, error } = await admin.storage
    .from(bucket)
    .list(prefix, { limit: 1, search: name });
  if (error) return false;
  return (data ?? []).some((o) => o.name === name);
}

async function resizeToJpeg(bytes: Uint8Array, maxEdge: number, quality: number): Promise<Uint8Array> {
  await ensureImageMagick();
  return await new Promise<Uint8Array>((resolve, reject) => {
    try {
      ImageMagick.read(bytes, (img) => {
        const ratio = Math.min(maxEdge / img.width, maxEdge / img.height, 1);
        const targetW = Math.max(1, Math.round(img.width * ratio));
        const targetH = Math.max(1, Math.round(img.height * ratio));
        img.resize(targetW, targetH);
        img.quality = quality;
        img.write(MagickFormat.Jpeg, (data) => resolve(new Uint8Array(data)));
      });
    } catch (err) {
      reject(err);
    }
  });
}

interface BackfillStats {
  bucket: string;
  scanned: number;
  generated: number;
  skipped_existing: number;
  errors: number;
  more: boolean;
}

async function backfillBucket(
  admin: AdminClient,
  bucket: string,
  opts: { pageLimit: number; sinceIso: string | null; dryRun: boolean },
): Promise<BackfillStats> {
  const cfg = THUMB_CONFIG[bucket];
  if (!cfg) throw new Error(`unknown bucket: ${bucket}`);

  const paths = await listRecentPaths(admin, bucket, opts.sinceIso);
  const stats: BackfillStats = {
    bucket,
    scanned: 0,
    generated: 0,
    skipped_existing: 0,
    errors: 0,
    more: paths.length > opts.pageLimit,
  };
  const work = paths.slice(0, opts.pageLimit);

  for (const path of work) {
    stats.scanned++;
    const thumbPath = deriveThumbPath(path);
    try {
      if (await thumbExists(admin, bucket, thumbPath)) {
        stats.skipped_existing++;
        continue;
      }
      if (opts.dryRun) {
        stats.generated++;
        continue;
      }
      const { data: blob, error: dlErr } = await admin.storage.from(bucket).download(path);
      if (dlErr || !blob) {
        stats.errors++;
        continue;
      }
      const originalBytes = new Uint8Array(await blob.arrayBuffer());
      const thumbBytes = await resizeToJpeg(originalBytes, cfg.maxEdge, cfg.quality);
      const { error: upErr } = await admin.storage
        .from(bucket)
        .upload(thumbPath, thumbBytes, {
          contentType: 'image/jpeg',
          upsert: true,
          cacheControl: IMMUTABLE_CACHE_CONTROL,
        });
      if (upErr) {
        stats.errors++;
        continue;
      }
      stats.generated++;
    } catch (err) {
      console.error(`[backfill-image-thumbs] ${bucket}/${path}:`, err);
      stats.errors++;
    }
  }
  return stats;
}

serve(async (req: Request) => {
  if (req.method !== 'POST') return json({ ok: false, error: 'method_not_allowed' }, 405);

  const auth = req.headers.get('Authorization') ?? '';
  if (!auth.startsWith('Bearer ') || auth.slice(7) !== SERVICE_KEY) {
    return json({ ok: false, error: 'unauthenticated' }, 401);
  }

  let body: {
    bucket?: 'post-images' | 'avatars' | 'both';
    pageLimit?: number;
    lookbackHours?: number;
    dryRun?: boolean;
  } = {};
  try {
    body = await req.json().catch(() => ({}));
  } catch {
    body = {};
  }

  const bucketArg = body.bucket ?? 'both';
  const pageLimit = typeof body.pageLimit === 'number' ? Math.max(1, Math.min(500, body.pageLimit)) : 100;
  const sinceIso = typeof body.lookbackHours === 'number'
    ? new Date(Date.now() - body.lookbackHours * 3600_000).toISOString()
    : null;
  const dryRun = body.dryRun === true;

  try {
    const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
      auth: { persistSession: false },
    });

    const buckets = bucketArg === 'both' ? ['post-images', 'avatars'] : [bucketArg];
    const results: BackfillStats[] = [];
    for (const bucket of buckets) {
      const stats = await backfillBucket(admin, bucket, { pageLimit, sinceIso, dryRun });
      console.log(`[backfill-image-thumbs] ${JSON.stringify(stats)}`);
      results.push(stats);
    }

    return json({ ok: true, dryRun, results });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[backfill-image-thumbs] fatal', msg);
    return json({ ok: false, error: msg }, 500);
  }
});
