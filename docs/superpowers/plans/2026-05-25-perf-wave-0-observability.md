# Performance Wave 0 — Observability Baseline Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Wire Sentry into the mobile app (crash + 3 explicit performance transactions) and Edge Functions (request timing) so subsequent waves can be measured against a real baseline. Closes TD-125.

**Architecture:** `@sentry/react-native` initialized at module load. Three explicit transactions — `app.cold_start`, `feed.first_render`, `image.first_paint` — via a `perfMarks` helper that no-ops if Sentry isn't initialised. `ErrorBoundary` forwards catches to Sentry. Edge Functions wrap their `Deno.serve` handler with a `withTiming` HOF that logs structured JSON lines to Supabase function logs. Sample rates: 100% dev, 25% prod. Source maps upload via EAS post-build hook.

**Spec mapping:** `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 0.

**SSOT updates in this PR:**
- Delete TD-125 row in `TECH_DEBT.md`.
- Add PERF-1 to `BACKLOG.md` under INFRA, ✅ Done.
- Append D-NN to `DECISIONS.md` (Sentry choice + sample rates).

---

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| `app/apps/mobile/package.json` | Modify | Add `@sentry/react-native` dep + `@sentry/cli` dev-dep |
| `app/apps/mobile/app.json` | Modify | Register `@sentry/react-native/expo` config plugin |
| `app/apps/mobile/src/lib/observability/sentry.ts` | Create | Single entry point for SDK init |
| `app/apps/mobile/src/lib/observability/perfMarks.ts` | Create | `startMark` / `finishMark` helpers — idempotent, safe when SDK uninitialised |
| `app/apps/mobile/src/lib/observability/__tests__/perfMarks.test.ts` | Create | Vitest test |
| `app/apps/mobile/app/_layout.tsx` | Modify | Call `initSentry()` + `startMark('app.cold_start')` at module top |
| `app/apps/mobile/src/components/ErrorBoundary.tsx` | Modify | Forward catches to `Sentry.captureException` |
| `app/apps/mobile/app/(tabs)/index.tsx` | Modify | Start `feed.first_render` + `image.first_paint` once per cold mount |
| `app/apps/mobile/src/components/PostFeedList.tsx` | Modify | Finish `feed.first_render` on first non-empty render |
| `app/apps/mobile/src/components/PostCardGrid.tsx` | Modify | Finish `image.first_paint` from first `onLoad` |
| `app/apps/mobile/.env.example` | Modify | Document `EXPO_PUBLIC_SENTRY_DSN` |
| `app/apps/mobile/eas.json` | Create or Modify | Post-build hook for source map upload |
| `app/apps/mobile/scripts/sentry-upload-sourcemaps.sh` | Create | Script invoked by EAS hook |
| `supabase/functions/_shared/withTiming.ts` | Create | Edge Function HOF — at repo root, NOT under `app/` |
| `supabase/functions/dispatch-notification/index.ts` | Modify | Wrap handler |
| `supabase/functions/validate-donation-link/index.ts` | Modify | Wrap handler |
| `supabase/functions/delete-account/index.ts` | Modify | Wrap handler |
| `app/packages/infrastructure-supabase/src/__tests__/withTiming.test.ts` | Create | Vitest test (lives here because this pkg's vitest runs in CI) |
| `docs/SSOT/TECH_DEBT.md` / `BACKLOG.md` / `DECISIONS.md` | Modify | TD-125 closed; PERF-1 added; D-NN recorded |

---

## Pre-flight

- [ ] Verify GH auth + clean working tree + branch on `dev`.
- [ ] `git fetch origin && git switch dev && git pull --ff-only && git switch -c chore/PERF-1-observability-baseline`.
- [ ] `cd app && pnpm install --frozen-lockfile && pnpm typecheck` — clean.

---

## Section A — Install Sentry

### Task A1: Add deps

```bash
cd app && pnpm --filter @kc/mobile add @sentry/react-native
cd app && pnpm --filter @kc/mobile add -D @sentry/cli
```

Commit: `chore(mobile): add @sentry/react-native + @sentry/cli (PERF-1)`

### Task A2: Register Expo plugin

In `app/apps/mobile/app.json`, append to `expo.plugins`:

```json
[
  "@sentry/react-native/expo",
  { "url": "https://sentry.io/", "organization": "karma-community", "project": "kc-mobile" }
]
```

Verify JSON parses; commit `chore(mobile): register @sentry/react-native expo plugin`.

### Task A3: SDK init module

Create `app/apps/mobile/src/lib/observability/sentry.ts`:

```typescript
import * as Sentry from '@sentry/react-native';
import Constants from 'expo-constants';

