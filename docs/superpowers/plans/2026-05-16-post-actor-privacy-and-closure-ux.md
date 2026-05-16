# Post actor privacy & closed-post closure UX — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship safer closed-post UX (hide contact when not open, unified copy), then add **server-backed** per-actor identity projection on post surfaces while keeping **profiles and chat participants always identifiable**; align with existing `posts.visibility` and chat anchor lifecycle.

**Architecture:** Keep `Post.visibility` / RLS / `is_post_visible_to` for **post discovery**. Add `post_actor_identity` (per `post_id` + `user_id`) for **actor exposure** + counterparty masking rules, with **OnlyMe → forced hide toward counterparty** applied in a pure domain projector called from `SupabasePostRepository` after fetching joined rows. Mobile consumes projected fields only; masked rows do not deep-link to profile for the counterparty.

**Tech Stack:** TypeScript monorepo (`app/packages/domain`, `application`, `infrastructure-supabase`, `apps/mobile`), Supabase Postgres + RLS, Vitest, expo-router, TanStack Query.

**Design spec:** `docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md`

---

## File structure (anticipated)

**Create**

- `supabase/migrations/0083_post_actor_identity.sql` — table + RLS + optional `updated_at` trigger.
- `app/packages/domain/src/postActorIdentity.ts` — enums + pure `projectPostActorIdentities(...)`.
- `app/packages/domain/src/__tests__/postActorIdentity.test.ts` — projector unit tests.
- `app/packages/infrastructure-supabase/src/posts/fetchPostActorIdentityRows.ts` — thin Supabase select helper (or inline private method).
- `app/packages/infrastructure-supabase/src/posts/applyPostActorIdentityProjection.ts` — wires fetch + domain call for `PostWithOwner`.

**Modify**

- `app/packages/domain/src/index.ts` — export new module.
- `app/packages/application/src/ports/IPostRepository.ts` — if new mutation `upsertPostActorIdentity` needed; else RPC via new port `IPostActorIdentityRepository` (prefer small dedicated port to avoid bloating `IPostRepository`).
- `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` — `findById`, `getFeed` result mapping, `getProfileClosedPostsHelper` hydration path.
- `app/packages/infrastructure-supabase/src/posts/mapPostRow.ts` — only if projection fits cleaner as post-mapper wrapper.
- `app/apps/mobile/app/post/[id].tsx` — CTA guard + pass navigability flags into author / callout children.
- `app/apps/mobile/src/components/post-detail/RecipientCallout.tsx` — respect `profileNavigable` / masked display.
- `app/apps/mobile/src/components/closure/OwnerActionsBar.tsx`, `RecipientUnmarkBar.tsx`, `ReopenConfirmModal.tsx` — copy keys.
- `app/apps/mobile/src/i18n/locales/he/modules/closure.ts` — shared strings.
- `docs/SSOT/spec/04_posts.md`, `05_closure_and_reopen.md`, `02_profile_and_privacy.md`, `docs/SSOT/DECISIONS.md`, `docs/SSOT/BACKLOG.md` — FR + D-entry.

**Verify-only (existing behaviour)**

- `supabase/migrations/0026_chat_anchor_lifecycle.sql` — already clears `chats.anchor_post_id` on close; `AnchoredPostCard.tsx` invalidates post query on `post_closed` system message.

---

## Task 1 — P0: Hide “contact poster” unless post is `open`

**Files:**

- Modify: `app/apps/mobile/app/post/[id].tsx` (footer CTA block ~L166–176)
- Modify: any parent that passes `onMessagePress` into `PostCard` for non-open posts (search under `app/apps/mobile` for `onMessagePress=`)

- [ ] **Step 1.1: Guard CTA in post detail**

Change the non-owner branch so the message button renders **only** when `post.status === 'open'` **and** viewer is authenticated (keep existing `contactPoster` null-user handling inside `contactPoster` as today).

Illustrative patch (adapt to exact JSX):

```tsx
      ) : !isOwner && post.status === 'open' ? (
        <View style={styles.cta}>
          <TouchableOpacity
            style={styles.messageBtn}
            onPress={() => contactPoster(viewerId, post, router)}
            accessibilityRole="button"
            accessibilityLabel={t('post.detail.contactA11y')}
          >
            <Text style={styles.messageBtnText}>{t('post.detail.contactCta')}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
```

