# Post-detail ⋮ menu + admin remove-post — Design

| Field | Value |
| ----- | ----- |
| Status | Draft (pending implementation plan) |
| Date | 2026-05-10 |
| SRS impact | Implements FR-POST-010, FR-POST-014 AC4, FR-POST-015 AC1 (delete only); adds **new** FR-ADMIN-009 (manual delete from post screen) |
| Owner | agent |

## 1. Problem

`app/apps/mobile/app/post/[id].tsx` ships without the `⋮` overflow menu that the SRS already specifies on the post detail screen for both viewers and owners (FR-POST-014 AC4, FR-POST-015 AC1). Concretely:

- A non-owner viewer has no way to report or block the poster from the post screen.
- An owner has no delete action on the post screen — only "Mark as delivered" / "Reopen" via `OwnerActionsBar`.
- The Super Admin has **no** direct moderation affordance on a post: the only path defined today (FR-ADMIN-005) is a button on a system message inside the report-channel chat thread, and that flow is not yet implemented either. There is no way to remove a post quickly from the post itself.

Backend infrastructure is already in place: `users.is_super_admin`, `is_admin(uid)` SECURITY DEFINER predicate, `posts.status = 'removed_admin'`, the `audit_events` table with an established insert pattern, and RLS that already hides `removed_admin` from non-owners. The gap is purely the application surface plus the new admin-removal RPC.

## 2. Goal

Ship the `⋮` menu on the post-detail screen with the items from the SRS *plus* an admin-only "Remove as admin" action. Reuse existing use cases for delete / report / block; add one new use case + RPC for admin removal.

Out of scope (logged as separate tech debt, see §8):
- Edit post screen (FR-POST-008) — no edit screen exists yet; not built here.
- `⋮` menu on feed cards (mentioned by FR-POST-010 AC1) — post-detail only.
- Surfacing `removed_admin` posts to their owner with a "removed by admin" banner — owner currently sees the post disappear silently; fixed in a separate ticket.
- Admin restore flow (FR-ADMIN-002).
- Notifications when a post is removed.

## 3. Menu contents by viewer role

| Viewer | Menu items |
| --- | --- |
| Guest (unauthenticated) | menu does not render |
| Regular viewer (signed in, not owner, not admin) | 🚩 דווח · 🚫 חסום משתמש |
| Owner | 🗑️ מחק את הפוסט |
| Super Admin viewing someone else's post | 🚩 דווח · 🚫 חסום משתמש · 🛡️ הסר כאדמין |
| Super Admin viewing their own post | 🗑️ מחק את הפוסט (treated as owner) |

"Mark as delivered" / "Reopen" stay where they are — primary CTAs at the bottom via `OwnerActionsBar`. Only delete/edit (and admin remove) live in the overflow menu.

## 4. Architecture

Five small, focused units. Each can be understood in isolation.

### 4.1 `PostMenuButton` + `PostMenuSheet` (UI)

Path: `app/apps/mobile/src/components/post/`.

- `PostMenuButton` — the floating ⋮ icon. Placed in the post detail header (top-leading in RTL). Tap opens the sheet.
- `PostMenuSheet` — bottom-sheet `Modal` matching the existing closure-sheet visual idiom. Receives `post`, `viewerId`, `isSuperAdmin`. Computes the role bucket from the table in §3 and renders only the applicable items. Each item dispatches to a confirmation modal or an action modal.

No business logic in these components — they are pure dispatchers.

### 4.2 `ReportPostModal`

Path: `app/apps/mobile/src/components/post/ReportPostModal.tsx`.

Direct mirror of the existing `app/apps/mobile/src/components/ReportChatModal.tsx`. Same five reasons (Spam / Offensive / Misleading / Illegal / Other), same optional note, same `duplicate_within_24h` handling. The only differences: title text, and submission goes through `ReportPostUseCase` instead of `ReportChatUseCase`.

### 4.3 `ReportPostUseCase` (application)

Path: `app/packages/application/src/reports/ReportPostUseCase.ts`.

Mirrors `ReportChatUseCase`. Wraps `IReportRepository.submit` with `targetType: 'post'` and `targetId: postId`. No new repository code — `IReportRepository.submit` already accepts a `'post'` target.

### 4.4 `AdminRemovePostUseCase` (application) + port extension

Path: `app/packages/application/src/posts/AdminRemovePostUseCase.ts`.

```ts
class AdminRemovePostUseCase {
  constructor(private readonly repo: IPostRepository) {}
  async execute(input: { postId: string }): Promise<void> {
    await this.repo.adminRemove(input.postId);
  }
}
```

Port addition: `IPostRepository.adminRemove(postId: string): Promise<void>`. Adapter implementation in `SupabasePostRepository` calls the new RPC (§4.5). Errors map to existing `PostError` codes (`forbidden` for non-admin callers, `not_found` if the post is gone).

### 4.5 SQL migration — `admin_remove_post` RPC

