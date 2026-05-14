# Closed Posts on Both Profiles — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Surface `closed_delivered` posts on **both** the publisher's profile and the respondent's profile, with an economic-role badge (📤 נתתי / 📥 קיבלתי) derived from `(post.type, identity-role)`. Visibility to third parties follows the post's original `visibility` setting.

**Architecture:**
- New SQL RPC `profile_closed_posts(profile_user_id, viewer_user_id, p_limit, p_cursor)` returns `(post_id, identity_role, closed_at)` rows.
- `is_post_visible_to` is updated so closed_delivered posts respect their `visibility` for third parties (matches open-post rules).
- New application port method `getProfileClosedPosts` + use case `GetProfileClosedPostsUseCase`.
- Closed-posts tab on both profile screens swaps to the new use case; a dedicated `ProfileClosedPostsGrid` renders cards with the role badge.
- Existing post detail screen handles tap routing (FR-POST-016 / FR-POST-017 / read-only) without changes; one banner-copy verification task confirms the third-party Request-post view.

**Tech Stack:** TypeScript, Expo / React Native (RN-Web), Supabase (Postgres + RLS), Vitest, pnpm + turbo. Domain / application / infrastructure-supabase / ui packages under `app/packages/*`; mobile composition root at `app/apps/mobile/`. SSOT docs at `docs/SSOT/`.

**Spec:** `docs/superpowers/specs/2026-05-13-closed-posts-on-both-profiles-design.md`

---

## File Structure

**Create:**
- `supabase/migrations/0059_post_visibility_closed_public.sql` — refresh `is_post_visible_to` so closed_delivered posts respect `visibility` like open posts.
- `supabase/migrations/0061_profile_closed_posts_rpc.sql` — new SQL function `profile_closed_posts`.
- `app/packages/application/src/posts/GetProfileClosedPostsUseCase.ts` — application use case.
- `app/packages/application/src/posts/__tests__/GetProfileClosedPostsUseCase.test.ts` — unit tests.
- `app/apps/mobile/src/components/profile/ProfileClosedPostsGrid.tsx` — grid + empty state for closed posts (carries identity role per item).

**Modify:**
- `app/packages/domain/src/entities.ts` — add `IdentityRoleForViewedProfile` type + `ProfileClosedPostsItem` interface.
- `app/packages/application/src/ports/IPostRepository.ts` — add `getProfileClosedPosts` method.
- `app/packages/application/src/posts/__tests__/fakePostRepository.ts` — implement the new method on the fake.
- `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` — implement `getProfileClosedPosts` (calls RPC + hydrates posts).
- `app/apps/mobile/src/lib/usecases.ts` (or wherever `getMyPostsUseCase()` is wired — confirm path during Task 7) — wire `getProfileClosedPostsUseCase()`.
- `app/apps/mobile/src/components/PostCardProfile.tsx` — accept optional `identityRole` prop and render the 📤/📥 badge.
- `app/apps/mobile/app/(tabs)/profile.tsx` — closed-tab query uses the new use case + grid.
- `app/apps/mobile/app/user/[handle]/index.tsx` — same.
- `docs/SSOT/spec/02_profile_and_privacy.md` — revise FR-PROFILE-001 AC4 and FR-PROFILE-002 AC2.
- `docs/SSOT/spec/04_posts.md` — revise FR-POST-017 AC1, add AC5.
- `docs/SSOT/DECISIONS.md` — append D-19.
- `docs/SSOT/TECH_DEBT.md` — append TD entry for renaming `recipients` → `respondents`.
- `docs/SSOT/BACKLOG.md` — add an entry (or flip a matching entry) for this feature.

---

## Task 1: Migration — refresh `is_post_visible_to` to allow third-party reads of closed_delivered posts per visibility

**Files:**
- Create: `supabase/migrations/0059_post_visibility_closed_public.sql`

- [ ] **Step 1.1: Write the migration**

Create `supabase/migrations/0059_post_visibility_closed_public.sql`:

```sql
-- 0059_post_visibility_closed_public.sql (renumbered from 0056 on the
-- feat/FR-NOTIF-001-foundation branch where 0056..0058 are already taken)
-- Spec: docs/superpowers/specs/2026-05-13-closed-posts-on-both-profiles-design.md
-- FR-POST-017 AC1 (revised) — closed_delivered posts are visible to viewers
-- according to the post's `visibility` setting, mirroring open-post rules:
--   Public         → everyone (minus block + reporter-hide)
--   FollowersOnly  → approved followers
--   OnlyMe         → owner only
-- Owner and recipient always see (unchanged).
--
-- Other tomb states (removed_admin, deleted_no_recipient, expired) remain
-- owner-only — unchanged from migration 0005.

create or replace function public.is_post_visible_to(p_post public.posts, p_viewer uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select case
    -- Owner always sees their own row, regardless of any moderation state.
    when p_post.owner_id = p_viewer then true
    -- Block short-circuit: bilateral.
    when public.is_blocked(p_viewer, p_post.owner_id) then false
    -- Reporter-side hides apply BEFORE every other branch (FR-MOD-001 AC5).
    when exists (
      select 1 from public.reporter_hides h
      where h.reporter_id = p_viewer
        and h.target_type = 'post'
        and h.target_id   = p_post.post_id
    ) then false
    -- Tomb states (other than closed_delivered): owner-only.
    when p_post.status in ('removed_admin','deleted_no_recipient','expired') then false
    -- closed_delivered: recipient always sees; non-recipients follow visibility.
    when p_post.status = 'closed_delivered' then
      case
        when exists (
          select 1 from public.recipients r
          where r.post_id = p_post.post_id and r.recipient_user_id = p_viewer
        ) then true
        when p_post.visibility = 'Public' then true
        when p_post.visibility = 'OnlyMe' then false
        when p_post.visibility = 'FollowersOnly' then public.is_following(p_viewer, p_post.owner_id)
        else false
      end
    -- open: standard visibility ladder.
    when p_post.status = 'open' and p_post.visibility = 'Public' then true
    when p_post.status = 'open' and p_post.visibility = 'OnlyMe' then false
    when p_post.status = 'open' and p_post.visibility = 'FollowersOnly' then
      public.is_following(p_viewer, p_post.owner_id)
    else false
  end;
$$;
```

- [ ] **Step 1.2: Apply the migration locally and verify**

Run:
```bash
cd /Users/navesarussi/KC/MVP-2
supabase db reset --linked=false || supabase migration up
```

