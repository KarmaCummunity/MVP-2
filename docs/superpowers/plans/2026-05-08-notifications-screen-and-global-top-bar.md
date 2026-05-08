# Notifications Screen + Global Top Bar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an in-app notifications screen wired to a real notifications mechanism, and replace per-screen top bars with a single global top bar that always exposes Chat / Notifications / Settings with smart, clean navigation to each.

**Architecture:** Two coupled deliverables in a single FE-lane PR. (1) A new `notifications/` slice through Domain → Application (port + use cases + InMemory adapter) → FE composition + screen, mirroring the `posts/*` shape. The Supabase adapter is intentionally deferred to P1.5 — the InMemory adapter ships seeded data so the screen is end-to-end functional today and the Supabase swap is a one-file change later. (2) A single route-aware `TopBar` rendered at the root layout (mirror of the existing global `TabBar`), gated by the same auth/route conditions; in-screen ad-hoc top bars and Stack `detailHeader` are removed so the global bar is the only top chrome.

**Tech Stack:** React Native + expo-router 6, React Query, Zustand, vitest. RTL-forced. Lint cap 200 LOC/file enforced by `pnpm lint:arch`.

---

## Spec deviation — explicit decision

`docs/SSOT/SRS/02_functional_requirements/09_notifications.md` line 11 currently says:

> Notifications are delivered via push (mobile + Web Push) only — there is **no** in-app notifications screen in MVP

The user (product owner) has decided to add an in-app notifications screen as part of MVP UX. As CTO I'm executing this and **updating the SRS in the same change-set** (Task 1) rather than letting code drift from spec. The implementation choice — InMemory adapter only, Supabase + push deferred to P1.5 — keeps the scope tight: we ship a real screen with a real architecture, but we do not pull P1.5 (push tokens, FCM/APNs, Edge Functions) forward.

## Lane / branch / SSOT bookkeeping

- **Lane:** FE (touches `apps/mobile/**`, `packages/{domain,application,ui}/**` — does NOT touch `supabase/**` or `packages/infrastructure-supabase/**`).
- **Branch:** `feat/FR-NOTIF-fe-screen-and-top-bar`
- **PR title:** `feat(notif): in-app notifications screen + global top bar`
- **TD IDs available (FE lane):** TD-100..149 — use TD-100 for "Supabase adapter for INotificationRepository (P1.5 follow-up)".
- **PROJECT_STATUS update** (Task 16): mark P2.1 row "Settings" untouched (separate work); add a new row P0.7 (or P1.x — see Task 16) for the screen, append to HISTORY, update §1 snapshot.

## File Structure

**New files (all ≤200 LOC):**

| Path | Responsibility |
|---|---|
| `app/packages/domain/src/notifications/Notification.ts` | `Notification` entity + `NotificationKind` union. |
| `app/packages/application/src/ports/INotificationRepository.ts` | Port: `list / countUnread / markAsRead / markAllAsRead`. |
| `app/packages/application/src/notifications/ListNotificationsUseCase.ts` | Pagination-free list ordered desc with `unreadOnly?`. |
| `app/packages/application/src/notifications/GetUnreadCountUseCase.ts` | Count for the bell badge. |
| `app/packages/application/src/notifications/MarkAsReadUseCase.ts` | Mark a single notification read; auth check. |
| `app/packages/application/src/notifications/MarkAllAsReadUseCase.ts` | Bulk mark for "Read all" action. |
| `app/packages/application/src/notifications/__tests__/fakeNotificationRepository.ts` | Test double (mirror of `posts/__tests__/fakePostRepository.ts`). |
| `app/packages/application/src/notifications/__tests__/ListNotificationsUseCase.test.ts` | vitest. |
| `app/packages/application/src/notifications/__tests__/GetUnreadCountUseCase.test.ts` | vitest. |
| `app/packages/application/src/notifications/__tests__/MarkAsReadUseCase.test.ts` | vitest. |
| `app/packages/application/src/notifications/__tests__/MarkAllAsReadUseCase.test.ts` | vitest. |
| `app/apps/mobile/src/repositories/InMemoryNotificationRepository.ts` | FE-side adapter with seeded mock data — used until P1.5. |
| `app/apps/mobile/src/services/notificationsComposition.ts` | DI: returns repo singleton + use cases (mirror of `postsComposition.ts`). |
| `app/apps/mobile/src/components/TopBar.tsx` | Route-aware global top bar. |
| `app/apps/mobile/app/notifications/index.tsx` | List screen. |

**Modified files:**

| Path | Change |
|---|---|
| `app/packages/application/src/index.ts` | Export new port + use cases. |
| `app/apps/mobile/app/_layout.tsx` | Render `<TopBar />` globally (same gating as `<TabBar />`); drop `detailHeader` (Stack headers) since `TopBar` owns the chrome. |
| `app/apps/mobile/app/(tabs)/index.tsx` | Remove in-screen `topBar` block (replaced by global). |
| `app/apps/mobile/app/(tabs)/profile.tsx` | Remove in-screen `topBar` block. |
| `app/apps/mobile/app/chat/index.tsx` | Remove in-screen `header` block. |
| `app/apps/mobile/app/chat/[id].tsx` | Remove in-screen header (relies on `TopBar`). |
| `app/apps/mobile/app/settings.tsx` | Remove in-screen header. |
| `app/apps/mobile/app/post/[id].tsx` | Remove in-screen header (if any) — verify in Task 14. |
| `app/apps/mobile/app/user/[handle].tsx` | Same — verify in Task 14. |
| `docs/SSOT/SRS/02_functional_requirements/09_notifications.md` | Replace "no in-app notifications screen" with the new spec wording (Task 1). |
| `docs/SSOT/PROJECT_STATUS.md` | §1 snapshot, §2 priority backlog row, §3 sprint board, §4 EXEC entry. |
| `docs/SSOT/HISTORY.md` | Append feature row at top. |
| `docs/SSOT/TECH_DEBT.md` | Add TD-100 (Supabase adapter follow-up). |

---

## Domain & contract — agreed up-front (so later tasks can reference them)

