# App Performance Overhaul — Design

| Field | Value |
| --- | --- |
| **Date** | 2026-05-25 |
| **Status** | Draft — planning artifact, not execution |
| **Mapped to spec** | Cross-cutting. Closes TD-126 (perf cluster), TD-137 (feed N+1), TD-11 (CDN), TD-135 (community stats cache), TD-92 (notification dispatcher), TD-125 (Sentry), partial TD-127 (cold-start cluster), TD-72 (actor identity projection) |
| **Driver** | PM directive — "make the app feel fast and smooth" |

---

## TL;DR

The app does not have one big performance bug. It has **seven layers of waste that compound**. A focused four-week effort organised into five waves addresses all of them. Wave 1 (images + re-renders) gives the most visible improvement within one week. Wave 3 (push dispatcher) is the biggest server-cost cut.

**Caching:** No Redis at this stage. Cache wins come from AsyncStorage (cities/streets), persisted React Query (feed/profile), Postgres materialized views (community stats), and a CDN (image edge caching). Redis revisited post-launch at >5k DAU.

**Measurement:** Wave 0 wires Sentry + custom marks. TD-125 (no crash reporting) is already a pre-launch blocker — bundling it here gets baseline for free.

---

## Goals

1. First-contentful render of the feed ≤ 1.5s on a cold start over LTE.
2. Scroll FPS ≥ 55 on iPhone 11 / equivalent Android, on feed and search.
3. Image bandwidth per session ↓ 80%+.
4. Postgres reads per feed page ↓ 50%.
5. Push dispatcher cost per notification ↓ 90%+.
6. Baseline observability: Sentry crash + performance with three custom marks (cold start, feed first render, image first paint).

## Non-goals

- New product features.
- Rewriting Clean Architecture invariants.
- Migrating runtime / DB / ORM.
- Multi-region database.
- Redis/Upstash infrastructure.
- i18n namespace lazy-load (not the bottleneck).
- FlashList migration (defer to post-Wave-1 evaluation).

---

## Diagnosis — the seven layers of waste

### Layer A — Imaging (🔴🔴🔴, most user-visible)
- Full-resolution images served into 200px thumbnails (`PostCardGrid.tsx:61`) — wastes ~25× bandwidth per image.
- Full-resolution avatars served into 40px circles (`AvatarInitials.tsx:38`).
- `getPublicUrl()` called from inside `render()` (`PostCardGrid.tsx:60-62`).
- No `expo-image` anywhere → no disk cache → every tab switch re-downloads.
- `post-images` bucket fetched direct from Supabase Storage origin (TD-11).

### Layer B — Re-render storm in lists (🔴🔴)
- `useFilterStore()` bare call (`(tabs)/index.tsx:34`), `useAuthStore()` destructure (`AuthGate.tsx:44`), `useSearchStore()` bare call (`(tabs)/search.tsx:66`).
- `formatDistanceToNow()` called inline from PostCard / PostCardGrid render body — Hebrew locale heavy; recomputed per visible card per render.
- `PostCardGrid` not memo'd; renderItem inline arrow (`PostFeedList.tsx:78-82`); breaks virtualization.
- `OnboardingSoftGate` provider `value={{ ... }}` recreated every render.

### Layer C — Push notification dispatcher (🔴🔴🔴, biggest server-cost waste)
- One Edge Function invocation per notification (`dispatch-notification/index.ts:51`) — cold-start per dispatch.
- One Expo Push API call per notification (`dispatch-notification/index.ts:156`) — Expo supports 100 messages per call.
- `DeviceNotRegistered` errors trigger `DELETE … WHERE push_token = …` inside a loop.
- Two separate `count(*)` queries for coalescing.
- TD-92 per-minute dedupe key blocks "X new messages" coalescer.

### Layer D — N+1 / over-fetching in DB calls (🟠🔴)
- Feed: `feed_ranked_ids` RPC + secondary `.in('id', …)` SELECT (TD-137).
- Inbox: `getMyChats.ts:45-91` three sequential SELECTs (chats → last messages → users).
- Feed actor identity projection: separate SELECTs for `post_actor_identity` and `follow_edges`.
- `select('*')` in `chats`, `messages`, `donation_links`, `post_actor_identity`.
- RLS policy `0106_recipients_select_visible_viewers.sql` — two EXISTS subqueries per row.
- `getMyChats` no `.limit()`.