const DSN: string | undefined =
  (process.env.EXPO_PUBLIC_SENTRY_DSN as string | undefined) ??
  (Constants.expoConfig?.extra as { sentryDsn?: string } | undefined)?.sentryDsn;

type Env = 'dev' | 'prod';
function detectEnv(): Env {
  return process.env.NODE_ENV === 'production' ? 'prod' : 'dev';
}

let initialised = false;
export function initSentry(): void {
  if (initialised) return;
  if (!DSN) { if (__DEV__) console.warn('[observability] Sentry DSN missing'); return; }
  const env = detectEnv();
  Sentry.init({
    dsn: DSN,
    environment: env,
    enableAutoSessionTracking: true,
    tracesSampleRate: env === 'prod' ? 0.25 : 1.0,
    enableNativeFramesTracking: true,
  });
  initialised = true;
}
export function isInitialised(): boolean { return initialised; }
export { Sentry };
```

`pnpm --filter @kc/mobile typecheck`; commit `feat(observability): add Sentry init module (PERF-1)`.

### Task A4: Document env var

Append to `app/apps/mobile/.env.example`:

```
# Sentry DSN — public-safe.
EXPO_PUBLIC_SENTRY_DSN=
```

Commit: `docs(mobile): document EXPO_PUBLIC_SENTRY_DSN env var`.

---

## Section B — Crash reporting

### Task B1: ErrorBoundary forward

In `app/apps/mobile/src/components/ErrorBoundary.tsx:34-38`, replace `componentDidCatch`:

```typescript
componentDidCatch(error: Error, info: React.ErrorInfo): void {
  if (__DEV__) console.error('ErrorBoundary caught:', error, info.componentStack);
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Sentry, isInitialised } = require('../lib/observability/sentry');
    if (isInitialised()) {
      Sentry.captureException(error, { extra: { componentStack: info.componentStack ?? null } });
    }
  } catch { /* never crash the boundary */ }
}
```

`require` rather than `import` keeps ErrorBoundary mountable in vitest. Typecheck; commit.

### Task B2: Init at module top of `_layout.tsx`

Above line 1 of `_layout.tsx`:

```typescript
import { initSentry } from '../src/lib/observability/sentry';
initSentry();
```

Ordering matters — Sentry inits before i18n + DOM mutations. Typecheck; commit.

---

## Section C — Performance transactions

### Task C1: perfMarks helper + test

Test (TDD — fail first):

```typescript
// app/apps/mobile/src/lib/observability/__tests__/perfMarks.test.ts
import { describe, expect, it, beforeEach } from 'vitest';
import { startMark, finishMark, _resetForTests } from '../perfMarks';
describe('perfMarks', () => {
  beforeEach(() => _resetForTests());
  it('no-ops cleanly when no mark started', () => expect(() => finishMark('feed.first_render')).not.toThrow());
  it('idempotent start', () => { startMark('app.cold_start'); expect(() => startMark('app.cold_start')).not.toThrow(); });
  it('returns true first, false repeat', () => { startMark('image.first_paint'); expect(finishMark('image.first_paint')).toBe(true); expect(finishMark('image.first_paint')).toBe(false); });
});
```

`cd app && pnpm --filter @kc/mobile test -- perfMarks` → FAIL.

Implementation:

```typescript
// app/apps/mobile/src/lib/observability/perfMarks.ts
type MarkName = 'app.cold_start' | 'feed.first_render' | 'image.first_paint';
type Span = { finish(): void };
const active = new Map<MarkName, Span>();

function getSentry(): typeof import('@sentry/react-native') | null {
  try { return require('@sentry/react-native') as typeof import('@sentry/react-native'); }
  catch { return null; }
}