```ts
// packages/domain/src/notifications/Notification.ts
export type NotificationKind =
  | 'chat_message'         // FR-NOTIF-001 (Critical)
  | 'system_message'       // FR-NOTIF-003 (Critical)
  | 'message_undeliverable'// FR-NOTIF-004 (Critical)
  | 'post_expiring'        // FR-NOTIF-005 (Critical)
  | 'recipient_marked'     // FR-NOTIF-009 (Critical)
  | 'recipient_unmarked'   // FR-NOTIF-010 (Critical)
  | 'post_removed'         // FR-NOTIF-011 (Critical)
  | 'follow_request'       // FR-NOTIF-006 (Social)
  | 'follow_accepted'      // FR-NOTIF-008 (Social)
  | 'started_following';   // FR-NOTIF-007 (Social)

export interface Notification {
  readonly id: string;
  readonly recipientId: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  /** Route-target hint, e.g. { route: '/chat/[id]', params: { id: 'c1' } }. */
  readonly target: { route: string; params?: Record<string, string> } | null;
  readonly isRead: boolean;
  readonly createdAt: string; // ISO
}
```

```ts
// packages/application/src/ports/INotificationRepository.ts
import type { Notification } from '@kc/domain';

export interface INotificationRepository {
  list(params: {
    recipientId: string;
    unreadOnly?: boolean;
    limit?: number;
  }): Promise<Notification[]>;

  countUnread(recipientId: string): Promise<number>;

  markAsRead(params: { id: string; recipientId: string }): Promise<void>;
  markAllAsRead(recipientId: string): Promise<void>;
}
```

All four use cases below take a single `{ recipientId, ... }` arg, return what their name suggests, and forward authorization (recipient match) to the repository at the storage layer for the InMemory case.

---

## Tasks

### Task 1: SSOT spec amendment (no code yet)

**Files:**
- Modify: `docs/SSOT/SRS/02_functional_requirements/09_notifications.md` (Scope section)

- [ ] **Step 1: Update SRS scope wording**

Replace lines 9–18 of `09_notifications.md` (the `## Scope` block) with:

```markdown
## Scope

The complete notification taxonomy for MVP. Notifications are delivered via:

- **Push** (mobile + Web Push) — implemented in `P1.5`.
- **In-app notifications screen** — a list of past notifications for the
  authenticated user, accessible from a bell icon in the global top bar.
  See `FR-NOTIF-017` below.

The system has exactly two user-controllable categories (per `D-5`):

- **Critical** — actions the user must know about to operate the product correctly (chat messages, recipient marking, follow requests, removals, expiry).
- **Social** — courtesy updates that strengthen connection but are non-blocking (someone followed you, someone approved your request).

A user toggle exists per category. Both categories default to **on**.
```

- [ ] **Step 2: Add a new requirement at the bottom (before Change Log)**

Append below `FR-NOTIF-016`:

```markdown
## FR-NOTIF-017 — In-app notifications screen

**Description.**
Authenticated users can open a screen listing their past notifications, with
read/unread state and a tap-through to the relevant target screen.

**Source.**
- Decision EXEC-6 (2026-05-08) — overrides the earlier "push-only" scope.

**Acceptance Criteria.**
- AC1. Reachable via a persistent bell icon in the global top bar; the icon shows
  an unread-count badge when `> 0` (capped display at `99+`).
- AC2. List sorted by `created_at` DESC, separated visually into "Unread" and
  "Earlier" sections.
- AC3. Tapping a notification: marks it read AND navigates to the
  notification's `target` route (when present).
- AC4. Bulk action "Mark all read" empties the unread badge in ≤1s on screen.
- AC5. Empty state: friendly Hebrew copy ("אין התראות עדיין").
- AC6. Storage layer is pluggable (`INotificationRepository`); MVP ships an
  InMemory adapter — the Supabase adapter ships with `P1.5`.

**Related.** Domain: `Notification`. Screens: global top bar, 5.x notifications.
```

- [ ] **Step 3: Add EXEC-6 in PROJECT_STATUS §4**

In `docs/SSOT/PROJECT_STATUS.md` §4 table, append:

```markdown
| EXEC-6 | In-app notifications screen added to MVP scope (overrides "push-only" wording in `09_notifications.md`). Adapter pluggable; InMemory now, Supabase ships with P1.5 | UX | 2026-05-08 |
```

Also mirror in `docs/SSOT/SRS/appendices/C_decisions_log.md` (same row).

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/SRS/02_functional_requirements/09_notifications.md \
        docs/SSOT/PROJECT_STATUS.md \
        docs/SSOT/SRS/appendices/C_decisions_log.md
git commit -m "docs(ssot): FR-NOTIF-017 + EXEC-6 — add in-app notifications screen to MVP"
```

---

### Task 2: Domain entity

**Files:**
- Create: `app/packages/domain/src/notifications/Notification.ts`
- Modify: `app/packages/domain/src/index.ts`

- [ ] **Step 1: Create the entity file**

Write to `app/packages/domain/src/notifications/Notification.ts`:

```ts
// Notification entity — read-only domain shape consumed by application use cases
// and the FE list screen. Mapped to: FR-NOTIF-001..017.
export type NotificationKind =
  | 'chat_message'
  | 'system_message'
  | 'message_undeliverable'
  | 'post_expiring'
  | 'recipient_marked'
  | 'recipient_unmarked'
  | 'post_removed'
  | 'follow_request'
  | 'follow_accepted'
  | 'started_following';

export interface NotificationTarget {
  readonly route: string;
  readonly params?: Record<string, string>;
}

export interface Notification {
  readonly id: string;
  readonly recipientId: string;
  readonly kind: NotificationKind;
  readonly title: string;
  readonly body: string;
  readonly target: NotificationTarget | null;
  readonly isRead: boolean;
  readonly createdAt: string;
}
```

- [ ] **Step 2: Re-export from domain index**

Open `app/packages/domain/src/index.ts` and add (alphabetically next to existing exports):

```ts
export * from './notifications/Notification';
```

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS

- [ ] **Step 4: Commit**

```bash
git add app/packages/domain/src/notifications/Notification.ts \
        app/packages/domain/src/index.ts
git commit -m "feat(domain): Notification entity (FR-NOTIF-017)"
```

---

### Task 3: Port — `INotificationRepository`

**Files:**
- Create: `app/packages/application/src/ports/INotificationRepository.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Create the port**

Write to `app/packages/application/src/ports/INotificationRepository.ts`:

