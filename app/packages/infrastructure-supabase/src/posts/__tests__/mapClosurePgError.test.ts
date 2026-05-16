import { describe, it, expect } from 'vitest';
import type { PostgrestError } from '@supabase/supabase-js';
import { PostError } from '@kc/application';
import { mapClosurePgError } from '../closureMethods';

function pg(message: string): PostgrestError {
  // Only `.message` is read; cast the rest of the PostgrestError shape away.
  return { message, details: '', hint: '', code: '' } as PostgrestError;
}

describe('mapClosurePgError', () => {
  it('maps "closure_not_owner" verbatim', () => {
    const out = mapClosurePgError(pg('closure_not_owner'));
    expect(out).toBeInstanceOf(PostError);
    expect(out.code).toBe('closure_not_owner');
    expect(out.message).toBe('closure_not_owner');
  });

  it('maps "closure_wrong_status" verbatim', () => {
    expect(mapClosurePgError(pg('closure_wrong_status')).code).toBe('closure_wrong_status');
  });

  it('maps "closure_recipient_not_in_chat" verbatim', () => {
    expect(mapClosurePgError(pg('closure_recipient_not_in_chat')).code).toBe(
      'closure_recipient_not_in_chat',
    );
  });

  it('maps "reopen_window_expired" verbatim', () => {
    expect(mapClosurePgError(pg('reopen_window_expired')).code).toBe('reopen_window_expired');
  });

  it('trims leading/trailing whitespace before matching the known set', () => {
    const out = mapClosurePgError(pg('  closure_not_owner  '));
    expect(out.code).toBe('closure_not_owner');
  });

  it('falls through to code=unknown for an unrecognized message', () => {
    const out = mapClosurePgError(pg('some_other_error'));
    expect(out.code).toBe('unknown');
    expect(out.message).toBe('some_other_error');
  });

  it('falls through to code=unknown with empty text when message is the empty string', () => {
    // `??` only triggers on null/undefined, so an empty string survives.
    const out = mapClosurePgError(pg(''));
    expect(out.code).toBe('unknown');
    expect(out.message).toBe('');
  });

  it('preserves the original Postgrest error as cause', () => {
    const src = pg('closure_not_owner');
    const out = mapClosurePgError(src);
    expect(out.cause).toBe(src);
  });
});
