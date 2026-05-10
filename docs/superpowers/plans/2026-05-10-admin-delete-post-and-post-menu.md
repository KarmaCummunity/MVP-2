# Post-detail ⋮ menu + admin remove-post — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the `⋮` overflow menu to the post-detail screen with role-aware items (Report/Block for viewers, Delete for owners, **Remove as admin** for super admins), backed by a new SQL RPC + use case for admin removal.

**Architecture:** Five small units — two UI components (`PostMenuButton`, `PostMenuSheet`) plus three confirmation/modal components, one new application use case (`AdminRemovePostUseCase`), one mirrored use case (`ReportPostUseCase`), one new repository port method (`adminRemove`), and one new SQL migration with a `SECURITY DEFINER` RPC. Existing `DeletePostUseCase` and `BlockUserUseCase` are reused. Authorization is double-gated: a `useIsSuperAdmin()` hook controls UI visibility, and the RPC re-checks `is_admin(auth.uid())` server-side.

**Tech Stack:** TypeScript 5.5, vitest, `@supabase/supabase-js@^2.69`, Postgres + RLS, React Native + expo-router, Zustand, `@tanstack/react-query`. No new runtime deps.

**Branch:** Continue on the existing worktree branch `claude/unruffled-black-7d25c9` (the design spec is already committed there as `6bf50af`).

**Spec:** [`docs/superpowers/specs/2026-05-10-admin-delete-post-and-post-menu-design.md`](../specs/2026-05-10-admin-delete-post-and-post-menu-design.md)

**SRS coverage:**
- FR-POST-014 AC4 (viewer ⋮: Report + Block) — fulfilled.
- FR-POST-015 AC1 (owner: Edit + Delete) — Delete only; Edit deferred (TD-125).
- FR-POST-010 (owner delete via ⋮ menu).
- FR-MOD-001 (report on post target).
- FR-MOD-007 + FR-MOD-009 (block user).
- **New: FR-ADMIN-009** — added to `12_super_admin.md` in this PR.

**Out of scope** (logged as new TDs at end of plan):
- TD-124 (FE): ⋮ menu on feed cards.
- TD-125 (FE): "Edit" item on owner menu — needs `app/edit-post/[id].tsx` screen.
- TD-126 (FE/BE): Surface `removed_admin` posts to owner with "removed by admin" banner.
- TD-52 (BE): `admin_restore_post` RPC + UI (FR-ADMIN-002 partial).

---

## File Structure

| Path | Purpose | Status |
| ---- | ------- | ------ |
| `app/packages/application/src/ports/IPostRepository.ts` | Add `adminRemove(postId)` to interface. | **Modify** |
| `app/packages/application/src/posts/AdminRemovePostUseCase.ts` | Single-method use case wrapping `repo.adminRemove`. | **Create** |
| `app/packages/application/src/posts/__tests__/AdminRemovePostUseCase.test.ts` | TDD coverage. | **Create** |
| `app/packages/application/src/posts/__tests__/fakePostRepository.ts` | Add `adminRemove` mock + capture. | **Modify** |
| `app/packages/application/src/posts/index.ts` | Re-export `AdminRemovePostUseCase`. | **Modify** |
| `app/packages/application/src/reports/ReportPostUseCase.ts` | Mirror of `ReportChatUseCase` with `targetType: 'post'`. | **Create** |
| `app/packages/application/src/reports/__tests__/fakeReportRepository.ts` | In-memory `IReportRepository`. | **Create** |
| `app/packages/application/src/reports/__tests__/ReportPostUseCase.test.ts` | TDD coverage. | **Create** |
| `app/packages/application/src/reports/index.ts` | Re-export. (Create if missing.) | **Modify/Create** |
| `supabase/migrations/0017_admin_remove_post.sql` | RPC `admin_remove_post(uuid)`. | **Create** |
| `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` | Implement `adminRemove` (call RPC, map errors). | **Modify** |
| `app/packages/infrastructure-supabase/src/database.types.ts` | Regenerated to include the new RPC. | **Modify (regenerated)** |
| `app/apps/mobile/src/hooks/useIsSuperAdmin.ts` | React-Query-cached self-read of `users.is_super_admin`. | **Create** |
| `app/apps/mobile/src/components/post/PostMenuButton.tsx` | Floating ⋮ icon trigger. | **Create** |
| `app/apps/mobile/src/components/post/PostMenuSheet.tsx` | Bottom-sheet with role-filtered items. | **Create** |
| `app/apps/mobile/src/components/post/ReportPostModal.tsx` | Mirror of `ReportChatModal` for post target. | **Create** |
| `app/apps/mobile/src/components/post/ConfirmActionModal.tsx` | Generic two-button confirmation modal (used for delete/admin-remove/block). | **Create** |
| `app/apps/mobile/src/services/postsComposition.ts` | Add `getAdminRemovePostUseCase()`. | **Modify** |
| `app/apps/mobile/src/lib/container.ts` | Add `reportPost` + `adminRemovePost` (mirror existing wiring). | **Modify** |
| `app/apps/mobile/app/post/[id].tsx` | Mount `PostMenuButton` via `Stack.Screen` `headerRight`. | **Modify** |
| `docs/SSOT/SRS/02_functional_requirements/12_super_admin.md` | Add FR-ADMIN-009 + change-log row. | **Modify** |
| `docs/SSOT/PROJECT_STATUS.md` | Last Updated date; sprint-board entry. | **Modify** |
| `docs/SSOT/HISTORY.md` | Append top entry. | **Modify** |
| `docs/SSOT/TECH_DEBT.md` | Open TD-52, TD-124, TD-125, TD-126. | **Modify** |

---

## Pre-flight

- [ ] **Step 0.1: Verify worktree state**

```bash
cd /Users/navesarussi/KC/MVP-2/.claude/worktrees/unruffled-black-7d25c9
git status
git branch --show-current
git log -1 --oneline
```

Expected: tree clean (or only this plan file untracked); branch is `claude/unruffled-black-7d25c9`; latest commit is the spec commit `6bf50af docs(spec): post-detail menu + admin remove-post`.

- [ ] **Step 0.2: Install deps if needed**

```bash
pnpm install
```

Expected: "Already up to date" or installs without error.

- [ ] **Step 0.3: Baseline checks pass**

```bash
pnpm --filter @kc/application test --run
pnpm --filter @kc/mobile typecheck
```

Expected: all 109 vitest tests pass; typecheck completes without errors.

---

## Phase A: SRS update (paper trail before code)

- [ ] **Step A.1: Add FR-ADMIN-009 to the super-admin SRS file**

Edit `docs/SSOT/SRS/02_functional_requirements/12_super_admin.md`. Insert this block right after the existing `FR-ADMIN-008` block (before the `## Change Log` heading):

```markdown
## FR-ADMIN-009 — Manual delete from post screen

**Description.**
While signed in as the Super Admin, the post detail screen exposes an "Remove as admin" action inside the `⋮` overflow menu, separate from the report-channel flow in `FR-ADMIN-005`.

**Source.**
- This document, §10 of `docs/superpowers/specs/2026-05-10-admin-delete-post-and-post-menu-design.md`.

**Acceptance Criteria.**
- AC1. The action is hidden for non-admin sessions and for posts the admin owns (the admin sees their owner-mode menu instead).
- AC2. Confirms with a modal, then sets `Post.status = 'removed_admin'`. Hard delete is **not** performed.
- AC3. Authorization is re-checked server-side via `is_admin(auth.uid())` inside a `SECURITY DEFINER` RPC; client gating is convenience only.
- AC4. An `audit_events` row is written with `action = 'manual_remove_target'`, `actor_id`, `target_type = 'post'`, `target_id = postId`.
- AC5. The action is idempotent: re-issuing it on an already-removed post is a quiet no-op and does not write a second audit row.

**Related.** Domain: `Post.status`, `AuditEvent`.

---
```