- [ ] **Step 1.2: Grep for other contact affordances**

Run:

```bash
cd /Users/navesarussi/Desktop/MVP-2/app && rg "onMessagePress|contactPoster" apps/mobile
```

If `onMessagePress` is passed for `closed_*` cards, gate it with the same `post.status === 'open'` rule.

- [ ] **Step 1.3: SSOT touch**

Edit `docs/SSOT/spec/04_posts.md` under `FR-POST-014` — add AC: primary contact CTA only when `open`.

- [ ] **Step 1.4: Verify**

Run from `app/`:

```bash
pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green.

---

## Task 2 — P1: Shared Hebrew copy (“החפץ לא נמסר בסוף”)

**Files:**

- Modify: `app/apps/mobile/src/i18n/locales/he/modules/closure.ts`
- Modify: `app/apps/mobile/src/components/closure/OwnerActionsBar.tsx`
- Modify: `app/apps/mobile/src/components/post-detail/RecipientUnmarkBar.tsx`
- Modify: `app/apps/mobile/src/components/closure/ReopenConfirmModal.tsx` (if present)
- Modify: `docs/SSOT/spec/05_closure_and_reopen.md` — FR-CLOSURE-005 / 007 copy ACs (English)

- [ ] **Step 2.1: Add i18n keys**

Example keys (final names at implementer discretion):

```ts
// closure.ts (illustrative)
export const closure = {
  itemNotDeliveredCta: 'החפץ לא נמסר בסוף',
  itemNotDeliveredTitle: '…',
  itemNotDeliveredBody: '…',
};
```

- [ ] **Step 2.2: Wire components** to use the shared key for button label + a11y label.

- [ ] **Step 2.3: Verify** — same trio: `pnpm typecheck && pnpm test && pnpm lint`.

---

## Task 3 — Domain: pure identity projector (TDD first)

**Files:**

- Create: `app/packages/domain/src/postActorIdentity.ts`
- Create: `app/packages/domain/src/__tests__/postActorIdentity.test.ts`
- Modify: `app/packages/domain/src/index.ts`

- [ ] **Step 3.1: Write failing tests**

`app/packages/domain/src/__tests__/postActorIdentity.test.ts`:

```typescript
import { describe, expect, it } from 'vitest';
import { projectActorIdentityForViewer, type ActorExposure, type ActorIdentityInput } from '../postActorIdentity';

const baseActor: ActorIdentityInput = {
  userId: 'u_owner',
  displayName: 'Moshe',
  shareHandle: 'moshe',
  avatarUrl: 'https://x/y.jpg',
};

describe('projectActorIdentityForViewer', () => {
  it('returns full profile when exposure Public and viewer is stranger', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', {
      viewerUserId: 'u_stranger',
      isCounterparty: false,
      viewerFollowsActor: false,
      forceCounterpartyAnonymous: false,
      ownerPostVisibilityOnlyMe: false,
    });
    expect(r.mode).toBe('full');
    expect(r.displayName).toBe('Moshe');
    expect(r.profileNavigableFromPost).toBe(true);
  });

  it('hides from counterparty when flag set', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', {
      viewerUserId: 'u_partner',
      isCounterparty: true,
      viewerFollowsActor: true,
      forceCounterpartyAnonymous: true,
      ownerPostVisibilityOnlyMe: false,
    });
    expect(r.mode).toBe('anonymous');
    expect(r.profileNavigableFromPost).toBe(false);
  });

  it('forces anonymous to counterparty when owner post is OnlyMe (coupling)', () => {
    const r = projectActorIdentityForViewer(baseActor, 'Public', {
      viewerUserId: 'u_partner',
      isCounterparty: true,
      viewerFollowsActor: true,
      forceCounterpartyAnonymous: false,
      ownerPostVisibilityOnlyMe: true,
    });
    expect(r.mode).toBe('anonymous');
  });

  it('FollowersOnly hides from stranger', () => {
    const r = projectActorIdentityForViewer(baseActor, 'FollowersOnly', {
      viewerUserId: 'u_stranger',
      isCounterparty: false,
      viewerFollowsActor: false,
      forceCounterpartyAnonymous: false,
      ownerPostVisibilityOnlyMe: false,
    });
    expect(r.mode).toBe('anonymous');
  });
});
```

Run (expect RED):

```bash
cd /Users/navesarussi/Desktop/MVP-2/app && pnpm --filter @kc/domain test -- postActorIdentity
```

- [ ] **Step 3.2: Implement minimal module** `postActorIdentity.ts` exporting `ActorExposure`, `ActorIdentityInput`, `ProjectedActorIdentity`, and `projectActorIdentityForViewer` until tests pass.

- [ ] **Step 3.3: Export** from `index.ts`.

---

## Task 4 — Migration `post_actor_identity`

**Files:**

- Create: `supabase/migrations/0083_post_actor_identity.sql`

- [ ] **Step 4.1: Add migration**

```sql
-- 0083_post_actor_identity.sql
-- Design: docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md