Then in psql (or via `supabase studio`):
```sql
-- Sanity check: function exists.
\df public.is_post_visible_to

-- Pick two test fixtures (a Public closed_delivered post and a stranger uuid).
-- Replace placeholders with real UUIDs from the dev DB.
select public.is_post_visible_to(
  (select p from public.posts p where status='closed_delivered' and visibility='Public' limit 1),
  '<stranger_user_id>'::uuid
);
-- Expected: true
```

- [ ] **Step 1.3: Commit**

```bash
git add supabase/migrations/0059_post_visibility_closed_public.sql
git commit -m "feat(infra): closed_delivered posts honor visibility for third-party viewers

Public closed posts are now visible to everyone (minus block + reporter-hide),
FollowersOnly closed posts to followers, OnlyMe closed posts to owner only.
Recipient and owner branches unchanged. Mapped to FR-POST-017 AC1 (revised)."
```

---

## Task 2: Migration — `profile_closed_posts` RPC

**Files:**
- Create: `supabase/migrations/0061_profile_closed_posts_rpc.sql`

- [ ] **Step 2.1: Write the migration**

Create `supabase/migrations/0061_profile_closed_posts_rpc.sql`:

```sql
-- 0061_profile_closed_posts_rpc.sql (renumbered from 0057 — see 0059 note)
-- Spec: docs/superpowers/specs/2026-05-13-closed-posts-on-both-profiles-design.md
-- Returns the set of closed_delivered posts to display on a user's "Closed Posts"
-- tab — the UNION of posts they published AND posts on which they are the
-- respondent (`recipients.recipient_user_id`). Each row carries the identity
-- role of `profile_user_id` on the post: 'publisher' or 'respondent'.
--
-- Visibility filtering reuses `public.is_post_visible_to(post, viewer_user_id)`,
-- so the caller only sees rows their auth context is allowed to read. The
-- function is SECURITY INVOKER (default) — RLS on posts/recipients applies in
-- addition to the predicate.
--
-- Pagination: `p_cursor` (timestamptz) is exclusive — pass the last `closed_at`
-- of the previous page. `p_limit` is clamped to [1, 100].
--
-- SECURITY: SECURITY DEFINER is required because `recipients` RLS blocks
-- third-party reads, so the function must bypass it to discover the
-- "received" side of the UNION. To prevent privilege escalation the function
-- asserts that `p_viewer_user_id` is either NULL, equal to auth.uid(), or
-- the caller is the service_role (cron / edge functions / admin).
--
-- NOTE: this RPC intentionally does NOT guard on the profile user's
-- privacy_mode. Per product, every user's profile is publicly visible (header
-- + identity); only individual posts are filtered by their per-post
-- `visibility`. FR-PROFILE-003's locked-panel behavior is a FE-level concern
-- and is enforced in the mobile screens before this RPC is even called.

create or replace function public.profile_closed_posts(
  p_profile_user_id uuid,
  p_viewer_user_id  uuid,
  p_limit           int          default 30,
  p_cursor          timestamptz  default null
)
returns table (
  post_id        uuid,
  identity_role  text,
  closed_at      timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  -- Service role bypasses the viewer-id check (no auth.uid() context).
  -- For authenticated/anon callers: `is distinct from` handles NULL correctly,
  -- so an anon caller (auth.uid()=NULL) passing a concrete viewer id is
  -- rejected. Equality (`<>`) would silently pass that case.
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role'
     and p_viewer_user_id is not null
     and p_viewer_user_id is distinct from auth.uid()
  then
    raise exception 'forbidden_viewer_mismatch' using errcode = '42501';
  end if;

  return query
  with safe_limit as (
    select greatest(1, least(coalesce(p_limit, 30), 100))::int as n
  ),
  unioned as (
    -- Publisher side: posts the profile user authored.
    -- Includes BOTH closed_delivered AND deleted_no_recipient so the publisher
    -- can still reopen / observe posts they closed without a recipient (within
    -- the 7-day grace window — FR-CLOSURE-005 AC4, FR-CLOSURE-008).
    select
      p.post_id,
      'publisher'::text as identity_role,
      coalesce(r.marked_at, p.updated_at) as closed_at
    from public.posts p
    left join public.recipients r on r.post_id = p.post_id
    where p.owner_id = p_profile_user_id
      and p.status in ('closed_delivered', 'deleted_no_recipient')

    union all

    -- Respondent side: posts where the profile user was picked at closure.
    -- Only closed_delivered — deleted_no_recipient has no respondent row.
    select
      p.post_id,
      'respondent'::text as identity_role,
      r.marked_at as closed_at
    from public.posts p
    join public.recipients r on r.post_id = p.post_id
    where r.recipient_user_id = p_profile_user_id
      and p.status = 'closed_delivered'
      -- Defensive: publisher cannot also be respondent (enforced by FR-CLOSURE-003).
      and p.owner_id <> p_profile_user_id
  )
  select u.post_id, u.identity_role, u.closed_at
  from unioned u
  join public.posts p on p.post_id = u.post_id
  where public.is_post_visible_to(p.*, p_viewer_user_id)
    and (p_cursor is null or u.closed_at < p_cursor)
  order by u.closed_at desc
  limit (select n from safe_limit);
end;
$$;

grant execute on function public.profile_closed_posts(uuid, uuid, int, timestamptz) to authenticated, anon;
```

- [ ] **Step 2.2: Apply the migration locally**

```bash
cd /Users/navesarussi/KC/MVP-2
supabase migration up
```

- [ ] **Step 2.3: Manual smoke test**

In psql / Supabase Studio, exercise the four key viewer × post combinations. Replace the placeholder UUIDs with real ones from `dev` (Super Admin can pick any two users with closed posts; see `super_admin_test_account.md` in memory for sign-in).

```sql
-- Publisher viewing their own profile: should see all their closed posts.
select * from public.profile_closed_posts('<publisher_uuid>', '<publisher_uuid>');

-- Respondent viewing their own profile: should see posts they received as 'respondent'.
select * from public.profile_closed_posts('<respondent_uuid>', '<respondent_uuid>');

-- Third party viewing the publisher's profile: should see only Public closed posts.
select * from public.profile_closed_posts('<publisher_uuid>', '<stranger_uuid>');

-- Third party viewing the respondent's profile: should see only Public closed posts
-- where the respondent was picked (transitively the same row set).
select * from public.profile_closed_posts('<respondent_uuid>', '<stranger_uuid>');
```

For each call: confirm `identity_role` matches expectation and `closed_at` is descending.

- [ ] **Step 2.4: Commit**

```bash
git add supabase/migrations/0061_profile_closed_posts_rpc.sql
git commit -m "feat(infra): profile_closed_posts RPC for cross-profile closed-posts tab

Returns (post_id, identity_role, closed_at) for the UNION of posts the
profile user published and posts where they are the respondent. Honors
visibility via is_post_visible_to. Mapped to FR-PROFILE-001 AC4 (revised),
FR-PROFILE-002 AC2 (revised)."
```

