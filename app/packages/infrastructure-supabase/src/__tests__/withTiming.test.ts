import { describe, expect, it } from 'vitest';
// @ts-expect-error — imports from outside rootDir; vitest resolves at runtime via esbuild, tsc cannot follow the path.
import { withTiming } from '../../../../../supabase/functions/_shared/withTiming.ts';

describe('withTiming', () => {
  it('logs invocation_ms on success', async () => {
    const logs: unknown[] = [];
    const handler = async (_req: Request) => new Response('ok', { status: 200 });
    const wrapped = withTiming('test-fn', handler, { log: (l) => logs.push(l) });
    const res = await wrapped(new Request('http://x/'));
    expect(res.status).toBe(200);
    const line = logs[0] as Record<string, unknown>;
    expect(line.fn).toBe('test-fn');
    expect(typeof line.invocation_ms).toBe('number');
    expect(typeof line.cold_start).toBe('boolean');
    expect(line.status).toBe(200);
  });

  it('logs 500 + error on throw', async () => {
    const logs: unknown[] = [];
    const handler = async () => { throw new Error('boom'); };
    const wrapped = withTiming('test-fn', handler, { log: (l) => logs.push(l) });
    await expect(wrapped(new Request('http://x/'))).rejects.toThrow('boom');
    const line = logs[0] as Record<string, unknown>;
    expect(line.status).toBe(500);
    expect(line.error).toBe('boom');
  });
});
