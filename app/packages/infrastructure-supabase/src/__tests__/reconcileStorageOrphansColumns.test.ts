import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

// The reconcile-storage-orphans Edge Function lives in Deno-land (no vitest
// runtime), so we verify its column references against the schema by reading
// the source as text. The `media_assets` column is `path` per migration
// 0002_init_posts.sql:130 — a wrong column name turns every uploaded image
// into a false orphan, which the daily cron (migration 0079) then deletes.
const here = dirname(fileURLToPath(import.meta.url));
const FN_SRC = readFileSync(
  resolve(here, '../../../../../supabase/functions/reconcile-storage-orphans/index.ts'),
  'utf8',
);

describe('reconcile-storage-orphans Edge Function — media_assets column contract', () => {
  it("queries `media_assets.path`, never the non-existent `storage_path`", () => {
    expect(FN_SRC).toMatch(/\.from\(['"]media_assets['"]\)/);
    expect(FN_SRC).not.toMatch(/storage_path/);
    expect(FN_SRC).toMatch(/\.select\(['"]path['"]\)/);
    expect(FN_SRC).toMatch(/\.in\(['"]path['"]\s*,/);
  });
});