```ts
// Port for notification storage. The application layer never knows whether
// data lives in memory, in Supabase, or in a push provider — implementors
// honor recipient authorization themselves.
import type { Notification } from '@kc/domain';

export interface ListNotificationsParams {
  readonly recipientId: string;
  readonly unreadOnly?: boolean;
  readonly limit?: number;
}

export interface MarkAsReadParams {
  readonly id: string;
  readonly recipientId: string;
}

export interface INotificationRepository {
  list(params: ListNotificationsParams): Promise<Notification[]>;
  countUnread(recipientId: string): Promise<number>;
  markAsRead(params: MarkAsReadParams): Promise<void>;
  markAllAsRead(recipientId: string): Promise<void>;
}
```

- [ ] **Step 2: Export from application index**

Open `app/packages/application/src/index.ts` and add after the existing port exports:

```ts
export * from './ports/INotificationRepository';
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd app && pnpm typecheck
git add app/packages/application/src/ports/INotificationRepository.ts \
        app/packages/application/src/index.ts
git commit -m "feat(contract): INotificationRepository port (FR-NOTIF-017)"
```

---

### Task 4: `FakeNotificationRepository` (test double)

**Files:**
- Create: `app/packages/application/src/notifications/__tests__/fakeNotificationRepository.ts`

- [ ] **Step 1: Write the fake**

```ts
import type { Notification } from '@kc/domain';
import type {
  INotificationRepository,
  ListNotificationsParams,
  MarkAsReadParams,
} from '../../ports/INotificationRepository';

/**
 * In-memory fake for notification use-case tests. Captures the last call to
 * each method so tests can assert on what the use case forwarded.
 */
export class FakeNotificationRepository implements INotificationRepository {
  notifications: Notification[] = [];

  lastListArgs: ListNotificationsParams | null = null;
  lastCountRecipient: string | null = null;
  lastMarkAsReadArgs: MarkAsReadParams | null = null;
  lastMarkAllRecipient: string | null = null;

  listError: Error | null = null;
  markAsReadError: Error | null = null;

  list = async (params: ListNotificationsParams): Promise<Notification[]> => {
    this.lastListArgs = params;
    if (this.listError) throw this.listError;
    let rows = this.notifications.filter((n) => n.recipientId === params.recipientId);
    if (params.unreadOnly) rows = rows.filter((n) => !n.isRead);
    rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (params.limit) rows = rows.slice(0, params.limit);
    return rows;
  };

  countUnread = async (recipientId: string): Promise<number> => {
    this.lastCountRecipient = recipientId;
    return this.notifications.filter((n) => n.recipientId === recipientId && !n.isRead).length;
  };

  markAsRead = async (params: MarkAsReadParams): Promise<void> => {
    this.lastMarkAsReadArgs = params;
    if (this.markAsReadError) throw this.markAsReadError;
    this.notifications = this.notifications.map((n) =>
      n.id === params.id && n.recipientId === params.recipientId ? { ...n, isRead: true } : n,
    );
  };

  markAllAsRead = async (recipientId: string): Promise<void> => {
    this.lastMarkAllRecipient = recipientId;
    this.notifications = this.notifications.map((n) =>
      n.recipientId === recipientId ? { ...n, isRead: true } : n,
    );
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/packages/application/src/notifications/__tests__/fakeNotificationRepository.ts
git commit -m "test(notif): FakeNotificationRepository for use-case tests"
```

---

### Task 5: `ListNotificationsUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/notifications/__tests__/ListNotificationsUseCase.test.ts`
- Create: `app/packages/application/src/notifications/ListNotificationsUseCase.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FakeNotificationRepository } from './fakeNotificationRepository';
import { ListNotificationsUseCase } from '../ListNotificationsUseCase';
import type { Notification } from '@kc/domain';

describe('ListNotificationsUseCase', () => {
  let repo: FakeNotificationRepository;
  let useCase: ListNotificationsUseCase;

  const make = (id: string, isRead: boolean, createdAt: string): Notification => ({
    id,
    recipientId: 'u1',
    kind: 'chat_message',
    title: 't',
    body: 'b',
    target: null,
    isRead,
    createdAt,
  });

  beforeEach(() => {
    repo = new FakeNotificationRepository();
    useCase = new ListNotificationsUseCase(repo);
    repo.notifications = [
      make('n3', false, '2026-05-08T10:00:00Z'),
      make('n1', true, '2026-05-06T10:00:00Z'),
      make('n2', false, '2026-05-07T10:00:00Z'),
    ];
  });

  it('returns notifications sorted by createdAt desc', async () => {
    const result = await useCase.execute({ recipientId: 'u1' });
    expect(result.map((n) => n.id)).toEqual(['n3', 'n2', 'n1']);
  });

  it('forwards unreadOnly + limit to the repo', async () => {
    await useCase.execute({ recipientId: 'u1', unreadOnly: true, limit: 50 });
    expect(repo.lastListArgs).toEqual({ recipientId: 'u1', unreadOnly: true, limit: 50 });
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd app && pnpm --filter @kc/application test -- ListNotificationsUseCase`
Expected: FAIL — "Cannot find module '../ListNotificationsUseCase'".

- [ ] **Step 3: Write the use case**

```ts
// List notifications for a recipient, ordered desc, optionally filtered.
// Pure orchestration — repository owns sort/limit semantics, we just forward.
import type { Notification } from '@kc/domain';
import type { INotificationRepository } from '../ports/INotificationRepository';

export interface ListNotificationsInput {
  readonly recipientId: string;
  readonly unreadOnly?: boolean;
  readonly limit?: number;
}

export class ListNotificationsUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  execute(input: ListNotificationsInput): Promise<Notification[]> {
    return this.repo.list(input);
  }
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `cd app && pnpm --filter @kc/application test -- ListNotificationsUseCase`
Expected: PASS (2 tests).

- [ ] **Step 5: Export + commit**

Add to `app/packages/application/src/index.ts`:

```ts
export * from './notifications/ListNotificationsUseCase';
```

```bash
git add app/packages/application/src/notifications/ListNotificationsUseCase.ts \
        app/packages/application/src/notifications/__tests__/ListNotificationsUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): ListNotificationsUseCase (FR-NOTIF-017)"