Also append a new line to the change-log table at the bottom of the same file:

```markdown
| 0.2 | 2026-05-10 | Added FR-ADMIN-009 (manual delete from post screen). |
```

- [ ] **Step A.2: Commit the SRS update**

```bash
git add docs/SSOT/SRS/02_functional_requirements/12_super_admin.md
git commit -m "$(cat <<'EOF'
docs(srs): add FR-ADMIN-009 — manual delete from post screen

Documents the admin-only remove-post affordance on the post detail
⋮ menu before its implementation. Complements FR-ADMIN-005 (report-
channel flow) and reuses the existing audit_events.action value
'manual_remove_target' so no schema change is needed.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase B: Application layer — port + use cases (TDD)

### Task B.1: Add `adminRemove` to `IPostRepository`

**Files:**
- Modify: `app/packages/application/src/ports/IPostRepository.ts`

- [ ] **Step B.1.1: Insert the `adminRemove` signature**

In the `IPostRepository` interface (around line 89, right after `delete(postId: string): Promise<void>;`), insert:

```ts
  /**
   * FR-ADMIN-009 — flip a post's status to `removed_admin` via the
   * `admin_remove_post` RPC. Server re-checks `is_admin(auth.uid())`;
   * non-admin callers receive a `forbidden` PostError.
   *
   * Idempotent: calling again on an already-removed post is a quiet
   * no-op (no second audit row).
   */
  adminRemove(postId: string): Promise<void>;
```

- [ ] **Step B.1.2: Verify typecheck still passes (now expecting failures in adapter / fake)**

```bash
pnpm --filter @kc/application typecheck
```

Expected: PASS for `@kc/application` itself (the interface compiles). Adapter + fake will be updated next.

### Task B.2: Extend `FakePostRepository` with `adminRemove`

**Files:**
- Modify: `app/packages/application/src/posts/__tests__/fakePostRepository.ts`

- [ ] **Step B.2.1: Add capture field + method**

Open `fakePostRepository.ts`. Inside the `FakePostRepository` class:

a. Add a capture field next to `lastDeletePostId` (around line 27):

```ts
  lastAdminRemovePostId: string | null = null;
```

b. Add an error stub next to `deleteError` (around line 38):

```ts
  adminRemoveError: Error | null = null;
```

c. Add the method right after `delete = async ...` (around line 75):

```ts
  adminRemove = async (postId: string): Promise<void> => {
    this.lastAdminRemovePostId = postId;
    if (this.adminRemoveError) throw this.adminRemoveError;
  };
```

- [ ] **Step B.2.2: Verify the application package still typechecks**

```bash
pnpm --filter @kc/application typecheck
```

Expected: PASS.

### Task B.3: TDD — `AdminRemovePostUseCase`

**Files:**
- Test: `app/packages/application/src/posts/__tests__/AdminRemovePostUseCase.test.ts`
- Create: `app/packages/application/src/posts/AdminRemovePostUseCase.ts`

- [ ] **Step B.3.1: Write the failing test**

Create `app/packages/application/src/posts/__tests__/AdminRemovePostUseCase.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { AdminRemovePostUseCase } from '../AdminRemovePostUseCase';
import { FakePostRepository } from './fakePostRepository';

describe('AdminRemovePostUseCase', () => {
  it('forwards postId to repo.adminRemove', async () => {
    const repo = new FakePostRepository();
    const uc = new AdminRemovePostUseCase(repo);
    await uc.execute({ postId: 'p_42' });
    expect(repo.lastAdminRemovePostId).toBe('p_42');
  });

  it('propagates repo errors (forbidden / not_found / unknown)', async () => {
    const repo = new FakePostRepository();
    repo.adminRemoveError = new Error('forbidden');
    const uc = new AdminRemovePostUseCase(repo);
    await expect(uc.execute({ postId: 'p_42' })).rejects.toThrow('forbidden');
  });
});
```

- [ ] **Step B.3.2: Run the test — expect failure**

```bash
pnpm --filter @kc/application test --run AdminRemovePostUseCase
```

Expected: FAIL with module-not-found (`AdminRemovePostUseCase` doesn't exist yet).

- [ ] **Step B.3.3: Implement the use case**

Create `app/packages/application/src/posts/AdminRemovePostUseCase.ts`:

```ts
/** FR-ADMIN-009 — Super-admin flips a post's status to `removed_admin`. */
import type { IPostRepository } from '../ports/IPostRepository';

export interface AdminRemovePostInput {
  postId: string;
}

export class AdminRemovePostUseCase {
  constructor(private readonly repo: IPostRepository) {}

  async execute(input: AdminRemovePostInput): Promise<void> {
    await this.repo.adminRemove(input.postId);
  }
}
```

- [ ] **Step B.3.4: Run the test — expect pass**

```bash
pnpm --filter @kc/application test --run AdminRemovePostUseCase
```

Expected: 2 tests PASS.

- [ ] **Step B.3.5: Re-export from posts barrel**

Open `app/packages/application/src/posts/index.ts` and add a line alongside the existing exports:

```ts
export { AdminRemovePostUseCase } from './AdminRemovePostUseCase';
export type { AdminRemovePostInput } from './AdminRemovePostUseCase';
```

(Add both lines if both are missing; merge into the existing export list if needed. Verify with `grep '^export' app/packages/application/src/posts/index.ts` — `AdminRemovePostUseCase` should appear exactly once.)

- [ ] **Step B.3.6: Commit**

```bash
git add app/packages/application/src/ports/IPostRepository.ts \
        app/packages/application/src/posts/AdminRemovePostUseCase.ts \
        app/packages/application/src/posts/__tests__/AdminRemovePostUseCase.test.ts \
        app/packages/application/src/posts/__tests__/fakePostRepository.ts \
        app/packages/application/src/posts/index.ts
git commit -m "$(cat <<'EOF'
feat(application): add AdminRemovePostUseCase + adminRemove port

FR-ADMIN-009. Mirrors DeletePostUseCase's thin-wrapper shape.
Adapter implementation in @kc/infrastructure-supabase (next commit)
calls the new admin_remove_post RPC.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

### Task B.4: TDD — `ReportPostUseCase`

**Files:**
- Test: `app/packages/application/src/reports/__tests__/ReportPostUseCase.test.ts`
- Test fixture: `app/packages/application/src/reports/__tests__/fakeReportRepository.ts`
- Create: `app/packages/application/src/reports/ReportPostUseCase.ts`
- Modify: `app/packages/application/src/reports/index.ts` (create if missing)

- [ ] **Step B.4.1: Create the fake report repository**

Create `app/packages/application/src/reports/__tests__/fakeReportRepository.ts`:

```ts
import type { IReportRepository } from '../../ports/IReportRepository';
import type { ReportSubmission } from '@kc/domain';

export class FakeReportRepository implements IReportRepository {
  lastSubmit: { reporterId: string; input: ReportSubmission } | null = null;
  submitError: Error | null = null;

  submit = async (reporterId: string, input: ReportSubmission): Promise<void> => {
    this.lastSubmit = { reporterId, input };
    if (this.submitError) throw this.submitError;
  };
}
```

