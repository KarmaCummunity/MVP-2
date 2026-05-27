// Mapped to docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md § Wave 0.
// Helpers around Sentry's transaction API:
//   - don't crash if Sentry isn't initialised (tests, no-DSN dev builds)
//   - idempotent (`startMark` is a no-op for an active name)
//   - finish returns boolean so callers can detect double-finish bugs
//
// Sentry v7 used span.finish(); Sentry v8 renamed it to span.end(). We call
// whichever exists so the helper survives major-version bumps without crashing
// the host app (which is what TypeError: s.finish is not a function would do).

type MarkName = 'app.cold_start' | 'feed.first_render' | 'image.first_paint';
type Span = { end?(): void; finish?(): void };

const active = new Map<MarkName, Span>();

function getSentry(): typeof import('@sentry/react-native') | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    return require('@sentry/react-native') as typeof import('@sentry/react-native');
  } catch {
    return null;
  }
}

const noopSpan: Span = { end() { /* no-op when Sentry unavailable */ } };

function endSpan(span: Span): void {
  try {
    if (typeof span.end === 'function') {
      span.end();
      return;
    }
    if (typeof span.finish === 'function') {
      span.finish();
    }
  } catch {
    // Never crash the host app on a Sentry span-end failure.
  }
}

export function startMark(name: MarkName): void {
  if (active.has(name)) return;
  const Sentry = getSentry();
  if (!Sentry) {
    active.set(name, noopSpan);
    return;
  }
  const span = Sentry.startInactiveSpan({ name, op: 'mark' }) as unknown as Span | undefined;
  active.set(name, span ?? noopSpan);
}

export function finishMark(name: MarkName): boolean {
  const span = active.get(name);
  if (!span) return false;
  endSpan(span);
  active.delete(name);
  return true;
}

// Test-only escape hatch.
export function _resetForTests(): void {
  active.clear();
}
