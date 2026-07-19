import assert from 'node:assert/strict';
import test from 'node:test';

import { assertLocalSupabaseUrl } from '../seed-glowe-local.mjs';

test('accepts local Supabase IP URL', () => {
  assert.equal(assertLocalSupabaseUrl('http://127.0.0.1:54321'), 'http://127.0.0.1:54321');
});

test('accepts localhost Supabase URL', () => {
  assert.equal(assertLocalSupabaseUrl('http://localhost:54321'), 'http://localhost:54321');
});

test('rejects hosted Supabase URLs', () => {
  assert.throws(
    () => assertLocalSupabaseUrl('https://roeefqpdbftlndzsvhfj.supabase.co'),
    /local Supabase URL/i,
  );
});