---

## Task 3: Domain — add identity-role types

**Files:**
- Modify: `app/packages/domain/src/entities.ts`

- [ ] **Step 3.1: Add the types**

After the existing `Recipient` / `Post` block (around line 118), add:

```typescript
// ── Profile closed-posts view ─────────────────

/**
 * Which identity role the profile user occupies on a given closed_delivered post.
 * - 'publisher' — `Post.ownerId === profileUserId`
 * - 'respondent' — `Post.recipient?.recipientUserId === profileUserId`
 *
 * The economic role (giver / receiver) is derived in the UI from
 * (post.type, identityRole).
 */
export type IdentityRoleForViewedProfile = 'publisher' | 'respondent';

export interface ProfileClosedPostsItem {
  readonly post: Post;
  readonly identityRole: IdentityRoleForViewedProfile;
}
```

- [ ] **Step 3.2: Typecheck**

```bash
cd app
pnpm --filter @kc/domain typecheck
```
Expected: no errors.

- [ ] **Step 3.3: Commit**

```bash
git add app/packages/domain/src/entities.ts
git commit -m "feat(domain): add IdentityRoleForViewedProfile + ProfileClosedPostsItem

Used by the closed-posts tab on profile screens to attach an identity-role
label to each post (publisher / respondent). Mapped to FR-PROFILE-001 AC4."
```

---

## Task 4: Application port — add `getProfileClosedPosts`

**Files:**
- Modify: `app/packages/application/src/ports/IPostRepository.ts`
- Modify: `app/packages/application/src/posts/__tests__/fakePostRepository.ts`

- [ ] **Step 4.1: Extend the port**

In `IPostRepository.ts`, add the import:

```typescript
import type { Post, PostStatus, ProfileClosedPostsItem } from '@kc/domain';
```

(Adjust the import line if there's already a `@kc/domain` import — just add `ProfileClosedPostsItem` to it.)

Then add to the `IPostRepository` interface, right after `getMyPosts` (around line 159):

```typescript
  /**
   * Closed-posts tab on a profile screen.
   * Returns the UNION of (posts profileUserId published) and (posts where
   * profileUserId is the respondent), all in status `closed_delivered`,
   * ordered by `closed_at` desc.
   *
   * Visibility for the viewer is enforced server-side via the RPC, which
   * reuses `is_post_visible_to`. The viewer may be null for anon flows;
   * the RPC will simply return Public closed posts only.
   *
   * Mapped to FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised),
   * FR-POST-017 AC1 (revised).
   */
  getProfileClosedPosts(
    profileUserId: string,
    viewerUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<ProfileClosedPostsItem[]>;
```

- [ ] **Step 4.2: Implement on the fake**

In `fakePostRepository.ts`, add at the top of the class:

```typescript
  lastGetProfileClosedPostsArgs: {
    profileUserId: string;
    viewerUserId: string | null;
    limit: number;
    cursor?: string;
  } | null = null;
  profileClosedPostsResult: ProfileClosedPostsItem[] = [];
```

And at the bottom (before the closing brace), add the method:

```typescript
  getProfileClosedPosts = async (
    profileUserId: string,
    viewerUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<ProfileClosedPostsItem[]> => {
    this.lastGetProfileClosedPostsArgs = { profileUserId, viewerUserId, limit, cursor };
    return this.profileClosedPostsResult;
  };
```

Don't forget to extend the import at the top of the file:

```typescript
import type { Post, PostStatus, ProfileClosedPostsItem } from '@kc/domain';
```

- [ ] **Step 4.3: Typecheck**

```bash
cd app
pnpm --filter @kc/application typecheck
```
Expected: no errors.

- [ ] **Step 4.4: Commit**

```bash
git add app/packages/application/src/ports/IPostRepository.ts \
        app/packages/application/src/posts/__tests__/fakePostRepository.ts
git commit -m "feat(application): IPostRepository.getProfileClosedPosts port

Returns the UNION of publisher-side and respondent-side closed_delivered
posts for a profile, with the identity-role label per item. Fake updated
to capture call args. Mapped to FR-PROFILE-001 AC4 (revised)."
```

---

## Task 5: Application use case — `GetProfileClosedPostsUseCase`

**Files:**
- Create: `app/packages/application/src/posts/GetProfileClosedPostsUseCase.ts`
- Create: `app/packages/application/src/posts/__tests__/GetProfileClosedPostsUseCase.test.ts`

- [ ] **Step 5.1: Write the failing test**

Create `app/packages/application/src/posts/__tests__/GetProfileClosedPostsUseCase.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { GetProfileClosedPostsUseCase } from '../GetProfileClosedPostsUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('GetProfileClosedPostsUseCase', () => {
  it('forwards profileUserId / viewerUserId / limit / cursor', async () => {
    const repo = new FakePostRepository();
    const uc = new GetProfileClosedPostsUseCase(repo);

    await uc.execute({
      profileUserId: 'u_profile',
      viewerUserId: 'u_viewer',
      limit: 50,
      cursor: 'cur',
    });

    expect(repo.lastGetProfileClosedPostsArgs).toEqual({
      profileUserId: 'u_profile',
      viewerUserId: 'u_viewer',
      limit: 50,
      cursor: 'cur',
    });
  });

  it('clamps limit to [1, 100]; defaults to 30', async () => {
    const repo = new FakePostRepository();
    const uc = new GetProfileClosedPostsUseCase(repo);

    await uc.execute({ profileUserId: 'u', viewerUserId: 'v', limit: 0 });
    expect(repo.lastGetProfileClosedPostsArgs?.limit).toBe(1);

    await uc.execute({ profileUserId: 'u', viewerUserId: 'v', limit: 999 });
    expect(repo.lastGetProfileClosedPostsArgs?.limit).toBe(100);

    await uc.execute({ profileUserId: 'u', viewerUserId: 'v' });
    expect(repo.lastGetProfileClosedPostsArgs?.limit).toBe(30);
  });

  it('accepts a null viewer (anonymous read)', async () => {
    const repo = new FakePostRepository();
    const uc = new GetProfileClosedPostsUseCase(repo);

    await uc.execute({ profileUserId: 'u', viewerUserId: null });
    expect(repo.lastGetProfileClosedPostsArgs?.viewerUserId).toBeNull();
  });

  it('returns items from the repo verbatim', async () => {
    const repo = new FakePostRepository();
    repo.profileClosedPostsResult = [
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { post: { postId: 'p1' } as any, identityRole: 'publisher' },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      { post: { postId: 'p2' } as any, identityRole: 'respondent' },
    ];
    const uc = new GetProfileClosedPostsUseCase(repo);

    const { items } = await uc.execute({ profileUserId: 'u', viewerUserId: 'v' });
    expect(items.map((i) => [i.post.postId, i.identityRole])).toEqual([
      ['p1', 'publisher'],
      ['p2', 'respondent'],
    ]);
  });
});
```

- [ ] **Step 5.2: Run the failing test**

```bash
cd app
pnpm --filter @kc/application test GetProfileClosedPostsUseCase
```
Expected: FAIL — `GetProfileClosedPostsUseCase` not found.

- [ ] **Step 5.3: Implement the use case**

Create `app/packages/application/src/posts/GetProfileClosedPostsUseCase.ts`:

```typescript
/**
 * FR-PROFILE-001 AC4 / FR-PROFILE-002 AC2 / FR-POST-017 AC1 (all revised).
 *
 * Returns the closed-posts list for a profile screen, with an identity-role
 * label per item ('publisher' | 'respondent'). The UI derives the economic
 * role (giver / receiver) from (post.type, identityRole) to render the badge.
 */
import type { IPostRepository } from '../ports/IPostRepository';
import type { ProfileClosedPostsItem } from '@kc/domain';

export interface GetProfileClosedPostsInput {
  profileUserId: string;
  viewerUserId: string | null;
  limit?: number;
  cursor?: string;
}

export interface GetProfileClosedPostsOutput {
  items: ProfileClosedPostsItem[];
}

const DEFAULT_LIMIT = 30;
const HARD_MAX = 100;

export class GetProfileClosedPostsUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: GetProfileClosedPostsInput): Promise<GetProfileClosedPostsOutput> {
    const limit = clamp(input.limit ?? DEFAULT_LIMIT, 1, HARD_MAX);
    const items = await this.repo.getProfileClosedPosts(
      input.profileUserId,
      input.viewerUserId,
      limit,
      input.cursor,
    );
    return { items };
  }
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, Math.trunc(n)));
}
```

- [ ] **Step 5.4: Run the tests**

```bash
cd app
pnpm --filter @kc/application test GetProfileClosedPostsUseCase
```
Expected: PASS (all 4 cases).

- [ ] **Step 5.5: Run the full application package suite to confirm no regression**

```bash
cd app
pnpm --filter @kc/application test
```
Expected: PASS.

- [ ] **Step 5.6: Commit**

```bash
git add app/packages/application/src/posts/GetProfileClosedPostsUseCase.ts \
        app/packages/application/src/posts/__tests__/GetProfileClosedPostsUseCase.test.ts
git commit -m "feat(application): GetProfileClosedPostsUseCase

Single use case that delegates to IPostRepository.getProfileClosedPosts;
clamps limit to [1, 100], default 30; forwards profile + viewer + cursor.
Mapped to FR-PROFILE-001 AC4 (revised)."
```

---

## Task 6: Infrastructure — implement `getProfileClosedPosts`

`SupabasePostRepository.ts` is already at ~225 LOC (over the 200-LOC cap noted in CLAUDE.md §5). To avoid making it worse — and to follow the existing pattern (`reopenPostHelper`, `getClosureCandidatesHelper`) already in this folder — the implementation lives in its own helper file. The class method just delegates.

**Files:**
- Create: `app/packages/infrastructure-supabase/src/posts/getProfileClosedPostsHelper.ts`
- Modify: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts`

- [ ] **Step 6.1: Write the helper**

Create `app/packages/infrastructure-supabase/src/posts/getProfileClosedPostsHelper.ts`:

```typescript
// Helper for SupabasePostRepository.getProfileClosedPosts — kept in its own
// file to respect the 200-LOC cap on the repository. Mirrors the existing
// reopenPostHelper / getClosureCandidatesHelper pattern.
//
// Mapped to FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised).

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Post, ProfileClosedPostsItem } from '@kc/domain';
import { POST_SELECT_BARE, mapPostRow, type PostJoinedRow } from './mapPostRow';