```

---

### Task 6: `GetUnreadCountUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/notifications/__tests__/GetUnreadCountUseCase.test.ts`
- Create: `app/packages/application/src/notifications/GetUnreadCountUseCase.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FakeNotificationRepository } from './fakeNotificationRepository';
import { GetUnreadCountUseCase } from '../GetUnreadCountUseCase';
import type { Notification } from '@kc/domain';

describe('GetUnreadCountUseCase', () => {
  let repo: FakeNotificationRepository;
  let useCase: GetUnreadCountUseCase;

  const make = (id: string, isRead: boolean): Notification => ({
    id, recipientId: 'u1', kind: 'chat_message',
    title: 't', body: 'b', target: null, isRead, createdAt: '2026-05-08T10:00:00Z',
  });

  beforeEach(() => {
    repo = new FakeNotificationRepository();
    useCase = new GetUnreadCountUseCase(repo);
    repo.notifications = [make('a', false), make('b', true), make('c', false)];
  });

  it('returns count of unread notifications for the recipient', async () => {
    const count = await useCase.execute('u1');
    expect(count).toBe(2);
  });

  it('returns 0 for unknown recipient', async () => {
    const count = await useCase.execute('other');
    expect(count).toBe(0);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd app && pnpm --filter @kc/application test -- GetUnreadCountUseCase`
Expected: FAIL.

- [ ] **Step 3: Write the use case**

```ts
// Returns unread notification count for the bell-badge in the global top bar.
import type { INotificationRepository } from '../ports/INotificationRepository';

export class GetUnreadCountUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  execute(recipientId: string): Promise<number> {
    return this.repo.countUnread(recipientId);
  }
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `cd app && pnpm --filter @kc/application test -- GetUnreadCountUseCase`
Expected: PASS.

- [ ] **Step 5: Export + commit**

Add to `app/packages/application/src/index.ts`:
```ts
export * from './notifications/GetUnreadCountUseCase';
```

```bash
git add app/packages/application/src/notifications/GetUnreadCountUseCase.ts \
        app/packages/application/src/notifications/__tests__/GetUnreadCountUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): GetUnreadCountUseCase (FR-NOTIF-017)"
```

---

### Task 7: `MarkAsReadUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/notifications/__tests__/MarkAsReadUseCase.test.ts`
- Create: `app/packages/application/src/notifications/MarkAsReadUseCase.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FakeNotificationRepository } from './fakeNotificationRepository';
import { MarkAsReadUseCase } from '../MarkAsReadUseCase';
import type { Notification } from '@kc/domain';

describe('MarkAsReadUseCase', () => {
  let repo: FakeNotificationRepository;
  let useCase: MarkAsReadUseCase;

  const make = (id: string, recipientId: string): Notification => ({
    id, recipientId, kind: 'chat_message',
    title: 't', body: 'b', target: null, isRead: false, createdAt: '2026-05-08T10:00:00Z',
  });

  beforeEach(() => {
    repo = new FakeNotificationRepository();
    useCase = new MarkAsReadUseCase(repo);
    repo.notifications = [make('n1', 'u1'), make('n2', 'u2')];
  });

  it('marks the matching notification as read', async () => {
    await useCase.execute({ id: 'n1', recipientId: 'u1' });
    expect(repo.notifications.find((n) => n.id === 'n1')?.isRead).toBe(true);
  });

  it('does not mark notifications belonging to a different recipient', async () => {
    await useCase.execute({ id: 'n2', recipientId: 'u1' });
    expect(repo.notifications.find((n) => n.id === 'n2')?.isRead).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd app && pnpm --filter @kc/application test -- MarkAsReadUseCase`
Expected: FAIL.

- [ ] **Step 3: Write the use case**

```ts
// Mark a single notification as read; recipient match is enforced at the repo
// boundary (so Supabase RLS will be the canonical guard once P1.5 ships).
import type { INotificationRepository, MarkAsReadParams } from '../ports/INotificationRepository';

export class MarkAsReadUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  execute(params: MarkAsReadParams): Promise<void> {
    return this.repo.markAsRead(params);
  }
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `cd app && pnpm --filter @kc/application test -- MarkAsReadUseCase`
Expected: PASS.

- [ ] **Step 5: Export + commit**

Add to `app/packages/application/src/index.ts`:
```ts
export * from './notifications/MarkAsReadUseCase';
```

```bash
git add app/packages/application/src/notifications/MarkAsReadUseCase.ts \
        app/packages/application/src/notifications/__tests__/MarkAsReadUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): MarkAsReadUseCase (FR-NOTIF-017)"
```

---

### Task 8: `MarkAllAsReadUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/notifications/__tests__/MarkAllAsReadUseCase.test.ts`
- Create: `app/packages/application/src/notifications/MarkAllAsReadUseCase.ts`
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Write failing test**

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { FakeNotificationRepository } from './fakeNotificationRepository';
import { MarkAllAsReadUseCase } from '../MarkAllAsReadUseCase';
import type { Notification } from '@kc/domain';

describe('MarkAllAsReadUseCase', () => {
  let repo: FakeNotificationRepository;
  let useCase: MarkAllAsReadUseCase;

  const make = (id: string, recipientId: string): Notification => ({
    id, recipientId, kind: 'chat_message',
    title: 't', body: 'b', target: null, isRead: false, createdAt: '2026-05-08T10:00:00Z',
  });

  beforeEach(() => {
    repo = new FakeNotificationRepository();
    useCase = new MarkAllAsReadUseCase(repo);
    repo.notifications = [make('n1', 'u1'), make('n2', 'u1'), make('n3', 'u2')];
  });

  it('marks all of the recipient unread notifications as read', async () => {
    await useCase.execute('u1');
    expect(repo.notifications.filter((n) => n.recipientId === 'u1').every((n) => n.isRead)).toBe(true);
  });

  it('does not touch other recipients', async () => {
    await useCase.execute('u1');
    expect(repo.notifications.find((n) => n.id === 'n3')?.isRead).toBe(false);
  });
});
```

- [ ] **Step 2: Run test, confirm fail**

Run: `cd app && pnpm --filter @kc/application test -- MarkAllAsReadUseCase`
Expected: FAIL.

- [ ] **Step 3: Write the use case**

```ts
// Bulk mark-as-read used by the "Read all" action in the notifications screen.
import type { INotificationRepository } from '../ports/INotificationRepository';

export class MarkAllAsReadUseCase {
  constructor(private readonly repo: INotificationRepository) {}

  execute(recipientId: string): Promise<void> {
    return this.repo.markAllAsRead(recipientId);
  }
}
```

- [ ] **Step 4: Run test, confirm pass**

Run: `cd app && pnpm --filter @kc/application test -- MarkAllAsReadUseCase`
Expected: PASS.

- [ ] **Step 5: Export + commit**

Add to `app/packages/application/src/index.ts`:
```ts
export * from './notifications/MarkAllAsReadUseCase';
```

```bash
git add app/packages/application/src/notifications/MarkAllAsReadUseCase.ts \
        app/packages/application/src/notifications/__tests__/MarkAllAsReadUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): MarkAllAsReadUseCase (FR-NOTIF-017)"
```

---

### Task 9: FE-side `InMemoryNotificationRepository` + composition

**Files:**
- Create: `app/apps/mobile/src/repositories/InMemoryNotificationRepository.ts`
- Create: `app/apps/mobile/src/services/notificationsComposition.ts`

- [ ] **Step 1: Write the InMemory adapter**

```ts
// In-memory adapter for INotificationRepository — used until P1.5 (Supabase
// notifications table + push tokens) ships. Seeded with sample notifications
// per recipient so the UI is end-to-end functional today. Singleton state
// lives on the module so multiple call sites share the same data.
import type { INotificationRepository, ListNotificationsParams, MarkAsReadParams } from '@kc/application';
import type { Notification } from '@kc/domain';

const seed = (recipientId: string): Notification[] => [
  {
    id: `${recipientId}-n1`,
    recipientId,
    kind: 'chat_message',
    title: 'ענת לוי',
    body: 'שלחה לך הודעה: "אני מעוניינת בספה, מתי נוח לאסוף?"',
    target: { route: '/chat/[id]', params: { id: 'c1' } },
    isRead: false,
    createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
  },
  {
    id: `${recipientId}-n2`,
    recipientId,
    kind: 'follow_request',
    title: 'יוסי כהן',
    body: 'מבקש לעקוב אחריך',
    target: null,
    isRead: false,
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: `${recipientId}-n3`,
    recipientId,
    kind: 'post_expiring',
    title: 'הפוסט שלך עומד לפוג',
    body: 'הפוסט "ספה ירוקה" יפוג בעוד 7 ימים',
    target: null,
    isRead: true,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
];

export class InMemoryNotificationRepository implements INotificationRepository {
  private rows: Notification[] = [];
  private seeded = new Set<string>();

  private ensureSeed(recipientId: string): void {
    if (this.seeded.has(recipientId)) return;
    this.rows.push(...seed(recipientId));
    this.seeded.add(recipientId);
  }

  list = async (params: ListNotificationsParams): Promise<Notification[]> => {
    this.ensureSeed(params.recipientId);
    let rows = this.rows.filter((n) => n.recipientId === params.recipientId);
    if (params.unreadOnly) rows = rows.filter((n) => !n.isRead);
    rows = [...rows].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (params.limit) rows = rows.slice(0, params.limit);
    return rows;
  };

  countUnread = async (recipientId: string): Promise<number> => {
    this.ensureSeed(recipientId);
    return this.rows.filter((n) => n.recipientId === recipientId && !n.isRead).length;
  };

  markAsRead = async (params: MarkAsReadParams): Promise<void> => {
    this.rows = this.rows.map((n) =>
      n.id === params.id && n.recipientId === params.recipientId ? { ...n, isRead: true } : n,
    );
  };

  markAllAsRead = async (recipientId: string): Promise<void> => {
    this.rows = this.rows.map((n) => (n.recipientId === recipientId ? { ...n, isRead: true } : n));
  };
}
```

- [ ] **Step 2: Write the composition module**

```ts
// Notifications DI for the mobile app — mirrors postsComposition.ts. Returns a
// shared singleton repo + lazy use-case instances. Swap to a Supabase adapter
// here when P1.5 ships (TD-100).
import {
  GetUnreadCountUseCase,
  ListNotificationsUseCase,
  MarkAllAsReadUseCase,
  MarkAsReadUseCase,
} from '@kc/application';
import type { INotificationRepository } from '@kc/application';
import { InMemoryNotificationRepository } from '../repositories/InMemoryNotificationRepository';

let repoSingleton: INotificationRepository | null = null;
export function getNotificationsRepo(): INotificationRepository {
  if (!repoSingleton) repoSingleton = new InMemoryNotificationRepository();
  return repoSingleton;
}

export const listNotificationsUseCase = (): ListNotificationsUseCase =>
  new ListNotificationsUseCase(getNotificationsRepo());
export const getUnreadCountUseCase = (): GetUnreadCountUseCase =>
  new GetUnreadCountUseCase(getNotificationsRepo());
export const markAsReadUseCase = (): MarkAsReadUseCase =>
  new MarkAsReadUseCase(getNotificationsRepo());
export const markAllAsReadUseCase = (): MarkAllAsReadUseCase =>
  new MarkAllAsReadUseCase(getNotificationsRepo());
```

- [ ] **Step 3: Typecheck + commit**

```bash
cd app && pnpm typecheck
git add app/apps/mobile/src/repositories/InMemoryNotificationRepository.ts \
        app/apps/mobile/src/services/notificationsComposition.ts
git commit -m "feat(mobile): InMemoryNotificationRepository + composition (FR-NOTIF-017)"
```

---

### Task 10: Notifications screen

**Files:**
- Create: `app/apps/mobile/app/notifications/index.tsx`

- [ ] **Step 1: Write the screen**

```tsx
// Notifications list screen — FR-NOTIF-017 AC1..AC5.
// Tap row → markAsRead + navigate to target (when present).
// "Read all" → bulk mark, badge resets in the bell within 1 invalidation cycle.
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import type { Href } from 'expo-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { Notification } from '@kc/domain';
import { useAuthStore } from '../../src/store/authStore';
import {
  listNotificationsUseCase,
  markAllAsReadUseCase,
  markAsReadUseCase,
} from '../../src/services/notificationsComposition';
import { EmptyState } from '../../src/components/EmptyState';

const ICON: Record<Notification['kind'], string> = {
  chat_message: '💬',
  system_message: 'ℹ️',
  message_undeliverable: '⚠️',
  post_expiring: '⏳',
  recipient_marked: '🎁',
  recipient_unmarked: '↩️',
  post_removed: '🚫',
  follow_request: '➕',
  follow_accepted: '✅',
  started_following: '👥',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const recipientId = session?.userId;
  const qc = useQueryClient();

  const list = useQuery({
    queryKey: ['notifications', recipientId],
    queryFn: () => listNotificationsUseCase().execute({ recipientId: recipientId! }),
    enabled: Boolean(recipientId),
  });

  const markRead = useMutation({
    mutationFn: (id: string) => markAsReadUseCase().execute({ id, recipientId: recipientId! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', recipientId] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count', recipientId] });
    },
  });

  const markAll = useMutation({
    mutationFn: () => markAllAsReadUseCase().execute(recipientId!),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications', recipientId] });
      qc.invalidateQueries({ queryKey: ['notifications-unread-count', recipientId] });
    },
  });

  const onRowPress = (n: Notification) => {
    if (!n.isRead) markRead.mutate(n.id);
    if (n.target) {
      router.push({
        pathname: n.target.route as Href,
        params: n.target.params,
      } as never);
    }
  };

  const data = list.data ?? [];
  const unread = data.filter((n) => !n.isRead);
  const earlier = data.filter((n) => n.isRead);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.actionsRow}>
        <Pressable
          onPress={() => markAll.mutate()}
          disabled={unread.length === 0 || markAll.isPending}
          style={[styles.actionBtn, (unread.length === 0 || markAll.isPending) && styles.actionDisabled]}
        >
          <Text style={styles.actionText}>סמן הכל כנקרא</Text>
        </Pressable>
      </View>

      <FlatList
        data={[
          ...(unread.length ? [{ section: 'לא נקראו' as const }] : []),
          ...unread.map((n) => ({ row: n })),
          ...(earlier.length ? [{ section: 'מוקדם יותר' as const }] : []),
          ...earlier.map((n) => ({ row: n })),
        ]}
        keyExtractor={(item, idx) =>
          'section' in item ? `s-${item.section}` : `r-${item.row.id}-${idx}`
        }
        renderItem={({ item }) => {
          if ('section' in item) return <Text style={styles.sectionHeader}>{item.section}</Text>;
          const n = item.row;
          return (
            <Pressable onPress={() => onRowPress(n)} style={styles.row}>
              <View style={[styles.iconBubble, !n.isRead && styles.iconBubbleUnread]}>
                <Text style={styles.iconEmoji}>{ICON[n.kind]}</Text>
              </View>
              <View style={styles.body}>
                <Text style={styles.title} numberOfLines={1}>{n.title}</Text>
                <Text style={styles.subtitle} numberOfLines={2}>{n.body}</Text>
              </View>
              {!n.isRead && <View style={styles.dot} />}
            </Pressable>
          );
        }}
        ListEmptyComponent={
          list.isLoading ? null : (
            <EmptyState emoji="🔔" title="אין התראות עדיין" subtitle="כשתקבל התראה, היא תופיע כאן." />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  actionsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  actionDisabled: { opacity: 0.5 },
  actionText: { ...typography.label, color: colors.primary, fontWeight: '600' },
  sectionHeader: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
    textAlign: 'right',
  },
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBubble: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  iconBubbleUnread: { backgroundColor: colors.primaryLight },
  iconEmoji: { fontSize: 22 },
  body: { flex: 1, gap: 2 },
  title: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
});
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd app && pnpm typecheck
git add app/apps/mobile/app/notifications/index.tsx
git commit -m "feat(mobile): notifications list screen (FR-NOTIF-017 AC1-AC5)"
```

---

### Task 11: Global `TopBar` component

**Files:**
- Create: `app/apps/mobile/src/components/TopBar.tsx`

- [ ] **Step 1: Write the component**

```tsx
// Single global top bar — rendered at the root layout for every authenticated,
// post-onboarding route, mirroring TabBar's gating. Always exposes Chat,
// Notifications (with unread badge), and Settings. Center is route-aware:
// on (tabs) routes it shows the brand logo; on detail routes it shows a back
// button + a contextual title (so no per-screen header is needed and the
// chrome is uniform across the app).
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, typography } from '@kc/ui';
import { useAuthStore } from '../store/authStore';
import { getUnreadCountUseCase } from '../services/notificationsComposition';

const TITLES: Record<string, string> = {
  settings: 'הגדרות',
  chat: 'שיחות',
  notifications: 'התראות',
  post: 'פרטי פוסט',
  user: 'פרופיל',
};

function resolveContext(segments: string[]): { showBack: boolean; title: string | null } {
  const head = segments[0];
  if (!head || head === '(tabs)') return { showBack: false, title: null };
  return { showBack: true, title: TITLES[head] ?? null };
}

export function TopBar() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const recipientId = useAuthStore((s) => s.session?.userId);
  const ctx = resolveContext(segments);

  const unread = useQuery({
    queryKey: ['notifications-unread-count', recipientId],
    queryFn: () => getUnreadCountUseCase().execute(recipientId!),
    enabled: Boolean(recipientId),
    staleTime: 30_000,
  });
  const badge = unread.data ?? 0;

  return (
    <View style={[styles.bar, { paddingTop: Math.max(insets.top, 8) }]}>
      {/* RTL: right edge first. Settings → right; logo/title → middle; bell + chat → left. */}
      <Pressable
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
        accessibilityLabel="הגדרות"
        style={styles.iconBtn}
      >
        <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
      </Pressable>

      <View style={styles.center}>
        {ctx.showBack ? (
          <Pressable onPress={() => router.back()} style={styles.backRow} accessibilityRole="button">
            <Ionicons name="chevron-forward" size={22} color={colors.textPrimary} />
            {ctx.title ? <Text style={styles.title}>{ctx.title}</Text> : null}
          </Pressable>
        ) : (
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        )}
      </View>

      <View style={styles.rightGroup}>
        <Pressable
          onPress={() => router.push('/notifications')}
          accessibilityRole="button"
          accessibilityLabel="התראות"
          style={styles.iconBtn}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
          {badge > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 99 ? '99+' : String(badge)}</Text>
            </View>
          )}
        </Pressable>
        <Pressable
          onPress={() => router.push('/chat')}
          accessibilityRole="button"
          accessibilityLabel="שיחות"
          style={styles.iconBtn}
        >
          <Ionicons name="chatbubbles-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const BAR_HEIGHT = 52;

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.xs,
    minHeight: BAR_HEIGHT,
  },
  iconBtn: {
    padding: spacing.xs,
    position: 'relative',
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  title: { ...typography.h3, color: colors.textPrimary },
  logo: { height: 28, width: 120 },
  rightGroup: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.xs },
  badge: {
    position: 'absolute',
    top: 0,
    left: 0,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
});

export const TOP_BAR_HEIGHT = BAR_HEIGHT;
```

- [ ] **Step 2: Typecheck + commit**

```bash
cd app && pnpm typecheck
git add app/apps/mobile/src/components/TopBar.tsx
git commit -m "feat(mobile): global TopBar with chat/notifications/settings (FR-NOTIF-017 AC1)"
```

---

### Task 12: Wire `TopBar` into root layout + drop `detailHeader`

**Files:**
- Modify: `app/apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Edit the root layout**

In `_layout.tsx`:

1. Add import at the top with the other component imports:
```ts
import { TopBar, TOP_BAR_HEIGHT } from '../src/components/TopBar';
```

2. Delete the `detailHeader` constant block (lines 26-32) — we no longer need stack headers.

3. Replace the `ShellWithTabBar` body so the same gating drives both bars (`showTopBar = showTabBar`):

```tsx
function ShellWithTabBar({ children }: Readonly<{ children: React.ReactNode }>) {
  const segments = useSegments() as string[];
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);

  const head = segments[0] as string | undefined;
  const isOAuthCallback = head === 'auth' && segments[1] === 'callback';
  // Single chrome predicate — TopBar and TabBar share it so neither flashes
  // independently across navigation transitions.
  const showChrome =
    !isLoading &&
    isAuthenticated &&
    head !== '(auth)' &&
    head !== '(guest)' &&
    head !== '(onboarding)' &&
    !isOAuthCallback;

  // (tabs) provides its own bottom Tabs bar — don't double up.
  const showGlobalTabBar = showChrome && head !== '(tabs)';

  const TAB_BAR_HEIGHT = 68;
  return (
    <View style={{ flex: 1 }}>
      {showChrome && <TopBar />}
      <View
        style={{
          flex: 1,
          paddingBottom: showGlobalTabBar ? TAB_BAR_HEIGHT : 0,
        }}
      >
        {children}
      </View>
      {showGlobalTabBar && (
        <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0 }}>
          <TabBar />
        </View>
      )}
    </View>
  );
}
```

4. Inside the `<Stack ...>` element, remove the `options={...detailHeader...}` from each detail screen:

```tsx
<Stack.Screen name="settings" />
<Stack.Screen name="post/[id]" />
<Stack.Screen name="user/[handle]" />
<Stack.Screen name="chat/[id]" />
<Stack.Screen name="chat/index" />
<Stack.Screen name="notifications/index" />
```

(Add the `notifications/index` line above; it's a new route.)

5. Remove the now-unused import: delete `import { BackButton } from '../src/components/BackButton';` if `BackButton` is no longer referenced (it was only used by `detailHeader`). Check first with grep; if `BackButton` is referenced elsewhere, leave the import.

- [ ] **Step 2: Verify no orphan references**

Run: `cd app && grep -r "detailHeader\|BackButton" apps/mobile/app apps/mobile/src`
Expected: only the import line in `_layout.tsx` (if `BackButton` is still imported there) — and the file `BackButton.tsx` itself. If you removed the import, expect ONLY the file definition.

- [ ] **Step 3: Typecheck + commit**

```bash
cd app && pnpm typecheck
git add app/apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): render global TopBar at root; drop Stack detailHeader"
```

---

### Task 13: Remove duplicate top bars from `(tabs)` screens

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/index.tsx`
- Modify: `app/apps/mobile/app/(tabs)/profile.tsx`