set search_path = public;

create table if not exists public.post_actor_identity (
  post_id uuid not null references public.posts (post_id) on delete cascade,
  user_id uuid not null references public.users (user_id) on delete cascade,
  exposure text not null check (exposure in ('Public', 'FollowersOnly', 'Hidden')),
  hide_from_counterparty boolean not null default false,
  updated_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create index if not exists post_actor_identity_user_idx
  on public.post_actor_identity (user_id);

alter table public.post_actor_identity enable row level security;

-- SELECT: any viewer who may see the post row may read identity policy rows
-- (needed so the client can project names consistently for third parties).
create policy post_actor_identity_select_post_visible
  on public.post_actor_identity for select
  using (
    exists (
      select 1 from public.posts p
      where p.post_id = post_actor_identity.post_id
        and public.is_post_visible_to(p, auth.uid())
    )
  );

-- INSERT: only the actor themselves, and only if they are owner or recipient.
create policy post_actor_identity_insert_participant
  on public.post_actor_identity for insert
  with check (
    user_id = auth.uid()
    and (
      exists (
        select 1 from public.posts p
        where p.post_id = post_actor_identity.post_id
          and p.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.recipients r
        where r.post_id = post_actor_identity.post_id
          and r.recipient_user_id = auth.uid()
      )
    )
  );

-- UPDATE: same participant gate; row must already belong to actor.
create policy post_actor_identity_update_own_participant
  on public.post_actor_identity for update
  using (user_id = auth.uid())
  with check (
    user_id = auth.uid()
    and (
      exists (
        select 1 from public.posts p
        where p.post_id = post_actor_identity.post_id
          and p.owner_id = auth.uid()
      )
      or exists (
        select 1 from public.recipients r
        where r.post_id = post_actor_identity.post_id
          and r.recipient_user_id = auth.uid()
      )
    )
  );

-- DELETE: optional — if omitted, disallow delete (use upsert only).
-- grant select/insert/update on public.post_actor_identity to authenticated;
-- (match grants style used for peer tables in 0002_init_posts.sql)
```

Adjust `grant` lines to match the repo’s prevailing pattern for new tables (see tail of `0002_init_posts.sql`).

- [ ] **Step 4.2: `supabase db reset` locally** (or `migration up`) and confirm table exists.

---

## Task 5 — Infrastructure: fetch policies + apply projection on `findById`

**Files:**

- Create: `app/packages/infrastructure-supabase/src/posts/applyPostActorIdentityProjection.ts`
- Modify: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` — `findById(postId, viewerId)` must pass real `viewerId` into projection (rename `_viewerId`).

- [ ] **Step 5.1: Implement fetch** of 0–2 identity rows for `post_id`.

- [ ] **Step 5.2: Build `ViewerContext`** for owner + recipient (follow queries may reuse existing patterns from feed or a lightweight `is_following` RPC if already present).

- [ ] **Step 5.3: Map** `PostWithOwner.ownerName` / `ownerHandle` / `ownerAvatarUrl` / `recipientUser` through `projectActorIdentityForViewer`.

- [ ] **Step 5.4: Adapter tests** — extend `app/packages/infrastructure-supabase/src/posts/__tests__/` with a focused test using mocked client or existing test harness if available; otherwise add application-level test on a fake repository that asserts domain projector integration.

- [ ] **Step 5.5: `pnpm --filter @kc/infrastructure-supabase test`**

---

## Task 6 — Extend projection to feed + profile closed posts

**Files:**

- Modify: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` — `getFeed` mapping path
- Modify: `app/packages/infrastructure-supabase/src/posts/getProfileClosedPostsHelper.ts` (or companion mapper)

- [ ] **Step 6.1:** Extract shared helper used by `findById` and list mappers to avoid triple duplication (respect **≤300 lines/file** — split helpers if needed).

- [ ] **Step 6.2:** Run full `pnpm test` from `app/`.

---

## Task 7 — RPC or repository method to upsert actor identity

**Files:**

- Create (optional port): `app/packages/application/src/ports/IPostActorIdentityRepository.ts`
- Create use case: `app/packages/application/src/posts/UpsertPostActorIdentityUseCase.ts` + `__tests__`
- Mobile wiring in `app/apps/mobile/src/services/postsComposition.ts`

- [ ] **Step 7.1:** Expose `upsert` only to authenticated owner/recipient; validate participant server-side (RLS is backstop).

- [ ] **Step 7.2:** Mobile UI — minimal toggle sheet on post detail for eligible users (`closed_delivered` + participant). Wire mutation + `queryClient.invalidateQueries`.

---

## Task 8 — UI: RecipientCallout & author row navigability

**Files:**

- Modify: `app/apps/mobile/src/components/post-detail/RecipientCallout.tsx`
- Modify: `app/apps/mobile/app/post/[id].tsx`

- [ ] **Step 8.1:** Extend `PostWithOwner` type in `IPostRepository.ts` with booleans (names illustrative):

```typescript
export interface PostWithOwner extends Post {
  // ...existing...
  ownerProfileNavigableFromPost?: boolean;
  recipientProfileNavigableFromPost?: boolean;
}
```

- [ ] **Step 8.2:** When `false`, render `TouchableOpacity` as `View` / disable `onPress` for profile navigation; keep avatar initials optional (product: masked label from i18n `common.anonymous` or new key).

---

## Task 9 — SSOT + DECISIONS + BACKLOG closure

**Files:**

- Modify: `docs/SSOT/spec/04_posts.md`, `05_closure_and_reopen.md`, `02_profile_and_privacy.md`
- Modify: `docs/SSOT/DECISIONS.md` — new `D-*` documenting **visibility vs actor identity** split + chat/profile rules
- Modify: `docs/SSOT/BACKLOG.md` — mark related items Done / In progress

- [ ] **Step 9.1:** Add FR-IDs for actor identity (allocate next free IDs per file convention).

---

## Task 10 — Final verification gate

- [ ] From `app/`:

```bash
pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green.

- [ ] Manual smoke (device):

1. Open post as non-owner → CTA visible only if `open`.
2. Close from chat → anchored card disappears (existing).
3. With identity row `hide_from_counterparty = true`, counterparty sees anonymous strings and **cannot** tap into profile from callout/author row; third-party viewer follows **A** rules.

---

## Plan self-review

| Design requirement | Task coverage |
| --- | --- |
| CTA only on `open` | Task 1 |
| Copy unify reopen/unmark | Task 2 |
| Two-axis model (visibility vs identity) | Tasks 3–6 + spec Task 9 |
| Server-side enforcement | Tasks 4–5 (RLS + projection on all read paths) |
| Counterparty vs own framing | Domain rules Task 3 |
| OnlyMe coupling | Domain test Task 3 + projection input wiring Task 5 |
| Chat/profile always real users | Design doc + Task 8 (no chat file changes expected) |
| Third-party independent evaluation | Domain per-actor calls Task 5–6 |

**Placeholder scan:** none intentional; migration policies must be completed to production quality before PR.

**Type consistency:** `ActorExposure` strings must match SQL check constraint and Zod/DB types generation if used.

---

## Execution handoff

**Plan complete** and saved to `docs/superpowers/plans/2026-05-16-post-actor-privacy-and-closure-ux.md`.  
**Design** saved to `docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md`.

Per repo workflow, **commit these docs when you choose** (not auto-committed).

**Two execution options:**

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks.  
2. **Inline execution** — run tasks sequentially in one session with checkpoints.

Which approach do you want for implementation?