### Layer E — Refetch storms (🟠)
- `QueryClient` defaults: `staleTime: 2min`, `refetchOnWindowFocus: true` (default), `refetchOnMount: true` (default).
- `useFeedRealtime.ts:43-47`: on app resume, re-subscribes AND triggers full feed refetch.
- Community stats polled every 60s (`useCommunityStatsAbout.ts:45`, `stats.tsx:45`).
- Account gate polled every 60s.
- `stats.tsx:56-62` calls `invalidateQueries` on every focus.

### Layer F — Realtime channels (🟠)
- Inbox subscription no `filter:` clause.
- Per-chat channel topic uses `Math.random()` → orphans.
- Unread total RPC fires on both INSERT and UPDATE events.

### Layer G — Cold start (🟠)
- `AuthGate` runs `restoreSession` → `tryDevAutoSignIn` → `bootstrap` sequentially.
- Hebrew locale (~164KB) imported eagerly.
- Web DOM mutations executed inside React module-load.

---

## Approach — five waves

| Wave | Theme | Effort | User-visible impact |
| --- | --- | --- | --- |
| 0 | Observability baseline (Sentry + 3 marks + Edge Function timing) | 2 days | None directly; unlocks measurement |
| 1 | Imaging + re-renders | 5–7 days | Dramatic — feed feels smooth, images cached, data usage drops |
| 2 | DB + React Query | 4–6 days | Feed page-load ½ time; tab switches no longer trigger refetch |
| 3 | Push dispatcher batching | 3–4 days | Fewer notification spam-bursts; major server-cost cut |
| 4 | CDN + cold start + cache cities/streets | 3–4 days | First-open faster; images snappy worldwide; onboarding faster |

Each wave is one PR (or PR cluster) targeting `dev`. Each wave is independently shippable. Total: 3–4 weeks for one engineer.

---

## Caching strategy

| Tier | What lives here | Wave |
| --- | --- | --- |
| In-memory (React Query) | feed, profile, post detail, follow-state, search | Wave 2 |
| AsyncStorage (per device) | cities, streets, legal docs (already done), last-known feed page | Wave 4 |
| Postgres materialized view + cron | `community_stats`, future leaderboards | Wave 2 tuning |
| CDN edge (Cloudflare) | post images, avatars | Wave 4 |

**When Redis becomes interesting (deferred):** DAU > 5000 + community stats > 1M reads/day; or distributed rate-limiting on Edge Functions; or cross-device presence; or idempotency keys across dispatcher batches.

---

## Risks & open questions

| Risk | Mitigation |
| --- | --- |
| Sentry quota cost in prod | 25% sample rate; revisit at >1k DAU |
| `expo-image` platform bugs | Behind `<KCImage>` wrapper — swap implementations in one place |
| New feed RPC visibility diverges from JS path | Integration probe set: Public/Followers/OnlyMe owner, banned, blocked, hidden identity |
| CDN URL cache bust on image edits | Verify content-hash in upload pipeline; `cache-control: immutable` is safe iff hash present |
| 5s batch latency annoying for chat | Immediate path preserved for `urgency='high'` rows |

## Mapped to spec / TDs

Closes: TD-126, TD-137, TD-135, TD-125. Partial: TD-11, TD-127, TD-92, TD-72. Spins out: FlashList migration, i18n namespace split, signed-URL plan for private posts.

BACKLOG.md rows added during execution:
- PERF-1 (Wave 0) — INFRA lane.
- PERF-2 (Wave 1) — P1, FE.
- PERF-3 (Wave 2) — P1, BE+FE.
- PERF-4 (Wave 3) — P2, BE.
- PERF-5 (Wave 4) — P2, mixed.

## Success metrics (post-Wave-4 dashboard)

| Metric | Wave 0 baseline | Target after Wave 4 |
| --- | --- | --- |
| `app.cold_start` p50 | TBD (Wave 0 measures) | ≤ 1500ms |
| `feed.first_render` p50 | TBD | ≤ 800ms |
| `image.first_paint` p50 | TBD | ≤ 250ms |
| Postgres reads per feed page | 2 | 1 |
| Edge Function invocations per 10-msg burst | 10 | ≤ 2 |
| Image bytes per session | TBD | ↓ ≥ 75% |