- [ ] **Step B.4.2: Write the failing test**

Create `app/packages/application/src/reports/__tests__/ReportPostUseCase.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { ReportPostUseCase } from '../ReportPostUseCase';
import { FakeReportRepository } from './fakeReportRepository';

describe('ReportPostUseCase', () => {
  it('submits with targetType="post" and forwards postId, reason, note', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportPostUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      postId: 'p_target',
      reason: 'Spam',
      note: 'נראה ספאם',
    });

    expect(repo.lastSubmit).not.toBeNull();
    expect(repo.lastSubmit!.reporterId).toBe('u_reporter');
    expect(repo.lastSubmit!.input).toEqual({
      targetType: 'post',
      targetId: 'p_target',
      reason: 'Spam',
      note: 'נראה ספאם',
    });
  });

  it('omits note when not provided', async () => {
    const repo = new FakeReportRepository();
    const uc = new ReportPostUseCase(repo);

    await uc.execute({
      reporterId: 'u_reporter',
      postId: 'p_target',
      reason: 'Offensive',
    });

    expect(repo.lastSubmit!.input.note).toBeUndefined();
  });

  it('propagates repo errors', async () => {
    const repo = new FakeReportRepository();
    repo.submitError = new Error('duplicate_within_24h');
    const uc = new ReportPostUseCase(repo);

    await expect(
      uc.execute({ reporterId: 'u_reporter', postId: 'p_target', reason: 'Spam' }),
    ).rejects.toThrow('duplicate_within_24h');
  });
});
```

- [ ] **Step B.4.3: Run the test — expect failure**

```bash
pnpm --filter @kc/application test --run ReportPostUseCase
```

Expected: FAIL with module-not-found.

- [ ] **Step B.4.4: Implement the use case**

Create `app/packages/application/src/reports/ReportPostUseCase.ts`:

```ts
/** FR-MOD-001 — submit a report against a single post. Mirror of ReportChatUseCase. */
import type { ReportReason, ReportSubmission } from '@kc/domain';
import type { IReportRepository } from '../ports/IReportRepository';

export interface ReportPostInput {
  reporterId: string;
  postId: string;
  reason: ReportReason;
  note?: string;
}

export class ReportPostUseCase {
  constructor(private readonly repo: IReportRepository) {}

  async execute(input: ReportPostInput): Promise<void> {
    const submission: ReportSubmission = {
      targetType: 'post',
      targetId: input.postId,
      reason: input.reason,
      note: input.note,
    };
    await this.repo.submit(input.reporterId, submission);
  }
}
```

- [ ] **Step B.4.5: Run the test — expect pass**

```bash
pnpm --filter @kc/application test --run ReportPostUseCase
```

Expected: 3 tests PASS.

- [ ] **Step B.4.6: Re-export from reports barrel**

Check first whether `app/packages/application/src/reports/index.ts` exists:

```bash
ls app/packages/application/src/reports/index.ts 2>/dev/null || echo "missing"
```

If it exists, append:

```ts
export { ReportPostUseCase } from './ReportPostUseCase';
export type { ReportPostInput } from './ReportPostUseCase';
```

If it does NOT exist, create it with both the existing chat use case and the new post use case:

```ts
export { ReportChatUseCase } from './ReportChatUseCase';
export type { ReportChatInput } from './ReportChatUseCase';
export { ReportPostUseCase } from './ReportPostUseCase';
export type { ReportPostInput } from './ReportPostUseCase';
export { ReportError } from './errors';
```

Then verify the package's top-level `index.ts` (`app/packages/application/src/index.ts`) re-exports the reports barrel — grep for `./reports` there and only add the export if it's missing.

- [ ] **Step B.4.7: Commit**

```bash
git add app/packages/application/src/reports/ReportPostUseCase.ts \
        app/packages/application/src/reports/__tests__/ReportPostUseCase.test.ts \
        app/packages/application/src/reports/__tests__/fakeReportRepository.ts \
        app/packages/application/src/reports/index.ts
git commit -m "$(cat <<'EOF'
feat(application): add ReportPostUseCase mirroring ReportChat

FR-MOD-001 with targetType='post'. Reuses the existing
IReportRepository.submit port — no new infrastructure needed.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase C: SQL migration — `admin_remove_post` RPC

### Task C.1: Author the migration

**Files:**
- Create: `supabase/migrations/0017_admin_remove_post.sql`

- [ ] **Step C.1.1: Verify the next free migration number**

```bash
ls supabase/migrations/ | sort | tail -3
```

Expected last entry: `0016_closure_cleanup_cron.sql`. New file is `0017`.

- [ ] **Step C.1.2: Write the migration**

Create `supabase/migrations/0017_admin_remove_post.sql`:

```sql
-- 0017_admin_remove_post | FR-ADMIN-009
-- Super-admin flips Post.status to 'removed_admin' from the post detail screen.
-- Server re-checks is_admin(auth.uid()) — client gating is convenience only.
-- Idempotent: re-running on an already-removed post is a no-op (no extra audit
-- row). Uses the existing audit_events.action value 'manual_remove_target'
-- (defined in 0005_init_moderation.sql), so no schema change is needed.