const HARD_MAX_LIMIT = 100;

export async function getProfileClosedPostsHelper(
  client: SupabaseClient,
  profileUserId: string,
  viewerUserId: string | null,
  limit: number,
  cursor?: string,
): Promise<ProfileClosedPostsItem[]> {
  const safeLimit = Math.max(1, Math.min(limit, HARD_MAX_LIMIT));

  // Step 1: RPC returns (post_id, identity_role, closed_at) ordered desc.
  const { data: rows, error: rpcError } = await client.rpc('profile_closed_posts', {
    p_profile_user_id: profileUserId,
    p_viewer_user_id: viewerUserId, // RPC accepts NULL for anon viewers.
    p_limit: safeLimit,
    p_cursor: cursor ?? null,
  });
  if (rpcError) throw new Error(`getProfileClosedPosts: ${rpcError.message}`);
  const rpcRows = (rows ?? []) as Array<{
    post_id: string;
    identity_role: 'publisher' | 'respondent';
    closed_at: string;
  }>;
  if (rpcRows.length === 0) return [];

  // Step 2: hydrate via the standard joined SELECT. RLS applies — and since
  // migration 0056 aligned `is_post_visible_to` with the RPC's filter, the
  // verdicts match. (One exception: `deleted_no_recipient` posts on the
  // publisher's own profile are visible only to the owner per the tomb-state
  // branch in `is_post_visible_to` — which matches our intent.)
  const ids = rpcRows.map((r) => r.post_id);
  const { data: postsData, error: postsError } = await client
    .from('posts')
    .select(POST_SELECT_BARE)
    .in('post_id', ids);
  if (postsError) throw new Error(`getProfileClosedPosts hydrate: ${postsError.message}`);

  const byId = new Map<string, Post>();
  for (const row of (postsData ?? []) as unknown as PostJoinedRow[]) {
    const post = mapPostRow(row);
    byId.set(post.postId, post);
  }

  // Step 3: re-assemble in RPC's order, dropping rows lost to RLS edge cases.
  const items: ProfileClosedPostsItem[] = [];
  for (const r of rpcRows) {
    const post = byId.get(r.post_id);
    if (!post) continue;
    items.push({ post, identityRole: r.identity_role });
  }
  return items;
}
```

- [ ] **Step 6.2: Wire the class method to delegate to the helper**

In `SupabasePostRepository.ts`:

- Extend the `@kc/domain` import to include `ProfileClosedPostsItem`.
- Add the helper import alongside the existing helper imports near the top of the file:

```typescript
import { getProfileClosedPostsHelper } from './getProfileClosedPostsHelper';
```

- After the `getMyPosts` method (around line 201) and before `// ── Stats ──`, add the method that just forwards:

