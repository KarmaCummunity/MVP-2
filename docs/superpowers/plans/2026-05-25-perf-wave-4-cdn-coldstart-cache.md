# Performance Wave 4 — CDN + Cold Start + Cache (Cities/Streets) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans.

**Goal:** Make first-launch fast and images snappy worldwide. Close the CDN portion of TD-11; close TD-127 cold-start cluster bullets; cache cities + streets to AsyncStorage (closes part of the Cities/Streets work in P2.30).

**Architecture:** Four independent slices, each shippable on its own.

1. **CDN in front of `post-images`** — Cloudflare DNS + cache rules in front of Supabase Storage. `getSupabasePublicImageUrl` (Wave 1) starts emitting `cdn.karma-community-kc.com/...` URLs. Cache-Control `public, max-age=31536000, immutable` works because uploads include a content hash in the path.
2. **Parallel cold-start in `AuthGate`** — flatten `restoreSession` → `tryDevAutoSignIn` → `bootstrap` into a `Promise.all` for the two independent halves.
3. **AsyncStorage cache for cities/streets** — wrap `SupabaseCityRepository.listAll()` + `SupabaseStreetRepository.listByCity()` in a versioned AsyncStorage layer (7-day TTL).
4. **Hoist web DOM setup to HTML template** — RTL/lang/favicon/viewport blocks move from `_layout.tsx` module load to inline `<script>` in `web/index.html`. Eliminates 10–20ms of JS execution before first paint on web.

**Tech Stack:** Cloudflare (or Bunny — PM-chosen), `@react-native-async-storage/async-storage` (already in project), `expo-router` HTML template hooks, JSON-LD content hashing.