Path: `supabase/migrations/0017_admin_remove_post.sql`.

```sql
create or replace function public.admin_remove_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if not public.is_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.posts
     set status = 'removed_admin', updated_at = now()
   where post_id = p_post_id
     and status <> 'removed_admin';

  if not found then
    -- already removed or does not exist; idempotent no-op
    return;
  end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'manual_remove_target', 'post', p_post_id, '{}'::jsonb);
end;
$$;

grant execute on function public.admin_remove_post(uuid) to authenticated;
```

Notes:
- `SECURITY DEFINER` is required because the existing `posts_delete_self_open` RLS policy only lets the owner mutate their own row. A regular `UPDATE` from an admin would be blocked by RLS even though `is_admin(auth.uid())` is true. The RPC sidesteps this safely because it explicitly re-checks `is_admin` before writing.
- The function only flips `status` and emits an audit event — no hard delete, no media-asset cleanup. Media stays in Storage; the post row stays in the DB. This is intentional and matches FR-ADMIN-005 AC2 ("status to `removed_admin`"). A future `admin_restore_post` RPC (FR-ADMIN-002) can reverse it.
- The audit `action` value is `'manual_remove_target'` — already in the `audit_events.action` CHECK constraint defined by migration 0005. Combined with `target_type = 'post'` it unambiguously identifies an admin post removal versus user/chat removals. No schema change to `audit_events`.
- The `where status <> 'removed_admin'` clause makes the RPC idempotent: re-running on an already-removed post is a quiet no-op rather than a duplicate audit event.

### 4.6 `useIsSuperAdmin()` hook

Path: `app/apps/mobile/src/hooks/useIsSuperAdmin.ts`.

```ts
export function useIsSuperAdmin(): boolean {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const { data } = useQuery({
    queryKey: ['users.is_super_admin', userId],
    queryFn: () => fetchIsSuperAdmin(userId!),
    enabled: userId !== null,
    staleTime: Infinity,
  });
  return data === true;
}
```

`fetchIsSuperAdmin` reads `users.is_super_admin` for the current user. RLS already permits a user to read their own row. The flag is cached for the session lifetime — a sign-out clears React Query state via the existing app shell.

This deliberately avoids extending `AuthSession` (which is a port-level type owned by `IAuthService`) with a field that belongs to the application's user domain. The two stay separated.

## 5. Confirmation copy (Hebrew)

### Owner delete

```
🗑️ למחוק את הפוסט?
הפוסט יימחק לצמיתות. שיחות שנפתחו סביבו יישארו ברשימת
הצ'אטים שלך, עם הערה שהפוסט המקורי לא זמין יותר.
[ ביטול ]      [ מחק ]
```

### Admin remove

```
🛡️ להסיר את הפוסט?
הפוסט "[כותרת]" יוסתר מהפיד ויסומן כמוסר על ידי מנהל.
ניתן יהיה לשחזר אותו בעתיד דרך יומן האודיט.
[ ביטול ]      [ הסר ]
```

### Block user

```
🚫 לחסום את [שם הבעלים]?
לא תראה יותר פוסטים שלו, והוא לא יוכל ליצור איתך קשר.
ניתן לבטל בהגדרות → משתמשים חסומים.
[ ביטול ]      [ חסום ]
```

After every successful action: `router.back()` plus a brief toast.

## 6. Data flow

Owner delete: existing path — `DeletePostUseCase` → `IPostRepository.delete` → Supabase `DELETE` constrained by `posts_delete_self_open` RLS.

Report post: `ReportPostModal` → `ReportPostUseCase` → `IReportRepository.submit({ targetType: 'post', targetId: postId, reason, note })`. The existing reports trigger (`reports_emit_admin_system_message`, migration 0013) will fire and drop a system message into the super-admin's inbox automatically.

Block user: existing path — `BlockUserUseCase.execute({ blockerId: viewerId, blockedId: post.ownerId })`. RLS via `is_blocked()` will hide all of the blocked user's posts from the viewer's feed on the next refetch.

Admin remove: `PostMenuSheet` → confirmation modal → `AdminRemovePostUseCase` → `IPostRepository.adminRemove` → `admin_remove_post` RPC → status flip + audit event. Post-mutation, `router.back()` and the feed query's `removed_admin` filter (already enforced by RLS) means the post is gone on the next render.

## 7. Authorization model

- **Client gate**: `useIsSuperAdmin()` controls which menu items render. This is convenience — a non-admin who manipulates the UI can still try to call the RPC.
- **Server gate**: `admin_remove_post` re-checks `is_admin(auth.uid())` and raises a SQL exception with `errcode = '42501'` (insufficient privilege) for non-admins. The Supabase adapter maps this to `PostError('forbidden')`.

The two gates together satisfy FR-ADMIN-006 ("the flag is **not** trusted from the client; every admin endpoint and every RLS policy revalidates it") for this surface.

## 8. Tech debt opened by this PR