```typescript
  // ── Profile closed posts (publisher ∪ respondent) ────────────────────────
  getProfileClosedPosts(
    profileUserId: string,
    viewerUserId: string | null,
    limit: number,
    cursor?: string,
  ): Promise<ProfileClosedPostsItem[]> {
    return getProfileClosedPostsHelper(this.client, profileUserId, viewerUserId, limit, cursor);
  }
```

- [ ] **Step 6.3: Typecheck**

```bash
cd app
pnpm --filter @kc/infrastructure-supabase typecheck
```
Expected: no errors.

- [ ] **Step 6.4: Run the infrastructure tests**

```bash
cd app
pnpm --filter @kc/infrastructure-supabase test
```
Expected: PASS (no regression; the new path has no unit test — covered by manual smoke + browser verification in Task 13).

- [ ] **Step 6.5: Commit**

```bash
git add app/packages/infrastructure-supabase/src/posts/getProfileClosedPostsHelper.ts \
        app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts
git commit -m "feat(infra): getProfileClosedPostsHelper + repository delegation

Helper lives in its own file (the repository is already at ~225 LOC, over
the 200-LOC cap; new code goes via a helper following the existing
reopen/closure-candidates pattern). Mapped to FR-PROFILE-001 AC4 (revised)."
```

---

## Task 7: Wire the use case into the mobile composition root

**Files:**
- Modify: the mobile use-case factory file. Locate via:

```bash
cd /Users/navesarussi/KC/MVP-2
grep -rn "getMyPostsUseCase\s*=\|export.*getMyPostsUseCase\|GetMyPostsUseCase" app/apps/mobile/src/ | head -5
```

Expected: a single composition-root file (likely `app/apps/mobile/src/lib/useCases.ts` or similar) that exports `getMyPostsUseCase()`. Modify that file.

- [ ] **Step 7.1: Add the factory**

In the file you found, mirror the `getMyPostsUseCase` pattern. Add the import:

```typescript
import { GetProfileClosedPostsUseCase } from '@kc/application';
```

(If `@kc/application` doesn't re-export `GetProfileClosedPostsUseCase`, add it to the application package's barrel — `app/packages/application/src/index.ts` — as `export * from './posts/GetProfileClosedPostsUseCase';`. Commit that separately if needed.)

Then add the factory function alongside `getMyPostsUseCase`:

```typescript
export function getProfileClosedPostsUseCase() {
  return new GetProfileClosedPostsUseCase(getPostRepo());
}
```

- [ ] **Step 7.2: Typecheck**

```bash
cd app
pnpm --filter @kc/mobile typecheck
```
Expected: no errors.

- [ ] **Step 7.3: Commit**

```bash
git add app/packages/application/src/index.ts app/apps/mobile/src/lib/useCases.ts
git commit -m "chore(mobile): wire getProfileClosedPostsUseCase factory"
```

(Adjust the file paths in `git add` to match where you actually edited.)

---

## Task 8: UI — `PostCardProfile` renders the economic-role badge

**Files:**
- Modify: `app/apps/mobile/src/components/PostCardProfile.tsx`

- [ ] **Step 8.1: Extend props**

In `PostCardProfile.tsx`, replace the existing `PostCardProfileProps` interface with:

```typescript
import type { IdentityRoleForViewedProfile } from '@kc/domain';

interface PostCardProfileProps {
  post: Post;
  /**
   * When set, an economic-role badge ("📤 נתתי" / "📥 קיבלתי") renders on
   * the card. The role is derived from (post.type, identityRole):
   *   publisher + Give    → giver  → 📤 נתתי
   *   publisher + Request → receiver → 📥 קיבלתי
   *   respondent + Give   → receiver → 📥 קיבלתי
   *   respondent + Request→ giver   → 📤 נתתי
   */
  identityRole?: IdentityRoleForViewedProfile;
  onPressOverride?: () => void;
}
```

- [ ] **Step 8.2: Derive the economic role and render the badge**

In the `PostCardProfile` function body, after the `firstImageUrl` const (around line 37), add:

```typescript
  const economicRole: 'giver' | 'receiver' | null = identityRole
    ? deriveEconomicRole(post.type, identityRole)
    : null;
```

And add the helper at the bottom of the file (outside the component):

```typescript
function deriveEconomicRole(
  postType: Post['type'],
  identityRole: IdentityRoleForViewedProfile,
): 'giver' | 'receiver' {
  if (identityRole === 'publisher') return postType === 'Give' ? 'giver' : 'receiver';
  return postType === 'Give' ? 'receiver' : 'giver';
}
```

Then in the JSX, place the badge inside `<View style={styles.imageArea}>` next to the existing `typeTag` (so it stacks visually). After the `<View style={[styles.typeTag, ...]}>` block (before the closing `</View>` of imageArea), add:

```typescript
        {economicRole ? (
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>
              {economicRole === 'giver' ? '📤 נתתי' : '📥 קיבלתי'}
            </Text>
          </View>
        ) : null}
```

Add the styles to the `StyleSheet.create` block:

```typescript
  roleBadge: {
    position: 'absolute',
    bottom: spacing.xs,
    ...(I18nManager.isRTL && Platform.OS !== 'web' ? { right: spacing.xs } : { left: spacing.xs }),
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  roleBadgeText: {
    ...typography.label,
    fontSize: 10,
    color: '#fff',
  },
```

- [ ] **Step 8.3: Typecheck**

```bash
cd app
pnpm --filter @kc/mobile typecheck
```
Expected: no errors.

- [ ] **Step 8.4: Commit**

```bash
git add app/apps/mobile/src/components/PostCardProfile.tsx
git commit -m "feat(mobile): PostCardProfile renders 📤/📥 economic-role badge

Badge appears only when identityRole is set (closed-posts tab). Economic
role is derived from (post.type, identityRole). Mapped to FR-PROFILE-001
AC4 (revised)."
```

---

## Task 9: UI — new `ProfileClosedPostsGrid` component

**Files:**
- Create: `app/apps/mobile/src/components/profile/ProfileClosedPostsGrid.tsx`

- [ ] **Step 9.1: Write the component**

Create `app/apps/mobile/src/components/profile/ProfileClosedPostsGrid.tsx`:

```typescript
// app/apps/mobile/src/components/profile/ProfileClosedPostsGrid.tsx
// Grid + loader + empty state for the "פוסטים סגורים" tab.
// Mapped to: FR-PROFILE-001 AC4 (revised), FR-PROFILE-002 AC2 (revised).

import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@kc/ui';
import type { ProfileClosedPostsItem } from '@kc/domain';
import { PostCardProfile } from '../PostCardProfile';
import { EmptyState } from '../EmptyState';

export type ClosedEmptyVariant = 'self_closed' | 'other_closed';

export interface ProfileClosedPostsGridProps {
  items: ProfileClosedPostsItem[];
  isLoading: boolean;
  empty: ClosedEmptyVariant;
}

const EMPTY_COPY: Record<ClosedEmptyVariant, {
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = {
  self_closed: {
    title: 'אין פוסטים סגורים עדיין',
    subtitle: 'פוסטים שסגרת או שקיבלת יופיעו כאן.',
    icon: 'archive-outline',
  },
  other_closed: {
    title: 'אין פוסטים סגורים',
    subtitle: 'משתמש זה עוד לא סגר ולא קיבל פוסט.',
    icon: 'archive-outline',
  },
};

export function ProfileClosedPostsGrid({ items, isLoading, empty }: ProfileClosedPostsGridProps) {
  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  if (items.length === 0) {
    const e = EMPTY_COPY[empty];
    return <EmptyState icon={e.icon} title={e.title} subtitle={e.subtitle} />;
  }
  return (
    <View style={styles.grid}>
      {items.map(({ post, identityRole }) => (
        <PostCardProfile key={post.postId} post={post} identityRole={identityRole} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  loading: { padding: spacing.xl, alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.base, gap: spacing.xs },
});
```

- [ ] **Step 9.2: Typecheck**

```bash
cd app
pnpm --filter @kc/mobile typecheck
```
Expected: no errors.

- [ ] **Step 9.3: Commit**

```bash
git add app/apps/mobile/src/components/profile/ProfileClosedPostsGrid.tsx
git commit -m "feat(mobile): ProfileClosedPostsGrid renders closed-posts tab items"
```

---

## Task 10: UI — swap closed tab on **My Profile** screen

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 10.1: Add imports**

Near the existing imports (around line 1–20), add:

```typescript
import { getProfileClosedPostsUseCase } from '../../src/lib/useCases'; // adjust path to match Task 7
import { ProfileClosedPostsGrid } from '../../src/components/profile/ProfileClosedPostsGrid';
```

- [ ] **Step 10.2: Add the closed-posts query**

Inside the component, right after the existing `myPostsQuery` block (around line 48–57), add:

```typescript
  const closedPostsQuery = useQuery({
    queryKey: ['my-closed-posts', userId],
    queryFn: () =>
      getProfileClosedPostsUseCase().execute({
        profileUserId: userId!,
        viewerUserId: userId!, // viewer == profile on My Profile.
        limit: 30,
      }),
    enabled: Boolean(userId) && activeTab === 'closed',
  });
```

- [ ] **Step 10.3: Conditionally render the new grid**

Find the JSX where `ProfilePostsGrid` is rendered for the active tab (search for `<ProfilePostsGrid`). Replace it with a conditional:

```typescript
          {activeTab === 'open' ? (
            <ProfilePostsGrid
              posts={myPostsQuery.data?.posts ?? []}
              isLoading={myPostsQuery.isLoading}
              empty="self_open"
            />
          ) : (
            <ProfileClosedPostsGrid
              items={closedPostsQuery.data?.items ?? []}
              isLoading={closedPostsQuery.isLoading}
              empty="self_closed"
            />
          )}
```

(The exact surrounding JSX may differ; preserve the existing structure and only swap the grid call.)

- [ ] **Step 10.4: Strip `closed_delivered` / `deleted_no_recipient` from the legacy `myPostsQuery`**

The legacy `myPostsQuery` should now only fetch open posts. Change line 53 from:

```typescript
        status: activeTab === 'open' ? ['open'] : ['closed_delivered', 'deleted_no_recipient'],
```

to:

```typescript
        status: ['open'],
```

And gate it on the active tab:

```typescript
    enabled: Boolean(userId) && activeTab === 'open',
```

- [ ] **Step 10.5: Typecheck + lint**

```bash
cd app
pnpm --filter @kc/mobile typecheck
pnpm --filter @kc/mobile lint
```
Expected: no errors.

- [ ] **Step 10.6: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "feat(mobile): My Profile closed tab uses GetProfileClosedPostsUseCase

Open tab continues with getMyPostsUseCase; closed tab now lists both
posts I published and posts where I'm the respondent, with 📤/📥 badges.
Mapped to FR-PROFILE-001 AC4 (revised)."
```

---

## Task 11: UI — swap closed tab on **Other-User Profile** screen

**Files:**
- Modify: `app/apps/mobile/app/user/[handle]/index.tsx`

- [ ] **Step 11.1: Add imports**

At the top of the file alongside existing imports:

```typescript
import { getProfileClosedPostsUseCase } from '../../../src/lib/useCases'; // adjust path
import { ProfileClosedPostsGrid } from '../../../src/components/profile/ProfileClosedPostsGrid';
```

- [ ] **Step 11.2: Add the closed-posts query**

After the existing `postsQuery` block (around lines 76–84), add:

```typescript
  const closedPostsQuery = useQuery({
    queryKey: ['profile-other-closed-posts', u?.userId, me],
    queryFn: () =>
      getProfileClosedPostsUseCase().execute({
        profileUserId: u!.userId,
        viewerUserId: me ?? null,
        limit: 30,
      }),
    enabled: Boolean(allowed && u?.userId) && activeTab === 'closed',
  });
```

- [ ] **Step 11.3: Trim `postsQuery` to open posts only**

Change line 80 from:

```typescript
      status: activeTab === 'open' ? ['open'] : ['closed_delivered'],
```

to:

```typescript
      status: ['open'],
```

And gate it on the open tab:

```typescript
    enabled: Boolean(allowed && u?.userId) && activeTab === 'open',
```

- [ ] **Step 11.4: Conditional grid render — inside the existing `allowed` branch only**

The existing screen already wraps the tabs+grid in an `allowed` guard (line 62 / line 116 `showLocked` → `<LockedPanel />`) per FR-PROFILE-003. The new grid MUST sit inside the same `!showLocked` / `allowed` branch — never reach a non-approved viewer of a Private profile.

Find the existing `<ProfilePostsGrid` for the active tab (around line 181, inside the `!showLocked` JSX block) and wrap with the same conditional pattern as Task 10.3:

```typescript
            {activeTab === 'open' ? (
              <ProfilePostsGrid
                posts={postsQuery.data?.posts ?? []}
                isLoading={postsQuery.isLoading}
                empty="other_open"
              />
            ) : (
              <ProfileClosedPostsGrid
                items={closedPostsQuery.data?.items ?? []}
                isLoading={closedPostsQuery.isLoading}
                empty="other_closed"
              />
            )}