export function startMark(name: MarkName): void {
  if (active.has(name)) return;
  const Sentry = getSentry(); if (!Sentry) return;
  const span = Sentry.startInactiveSpan({ name, op: 'mark' }) as unknown as Span | undefined;
  if (span) active.set(name, span);
}

export function finishMark(name: MarkName): boolean {
  const span = active.get(name); if (!span) return false;
  span.finish(); active.delete(name); return true;
}

export function _resetForTests(): void { active.clear(); }
```

Test PASS; commit.

### Task C2: Mark `app.cold_start`

Below the `initSentry()` line in `_layout.tsx`:

```typescript
import { startMark, finishMark } from '../src/lib/observability/perfMarks';
startMark('app.cold_start');
```

In `ThemedRootShell`, at top of function body:

```typescript
React.useEffect(() => { finishMark('app.cold_start'); }, []);
```

Typecheck; commit `feat(observability): mark app.cold_start in root layout`.

### Task C3: Mark `feed.first_render` + `image.first_paint`

In `app/apps/mobile/app/(tabs)/index.tsx`, near top:

```typescript
import { startMark } from '../../src/lib/observability/perfMarks';
let feedFirstRenderStarted = false;
if (!feedFirstRenderStarted) {
  feedFirstRenderStarted = true;
  startMark('feed.first_render');
  startMark('image.first_paint');
}
```

In `PostFeedList.tsx`, inside component before return:

```typescript
import { finishMark } from '../lib/observability/perfMarks';
React.useEffect(() => {
  if ((posts ?? []).length > 0) finishMark('feed.first_render');
}, [posts]);
```

In `PostCardGrid.tsx`, before return:

```typescript
import { finishMark } from '../lib/observability/perfMarks';
const onImageLoadOnce = React.useCallback(() => { finishMark('image.first_paint'); }, []);
```

Add `onLoad={onImageLoadOnce}` to the `<Image>` element. `finishMark` is idempotent — only first card's first load closes the mark.

Typecheck; commit.

---

## Section D — Edge Function timing

### Task D1: `withTiming` + test

Test:

```typescript
// app/packages/infrastructure-supabase/src/__tests__/withTiming.test.ts
import { describe, expect, it } from 'vitest';
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
```

Implementation at `supabase/functions/_shared/withTiming.ts` (repo root, not under `app/`):

```typescript
const MODULE_LOADED_AT = Date.now();
const COLD_START_WINDOW_MS = 200;

export type Handler = (req: Request) => Promise<Response>;
type Opts = { log?: (line: unknown) => void };

export function withTiming(fnName: string, handler: Handler, opts: Opts = {}): Handler {
  const log = opts.log ?? ((l: unknown) => console.log(JSON.stringify(l)));
  return async (req: Request): Promise<Response> => {
    const startedAt = Date.now();
    const isColdStart = startedAt - MODULE_LOADED_AT < COLD_START_WINDOW_MS;
    try {
      const res = await handler(req);
      log({ fn: fnName, invocation_ms: Date.now() - startedAt, cold_start: isColdStart, status: res.status });
      return res;
    } catch (err) {
      log({ fn: fnName, invocation_ms: Date.now() - startedAt, cold_start: isColdStart, status: 500, error: err instanceof Error ? err.message : String(err) });
      throw err;
    }
  };
}
```

`cd app && pnpm --filter @kc/infrastructure-supabase test -- withTiming` PASS; commit.

### Tasks D2–D4: Wrap three Edge Functions

For each of `supabase/functions/{dispatch-notification,validate-donation-link,delete-account}/index.ts`:

1. Find the `Deno.serve(handler)` line.
2. Add at top: `import { withTiming } from '../_shared/withTiming.ts';`
3. Change to `Deno.serve(withTiming('<fn-name>', handler));`
4. If handler is inline arrow, extract to `const handler: Handler = async (req) => { ... };` first.

One commit per function.

---

## Section E — Source maps + EAS hook

### Task E1: Configure EAS

Create or merge `app/apps/mobile/eas.json` to include:

```json
"production": {
  "channel": "production",
  "env": { "EXPO_PUBLIC_SENTRY_DSN": "@kc/sentry_dsn" }
},
"hooks": {
  "postPublish": [
    { "file": "../scripts/sentry-upload-sourcemaps.sh", "config": {} }
  ]
}
```

Create `app/apps/mobile/scripts/sentry-upload-sourcemaps.sh`:

```bash
#!/usr/bin/env bash
set -euo pipefail
if [ -z "${SENTRY_AUTH_TOKEN:-}" ]; then echo "[sentry] no token — skip"; exit 0; fi
ORG="${SENTRY_ORG:-karma-community}"
PROJECT="${SENTRY_PROJECT:-kc-mobile}"
npx --yes @sentry/cli releases --org "$ORG" --project "$PROJECT" \
  files "$EXPO_VERSION" upload-sourcemaps dist || { echo "[sentry] upload failed — non-fatal"; exit 0; }