- [ ] **Step 1: Strip the in-screen `topBar` from `(tabs)/index.tsx`**

Open `app/apps/mobile/app/(tabs)/index.tsx`. Delete the `<View style={styles.topBar}>...</View>` block (the chat/logo/settings row, currently lines ~50-60). Then delete the now-unused styles in the StyleSheet: `topBar`, `topBarLogo`, `iconBtn`. Remove the now-unused imports if any (`Image`, `Ionicons` if not used elsewhere in the file — verify before deleting).

- [ ] **Step 2: Strip the in-screen `topBar` from `(tabs)/profile.tsx`**

Open `app/apps/mobile/app/(tabs)/profile.tsx`. Delete the `<View style={styles.topBar}>...</View>` block (currently lines ~52-60, the title + settings icon row). Delete unused styles and imports.

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/index.tsx app/apps/mobile/app/\(tabs\)/profile.tsx
git commit -m "refactor(mobile): drop in-screen top bars from (tabs) — global TopBar owns it"
```

---

### Task 14: Remove duplicate headers from detail screens

**Files:**
- Modify: `app/apps/mobile/app/chat/index.tsx`
- Modify: `app/apps/mobile/app/chat/[id].tsx`
- Modify: `app/apps/mobile/app/settings.tsx`
- Modify: `app/apps/mobile/app/post/[id].tsx` (if it has an in-screen header)
- Modify: `app/apps/mobile/app/user/[handle].tsx` (same)

- [ ] **Step 1: Remove `<View style={styles.header}>` from each**

For each file above, delete the in-screen header block (back arrow + title row that mirrors what `TopBar` now provides). Keep `SafeAreaView edges={['top']}` because the `TopBar` lives above it but the screen still wants top inset for non-bar content. Drop unused styles (`header`, `title`) and imports (`Ionicons` if no other usage in the file).

For `chat/index.tsx` specifically: delete lines 33-41 (the header). For `settings.tsx`: delete lines 86-93. For the others, search for a `header` style and remove.

- [ ] **Step 2: Verify on simulator (manual)**

Run: `cd app && pnpm --filter @kc/mobile start --port 8083`
Then in the simulator, walk these flows:
1. Home → tap bell → notifications → back → home
2. Home → tap chat → chat list → tap a row → thread → back → chat list → back
3. Home → tap settings → settings → back

Expected: each transition has a single, smooth top bar (TopBar) with the right icons, no duplicated header, back button correctly returns one step.

- [ ] **Step 3: Typecheck + commit**

```bash
cd app && pnpm typecheck
git add app/apps/mobile/app/chat/index.tsx \
        app/apps/mobile/app/chat/\[id\].tsx \
        app/apps/mobile/app/settings.tsx \
        app/apps/mobile/app/post/\[id\].tsx \
        app/apps/mobile/app/user/\[handle\].tsx