create or replace function public.admin_remove_post(p_post_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_actor uuid := auth.uid();
begin
  if v_actor is null then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not public.is_admin(v_actor) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.posts
     set status = 'removed_admin',
         updated_at = now()
   where post_id = p_post_id
     and status <> 'removed_admin';

  if not found then
    -- Either the post does not exist or it's already in removed_admin.
    -- Treat both as quiet no-ops (idempotent). Audit row is NOT written
    -- in either case to avoid duplicate or orphan audit lines.
    return;
  end if;

  insert into public.audit_events (actor_id, action, target_type, target_id, metadata)
  values (v_actor, 'manual_remove_target', 'post', p_post_id, '{}'::jsonb);
end;
$$;

grant execute on function public.admin_remove_post(uuid) to authenticated;
revoke execute on function public.admin_remove_post(uuid) from anon;
```

- [ ] **Step C.1.3: Lint the migration locally (if Supabase CLI is available)**

```bash
which supabase && supabase db lint supabase/migrations/0017_admin_remove_post.sql || echo "supabase CLI not installed locally — will verify on apply"
```

- [ ] **Step C.1.4: Commit the migration**

```bash
git add supabase/migrations/0017_admin_remove_post.sql
git commit -m "$(cat <<'EOF'
feat(db): admin_remove_post RPC for FR-ADMIN-009

SECURITY DEFINER, gated on is_admin(auth.uid()). Flips post status
to removed_admin and writes a manual_remove_target audit event.
Idempotent — no second audit row on retry.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase D: Infrastructure adapter

### Task D.1: Implement `adminRemove` in `SupabasePostRepository`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts`

- [ ] **Step D.1.1: Add the method**

Open `SupabasePostRepository.ts`. Right after the existing `delete(...)` method (around line 178), insert:

```ts
  async adminRemove(postId: string): Promise<void> {
    const { error } = await this.client.rpc('admin_remove_post', { p_post_id: postId });
    if (error) {
      // Postgres errcode 42501 (insufficient_privilege) → forbidden.
      // PostgREST surfaces this as `code: '42501'` on the returned error.
      if (error.code === '42501' || /forbidden/i.test(error.message)) {
        const { PostError } = await import('@kc/application');
        throw new PostError('forbidden', error.message);
      }
      throw new Error(`adminRemove: ${error.message}`);
    }
  }
```

Note on the dynamic `import('@kc/application')`: the existing adapter already uses static imports of `@kc/application` types — check the file's existing import block for `PostError`. If `PostError` is already imported statically (search for `PostError` in the imports section), use it directly without the dynamic import:

```ts
  async adminRemove(postId: string): Promise<void> {
    const { error } = await this.client.rpc('admin_remove_post', { p_post_id: postId });
    if (error) {
      if (error.code === '42501' || /forbidden/i.test(error.message)) {
        throw new PostError('forbidden', error.message);
      }
      throw new Error(`adminRemove: ${error.message}`);
    }
  }
```

If `PostError` is NOT already imported, add it to the existing `import` from `@kc/application` at the top of the file (around line 12).

- [ ] **Step D.1.2: Verify infrastructure typechecks**

```bash
pnpm --filter @kc/infrastructure-supabase typecheck
```

Expected: PASS. If it fails because `database.types.ts` doesn't know about `admin_remove_post`, that's expected — the next step regenerates types.

### Task D.2: Regenerate `database.types.ts`

**Files:**
- Modify (regenerated): `app/packages/infrastructure-supabase/src/database.types.ts`

- [ ] **Step D.2.1: Check whether the migration is applied to the dev DB**

The RPC must be applied to the live Supabase dev project before regenerating types — otherwise the new function won't be in the introspection result.

```bash
# Check the package.json for the typegen script
grep -E 'gen.*types|database.types' app/packages/infrastructure-supabase/package.json
```

If a `typegen` or similar script exists, the operator runbook should document applying the migration via the Supabase dashboard SQL editor first, then regenerating. Add a manual operator step note to the PR description.

If type regeneration is not automated, **manually edit** `database.types.ts` to add the function under the `Functions` section. Open the file and find the existing function definitions (search for `admin_remove_post` to confirm it's missing, then look at the shape used by, e.g., `is_admin` or `close_post_with_recipient`). Insert:

```ts
      admin_remove_post: {
        Args: { p_post_id: string }
        Returns: undefined
      }
```

Place it alphabetically alongside other RPC entries.

- [ ] **Step D.2.2: Verify typecheck across the workspace**

```bash
pnpm typecheck
```

Expected: full workspace typecheck passes.

- [ ] **Step D.2.3: Commit the adapter + types**

```bash
git add app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts \
        app/packages/infrastructure-supabase/src/database.types.ts
git commit -m "$(cat <<'EOF'
feat(infra): SupabasePostRepository.adminRemove via RPC

Calls admin_remove_post and maps Postgres errcode 42501 to
PostError('forbidden'). Other errors surface with the RPC message
prefix.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase E: Mobile auth hook

### Task E.1: `useIsSuperAdmin()`

**Files:**
- Create: `app/apps/mobile/src/hooks/useIsSuperAdmin.ts`

- [ ] **Step E.1.1: Inspect the existing supabase client export**

```bash
grep -n "supabase\|getClient\|export" app/apps/mobile/src/lib/supabase.ts | head -10
```

Note the export path the file uses (likely `import { supabase } from '../lib/supabase'`). Use the same path in the hook.

- [ ] **Step E.1.2: Create the hook**

Create `app/apps/mobile/src/hooks/useIsSuperAdmin.ts`:

```ts
/**
 * FR-ADMIN-009 — UI-only convenience flag. The server re-checks via
 * is_admin(auth.uid()) inside the admin_remove_post RPC, so a tampered
 * client cannot escalate. We cache for the session lifetime — admin
 * promotion is a manual SQL operation that requires a session restart
 * to take effect anyway.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

async function fetchIsSuperAdmin(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select('is_super_admin')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    // RLS lets a user read their own row; if this fails, treat as non-admin.
    return false;
  }
  return data?.is_super_admin === true;
}

export function useIsSuperAdmin(): boolean {
  const userId = useAuthStore((s) => s.session?.userId ?? null);
  const { data } = useQuery({
    queryKey: ['users.is_super_admin', userId],
    queryFn: () => fetchIsSuperAdmin(userId as string),
    enabled: userId !== null,
    staleTime: Infinity,
  });
  return data === true;
}
```

(If the supabase client is exported under a different name in `lib/supabase.ts` — for example `client` or `getSupabaseClient()` — adjust the import. Run `grep "export" app/apps/mobile/src/lib/supabase.ts` to confirm.)

- [ ] **Step E.1.3: Verify mobile typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS.

- [ ] **Step E.1.4: Commit**

```bash
git add app/apps/mobile/src/hooks/useIsSuperAdmin.ts
git commit -m "$(cat <<'EOF'
feat(mobile): useIsSuperAdmin React Query hook

Reads users.is_super_admin for the current session via the existing
self-select RLS policy. Cached with staleTime: Infinity — admin
promotion is a manual SQL operation that needs a fresh session
anyway. UI-only convenience; the RPC re-checks server-side.

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase F: Mobile UI — confirmation modal + report modal + menu

### Task F.1: Generic `ConfirmActionModal`

**Files:**
- Create: `app/apps/mobile/src/components/post/ConfirmActionModal.tsx`

- [ ] **Step F.1.1: Inspect the existing reopen modal as a style reference**

```bash
sed -n '1,50p' app/apps/mobile/src/components/closure/ReopenConfirmModal.tsx
```

Note the Modal/View/Text/Pressable structure, padding, and color tokens used. Match them.

- [ ] **Step F.1.2: Create the generic confirmation modal**

Create `app/apps/mobile/src/components/post/ConfirmActionModal.tsx`:

```tsx
import { Modal, View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';

interface Props {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  /** When true, the confirm button is rendered in destructive (red) style. */
  destructive?: boolean;
  isBusy?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

export function ConfirmActionModal({
  visible,
  title,
  message,
  confirmLabel,
  destructive = false,
  isBusy = false,
  errorMessage = null,
  onCancel,
  onConfirm,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
          <View style={styles.row}>
            <Pressable
              style={[styles.btn, styles.btnSecondary, isBusy && styles.btnDisabled]}
              disabled={isBusy}
              onPress={onCancel}
              accessibilityLabel="ביטול"
            >
              <Text style={styles.btnSecondaryText}>ביטול</Text>
            </Pressable>
            <Pressable
              style={[
                styles.btn,
                destructive ? styles.btnDestructive : styles.btnPrimary,
                isBusy && styles.btnDisabled,
              ]}
              disabled={isBusy}
              onPress={onConfirm}
              accessibilityLabel={confirmLabel}
            >
              {isBusy ? (
                <ActivityIndicator color={colors.textInverse} />
              ) : (
                <Text style={styles.btnPrimaryText}>{confirmLabel}</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: spacing.base },
  sheet: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  message: { ...typography.body, color: colors.textSecondary, textAlign: 'right', lineHeight: 22 },
  error: { ...typography.caption, color: colors.danger, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnDestructive: { backgroundColor: colors.danger },
  btnSecondary: { backgroundColor: colors.surfaceMuted, borderWidth: 1, borderColor: colors.border },
  btnPrimaryText: { ...typography.button, color: colors.textInverse },
  btnSecondaryText: { ...typography.button, color: colors.textPrimary },
  btnDisabled: { opacity: 0.5 },
});
```

If `colors.danger` or `colors.surfaceMuted` does not exist in `@kc/ui` (check with `grep -E 'danger|surfaceMuted' app/packages/ui/src/colors.ts`), substitute the closest existing token (e.g., `colors.error` or `colors.surface`). Adjust accordingly.

- [ ] **Step F.1.3: Verify mobile typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS.

### Task F.2: `ReportPostModal`

**Files:**
- Create: `app/apps/mobile/src/components/post/ReportPostModal.tsx`

- [ ] **Step F.2.1: Read `ReportChatModal` end-to-end**

```bash
cat app/apps/mobile/src/components/ReportChatModal.tsx
```

Note: imports, container access, error mapping, styles.

- [ ] **Step F.2.2: Create `ReportPostModal` as a near-mirror**

Create `app/apps/mobile/src/components/post/ReportPostModal.tsx`. Copy the structure of `ReportChatModal.tsx` and adjust the differences:

- Title: `'דיווח על הפוסט'` (instead of `'דיווח על השיחה'`).
- Prop: `postId: string` (instead of `chatId`).
- Submit calls `container.reportPost.execute({ reporterId, postId, reason, note })`.
- Duplicate-error message: `'דיווחת על הפוסט הזה ב-24 השעות האחרונות.'`.

The exact code:

```tsx
// FR-MOD-001 — Report modal opened from post-detail ⋮ menu.
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import type { ReportReason } from '@kc/domain';
import { ReportError } from '@kc/application';
import { container } from '../../lib/container';
import { useAuthStore } from '../../store/authStore';
import { colors, typography, spacing, radius } from '@kc/ui';

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'Spam', label: 'ספאם' },
  { value: 'Offensive', label: 'תוכן פוגעני' },
  { value: 'Misleading', label: 'מטעה' },
  { value: 'Illegal', label: 'בלתי חוקי' },
  { value: 'Other', label: 'אחר' },
];

interface Props {
  postId: string;
  visible: boolean;
  onClose: () => void;
}

export function ReportPostModal({ postId, visible, onClose }: Props) {
  const userId = useAuthStore((s) => s.session?.userId);
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await container.reportPost.execute({
        reporterId: userId,
        postId,
        reason,
        note: note.trim() || undefined,
      });
      onClose();
      Alert.alert('הדיווח נשלח', 'תודה, נבחן את הדיווח.');
    } catch (err) {
      if (err instanceof ReportError && err.code === 'duplicate_within_24h') {
        Alert.alert('כבר דיווחת', 'דיווחת על הפוסט הזה ב-24 השעות האחרונות.');
        onClose();
      } else {
        Alert.alert('שגיאה', 'נסה שוב מאוחר יותר.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>דיווח על הפוסט</Text>
          {REASONS.map((r) => (
            <TouchableOpacity
              key={r.value}
              style={[styles.reasonRow, reason === r.value && styles.reasonRowActive]}
              onPress={() => setReason(r.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected: reason === r.value }}
            >
              <Text style={styles.reasonText}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.note}
            placeholder="הערה (אופציונלי)"
            placeholderTextColor={colors.textSecondary}
            value={note}
            onChangeText={setNote}
            multiline
            maxLength={500}
            textAlign="right"
          />
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.btn, styles.btnGhost]}
              onPress={onClose}
              disabled={submitting}
            >
              <Text style={styles.btnGhostText}>ביטול</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.btn, styles.btnPrimary, submitting && styles.btnDisabled]}
              onPress={submit}
              disabled={submitting}
            >
              <Text style={styles.btnPrimaryText}>{submitting ? 'שולח...' : 'שלח דיווח'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, padding: spacing.base, gap: spacing.sm,
    borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right', marginBottom: spacing.xs },
  reasonRow: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
  reasonRowActive: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  reasonText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  note: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md,
    padding: spacing.sm, minHeight: 80, ...typography.body, color: colors.textPrimary },
  actions: { flexDirection: 'row-reverse', gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1, height: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnGhost: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border },
  btnPrimaryText: { ...typography.button, color: colors.textInverse },
  btnGhostText: { ...typography.button, color: colors.textPrimary },
  btnDisabled: { opacity: 0.5 },
});
```

If `colors.primaryMuted` does not exist, substitute the closest existing token (check `app/packages/ui/src/colors.ts` — likely `colors.surface` or a tinted equivalent).

- [ ] **Step F.2.3: Verify mobile typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS or FAIL only because `container.reportPost` is not yet wired (next phase wires the container).

### Task F.3: `PostMenuSheet`

**Files:**
- Create: `app/apps/mobile/src/components/post/PostMenuSheet.tsx`

- [ ] **Step F.3.1: Create the menu sheet**

Create `app/apps/mobile/src/components/post/PostMenuSheet.tsx`:

```tsx
/**
 * FR-POST-014 AC4 + FR-POST-015 AC1 + FR-ADMIN-009.
 * Bottom-sheet menu opened from PostMenuButton on PostDetail.
 * Items shown depend on viewer role (see spec §3).
 */
import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import type { PostWithOwner } from '@kc/application';
import { colors, radius, spacing, typography } from '@kc/ui';
import { container } from '../../lib/container';
import { ConfirmActionModal } from './ConfirmActionModal';
import { ReportPostModal } from './ReportPostModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  post: PostWithOwner;
  viewerId: string | null;
  isSuperAdmin: boolean;
  /** Called after a successful destructive action so parent can route away. */
  onAfterRemoval: () => void;
}