| ID | Item | Owner |
| -- | ---- | ----- |
| TD-FE (next free) | `⋮` menu on feed cards (FR-POST-010 AC1) — post-detail only here | P1.x |
| TD-FE (next free) | "Edit" item on owner menu — needs `app/edit-post/[id].tsx` screen (FR-POST-008) | P2.x |
| TD-FE/BE (next free) | Surface `removed_admin` posts to their owner under "My Posts" with a "removed by admin" banner | When admin moderation lands |
| TD-BE (next free) | `admin_restore_post` RPC + UI (FR-ADMIN-002) — partial pair to admin remove | P2.5 |

The exact TD numbers are assigned at PR time per `TECH_DEBT.md` (FE: TD-100..149, BE: TD-50..99).

## 9. Tests

### Unit (vitest, run via `pnpm test`)

- `AdminRemovePostUseCase.test.ts` — invokes `repo.adminRemove(postId)` with the right input via a `fakePostRepository`.
- `ReportPostUseCase.test.ts` — mirrors `ReportChatUseCase.test.ts`: happy path + duplicate-within-24h.

### SQL probe (manual, documented in PR body)

1. Sign in as a regular user; call `select admin_remove_post('<some-post-id>')`. Expect: `forbidden` (errcode 42501).
2. Sign in as the canonical super admin (`karmacommunity2.0@gmail.com`); same call. Expect: `null` return, `posts.status = 'removed_admin'`, one new row in `audit_events` with `action = 'manual_remove_target'`.
3. Re-run as admin on the now-removed post. Expect: idempotent no-op, no second audit row.

### UI verification (Chrome MCP, web preview)

Per the user's standing instruction (`feedback_verify_ui_before_claiming_done`), I do not claim the task is done before loading the post screen in the browser and checking the DOM. Cases to check:

1. Guest at `(guest)/feed` → tap a post card → preview screen — no `⋮` button visible.
2. Regular viewer on someone else's post → `⋮` shows Report + Block; Admin and Delete are absent.
3. Owner on own post → `⋮` shows Delete only; Report/Block/Admin absent.
4. Super admin on someone else's post → `⋮` shows Report + Block + Admin remove.
5. End-to-end admin remove: confirm, route returns, feed no longer shows the post (refetch).

## 10. SRS additions

A new requirement is added to `docs/SSOT/SRS/02_functional_requirements/12_super_admin.md`:

> ### FR-ADMIN-009 — Manual delete from post screen
>
> **Description.** While signed in as the Super Admin, the post detail screen exposes an "Remove as admin" action inside the `⋮` overflow menu, separate from the report-channel flow in FR-ADMIN-005.
>
> **Acceptance Criteria.**
> - AC1. The action is hidden for non-admin sessions and for posts the admin owns (the admin sees their owner-mode menu instead).
> - AC2. Confirms with a modal, then sets `Post.status = 'removed_admin'`. Hard delete is **not** performed.
> - AC3. Authorization is re-checked server-side via `is_admin(auth.uid())` inside a SECURITY DEFINER RPC; client gating is convenience only.
> - AC4. An `audit_events` row is written with `action = 'manual_remove_target'`, `actor_id`, `target_type = 'post'`, `target_id = postId`.
> - AC5. The action is idempotent: re-issuing it on an already-removed post is a quiet no-op and does not write a second audit row.

The change log of `12_super_admin.md` gets a new line for version 0.2 / 2026-05-10.

## 11. Files touched (high-level)

New:
- `supabase/migrations/0017_admin_remove_post.sql`
- `app/packages/application/src/posts/AdminRemovePostUseCase.ts`
- `app/packages/application/src/posts/__tests__/AdminRemovePostUseCase.test.ts`
- `app/packages/application/src/reports/ReportPostUseCase.ts`
- `app/packages/application/src/reports/__tests__/ReportPostUseCase.test.ts`
- `app/apps/mobile/src/hooks/useIsSuperAdmin.ts`
- `app/apps/mobile/src/components/post/PostMenuButton.tsx`
- `app/apps/mobile/src/components/post/PostMenuSheet.tsx`
- `app/apps/mobile/src/components/post/ReportPostModal.tsx`

Modified:
- `app/packages/application/src/ports/IPostRepository.ts` — add `adminRemove(postId)`.
- `app/packages/application/src/posts/__tests__/fakePostRepository.ts` — implement `adminRemove`.
- `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` — call the RPC.
- `app/apps/mobile/src/services/postsComposition.ts` — add `getAdminRemovePostUseCase()`.
- `app/apps/mobile/app/post/[id].tsx` — mount `PostMenuButton` in the header.
- `docs/SSOT/SRS/02_functional_requirements/12_super_admin.md` — add FR-ADMIN-009.
- `docs/SSOT/PROJECT_STATUS.md` — sprint board entry + counters.
- `docs/SSOT/HISTORY.md` — append the feature row at the top.
- `docs/SSOT/TECH_DEBT.md` — open four new TDs per §8.