```

After editing, re-read the file to confirm the new block is inside the `{showLocked ? <LockedPanel /> : (...)}` branch — not at the top level.

- [ ] **Step 11.5: Typecheck + lint**

```bash
cd app
pnpm --filter @kc/mobile typecheck
pnpm --filter @kc/mobile lint
```
Expected: no errors.

- [ ] **Step 11.6: Commit**

```bash
git add app/apps/mobile/app/user/\[handle\]/index.tsx
git commit -m "feat(mobile): Other-user profile closed tab uses GetProfileClosedPostsUseCase

Closed tab now surfaces posts the profile user received in addition to
those they published, gated by visibility. Mapped to FR-PROFILE-002 AC2."
```

---

## Task 12: Verify third-party post-detail banner copy for Request posts

**Files:**
- Modify: `app/apps/mobile/src/components/post-detail/RecipientCallout.tsx` (only if Step 12.1 finds mismatched copy)

- [ ] **Step 12.1: Read the component**

Open `app/apps/mobile/src/components/post-detail/RecipientCallout.tsx`. Confirm that:
- For `postType === 'Give'`, the banner reads "X מסר ל-Y" (or equivalent phrasing).
- For `postType === 'Request'`, the banner reads "Y מסר ל-X" / "X קיבל מ-Y" (or equivalent).

The spec requires both variants to be present and readable by a third-party viewer (FR-POST-017 AC5).

- [ ] **Step 12.2: If copy is missing or incorrect, fix inline**

If only one branch exists, add the other. If the wording is unclear, normalise to:

```typescript
const bannerText = postType === 'Give'
  ? `${publisherName} מסר ל-${respondentName}`
  : `${publisherName} קיבל מ-${respondentName}`;
```

(Adjust to match the component's existing prop names.)

- [ ] **Step 12.3: Typecheck**

```bash
cd app
pnpm --filter @kc/mobile typecheck
```
Expected: no errors.

- [ ] **Step 12.4: Commit (only if file was modified)**

```bash
git add app/apps/mobile/src/components/post-detail/RecipientCallout.tsx
git commit -m "fix(mobile): RecipientCallout banner copy for Request posts

Mapped to FR-POST-017 AC5 (third-party read-only banner on respondent
profile). If unchanged, skip this commit."
```

---

## Task 13: Browser verification

**Files:** none (verification only)

- [ ] **Step 13.1: Start the preview**

Use the Claude Preview tools. Start the dev server for the mobile web bundle:
- `preview_start` with the mobile-web target.
- Open the LAN URL from memory (`dev_preview_url.md`).

- [ ] **Step 13.2: Sign in as Super Admin**

Use the credentials in memory (`super_admin_test_account.md`) to sign into the dev environment.

- [ ] **Step 13.3: Verify "My Profile" closed tab**

- Navigate to `/(tabs)/profile`.
- Tap "פוסטים סגורים".
- Confirm at least one card with 📤 נתתי badge (if the admin has published a closed post) and at least one with 📥 קיבלתי (if the admin has been picked as respondent).
- Tap a 📥 קיבלתי card: confirm the "Remove my recipient mark" CTA appears (FR-POST-017).
- Tap a 📤 נתתי card: confirm the "Reopen" CTA appears (FR-POST-016).

If the dev DB has no such posts, seed one by closing an open post with a recipient (use the existing closure flow from chat — FR-CHAT-015).

- [ ] **Step 13.4: Verify "Other-user profile" closed tab**

- Navigate to `/user/<some-other-handle>` whose profile has at least one closed post.
- Tap "פוסטים סגורים".
- Confirm cards from both sides of the user's transactions appear.
- Confirm the badges match the user's role on each card.
- Tap a card: confirm a read-only post detail loads (no Reopen, no Remove-mark CTAs).

- [ ] **Step 13.5: Verify visibility gating with a stranger account**

- Sign out and sign in as a second, non-admin user (or use the anonymous browser flow if available).
- Visit the same other-user profile.
- Confirm that:
  - Public closed posts are visible.
  - FollowersOnly closed posts are visible **only** if the stranger follows the publisher of that specific post.
  - OnlyMe closed posts are not visible (should not appear at all in the list).

If FollowersOnly / OnlyMe posts can't be seeded easily, log this as a follow-up smoke test in `TECH_DEBT.md`.

- [ ] **Step 13.6: Screenshot evidence**

Use `preview_screenshot` to capture:
- One screenshot of the closed-posts tab with mixed 🎁 / 🎀 badges (My Profile).
- One screenshot of the same tab on another user's profile (third-party view).

Attach the screenshots to the eventual PR (Task 14).

---

## Task 14: SSOT updates

**Files:**
- Modify: `docs/SSOT/spec/02_profile_and_privacy.md`
- Modify: `docs/SSOT/spec/04_posts.md`
- Modify: `docs/SSOT/DECISIONS.md`
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/BACKLOG.md`

- [ ] **Step 14.1: Revise FR-PROFILE-001 AC4**

In `docs/SSOT/spec/02_profile_and_privacy.md`, replace the body of AC4 with:

```markdown
- AC4. Two tabs:
   - **Active Posts** (Hebrew label: *"פוסטים פתוחים"*): unchanged — lists all `open` posts authored by the user including `Public`, `Followers only`, and `Only me`. Each card carries a visual badge showing its visibility.
   - **Closed Posts** (Hebrew label: *"פוסטים סגורים"*): lists posts where the user is **either the publisher or the respondent**. The publisher side covers status `closed_delivered` and (for the user's own view) `deleted_no_recipient` within the 7-day grace window so they can still reopen — FR-CLOSURE-005 AC4, FR-CLOSURE-008. The respondent side covers only `closed_delivered`. Ordered by `closed_at` desc. Each card shows an economic-role badge derived from `(post.type, identity-role)`: 📤 נתתי when the profile owner is the giver, 📥 קיבלתי when the profile owner is the receiver. (Revised 2026-05-13 per D-19.)
```

- [ ] **Step 14.2: Revise FR-PROFILE-002 AC2**

In the same file, replace AC2 of `FR-PROFILE-002` with:

```markdown
- AC2. The "Closed Posts" tab on another user's profile follows the same UNION rule as `FR-PROFILE-001 AC4` (publisher ∪ respondent), filtered by each post's `visibility`. Third-party viewers see the same cards but the tap target opens a read-only post detail. (Revised 2026-05-13 per D-19.)
```

- [ ] **Step 14.3: Revise FR-POST-017 AC1 and add AC5**