**Spec mapping:** `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 4.

**Depends on:** Wave 1 merged (`getSupabasePublicImageUrl` and `<KCImage>` must exist).

**SSOT updates in this PR:**
- Add `PERF-5` to BACKLOG.md, ✅ Done.
- Close TD-11 (or narrow to private-bucket signed-URL plan, which is post-MVP).
- Partial close TD-127 (cold-start cluster).
- Partial close P2.30 (cities truncation fix; rest of the streets picker work stays open).

**External cost:** Cloudflare free tier covers expected MVP traffic. If switching to Bunny.net, ~$1/mo per 1TB egress. Both negligible.

---

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| Cloudflare account / DNS | PM action | New CNAME `cdn.karma-community-kc.com` → Supabase Storage origin. Cache rule for `/storage/v1/render/image/*` and `/storage/v1/object/public/post-images/*`. |
| `app/apps/mobile/src/lib/imageUrl.ts` | Modify | Emit `cdn.karma-community-kc.com` URLs when `EXPO_PUBLIC_CDN_BASE` is set. Fall back to direct Supabase Storage URL when not. |
| `app/apps/mobile/src/lib/__tests__/imageUrl.test.ts` | Modify | New test: when env var set, URL host is the CDN. |
| `app/apps/mobile/.env.example` | Modify | Document `EXPO_PUBLIC_CDN_BASE`. |
| `app/apps/mobile/src/components/AuthGate.tsx:54-85` | Modify | Parallelise the cold-start chain via `Promise.all`. |
| `app/apps/mobile/src/lib/cache/asyncStorageCache.ts` | Create | Tiny generic `cacheReadThrough<T>(key, version, ttlMs, fetcher)` helper. |
| `app/apps/mobile/src/lib/cache/__tests__/asyncStorageCache.test.ts` | Create | Unit test. |
| `app/packages/infrastructure-supabase/src/cities/SupabaseCityRepository.ts` | Modify | Wrap `listAll()` with `cacheReadThrough`. |
| `app/packages/infrastructure-supabase/src/streets/SupabaseStreetRepository.ts` | Modify | Wrap `listByCity(cityId)` with `cacheReadThrough` keyed by `cityId`. |
| `app/apps/mobile/web/index.html` (or `+html.tsx` per Expo Router config) | Create or Modify | Inline `<script>` for RTL/lang/favicon/viewport (move out of `_layout.tsx`). |
| `app/apps/mobile/app/_layout.tsx:19-90` | Modify | Delete the web DOM mutation block — now in HTML template. |
| `docs/SSOT/TECH_DEBT.md` / `BACKLOG.md` / `DECISIONS.md` | Modify | Close/narrow TDs; add PERF-5; record CDN decision (Cloudflare vs Bunny). |

---

## Pre-flight

- [ ] **Step 0.1**: Waves 0–3 merged. Sentry dashboards show post-Wave-3 baseline. `image.first_paint` should already be far better than Wave 0; this wave attacks the geographic-latency portion.
- [ ] **Step 0.2**: PM confirmation of CDN choice (Cloudflare recommended). PM has access to Cloudflare for the `karma-community-kc.com` zone.
- [ ] **Step 0.3**: Branch `feat/PERF-5-cdn-cold-start-cache-fullstack`.

---

## Section A — Cloudflare CDN

### Task A1: Set up the CNAME + cache rule (PM action)

> This task is mostly UI clicks in Cloudflare; the engineer can write a runbook step-by-step but execution needs Cloudflare account access.

- [ ] **Step A1.1: Add CNAME**

In Cloudflare dashboard for the `karma-community-kc.com` zone:
1. DNS → Add record → Type: `CNAME`, Name: `cdn`, Target: `roeefqpdbftlndzsvhfj.supabase.co`, Proxy: ON (orange cloud).
2. Wait ~60s for propagation.
3. Verify: `dig cdn.karma-community-kc.com CNAME +short` — returns the Supabase host (proxied → Cloudflare's IPs visible).

- [ ] **Step A1.2: Add cache rule**

Caching → Cache Rules → Create:
- Rule name: `Cache public storage`.
- If incoming requests match: URI Path `wildcard` `/storage/v1/render/image/*` OR `/storage/v1/object/public/post-images/*` OR `/storage/v1/object/public/avatars/*`.
- Then: Cache eligibility → Eligible for cache; Edge TTL → Override with `1 year`; Browser TTL → `1 year`.

- [ ] **Step A1.3: Smoke**

```bash
curl -I 'https://cdn.karma-community-kc.com/storage/v1/object/public/avatars/<some-existing-path>'
```

Expected: `cf-cache-status: HIT` (or `MISS` first time, `HIT` on second request). `cache-control: public, max-age=31536000`.

- [ ] **Step A1.4: Record decision**

Append to `docs/SSOT/DECISIONS.md`:

```markdown
### D-NN — Cloudflare CDN in front of Supabase Storage (2026-05-25)

CNAME `cdn.karma-community-kc.com` → `roeefqpdbftlndzsvhfj.supabase.co`, Cloudflare proxied. Cache rule covers `/storage/v1/render/image/*`, `/storage/v1/object/public/post-images/*`, `/storage/v1/object/public/avatars/*` at 1y TTL.

**Why Cloudflare not Bunny:** team already operates on the `karma-community-kc.com` zone; free tier covers expected MVP egress; deploys with one DNS change. Bunny is cheaper at scale (>5TB/mo) — revisit then.

**Risk:** image cache busting requires content-hash in the filename. Verified in `imageUpload.ts` — confirmed (or follow up if not). Without a content hash, edited images would serve stale.
```

### Task A2: Code change — emit CDN URLs from helper

**Files:**
- Modify: `app/apps/mobile/src/lib/imageUrl.ts`
- Modify: `app/apps/mobile/src/lib/__tests__/imageUrl.test.ts`
- Modify: `app/apps/mobile/.env.example`

- [ ] **Step A2.1: Add `EXPO_PUBLIC_CDN_BASE` resolution**

```typescript
function getImageBaseUrl(): string {
  const cdn = process.env.EXPO_PUBLIC_CDN_BASE;
  if (cdn) return cdn.replace(/\/$/, '');
  return getSupabaseBaseUrl();
}

// In `getSupabasePublicImageUrl`:
const base = getImageBaseUrl();
// rest unchanged
```

- [ ] **Step A2.2: Add a test for the CDN host swap**

```typescript
it('emits CDN host when EXPO_PUBLIC_CDN_BASE is set', () => {
  const original = process.env.EXPO_PUBLIC_CDN_BASE;
  process.env.EXPO_PUBLIC_CDN_BASE = 'https://cdn.karma-community-kc.com';
  try {
    const url = getSupabasePublicImageUrl({
      bucket: 'post-images',
      path: 'user-abc/photo.jpg',
      width: 400,
    });
    expect(url.startsWith('https://cdn.karma-community-kc.com/storage/v1/render/image/public/')).toBe(true);
  } finally {
    if (original === undefined) delete process.env.EXPO_PUBLIC_CDN_BASE;
    else process.env.EXPO_PUBLIC_CDN_BASE = original;
  }
});
```

- [ ] **Step A2.3: Document env var**

`.env.example`:

```
# CDN base URL for Supabase Storage public assets. When unset, app talks to Supabase Storage directly.
EXPO_PUBLIC_CDN_BASE=https://cdn.karma-community-kc.com
```

- [ ] **Step A2.4: Run tests, commit**

```bash
cd app && pnpm --filter @kc/mobile test -- imageUrl
git add app/apps/mobile/src/lib/imageUrl.ts app/apps/mobile/src/lib/__tests__/imageUrl.test.ts app/apps/mobile/.env.example
git commit -m "feat(images): emit CDN host when EXPO_PUBLIC_CDN_BASE is set (PERF-5)"
```

---

## Section B — Parallel cold-start in AuthGate

### Task B1: Refactor the bootstrap chain

**Files:**
- Modify: `app/apps/mobile/src/components/AuthGate.tsx:54-85`

- [ ] **Step B1.1: Inspect current sequential chain**

```bash
grep -n "restoreSession\|tryDevAutoSignIn\|bootstrap\|getOnboardingBootstrap" app/apps/mobile/src/components/AuthGate.tsx
```

- [ ] **Step B1.2: Parallelise independent halves**

```typescript
useEffect(() => {
  let cancelled = false;
  (async () => {
    try {
      // restoreSession and tryDevAutoSignIn don't depend on each other.
      const [restored, devSigned] = await Promise.all([
        getRestoreSessionUseCase().execute(),
        tryDevAutoSignIn(),
      ]);
      if (cancelled) return;

      // Bootstrap depends on a known session — read whichever wins.
      const session = devSigned ?? restored;
      if (session) {
        await getOnboardingBootstrap(session);
      }

      // Subscribe AFTER restore so we don't clobber the live session with
      // an INITIAL_SESSION=null that arrives before restore resolves.
      subscribeToSession();
    } catch (err) {
      console.error('AuthGate bootstrap failed', err);
    }
  })();
  return () => { cancelled = true; };
}, []);
```

- [ ] **Step B1.3: Typecheck + commit**

```bash
cd app && pnpm --filter @kc/mobile typecheck
git add app/apps/mobile/src/components/AuthGate.tsx
git commit -m "perf(auth): parallelise cold-start restore + autoSignIn (PERF-5, TD-127)"
```

---

## Section C — AsyncStorage cache for cities + streets

### Task C1: Generic cache helper + test

**Files:**
- Create: `app/apps/mobile/src/lib/cache/asyncStorageCache.ts`
- Create: `app/apps/mobile/src/lib/cache/__tests__/asyncStorageCache.test.ts`

- [ ] **Step C1.1: Failing test**

```typescript
import { describe, expect, it, vi, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { cacheReadThrough, _clearForTests } from '../asyncStorageCache';

describe('cacheReadThrough', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    _clearForTests();
  });

  it('calls fetcher on cache miss and stores result', async () => {
    const fetcher = vi.fn(async () => ['a', 'b']);
    const out = await cacheReadThrough({ key: 'k1', version: 1, ttlMs: 1000, fetcher });
    expect(out).toEqual(['a', 'b']);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('returns cached value on hit without calling fetcher', async () => {
    const fetcher1 = vi.fn(async () => ['x']);
    await cacheReadThrough({ key: 'k2', version: 1, ttlMs: 60_000, fetcher: fetcher1 });
    const fetcher2 = vi.fn(async () => ['y']);
    const out = await cacheReadThrough({ key: 'k2', version: 1, ttlMs: 60_000, fetcher: fetcher2 });
    expect(out).toEqual(['x']);
    expect(fetcher2).not.toHaveBeenCalled();
  });

  it('invalidates on version mismatch', async () => {
    await cacheReadThrough({ key: 'k3', version: 1, ttlMs: 60_000, fetcher: async () => 'v1' });
    const out = await cacheReadThrough({ key: 'k3', version: 2, ttlMs: 60_000, fetcher: async () => 'v2' });
    expect(out).toBe('v2');
  });

  it('refetches when entry exceeds ttl', async () => {
    await cacheReadThrough({ key: 'k4', version: 1, ttlMs: 0, fetcher: async () => 'a' });
    const out = await cacheReadThrough({ key: 'k4', version: 1, ttlMs: 0, fetcher: async () => 'b' });
    expect(out).toBe('b');
  });
});
```

> Vitest config needs the `@react-native-async-storage/async-storage` mock. Most monorepos already have one; if not, install `@react-native-async-storage/async-storage/jest/async-storage-mock` and wire it via `vitest.config.ts`'s `setupFiles`.

- [ ] **Step C1.2: Implement**

```typescript
// Generic read-through cache over AsyncStorage.
// - Versioned (bump `version` to invalidate the whole keyspace).
// - TTL'd (entries older than ttlMs are treated as misses).
// - Safe on parse errors (returns fresh).
import AsyncStorage from '@react-native-async-storage/async-storage';

type Entry<T> = { v: number; at: number; value: T };

type Args<T> = {
  key: string;
  version: number;
  ttlMs: number;
  fetcher: () => Promise<T>;
};

// In-memory dedupe so concurrent calls during a single mount don't double-fetch.
const inflight = new Map<string, Promise<unknown>>();

export async function cacheReadThrough<T>(args: Args<T>): Promise<T> {
  const { key, version, ttlMs, fetcher } = args;

  const cached = await safeRead<T>(key);
  if (cached && cached.v === version && Date.now() - cached.at < ttlMs) {
    return cached.value;
  }

  const existing = inflight.get(key) as Promise<T> | undefined;
  if (existing) return existing;

  const p = (async () => {
    try {
      const value = await fetcher();
      const entry: Entry<T> = { v: version, at: Date.now(), value };
      await AsyncStorage.setItem(key, JSON.stringify(entry));
      return value;
    } finally {
      inflight.delete(key);
    }
  })();
  inflight.set(key, p);
  return p;
}

async function safeRead<T>(key: string): Promise<Entry<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as Entry<T>;
  } catch {
    return null;
  }
}

export function _clearForTests(): void {
  inflight.clear();
}
```

- [ ] **Step C1.3: PASS + commit**

```bash
cd app && pnpm --filter @kc/mobile test -- asyncStorageCache
git add app/apps/mobile/src/lib/cache/asyncStorageCache.ts app/apps/mobile/src/lib/cache/__tests__/asyncStorageCache.test.ts
git commit -m "feat(cache): generic AsyncStorage read-through helper (PERF-5)"
```

### Task C2: Cache cities `listAll`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/cities/SupabaseCityRepository.ts`

> Domain/application layers must not import AsyncStorage. Therefore the cache wrapper lives at the *mobile* side (composition root) wrapping the repository, not inside the repo itself. Concretely: keep the raw `SupabaseCityRepository` untouched, and create a `CachedCityRepository` decorator at `app/apps/mobile/src/lib/repositories/CachedCityRepository.ts` that implements `ICityRepository` and delegates to the Supabase one through `cacheReadThrough`.

- [ ] **Step C2.1: Create the decorator**

`app/apps/mobile/src/lib/repositories/CachedCityRepository.ts`:

```typescript
import type { ICityRepository, City } from '@kc/application';
import { cacheReadThrough } from '../cache/asyncStorageCache';

const VERSION = 1; // bump on cities schema change

export class CachedCityRepository implements ICityRepository {
  constructor(private readonly inner: ICityRepository) {}

  listAll(): Promise<readonly City[]> {
    return cacheReadThrough({
      key: 'kc:cities:listAll',
      version: VERSION,
      ttlMs: 7 * 24 * 60 * 60_000,
      fetcher: () => this.inner.listAll(),
    });
  }

  // Pass through any other methods unchanged.
}
```

- [ ] **Step C2.2: Wire into the composition root (`src/lib/container.ts`)**

Wherever the SupabaseCityRepository is instantiated, wrap it:

```typescript
import { CachedCityRepository } from './repositories/CachedCityRepository';
// ...
const cityRepo = new CachedCityRepository(new SupabaseCityRepository(client));
```

- [ ] **Step C2.3: Commit**

```bash
git add app/apps/mobile/src/lib/repositories/CachedCityRepository.ts app/apps/mobile/src/lib/container.ts
git commit -m "feat(cache): CachedCityRepository decorator with 7d AsyncStorage cache (PERF-5)"
```

### Task C3: Cache streets `listByCity`

**Files:**
- Create: `app/apps/mobile/src/lib/repositories/CachedStreetRepository.ts`
- Modify: `app/apps/mobile/src/lib/container.ts`

- [ ] **Step C3.1: Create decorator**

```typescript
import type { IStreetRepository, Street } from '@kc/application';
import { cacheReadThrough } from '../cache/asyncStorageCache';

const VERSION = 1;

export class CachedStreetRepository implements IStreetRepository {
  constructor(private readonly inner: IStreetRepository) {}

  listByCity(cityId: string): Promise<readonly Street[]> {
    return cacheReadThrough({
      key: `kc:streets:listByCity:${cityId}`,
      version: VERSION,
      ttlMs: 7 * 24 * 60 * 60_000,
      fetcher: () => this.inner.listByCity(cityId),
    });
  }
}
```

- [ ] **Step C3.2: Wire**

```typescript
const streetRepo = new CachedStreetRepository(new SupabaseStreetRepository(client));
```

- [ ] **Step C3.3: Commit**

```bash
git add app/apps/mobile/src/lib/repositories/CachedStreetRepository.ts app/apps/mobile/src/lib/container.ts
git commit -m "feat(cache): CachedStreetRepository decorator (PERF-5)"
```

---

## Section D — Hoist web DOM setup

### Task D1: Move RTL/lang/favicon/viewport into HTML template

**Files:**
- Create or Modify: `app/apps/mobile/web/index.html` OR an `expo-router` `+html.tsx` file (Expo's `web.output: "single"` makes `+html.tsx` not apply per the comment in `_layout.tsx:9-11`)
- Modify: `app/apps/mobile/app/_layout.tsx:19-90` — delete the now-redundant block

- [ ] **Step D1.1: Verify Expo web output mode**

```bash
grep -n "web" app/apps/mobile/app.json
```

If `web.output: "single"` (current), `+html.tsx` is ignored. The single-output mode uses Expo's default template. We need to inject via a different mechanism — likely the `expo export --platform web` post-step, or by switching to `"static"` output (more invasive).

Alternative path that's known to work with `output: "single"`: leave the JS-driven setup in place but move the `<style>` injection earlier — the cheap wins are in the `<style>` blob, which currently inserts after React mount. Pulling that out won't be possible without changing the build pipeline.

- [ ] **Step D1.2: Choose path**

If switching to `output: "static"` is undesired (it would require re-validating routing, manifests, push deep-link handling — significant scope creep), **defer Task D1 to a follow-up TD** and document the deferral.

Recommended call: defer. The cold-start gain is ~10–20ms; not worth the risk of breaking deep links during this wave. Open a new TD: `Hoist mobile-web RTL/viewport/style setup out of _layout.tsx into an HTML template. Requires switching web.output to "static"; validate all manifests + deep-link routing first. Wave 4 deferred.`

- [ ] **Step D1.3: If deferred, no commit needed in this wave**

---

## Section E — SSOT updates + PR

### Task E1: SSOT

**Files:**
- Modify: `docs/SSOT/TECH_DEBT.md`, `docs/SSOT/BACKLOG.md`, `docs/SSOT/DECISIONS.md`

- [ ] **Step E1.1: Close / narrow TDs**

- TD-11: narrow to "post-images is public-read; private-bucket + signed-URL path not implemented (post-MVP)". The CDN portion is done.
- TD-127: narrow. AuthGate parallel cold-start sub-bullet is closed; typed-route escapes (other sub-bullet) is unrelated.
- If Section D was deferred, add a new TD for the HTML template hoist.

- [ ] **Step E1.2: Add PERF-5**

Under `## P2 — Stats, Admin & Polish`:

```
| PERF-5 | Performance Wave 4 — Cloudflare CDN in front of post-images + parallel cold-start + AsyncStorage cache for cities/streets | agent-fullstack | ✅ Done | `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 4; `docs/superpowers/plans/2026-05-25-perf-wave-4-cdn-coldstart-cache.md` |
```

- [ ] **Step E1.3: Add CDN decision (already drafted in Task A1.4)**

Confirm `D-NN` is appended in DECISIONS.md.

- [ ] **Step E1.4: Commit**

```bash
git add docs/SSOT/TECH_DEBT.md docs/SSOT/BACKLOG.md docs/SSOT/DECISIONS.md
git commit -m "docs(ssot): narrow TD-11/TD-127, add PERF-5 + D-NN CDN decision"
```

### Task E2: Verification

- [ ] **Step E2.1: Pre-push**

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

- [ ] **Step E2.2: Smoke web**

`pnpm --filter @kc/mobile web`
- DevTools Network → image requests go to `cdn.karma-community-kc.com` and return `cf-cache-status: HIT` on the second load.
- Open city picker; first open hits DB; reload app and re-open — second open returns from AsyncStorage (no Network call).
- Profile reload of the home tab; `app.cold_start` p50 should drop ~25% vs Wave 0 baseline (Sentry).

- [ ] **Step E2.3: Push + PR**

```bash
git push -u origin feat/PERF-5-cdn-cold-start-cache-fullstack
gh pr create --base dev --head feat/PERF-5-cdn-cold-start-cache-fullstack \
  --title "perf: Wave 4 — Cloudflare CDN + parallel cold-start + cities/streets cache (PERF-5)" \
  --body "..." \
  --label "PERF" --assignee "@me"
gh pr merge --auto --squash --delete-branch
```

---

## Section F — Post-Wave-4 follow-ups

- [ ] **F1: Confirm Sentry geo-segmented metrics**

After 48h of post-merge traffic, segment `image.first_paint` p50 by Sentry country tag. Users outside the Supabase region should drop ≥40%. If not, check the CDN cache hit rate via Cloudflare analytics.

- [ ] **F2: Decide on private-bucket signed-URL plan**

TD-11's remaining concern is that `OnlyMe` and `FollowersOnly` posts rely on URL non-discoverability. Pre-launch hardening: move private posts to a separate bucket + sign-on-fetch (or generate short-lived URLs from a SECURITY DEFINER function). Out of scope for Wave 4; capture in a new TD.

- [ ] **F3: Revisit Bunny.net**

If Cloudflare egress costs become an issue post-launch (unlikely below 5TB/mo), evaluate Bunny.net. Decision criteria captured in D-NN; revisit at 12-month traffic projections.

---

## Wave summary across the 5 plans

By the end of Wave 4, the user-facing app should feel like a different product:
- **Cold start**: ~25% faster (parallel auth bootstrap + DOM-template hoist when un-deferred).
- **Image bandwidth**: ↓ ~75–90% (transform URLs from Wave 1 × CDN cache from Wave 4).
- **Image first paint**: ↓ ~70% vs Wave 0 baseline (cache + edge POPs).
- **Feed re-render storms**: gone (Wave 1).
- **Feed Postgres reads**: ↓ 50% (Wave 2's single RPC).
- **Inbox open**: ↓ 60% on first-byte time (Wave 2's LATERAL JOIN RPC).
- **Push notification server cost**: ↓ 50–95% (Wave 3's batch + cron).
- **Cities/streets first-open**: instant after first session (Wave 4 cache).
- **Observability**: Sentry crash + 3 perf marks across all environments (Wave 0).

Each wave is independently mergeable; if at any point the team wants to pause, the app stays in a consistent state. The waves were sequenced so earlier ones give later ones better measurement signal.