git commit -m "refactor(mobile): drop per-screen headers on detail routes — TopBar owns chrome"
```

---

### Task 15: Run full quality gate

**Files:** none.

- [ ] **Step 1: Architecture lint**

Run: `cd app && pnpm lint:arch`
Expected: PASS — no new files exceed 200 LOC.

If any new file exceeds 200 LOC, split it (use the same component-splitting pattern already used in `CreatePostForm/`).

- [ ] **Step 2: Lint**

Run: `cd app && pnpm lint`
Expected: PASS.

- [ ] **Step 3: Typecheck**

Run: `cd app && pnpm typecheck`
Expected: PASS.

- [ ] **Step 4: Tests**

Run: `cd app && pnpm test`
Expected: PASS — 57 prior tests + 4 new test files (≥8 new tests). Confirm the new total in the output.

---

### Task 16: SSOT updates (PROJECT_STATUS, HISTORY, TECH_DEBT)

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`
- Modify: `docs/SSOT/HISTORY.md`
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step 1: Update PROJECT_STATUS §1 + §2 + §3**

§1 "Last Updated" line — append today's note: `(in-app notifications screen + global TopBar — FR-NOTIF-017, EXEC-6)`. Update completion % by +2 (rough). Update "What works": add bullet "In-app notifications screen with bell badge in global TopBar; chat / settings / notifications icons reachable from anywhere (FR-NOTIF-017)". Update "What is fake": add "Notifications backed by in-memory adapter; Supabase + push tokens deferred to P1.5 (TD-100)".