type ActiveModal = null | 'delete-owner' | 'admin-remove' | 'block' | 'report';

export function PostMenuSheet({
  visible,
  onClose,
  post,
  viewerId,
  isSuperAdmin,
  onAfterRemoval,
}: Props) {
  const router = useRouter();
  const [active, setActive] = useState<ActiveModal>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const isAdminViewingOther = isSuperAdmin && !isOwner;

  function openModal(name: Exclude<ActiveModal, null>) {
    setError(null);
    onClose();
    setActive(name);
  }

  function closeModal() {
    if (busy) return;
    setActive(null);
    setError(null);
  }

  async function handleOwnerDelete() {
    setBusy(true);
    setError(null);
    try {
      await container.deletePost.execute({ postId: post.postId });
      setActive(null);
      onAfterRemoval();
    } catch (e) {
      setError('המחיקה נכשלה, נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAdminRemove() {
    setBusy(true);
    setError(null);
    try {
      await container.adminRemovePost.execute({ postId: post.postId });
      setActive(null);
      onAfterRemoval();
    } catch (e) {
      setError('ההסרה נכשלה, נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBlock() {
    if (!viewerId) return;
    setBusy(true);
    setError(null);
    try {
      await container.blockUser.execute({ blockerId: viewerId, blockedId: post.ownerId });
      setActive(null);
      onAfterRemoval();
    } catch (e) {
      setError('החסימה נכשלה, נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {isOwner ? (
              <MenuItem
                icon="🗑️"
                label="מחק את הפוסט"
                destructive
                onPress={() => openModal('delete-owner')}
              />
            ) : (
              <>
                <MenuItem icon="🚩" label="דווח" onPress={() => openModal('report')} />
                <MenuItem icon="🚫" label="חסום משתמש" onPress={() => openModal('block')} />
                {isAdminViewingOther ? (
                  <MenuItem
                    icon="🛡️"
                    label="הסר כאדמין"
                    destructive
                    onPress={() => openModal('admin-remove')}
                  />
                ) : null}
              </>
            )}
            <MenuItem icon="✕" label="ביטול" onPress={onClose} muted />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmActionModal
        visible={active === 'delete-owner'}
        title="🗑️ למחוק את הפוסט?"
        message="הפוסט יימחק לצמיתות. שיחות שנפתחו סביבו יישארו ברשימת הצ'אטים שלך, עם הערה שהפוסט המקורי לא זמין יותר."
        confirmLabel="מחק"
        destructive
        isBusy={busy}
        errorMessage={error}
        onCancel={closeModal}
        onConfirm={handleOwnerDelete}
      />

      <ConfirmActionModal
        visible={active === 'admin-remove'}
        title="🛡️ להסיר את הפוסט?"
        message={`הפוסט "${post.title}" יוסתר מהפיד ויסומן כמוסר על ידי מנהל. ניתן יהיה לשחזר אותו בעתיד דרך יומן האודיט.`}
        confirmLabel="הסר"
        destructive
        isBusy={busy}
        errorMessage={error}
        onCancel={closeModal}
        onConfirm={handleAdminRemove}
      />

      <ConfirmActionModal
        visible={active === 'block'}
        title={`🚫 לחסום את ${post.ownerName}?`}
        message="לא תראה יותר פוסטים שלו, והוא לא יוכל ליצור איתך קשר. ניתן לבטל בהגדרות → משתמשים חסומים."
        confirmLabel="חסום"
        destructive
        isBusy={busy}
        errorMessage={error}
        onCancel={closeModal}
        onConfirm={handleBlock}
      />

      <ReportPostModal
        postId={post.postId}
        visible={active === 'report'}
        onClose={() => setActive(null)}
      />
    </>
  );
}

interface MenuItemProps {
  icon: string;
  label: string;
  destructive?: boolean;
  muted?: boolean;
  onPress: () => void;
}

function MenuItem({ icon, label, destructive, muted, onPress }: MenuItemProps) {
  return (
    <Pressable style={styles.item} onPress={onPress} accessibilityRole="button">
      <Text style={styles.itemIcon}>{icon}</Text>
      <Text
        style={[
          styles.itemLabel,
          destructive && styles.itemLabelDestructive,
          muted && styles.itemLabelMuted,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    paddingVertical: spacing.sm,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    gap: spacing.md,
  },
  itemIcon: { fontSize: 22 },
  itemLabel: { ...typography.body, color: colors.textPrimary, textAlign: 'right', flex: 1 },
  itemLabelDestructive: { color: colors.danger },
  itemLabelMuted: { color: colors.textSecondary },
});
```

If the unused `useRouter` import causes a lint warning, drop the import.

### Task F.4: `PostMenuButton`

**Files:**
- Create: `app/apps/mobile/src/components/post/PostMenuButton.tsx`

- [ ] **Step F.4.1: Create the trigger button**

Create `app/apps/mobile/src/components/post/PostMenuButton.tsx`:

```tsx
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { PostWithOwner } from '@kc/application';
import { colors, spacing } from '@kc/ui';
import { useAuthStore } from '../../store/authStore';
import { useIsSuperAdmin } from '../../hooks/useIsSuperAdmin';
import { PostMenuSheet } from './PostMenuSheet';

interface Props {
  post: PostWithOwner;
}

export function PostMenuButton({ post }: Props) {
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);
  const isSuperAdmin = useIsSuperAdmin();
  const [open, setOpen] = useState(false);

  if (viewerId === null) {
    // Guests don't get a menu (no actions available to them).
    return null;
  }

  return (
    <>
      <Pressable
        style={styles.btn}
        onPress={() => setOpen(true)}
        accessibilityLabel="תפריט פעולות"
        accessibilityRole="button"
        hitSlop={8}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
      </Pressable>

      <PostMenuSheet
        visible={open}
        onClose={() => setOpen(false)}
        post={post}
        viewerId={viewerId}
        isSuperAdmin={isSuperAdmin}
        onAfterRemoval={() => router.back()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: { padding: spacing.xs, marginEnd: spacing.xs },
});
```

- [ ] **Step F.4.2: Verify mobile typecheck (will still fail until container is wired in Phase G)**

```bash
pnpm --filter @kc/mobile typecheck 2>&1 | tail -20
```

Expected: errors only on `container.reportPost`, `container.adminRemovePost`. These are wired next.

---

## Phase G: Container + composition wiring

### Task G.1: Wire the new use cases into the mobile container

**Files:**
- Modify: `app/apps/mobile/src/lib/container.ts`
- Modify: `app/apps/mobile/src/services/postsComposition.ts`

- [ ] **Step G.1.1: Inspect the existing container shape**

```bash
cat app/apps/mobile/src/lib/container.ts
```

The file likely composes use cases and exposes them as `container.deletePost`, `container.reportChat`, `container.blockUser`, etc.

- [ ] **Step G.1.2: Add `reportPost` and `adminRemovePost`**

Edit `container.ts`. Find the imports section and add:

```ts
import { ReportPostUseCase, AdminRemovePostUseCase } from '@kc/application';
```

(If `@kc/application` is already imported as a single statement, merge these into the existing import list.)

In the container construction (look for where `deletePost`, `reportChat`, `blockUser` are instantiated), add:

```ts
const reportPost = new ReportPostUseCase(reportRepo);
const adminRemovePost = new AdminRemovePostUseCase(postRepo);
```

(Use the existing variable names for `reportRepo` and `postRepo` — match what's in the file. If the file uses a different idiom such as `getPostRepo()`, follow that idiom instead.)

In the exported `container` object literal, add the two new entries:

```ts
  reportPost,
  adminRemovePost,
```

- [ ] **Step G.1.3: Add `getAdminRemovePostUseCase()` to postsComposition (for parity with siblings)**

Open `app/apps/mobile/src/services/postsComposition.ts`. Find the existing pattern (`let _delete: DeletePostUseCase | null = null;` and `getDeletePostUseCase()`). Add the parallel:

```ts
let _adminRemove: AdminRemovePostUseCase | null = null;

export function getAdminRemovePostUseCase(): AdminRemovePostUseCase {
  if (!_adminRemove) _adminRemove = new AdminRemovePostUseCase(getRepo());
  return _adminRemove;
}
```

And add `AdminRemovePostUseCase` to the existing import block from `@kc/application` at the top of the file.

- [ ] **Step G.1.4: Typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS.

### Task G.2: Mount `PostMenuButton` in the post-detail header

**Files:**
- Modify: `app/apps/mobile/app/post/[id].tsx`

- [ ] **Step G.2.1: Add the import + Stack.Screen options**

Open `app/apps/mobile/app/post/[id].tsx`. Add to the imports at the top:

```ts
import { Stack } from 'expo-router';
import { PostMenuButton } from '../../src/components/post/PostMenuButton';
```

Inside the `PostDetailScreen` component, in the success-render branch (the section that returns the `<SafeAreaView>` containing the post content — currently around line 78), insert a `<Stack.Screen>` element as the **first child** of the `<SafeAreaView>`:

```tsx
return (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    <Stack.Screen
      options={{
        headerRight: () => <PostMenuButton post={post} />,
      }}
    />
    <ScrollView showsVerticalScrollIndicator={false}>
      ...existing content unchanged...
    </ScrollView>
    ...existing footer unchanged...
  </SafeAreaView>
);
```

**Note on RTL placement:** in this app, the title/back-arrow on the post screen are configured via `detailHeader` in `app/_layout.tsx`. Inspect that to confirm whether `headerRight` lands on the leading (RTL: left) or trailing (RTL: right) side. If the menu icon ends up on the wrong side, switch `headerRight` to `headerLeft` here.

- [ ] **Step G.2.2: Verify mobile typecheck**

```bash
pnpm --filter @kc/mobile typecheck
```

Expected: PASS.

- [ ] **Step G.2.3: Commit Phase F + G**

```bash
git add app/apps/mobile/src/components/post/ \
        app/apps/mobile/src/hooks/useIsSuperAdmin.ts \
        app/apps/mobile/src/lib/container.ts \
        app/apps/mobile/src/services/postsComposition.ts \
        app/apps/mobile/app/post/[id].tsx
git commit -m "$(cat <<'EOF'
feat(mobile): post-detail ⋮ menu with role-aware actions

FR-POST-014 AC4 + FR-POST-015 AC1 (delete only) + FR-ADMIN-009.
Adds PostMenuButton + PostMenuSheet, ReportPostModal, generic
ConfirmActionModal, and useIsSuperAdmin hook. Owner sees Delete;
viewer sees Report + Block; super admin viewing someone else's
post additionally sees Remove-as-admin. Edit deferred (TD-125).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase H: Verification

### Task H.1: Unit tests + typecheck

- [ ] **Step H.1.1: Full vitest suite passes**

```bash
pnpm --filter @kc/application test --run
```

Expected: 109 + 5 (= 114) tests pass — 109 prior + 2 from `AdminRemovePostUseCase` + 3 from `ReportPostUseCase`.

- [ ] **Step H.1.2: Workspace typecheck passes**

```bash
pnpm typecheck
```

Expected: clean exit.

- [ ] **Step H.1.3: Architecture lint passes**

```bash
pnpm lint:arch
```

Expected: no new offenders. New files all stay under the 200-LOC cap.

### Task H.2: SQL probe (manual; document outcomes in the PR description)

These steps run against the live Supabase dev project. **Apply migration 0017 first** via the Supabase dashboard SQL editor — copy the contents of `supabase/migrations/0017_admin_remove_post.sql` and run.

- [ ] **Step H.2.1: Probe as a regular user — expect FORBIDDEN**

In Supabase SQL editor, open a session as a non-admin user (use the dashboard's "Run as user" feature or `set local role authenticated; set local request.jwt.claim.sub = '<a-non-admin-uuid>';`):

```sql
select public.admin_remove_post('<a-real-post-id>');
```

Expected: SQL error `forbidden` with errcode `42501`. The post's `status` is unchanged.

- [ ] **Step H.2.2: Probe as the super admin — expect status flip + audit row**

Repeat with the canonical super-admin uuid (the user `karmacommunity2.0@gmail.com`):

```sql
-- 1. Pick a victim post:
select post_id, status from public.posts where status = 'open' limit 1;

-- 2. Remove it:
select public.admin_remove_post('<that-post-id>');

-- 3. Verify status:
select post_id, status, updated_at from public.posts where post_id = '<that-post-id>';

-- 4. Verify audit row:
select actor_id, action, target_type, target_id, created_at
  from public.audit_events
 where target_id = '<that-post-id>'
 order by created_at desc
 limit 5;
```

Expected: status is `removed_admin`, exactly one new `audit_events` row with `action = 'manual_remove_target'` and `target_type = 'post'`.

- [ ] **Step H.2.3: Re-probe (idempotency)**

Run `select public.admin_remove_post('<that-post-id>');` a second time.

Expected: returns NULL with no error, **no second audit row**.

- [ ] **Step H.2.4: Restore the test post (clean up)**

```sql
update public.posts set status = 'open' where post_id = '<that-post-id>';
```

(This is a manual cleanup; the proper restore RPC is FR-ADMIN-002 / TD-52.)

### Task H.3: Web preview UI verification (Chrome MCP)

The user's standing instruction (`feedback_verify_ui_before_claiming_done`) requires loading the actual route in the browser and inspecting the DOM. Do not skip.

- [ ] **Step H.3.1: Start the dev server**

Use the `preview_start` MCP tool with the mobile web target. The standard command in this repo is:

```bash
pnpm --filter @kc/mobile web
```

(or use `preview_start` with the corresponding command). Wait for "web ready" output.

- [ ] **Step H.3.2: Verify role 1 — guest, no menu**

Open the dev preview URL (LAN IP per memory `dev_preview_url.md`). Navigate to `/(guest)/feed`, tap a post card, confirm preview screen renders. Use `preview_snapshot` to capture the DOM. Expected: no element with `accessibilityLabel="תפריט פעולות"`.

- [ ] **Step H.3.3: Verify role 2 — regular viewer**

Sign in as a regular (non-admin) test account. Open someone else's post. Tap ⋮. Expected items in `preview_snapshot`: "🚩 דווח", "🚫 חסום משתמש", "✕ ביטול". Absent: Delete, Admin remove.

- [ ] **Step H.3.4: Verify role 3 — owner**

Open one of the signed-in user's own posts. Tap ⋮. Expected: "🗑️ מחק את הפוסט", "✕ ביטול". Absent: Report, Block, Admin remove.

- [ ] **Step H.3.5: Verify role 4 — super admin on someone else's post**

Sign out, sign in as `karmacommunity2.0@gmail.com` (super-admin test account per memory `super_admin_test_account.md`). Open someone else's post. Tap ⋮. Expected: "🚩 דווח", "🚫 חסום משתמש", "🛡️ הסר כאדמין", "✕ ביטול".

- [ ] **Step H.3.6: End-to-end admin remove**

Continuing from Step H.3.5, tap "🛡️ הסר כאדמין", then "הסר" in the confirmation modal. Expected: `router.back()` returns to the previous screen, the feed query refetches, and the removed post is gone from the feed. Take a `preview_screenshot` for the PR description.

- [ ] **Step H.3.7: End-to-end owner delete**

Sign in as a regular user with at least one post. Open that post. Tap ⋮ → "🗑️ מחק את הפוסט" → "מחק". Expected: `router.back()`, post no longer in the feed.

---

## Phase I: SSOT updates

### Task I.1: Update `PROJECT_STATUS.md`

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`

- [ ] **Step I.1.1: Update header date + counts**

In the table at the top, update:
- `Last Updated`: `2026-05-10 (FR-ADMIN-009 + post-detail ⋮ menu shipped. 114 vitest passing.)`

In §1 Snapshot:
- Update `Test coverage` line: `109 vitest passing` → `114 vitest passing`.
- Update `Open tech-debt items` count: add 4 (TD-52, TD-124, TD-125, TD-126) → adjust both numbers.

Adjust the "What works end-to-end today" bullet for posts to mention the menu, e.g., append: *"⋮ menu on post detail with role-aware actions (Report/Block/Delete + admin Remove via FR-ADMIN-009)"*.

- [ ] **Step I.1.2: Update §3 Sprint Board**

Set "In progress" row to `(none)` (the work just shipped). Append a "Most recently shipped" line for FR-ADMIN-009 mirroring the closure flow line.

### Task I.2: Append to `HISTORY.md`

**Files:**
- Modify: `docs/SSOT/HISTORY.md`

- [ ] **Step I.2.1: Insert a new top entry**

Add this row at the top of the feature log (above the most recent P0.6 entry):

```markdown
- **2026-05-10 — Post-detail ⋮ menu + admin remove-post (FR-POST-014 AC4 partial · FR-POST-015 AC1 partial · FR-MOD-001 · FR-MOD-007 · FR-POST-010 · FR-ADMIN-009)** — Branch `claude/unruffled-black-7d25c9` · 114 vitest (109 + 5 new). Migration 0017 (`admin_remove_post` RPC, SECURITY DEFINER, gated on `is_admin(auth.uid())`, writes `manual_remove_target` audit event). New use cases: `AdminRemovePostUseCase`, `ReportPostUseCase`. New mobile components: `PostMenuButton`, `PostMenuSheet`, `ReportPostModal`, `ConfirmActionModal`, `useIsSuperAdmin` hook. Defers: TD-124 (feed-card ⋮ menu), TD-125 (Edit owner action — needs FR-POST-008 screen), TD-126 (surface `removed_admin` to owner with banner), TD-52 (admin restore RPC).
```

### Task I.3: Update `TECH_DEBT.md`

**Files:**
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step I.3.1: Open TD-52 (BE)**

Find the BE active section and add a row:

```markdown
| TD-52 | 🟠 | **`admin_restore_post` RPC + UI for FR-ADMIN-002 (partial).** The admin remove flow (FR-ADMIN-009) flips status to `removed_admin` and writes an audit row. There is no symmetric restore yet — the only path to restore is a manual SQL update. Build a `SECURITY DEFINER` RPC that flips `removed_admin → open`, writes `restore_target` to `audit_events`, and surfaces it from a future audit-log UI (FR-ADMIN-007). | P2.5 |
```

- [ ] **Step I.3.2: Open TD-124, TD-125, TD-126 (FE)**

In the FE active section:

```markdown
| TD-124 | 🟠 | **⋮ overflow menu on feed-card.** FR-POST-010 AC1 mandates the menu both on the post detail screen (shipped 2026-05-10) and on the post card in the feed. Card-side menu is not yet implemented — feed cards have no destructive actions. Replicate `PostMenuButton`/`PostMenuSheet` placement at the card level. | Opportunistic |
| TD-125 | 🟠 | **"Edit" item missing from owner ⋮ menu.** FR-POST-015 AC1 lists Edit alongside Delete. The post-detail ⋮ menu (shipped 2026-05-10) only renders Delete because no edit-post screen exists (`UpdatePostUseCase` exists in `@kc/application` but no consuming UI). Building it requires `app/edit-post/[id].tsx` reusing the create form for FR-POST-008. | P2.x |
| TD-126 | 🟠 | **`removed_admin` posts invisible to their owner.** When the super admin removes a post via FR-ADMIN-009, RLS hides it from all viewers including the owner, and `getMyPosts` is called only with `['open']` or `['closed_delivered','deleted_no_recipient']`. The owner sees the post simply vanish with no explanation. Add `removed_admin` to a third tab in My Posts ("הוסרו") with a "removed by admin" banner per FR-POST-008 edge case. Affects FE (My Posts tab) and BE (`getMyPosts` status filter) — likely just FE since the status array is constructed client-side. | When admin moderation lands |
```

(The exact "when" / priority column may follow a slightly different format in the live file — match its current convention. Open the file and check the existing rows before pasting.)

### Task I.4: Commit SSOT updates

- [ ] **Step I.4.1: Commit**

```bash
git add docs/SSOT/PROJECT_STATUS.md \
        docs/SSOT/HISTORY.md \
        docs/SSOT/TECH_DEBT.md
git commit -m "$(cat <<'EOF'
docs(ssot): record FR-ADMIN-009 ship + open TD-52/124/125/126

Updates PROJECT_STATUS.md (Last Updated, test count, sprint board),
appends a HISTORY.md row, and opens four tech-debt items for the
deferred follow-ups (admin restore RPC, feed-card menu, owner edit
screen, removed_admin owner visibility).

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>
EOF
)"
```

---

## Phase J: Open the PR

- [ ] **Step J.1: Push the branch**

```bash
git push -u origin claude/unruffled-black-7d25c9
```

- [ ] **Step J.2: Open the PR via gh**

```bash
gh pr create --title "feat(FR-ADMIN-009): post-detail ⋮ menu + admin remove-post" --body "$(cat <<'EOF'
## Summary
- Adds the post-detail `⋮` overflow menu with role-aware items (FR-POST-014 AC4 + FR-POST-015 AC1, partial).
- Wires existing use cases for owner Delete (FR-POST-010), viewer Report (FR-MOD-001), and viewer Block (FR-MOD-007).
- Introduces FR-ADMIN-009: super-admin "Remove as admin" via new `admin_remove_post` RPC (`SECURITY DEFINER`, idempotent, writes `manual_remove_target` audit event).
- Spec: `docs/superpowers/specs/2026-05-10-admin-delete-post-and-post-menu-design.md`.

## Out of scope (TDs opened)
- TD-52 — admin restore RPC (FR-ADMIN-002 partial).
- TD-124 — feed-card ⋮ menu.
- TD-125 — Edit item on owner menu (needs FR-POST-008 screen).
- TD-126 — surface `removed_admin` posts to their owner.

## Operator step required before merge
Apply migration `supabase/migrations/0017_admin_remove_post.sql` to the dev/prod Supabase project (SQL editor → paste → run). Without this, calls to `admin_remove_post` will fail with `function does not exist`.

## Test plan
- [x] `pnpm --filter @kc/application test` — 114 passing.
- [x] `pnpm typecheck` — clean.
- [x] `pnpm lint:arch` — clean.
- [ ] SQL probe: non-admin → FORBIDDEN; admin → status flip + 1 audit row; re-run → no second audit row.
- [ ] Web UI verification: guest (no menu) / regular viewer (Report+Block) / owner (Delete) / admin (Report+Block+Admin remove).
- [ ] End-to-end admin remove + owner delete with screenshots.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

Expected: PR URL printed.

---

## Self-Review

### Spec coverage

| Spec section | Tasks |
| --- | --- |
| §3 menu by role | F.3 (`PostMenuSheet` role logic) |
| §4.1 PostMenuButton + Sheet | F.3, F.4 |
| §4.2 ReportPostModal | F.2 |
| §4.3 ReportPostUseCase | B.4 |
| §4.4 AdminRemovePostUseCase + port | B.1, B.2, B.3 |
| §4.5 SQL migration | C.1 |
| §4.6 useIsSuperAdmin hook | E.1 |
| §5 confirmation copy | F.1 (`ConfirmActionModal`), F.3 (wired with the exact strings) |
| §6 data flow | covered transitively by F.3 + G.1 |
| §7 authorization model | client gate (E.1, F.4); server gate (C.1) |
| §8 tech debt | I.3 |
| §9 tests (unit) | B.3, B.4 |
| §9 SQL probe | H.2 |
| §9 UI verification | H.3 |
| §10 SRS additions | A.1 |
| §11 files touched | matches File Structure table above |

### Placeholder scan
No "TBD"/"TODO"/"implement later"/"add appropriate" remain. Every code step contains the actual snippet. Every command has expected output stated.

### Type consistency
- `IPostRepository.adminRemove(postId: string): Promise<void>` — used identically in `FakePostRepository`, `SupabasePostRepository`, and `AdminRemovePostUseCase`.
- `AdminRemovePostUseCase.execute({ postId })` — same signature in B.3 (definition), F.3 (call from `PostMenuSheet`), G.1 (composition).
- `ReportPostUseCase.execute({ reporterId, postId, reason, note? })` — same in B.4 (definition), F.2 (call from `ReportPostModal`).
- RPC name `admin_remove_post(p_post_id uuid)` — same in C.1 (DDL), D.1 (adapter call), D.2 (types), H.2 (probe).
- Audit action `manual_remove_target` — consistent across spec §10 AC4, C.1 (RPC body), and H.2 (probe assertions).