```

`chmod +x` the script; commit `build(observability): EAS post-build hook for Sentry source maps`.

Hook is non-fatal so missing token doesn't block builds. Flag in PR body for PM to add `SENTRY_AUTH_TOKEN` to EAS secrets.

---

## Section F — SSOT updates

### Task F1: Close TD-125, add PERF-1, record D-NN

In `docs/SSOT/TECH_DEBT.md`:
- Delete the `| TD-125 |` row.
- Update `**Last Updated**` line with today's date + one-line note.

In `docs/SSOT/BACKLOG.md` under `## INFRA — Tooling & Environment`:

```
| PERF-1 | Performance Wave 0 — Sentry crash + perf instrumentation + Edge Function timing logger | infra | ✅ Done | `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 0; `docs/superpowers/plans/2026-05-25-perf-wave-0-observability.md` |
```

In `docs/SSOT/DECISIONS.md`, append D-NN (replace with next number):

```markdown
### D-NN — Sentry as the single observability sink for mobile + Edge Functions (2026-05-25)
`@sentry/react-native` for mobile crash + 3 explicit performance marks. Edge Functions use `withTiming` wrapper logging structured JSON to Supabase function logs.
**Sample rates:** Performance 100% dev, 25% prod. Revisit at >1k DAU.
**Why not Datadog/Honeycomb:** vendor cost + integration overhead exceed value at this scale.
```

Commit `docs(ssot): close TD-125, add PERF-1, record D-NN observability decision`.

---

## Section G — Verification + PR

### Task G1: Local verification

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

All green (CLAUDE.md §6).

Web smoke: `pnpm --filter @kc/mobile web` → DevTools Console shows `Sentry Logger [INFO]:` lines. Temporary throw in a leaf component → ErrorBoundary fallback + Network POST to `/api/<project>/store/`. Revert throw.

Edge Function log smoke: `supabase functions deploy dispatch-notification --project-ref roeefqpdbftlndzsvhfj`. Trigger once. Read logs via `mcp__supabase__get_logs` (service `edge-function`). Expect `{"fn":"dispatch-notification","invocation_ms":42,"cold_start":true,"status":200}`.

### Task G2: Push + PR

```bash
git push -u origin chore/PERF-1-observability-baseline
gh pr create --base dev --head chore/PERF-1-observability-baseline \
  --title "chore(observability): wire Sentry + Edge Function timing (PERF-1, Wave 0)" \
  --body "..." --label "PERF" --assignee "@me"
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

PR body cites the spec, lists changes, `Mapped to spec` line, SSOT updated checkboxes, risk notes (sample rates + EAS env action needed).

---

## Section H — Post-merge PM actions

- H1: Add `EXPO_PUBLIC_SENTRY_DSN` to EAS env.
- H2: Add `SENTRY_AUTH_TOKEN` to EAS secrets (scopes: `project:releases`, `project:write`).
- H3: Create 3 Sentry dashboards — cold start, feed first render, image first paint — p50/p75/p95 by `os`.
- H4: Set quota alerts — Performance 70%, Errors 50%.
- H5: Dogfood 48h; each dashboard ≥100 samples.
- H6: Open new TD: "Wire @sentry/react-native expo-router navigation integration for `screen.transition` auto-capture. Deferred from Wave 0 — brittle across Expo SDK versions; 3 explicit marks cover Waves 1–4 gating." 🟢.