§2 — add a new row under the existing P1 band:

```markdown
| P1.5a | In-app notifications screen + global TopBar (UX prep for push) | FR-NOTIF-017 | 🟢 Done (2026-05-08) | Storage InMemory; Supabase adapter pending P1.5 (TD-100) |
```

§3 — leave Sprint Board pointing at P0.5 chat (next).

- [ ] **Step 2: Append HISTORY entry at top**

Add a new bullet at the top of `docs/SSOT/HISTORY.md`:

```markdown
- **2026-05-08 — FR-NOTIF-017 in-app notifications screen + global TopBar.**
  Branch: `feat/FR-NOTIF-fe-screen-and-top-bar` · Tests: +4 vitest files (List/UnreadCount/MarkAsRead/MarkAllAsRead) · Tech-debt: +TD-100 (Supabase adapter pending P1.5) · Open gaps: push tokens, server-emitted notifications. Spec: EXEC-6 in §4 + new FR-NOTIF-017.
```

- [ ] **Step 3: Append TD-100 to TECH_DEBT**

Add under the FE section (TD-100..149 range):

```markdown
- **TD-100** — `INotificationRepository` Supabase adapter is not implemented. The mobile app currently uses `InMemoryNotificationRepository` (FE-only seed). Closes when P1.5 ships the `notifications` table + Supabase adapter + push token registration. Owner: agent-be on P1.5.
```

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/PROJECT_STATUS.md docs/SSOT/HISTORY.md docs/SSOT/TECH_DEBT.md
git commit -m "docs(ssot): record FR-NOTIF-017 ship + TD-100 follow-up"
```

---

### Task 17: Open PR

**Files:** none.

- [ ] **Step 1: Push branch**

```bash
git push -u origin feat/FR-NOTIF-fe-screen-and-top-bar
```

- [ ] **Step 2: Open PR via gh**

```bash
gh pr create --title "feat(notif): in-app notifications screen + global top bar (FR-NOTIF-017)" --body "$(cat <<'EOF'
## Summary
- Adds an in-app notifications screen wired to `INotificationRepository` (InMemory adapter today; Supabase ships with P1.5 — see TD-100).
- Replaces per-screen ad-hoc top bars with a single global `TopBar` that always exposes Chat / Notifications (with unread badge) / Settings, route-aware center (logo on tabs, back+title on details).
- Spec amended: new `FR-NOTIF-017` + `EXEC-6` decision overrides the previous "push-only, no in-app screen" wording.