In `docs/SSOT/spec/04_posts.md`, under FR-POST-017, replace AC1 with:

```markdown
- AC1. A user picked as the respondent of a `closed_delivered` post sees the post in their own profile's "פוסטים סגורים" tab. The post is **also** visible to other viewers of the respondent's profile, subject to the post's original `visibility` setting (Public / Followers-only / Only-me). The "Remove my recipient mark" CTA remains exclusive to the respondent themselves. (Revised 2026-05-13 per D-19 — reverses the respondent-privacy carve-out previously in D-7.)
```

Add a new AC5 after AC4:

```markdown
- AC5. When a third party opens the post via the respondent's profile, the detail screen renders a read-only public view (no Reopen, no Remove-mark, no Edit). Banner reflects the transaction: *"[publisher] מסר ל-[respondent] בתאריך D"* for `Give` posts, *"[publisher] קיבל מ-[respondent] בתאריך D"* for `Request` posts.
```

- [ ] **Step 14.4: Append D-19 to DECISIONS.md**

Append to `docs/SSOT/DECISIONS.md`:

```markdown
## D-19 — Closed posts surface on both publisher and respondent profiles (2026-05-13)

Closed-delivered posts appear in the "פוסטים סגורים" tab of both the publisher's and the respondent's profile. Visibility to third parties is governed by the post's original `visibility` field (Public / Followers-only / Only-me) — no automatic upgrade on close. Each card shows an economic-role badge (📤 נתתי / 📥 קיבלתי) derived from `(post.type, identity-role)`.

**Reverses** the respondent-privacy carve-out previously stated in D-7 / FR-POST-017 AC1. Rationale: a public karma trail across both sides of a transaction is more important than the implicit privacy of being a respondent on a public post. Users who want privacy can publish posts as Followers-only or Only-me, and the closed visibility inherits accordingly.

**Spec:** `docs/superpowers/specs/2026-05-13-closed-posts-on-both-profiles-design.md`.
**Touches:** FR-PROFILE-001 AC4, FR-PROFILE-002 AC2, FR-POST-017 AC1 + AC5.
```

- [ ] **Step 14.5: Append the tech-debt entry**

In `docs/SSOT/TECH_DEBT.md`, find the BE Active section (rows `TD-50..99`) and append the next available row:

```markdown
| TD-XX | Rename `recipients` table → `respondents` | Column `recipient_user_id` is semantically misleading: for `Request` posts the row stores the *giver*, not the receiver. Touches schema, RLS, RPCs (`profile_closed_posts`, `close_post_with_recipient`, `reopen_post_marked`), FE types (`Recipient` interface in `entities.ts`), and `FR-POST-017` CTA copy ("Remove my recipient mark"). Driven by D-19 (2026-05-13). | BE |
```

(Replace `TD-XX` with the next available number in the BE 50-99 range.)

- [ ] **Step 14.6: Update BACKLOG.md**

In `docs/SSOT/BACKLOG.md`, add a new row under the appropriate section (or flip an existing matching row from `⏳ Planned` to `✅ Done`):

```markdown
| Closed posts on both profiles (D-19) | FR-PROFILE-001 AC4, FR-PROFILE-002 AC2, FR-POST-017 AC1+AC5 | ✅ Done | 2026-05-13 |
```

- [ ] **Step 14.7: Commit**

```bash
git add docs/SSOT/spec/02_profile_and_privacy.md \
        docs/SSOT/spec/04_posts.md \
        docs/SSOT/DECISIONS.md \
        docs/SSOT/TECH_DEBT.md \
        docs/SSOT/BACKLOG.md
git commit -m "docs(ssot): revise FR-PROFILE / FR-POST-017 + D-19 for cross-profile closed posts

FR-PROFILE-001 AC4 + FR-PROFILE-002 AC2 + FR-POST-017 AC1 revised, AC5
added. New D-19 reverses recipient-privacy carve-out from D-7. New TD
captured for renaming the recipients table."
```

---

## Task 15: Pre-PR gates + push

**Files:** none

- [ ] **Step 15.1: Run all pre-push gates**

```bash
cd app
pnpm typecheck && pnpm test && pnpm lint
```
Expected: all three green.

- [ ] **Step 15.2: Push the branch**

```bash
git push -u origin HEAD
```

- [ ] **Step 15.3: Open the PR against `dev`**

Per CLAUDE.md §6 — the working branch in this project is `dev`, not `main`. Open the PR against `dev`:

```bash
gh pr create --base dev --head "$(git branch --show-current)" \
  --title "feat(profile): closed posts on both publisher and respondent profiles" \
  --body "$(cat <<'EOF'
## Summary
Closed-delivered posts now appear on both stakeholders' profiles with a 📤/📥 economic-role badge derived from (post.type, identity-role). Visibility for third parties follows the post's original setting (Public / Followers-only / Only-me).

## Mapped to spec
- FR-PROFILE-001 AC4 (revised) — docs/SSOT/spec/02_profile_and_privacy.md
- FR-PROFILE-002 AC2 (revised) — docs/SSOT/spec/02_profile_and_privacy.md
- FR-POST-017 AC1 (revised) + AC5 (new) — docs/SSOT/spec/04_posts.md
- D-19 (new) — docs/SSOT/DECISIONS.md

Design: docs/superpowers/specs/2026-05-13-closed-posts-on-both-profiles-design.md

## Changes
- Migrations 0056 (visibility predicate) + 0057 (profile_closed_posts RPC).
- New application port + use case + tests.
- Infra adapter implementing the RPC + hydrate flow.
- New ProfileClosedPostsGrid; PostCardProfile renders the 📤/📥 badge.
- Both profile screens swap to the new use case on the closed tab.

## Tests
- `pnpm typecheck` ✅
- `pnpm test` ✅
- `pnpm lint` ✅
- Manual browser verification: see screenshots below.

## SSOT updated
- [x] BACKLOG.md row added (✅ Done)
- [x] spec/02 + spec/04 updated
- [x] DECISIONS.md — D-19 appended
- [x] TECH_DEBT.md — new BE row for renaming `recipients` → `respondents`

## Risk / rollout notes
Visibility predicate update touches a function used by feed/search; both already filter by status='open' so no regression expected. Verified manually in the browser. Migrations are forward-only and reversible by re-creating the prior function from migration 0005.

## Screenshots
<paste from Task 13.6>
EOF
)"
```

- [ ] **Step 15.4: Enable auto-merge**

```bash
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

- [ ] **Step 15.5: After CI passes**

```bash
git switch dev
git pull --ff-only origin dev
git branch -D <feature-branch-name>
```

---