## Test plan
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint && pnpm lint:arch` pass
- [ ] `pnpm test` — new tests for List/UnreadCount/MarkAsRead/MarkAllAsRead use cases
- [ ] iOS sim: bell shows unread count; tap → screen; tap row → marks read + navigates; "Read all" empties badge
- [ ] iOS sim: settings/chat/notifications icons reachable from every authenticated screen with smooth back-navigation (no double headers)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 2: Confirm CI is green and let it auto-merge per `.cursor/rules/git-workflow.mdc`.**

---

## Self-Review (executed)

**Spec coverage:** FR-NOTIF-017 AC1 → TopBar bell + badge (Task 11) ✅. AC2 → Notifications screen Unread/Earlier sections (Task 10) ✅. AC3 → `onRowPress` → `markRead` + `router.push(target)` (Task 10) ✅. AC4 → bell query invalidation on `markAll` success (Task 10) ✅. AC5 → `EmptyState` with "אין התראות עדיין" (Task 10) ✅. AC6 → InMemory adapter + composition swap point (Task 9) ✅. EXEC-6 documented in PROJECT_STATUS + appendices (Task 1) ✅. Always-visible nav: TopBar gated identically to TabBar in `ShellWithTabBar` (Task 12) ✅.

**Placeholder scan:** none. All steps include the actual code or exact commands.

**Type consistency:** `INotificationRepository` shape (`list / countUnread / markAsRead / markAllAsRead`) is consistent across the port (Task 3), fake (Task 4), use cases (Tasks 5-8), and InMemory adapter (Task 9). `Notification` entity shape is locked in Task 2 and used identically by every later task. Use-case names (`ListNotificationsUseCase`, `GetUnreadCountUseCase`, `MarkAsReadUseCase`, `MarkAllAsReadUseCase`) match the composition exports and the screen imports.
