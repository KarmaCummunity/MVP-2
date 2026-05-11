# Chat-Post Anchor Lifecycle — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the anchored-post card not appearing in chat when a user enters an existing chat from a different post, by (a) updating `anchor_post_id` on chat reuse, (b) clearing the anchor when the post closes, and (c) propagating chat-row changes via realtime to keep both participants' chat screens in sync.

**Architecture:** Three coordinated changes across DB, infrastructure adapter, and UI realtime — Domain/Application contracts are unchanged. The DB trigger fan-out from FR-CHAT-015 already exists (migration `0021`); this plan extends it. The use-case port `IChatRepository.findOrCreateChat(a, b, anchorPostId?)` keeps its signature; only adapter behavior changes. Realtime gets one new optional callback (`onChatChanged`) that the chat screen wires to its local state.

**Tech Stack:** Postgres + Supabase Realtime · TypeScript · React Native (Expo) · Zustand store · vitest (use-case tests) · pnpm + turbo monorepo. Repo root: `/Users/navesarussi/KC/MVP-2`. Monorepo lives under `app/`. Migrations under `supabase/migrations/`. Branch: `fix/P1.2.x-chat-anchor-lifecycle` (already created).

**Spec:** [docs/superpowers/specs/2026-05-11-chat-post-anchor-lifecycle-design.md](../specs/2026-05-11-chat-post-anchor-lifecycle-design.md)

---

## File Structure

| Layer | File | Action |
|-------|------|--------|
| DB | `supabase/migrations/0026_chat_anchor_lifecycle.sql` | **Create** — redefines the closure trigger function to also clear `anchor_post_id`. |
| Application port | `app/packages/application/src/ports/IChatRealtime.ts` | **Modify** — add optional `onChatChanged` to `ChatStreamCallbacks`. |
| Application use-case test fake | `app/packages/application/src/chat/__tests__/fakeChatRepository.ts` | **Modify** — `findOrCreateChat` re-anchors on reuse. |
| Application use-case test | `app/packages/application/src/chat/__tests__/OpenOrCreateChatUseCase.test.ts` | **Modify** — flip the "second call" assertion + add scenarios. |
| Infrastructure adapter | `app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts` | **Modify** — `findOrCreateChat` UPDATEs anchor when reusing. |
| Infrastructure realtime | `app/packages/infrastructure-supabase/src/chat/SupabaseChatRealtime.ts` | **Modify** — `subscribeToChat` listens to chats UPDATE. |
| App store | `app/apps/mobile/src/store/chatStore.ts` | **Modify** — `startThreadSub` accepts optional `onChatChanged` and forwards. |
| App hook | `app/apps/mobile/src/components/useChatInit.ts` | **Modify** — passes `setChat` as `onChatChanged`. |
| SRS | `docs/SSOT/SRS/02_functional_requirements/FR-CHAT-014.md` | **Modify** — new AC for re-anchor on entry. |
| SRS | `docs/SSOT/SRS/02_functional_requirements/FR-CLOSURE-001.md` | **Modify** — new AC for clearing anchor on close. |
| Status | `docs/SSOT/PROJECT_STATUS.md` | **Modify** — add P1.2.x row, mark In progress → Done. |
| Tech debt | `docs/SSOT/TECH_DEBT.md` | **Modify** — close the TD note left in migration `0017`. |

---

## Task 1: Create migration 0026 — clear `anchor_post_id` on close

**Files:**
- Create: `supabase/migrations/0026_chat_anchor_lifecycle.sql`
- Reference (do not edit): `supabase/migrations/0021_post_closure_emit_system_messages.sql`

- [ ] **Step 1: Write the migration**

Create `supabase/migrations/0026_chat_anchor_lifecycle.sql`:

```sql
-- 0026_chat_anchor_lifecycle | P1.2.x — FR-CHAT-014 / FR-CLOSURE-001 ext.
--
-- Extends posts_emit_closure_system_messages (defined in 0021) to additionally
-- clear chats.anchor_post_id for every chat anchored to the post being closed.
-- This makes the chat "free" so a subsequent contact-poster from a different
-- post re-anchors cleanly (paired with the adapter fix in
-- SupabaseChatRepository.findOrCreateChat).
--
-- The clear runs AFTER the system-message inserts so the SELECT in the loop
-- still finds the anchored chats.

set search_path = public;

create or replace function public.posts_emit_closure_system_messages()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_recipient   uuid;
  v_chat        record;
  v_other       uuid;
  v_is_recipient_chat boolean;
  v_body        text;
  v_payload     jsonb;
begin
  if not (
    old.status = 'open'
    and new.status in ('closed_delivered', 'deleted_no_recipient')
  ) then
    return new;
  end if;

  if new.status = 'closed_delivered' then
    select recipient_user_id into strict v_recipient
    from public.recipients
    where post_id = new.post_id;
  else
    v_recipient := null;
  end if;

  for v_chat in
    select chat_id, participant_a, participant_b
    from public.chats
    where anchor_post_id = new.post_id
  loop
    if v_chat.participant_a <> new.owner_id and v_chat.participant_b <> new.owner_id then
      continue;
    end if;

    v_other := case
      when v_chat.participant_a = new.owner_id then v_chat.participant_b
      else v_chat.participant_a
    end;

    v_is_recipient_chat := (v_recipient is not null and v_other = v_recipient);

    if new.status = 'closed_delivered' then
      if v_is_recipient_chat then
        v_body := 'הפוסט סומן כנמסר ✓ · תודה!';
      else
        v_body := 'הפוסט נמסר למשתמש אחר';
      end if;
    else
      v_body := 'המפרסם סגר את הפוסט — הפריט לא נמסר';
    end if;

    v_payload := jsonb_build_object(
      'kind',              'post_closed',
      'post_id',           new.post_id,
      'status',            new.status,
      'recipient_user_id', case when v_is_recipient_chat then v_recipient else null end
    );

    insert into public.messages (
      chat_id, sender_id, kind, body, system_payload, status, delivered_at
    ) values (
      v_chat.chat_id, null, 'system', v_body, v_payload, 'delivered', now()
    );
  end loop;

  -- NEW in 0026: clear the anchor for every chat that pointed to this post,
  -- so a future contact-poster from a different post re-anchors cleanly.
  -- Runs after the loop above so the SELECT in the loop still sees the
  -- anchored rows.
  update public.chats
     set anchor_post_id = null
   where anchor_post_id = new.post_id;

  return new;
end;
$$;

-- end of 0026_chat_anchor_lifecycle
```

- [ ] **Step 2: Apply migration locally**

Run:
```bash
cd /Users/navesarussi/KC/MVP-2
supabase db push --linked
```

Expected: "Applying migration 0026_chat_anchor_lifecycle.sql..." then success. If `supabase` CLI is not linked, fall back to running the SQL manually in Supabase Studio SQL editor on the dev project (URL is in user memory `supabase_project.md`).

- [ ] **Step 3: Manually verify clearing**

In Supabase Studio SQL editor:
```sql
-- Pick any owner's open post (replace with a real UUID from dev):
select post_id, status from posts where status = 'open' limit 5;

-- Confirm at least one chat anchored to it:
select chat_id, anchor_post_id from chats where anchor_post_id = '<picked-post-id>';

-- Close via RPC:
select close_post_with_recipient('<picked-post-id>', '<some-existing-counterpart-user-id>');

-- Verify anchor cleared on all previously anchored chats:
select chat_id, anchor_post_id from chats where chat_id in (<list from step above>);
-- Expected: all rows show anchor_post_id = null.

-- Verify system messages were emitted (sanity check 0021 still works):
select chat_id, kind, body from messages where system_payload->>'post_id' = '<picked-post-id>' order by created_at desc;
-- Expected: one system row per previously anchored chat.
```

- [ ] **Step 4: Commit**

```bash
cd /Users/navesarussi/KC/MVP-2
git add supabase/migrations/0026_chat_anchor_lifecycle.sql
git commit -m "feat(db): clear chats.anchor_post_id when post closes (0026)"
```

---

## Task 2: Update `FakeChatRepository` to re-anchor on reuse

**Files:**
- Modify: `app/packages/application/src/chat/__tests__/fakeChatRepository.ts:27-43`

- [ ] **Step 1: Edit `findOrCreateChat` in the fake**

Replace the existing `findOrCreateChat` method (lines 27-43) with:

```typescript
  async findOrCreateChat(userId: string, otherUserId: string, anchorPostId?: string): Promise<Chat> {
    const ids = [userId, otherUserId].sort() as [string, string];
    const existing = this.chats.find(
      (c) => c.participantIds[0] === ids[0] && c.participantIds[1] === ids[1],
    );
    if (existing) {
      // Re-anchor on reuse if a non-null anchor is supplied AND it differs.
      // No-op when caller passes no anchor (e.g. inbox flow) or same anchor.
      if (anchorPostId !== undefined && existing.anchorPostId !== anchorPostId) {
        const idx = this.chats.indexOf(existing);
        const updated: Chat = { ...existing, anchorPostId };
        this.chats[idx] = updated;
        return updated;
      }
      return existing;
    }
    const chat: Chat = {
      chatId: `chat-${this.chats.length + 1}`,
      participantIds: ids,
      anchorPostId: anchorPostId ?? null,
      isSupportThread: false,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.chats.push(chat);
    return chat;
  }
```

- [ ] **Step 2: Run existing tests to see the expected failure**

```bash
cd /Users/navesarussi/KC/MVP-2/app/packages/application
pnpm test
```

Expected: `OpenOrCreateChatUseCase > returns the existing chat (first-anchor-wins) on second call` **FAILS** because we just inverted the behavior. This proves the fake now embodies the new contract. We'll fix the test assertion in Task 3.

(Other tests should still pass.)

---

## Task 3: Update `OpenOrCreateChatUseCase` tests for re-anchor behavior

**Files:**
- Modify: `app/packages/application/src/chat/__tests__/OpenOrCreateChatUseCase.test.ts`

- [ ] **Step 1: Replace the test file with updated assertions**

Replace the entire file contents:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { OpenOrCreateChatUseCase } from '../OpenOrCreateChatUseCase';
import { FakeChatRepository } from './fakeChatRepository';

describe('OpenOrCreateChatUseCase', () => {
  let repo: FakeChatRepository;
  let uc: OpenOrCreateChatUseCase;
  beforeEach(() => {
    repo = new FakeChatRepository();
    uc = new OpenOrCreateChatUseCase(repo);
  });

  it('creates a new chat when none exists', async () => {
    const chat = await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    expect(chat.anchorPostId).toBe('p1');
    expect(repo.chats).toHaveLength(1);
  });

  it('re-anchors the existing chat to the new post on second call', async () => {
    await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    const second = await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p2' });
    expect(second.anchorPostId).toBe('p2');
    expect(repo.chats).toHaveLength(1);
  });

  it('does not change anchor when called without an anchor (inbox flow)', async () => {
    await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    const second = await uc.execute({ viewerId: 'a', otherUserId: 'b' });
    expect(second.anchorPostId).toBe('p1');
    expect(repo.chats).toHaveLength(1);
  });

  it('handles no-anchor entry (profile flow) for brand-new chat', async () => {
    const chat = await uc.execute({ viewerId: 'a', otherUserId: 'b' });
    expect(chat.anchorPostId).toBeNull();
  });

  it('is a no-op UPDATE when called with the same anchor twice', async () => {
    const first = await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    const second = await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    expect(second.anchorPostId).toBe('p1');
    expect(second).toEqual(first);
  });
});
```

- [ ] **Step 2: Run tests to verify all pass**

```bash
cd /Users/navesarussi/KC/MVP-2/app/packages/application
pnpm test
```

Expected: all 5 tests in `OpenOrCreateChatUseCase` pass.

- [ ] **Step 3: Run full app test suite + typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm typecheck && pnpm test
```

Expected: green across all packages. If any other test depended on first-anchor-wins behavior, fix it now and capture the change in the commit.

- [ ] **Step 4: Commit**

```bash
cd /Users/navesarussi/KC/MVP-2
git add app/packages/application/src/chat/__tests__/
git commit -m "test(application): re-anchor chat on reuse + sibling scenarios"
```

---

## Task 4: Fix `SupabaseChatRepository.findOrCreateChat`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts:35-63`

- [ ] **Step 1: Replace the method body**

Replace the `findOrCreateChat` method (lines 35-63) with:

```typescript
  async findOrCreateChat(
    userId: string,
    otherUserId: string,
    anchorPostId?: string,
  ): Promise<Chat> {
    const [a, b] =
      userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

    const existing = await this.client
      .from('chats')
      .select('*')
      .eq('participant_a', a)
      .eq('participant_b', b)
      .maybeSingle();
    if (existing.error) throw mapChatError(existing.error);

    if (existing.data) {
      // Re-anchor when caller supplied a non-null anchor that differs from the
      // current value. When caller passes no anchor (inbox flow) or the same
      // anchor, return as-is to avoid a wasted UPDATE and a spurious realtime
      // event.
      const needsReanchor =
        anchorPostId !== undefined &&
        anchorPostId !== null &&
        existing.data.anchor_post_id !== anchorPostId;

      if (!needsReanchor) return rowToChat(existing.data);

      const updated = await this.client
        .from('chats')
        .update({ anchor_post_id: anchorPostId })
        .eq('chat_id', existing.data.chat_id)
        .select('*')
        .single();
      if (updated.error) throw mapChatError(updated.error);
      return rowToChat(updated.data);
    }

    const insert = await this.client
      .from('chats')
      .insert({
        participant_a: a,
        participant_b: b,
        anchor_post_id: anchorPostId ?? null,
      })
      .select('*')
      .single();
    if (insert.error) throw mapChatError(insert.error);
    return rowToChat(insert.data);
  }
```

- [ ] **Step 2: Typecheck the infra package**

```bash
cd /Users/navesarussi/KC/MVP-2/app/packages/infrastructure-supabase
pnpm typecheck
```

Expected: clean. No type errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/navesarussi/KC/MVP-2
git add app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts
git commit -m "fix(chat-infra): re-anchor existing chat on findOrCreateChat reuse"
```

---

## Task 5: Extend `ChatStreamCallbacks` port with `onChatChanged`

**Files:**
- Modify: `app/packages/application/src/ports/IChatRealtime.ts:8-19`

- [ ] **Step 1: Add the optional callback to `ChatStreamCallbacks`**

Replace lines 8-19 (the `ChatStreamCallbacks` interface) with:

```typescript
export interface ChatStreamCallbacks {
  onMessage: (m: Message) => void;
  onMessageStatusChanged: (
    patch: {
      messageId: string;
      status: MessageStatus;
      deliveredAt: string | null;
      readAt: string | null;
    },
  ) => void;
  // Fires when the chat row itself changes (e.g. anchor_post_id flips, or
  // last_message_at advances). Optional — consumers that only care about
  // messages can omit it.
  onChatChanged?: (chat: Chat) => void;
  onError: (err: Error) => void;
}
```

- [ ] **Step 2: Typecheck the application package**

```bash
cd /Users/navesarussi/KC/MVP-2/app/packages/application
pnpm typecheck
```

Expected: clean. The infra adapter and store don't yet emit/consume `onChatChanged`, but the interface change is backwards-compatible (optional field).

---

## Task 6: Make `SupabaseChatRealtime.subscribeToChat` emit chat-row changes

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/chat/SupabaseChatRealtime.ts:25-64`

- [ ] **Step 1: Add a 3rd `.on(...)` for chats UPDATE**

Replace `subscribeToChat` (lines 25-64) with:

```typescript
  subscribeToChat(chatId: string, cb: ChatStreamCallbacks): Unsubscribe {
    const channel = this.client
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => cb.onMessage(rowToMessage(payload.new as never)),
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          const m = rowToMessage(payload.new as never);
          cb.onMessageStatusChanged({
            messageId: m.messageId,
            status: m.status,
            deliveredAt: m.deliveredAt,
            readAt: m.readAt,
          });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chats',
          filter: `chat_id=eq.${chatId}`,
        },
        (payload) => {
          if (cb.onChatChanged) {
            cb.onChatChanged(rowToChat(payload.new as never));
          }
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          cb.onError(new Error(`chat channel ${status.toLowerCase()}`));
        }
      });
    return () => {
      void channel.unsubscribe();
    };
  }
```

- [ ] **Step 2: Typecheck the infra package**

```bash
cd /Users/navesarussi/KC/MVP-2/app/packages/infrastructure-supabase
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Commit (port + realtime adapter together)**

```bash
cd /Users/navesarussi/KC/MVP-2
git add app/packages/application/src/ports/IChatRealtime.ts \
        app/packages/infrastructure-supabase/src/chat/SupabaseChatRealtime.ts
git commit -m "feat(chat-realtime): emit chat-row changes via onChatChanged"
```

---

## Task 7: Plumb `onChatChanged` through `startThreadSub`

**Files:**
- Modify: `app/apps/mobile/src/store/chatStore.ts:47-48,192-216`

- [ ] **Step 1: Find and read the `startThreadSub` interface declaration**

Open `app/apps/mobile/src/store/chatStore.ts`. The interface declaration is around line 47:

```typescript
  startThreadSub(chatId: string, repo: IChatRepository, realtime: IChatRealtime): Promise<void>;
```

The implementation is around lines 192-216 (matches the existing pattern shown in the spec).

- [ ] **Step 2: Update the interface signature**

Change line 47 from:
```typescript
  startThreadSub(chatId: string, repo: IChatRepository, realtime: IChatRealtime): Promise<void>;
```

To:
```typescript
  startThreadSub(
    chatId: string,
    repo: IChatRepository,
    realtime: IChatRealtime,
    onChatChanged?: (chat: import('@kc/domain').Chat) => void,
  ): Promise<void>;
```

(If the file already imports `Chat` from `@kc/domain` at the top, drop the inline `import(...)` and use `Chat` directly.)

- [ ] **Step 3: Update the implementation**

Replace the `startThreadSub` body (lines ~192-216) with:

```typescript
  startThreadSub: async (chatId, repo, realtime, onChatChanged) => {
    if (get().threadSubs[chatId]) return;
    const noopUnsub: Unsubscribe = () => {};
    set((s) => ({ threadSubs: { ...s.threadSubs, [chatId]: noopUnsub } }));
    try {
      const msgs = await repo.getMessages(chatId, 50);
      if (get().threadSubs[chatId] !== noopUnsub) return;
      get().setThreadMessages(chatId, msgs);
      const unsub = realtime.subscribeToChat(chatId, {
        onMessage: (m) => get().applyIncomingMessage(chatId, m),
        onMessageStatusChanged: (p) => get().applyStatusChange(chatId, p),
        onChatChanged,
        onError: () => {
          /* deferred: surface to screen via ChatChannelStatus hook later */
        },
      });
      set((s) => ({ threadSubs: { ...s.threadSubs, [chatId]: unsub } }));
    } catch (err) {
      set((s) => {
        if (s.threadSubs[chatId] !== noopUnsub) return s;
        const { [chatId]: _, ...rest } = s.threadSubs;
        return { threadSubs: rest };
      });
      throw err;
    }
  },
```

- [ ] **Step 4: Typecheck the mobile app**

```bash
cd /Users/navesarussi/KC/MVP-2/app/apps/mobile
pnpm typecheck
```

Expected: clean — the parameter is optional, so existing callers stay valid.

---

## Task 8: Wire `onChatChanged` into `useChatInit`

**Files:**
- Modify: `app/apps/mobile/src/components/useChatInit.ts:23-63`

- [ ] **Step 1: Replace the hook body**

Replace lines 23-63 of `useChatInit.ts`:

```typescript
export function useChatInit(chatId: string, userId: string) {
  const [chat, setChat] = useState<Chat | null>(null);
  const [counterpart, setCounterpart] = useState<ChatCounterpart>(EMPTY_COUNTERPART);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const c = await container.chatRepo.findById(chatId);
      if (cancelled || !c) return;
      const cp = await container.chatRepo.getCounterpart(c, userId);
      if (cancelled) return;
      setChat(c);
      setCounterpart({
        displayName: cp.displayName,
        shareHandle: cp.shareHandle,
        isDeleted: cp.isDeleted,
      });
    })();

    void useChatStore
      .getState()
      .startThreadSub(chatId, container.chatRepo, container.chatRealtime, (next) => {
        // Chat row changed in realtime (e.g. anchor_post_id flipped because the
        // counterpart entered from a new post, or the post anchored here just
        // closed — see migration 0026). Refresh local state so AnchoredPostCard
        // reflects the new anchor without requiring a screen reload.
        if (!cancelled) setChat(next);
      });

    void (async () => {
      try {
        await container.markChatRead.execute({ chatId, userId });
        if (!cancelled) useChatStore.getState().markChatLocallyRead(chatId);
      } catch {
        /* read-state lag is recoverable; realtime will reconcile */
      }
    })();

    return () => {
      cancelled = true;
      useChatStore.getState().stopThreadSub(chatId);
    };
  }, [chatId, userId]);

  return { chat, counterpart };
}
```

- [ ] **Step 2: Typecheck the mobile app**

```bash
cd /Users/navesarussi/KC/MVP-2/app/apps/mobile
pnpm typecheck
```

Expected: clean.

- [ ] **Step 3: Commit (store + hook together)**

```bash
cd /Users/navesarussi/KC/MVP-2
git add app/apps/mobile/src/store/chatStore.ts app/apps/mobile/src/components/useChatInit.ts
git commit -m "feat(chat-mobile): refresh chat state on realtime chat-row change"
```

---

## Task 9: Update SRS docs

**Files:**
- Modify: `docs/SSOT/SRS/02_functional_requirements/FR-CHAT-014.md`
- Modify: `docs/SSOT/SRS/02_functional_requirements/FR-CLOSURE-001.md`

- [ ] **Step 1: Read the current FR-CHAT-014 file**

```bash
cat docs/SSOT/SRS/02_functional_requirements/FR-CHAT-014.md
```

Locate the acceptance-criteria section (typically a numbered list under a heading like `## Acceptance Criteria`).

- [ ] **Step 2: Append a new AC to FR-CHAT-014**

Add the following AC at the end of the acceptance-criteria list (renumber as needed to fit the existing pattern):

```markdown
- AC-NEW (re-anchor on entry from different post): When a user opens an existing chat through "💬 שלח הודעה למפרסם" from a post Y whose ID differs from the chat's current `anchor_post_id`, the chat's `anchor_post_id` is updated to Y. The card in the chat header reflects Y on the next render. When the call carries no anchor (inbox/profile flow), the existing `anchor_post_id` is left unchanged.
```

- [ ] **Step 3: Read the current FR-CLOSURE-001 file**

```bash
cat docs/SSOT/SRS/02_functional_requirements/FR-CLOSURE-001.md
```

- [ ] **Step 4: Append a new AC to FR-CLOSURE-001**

Add the following AC at the end of the acceptance-criteria list:

```markdown
- AC-NEW (clear anchor on close): When a post transitions from `open` to either `closed_delivered` or `deleted_no_recipient`, `chats.anchor_post_id` is cleared (set to NULL) on every chat that was anchored to that post. The clear runs after the system-message fan-out (FR-CHAT-015) in the same DB trigger so the messages still reach the anchored chats. Implemented in migration `0026_chat_anchor_lifecycle.sql`.
```

- [ ] **Step 5: Commit**

```bash
cd /Users/navesarussi/KC/MVP-2
git add docs/SSOT/SRS/02_functional_requirements/FR-CHAT-014.md \
        docs/SSOT/SRS/02_functional_requirements/FR-CLOSURE-001.md
git commit -m "docs(srs): re-anchor on entry + clear anchor on close"
```

---

## Task 10: Update `PROJECT_STATUS.md` and `TECH_DEBT.md`

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step 1: Read PROJECT_STATUS §3 (Sprint Board)**

```bash
grep -n "^## \|^### " docs/SSOT/PROJECT_STATUS.md | head -20
```

Find the Sprint Board section and locate where in-progress / planned rows live.

- [ ] **Step 2: Add a row for P1.2.x**

In the Sprint Board, add (or update an existing row):

```
| P1.2.x | Chat-post anchor lifecycle (re-anchor on reuse + clear on close) | 🟡 In progress | fix/P1.2.x-chat-anchor-lifecycle | FR-CHAT-014 ext, FR-CLOSURE-001 ext |
```

(Match the exact column structure already in the file — adjust columns to fit.)

- [ ] **Step 3: Update TECH_DEBT.md**

```bash
grep -n "0017\|anchor" docs/SSOT/TECH_DEBT.md
```

Look for any TD entry referencing the migration-0017 note about chats not being re-anchored on reuse. If found, mark it resolved with a one-line note:

```markdown
- ~~TD-XXX: chats.anchor_post_id stale on findOrCreateChat reuse~~ → Resolved by P1.2.x (migration 0026 + SupabaseChatRepository fix), 2026-05-11.
```

If no such TD exists, add a closing note under the appropriate "Closed in P1.2" section. If neither pattern matches, skip — don't fabricate a TD.

- [ ] **Step 4: Commit**

```bash
cd /Users/navesarussi/KC/MVP-2
git add docs/SSOT/PROJECT_STATUS.md docs/SSOT/TECH_DEBT.md
git commit -m "docs(status): P1.2.x — chat-post anchor lifecycle in progress"
```

---

## Task 11: Manual E2E verification in browser

**Files:**
- None modified — verification only.

**Prerequisites:** dev server running (`pnpm --filter @kc/mobile web` from `app/`), two browser sessions or two Supabase test accounts (use super-admin from user memory + a regular dev account; or two regular accounts).

- [ ] **Step 1: Start the dev server**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm --filter @kc/mobile web
```

Wait for "Web Bundled" message. Open the localhost URL the bundler prints.

- [ ] **Step 2: Scenario 1 — fresh chat anchored correctly**

1. Sign in as user A.
2. Navigate to a feed item posted by user B.
3. Tap "💬 שלח הודעה למפרסם".
4. **Expected:** chat opens, AnchoredPostCard visible at top showing post P1's title/type tag.

If card missing: open dev tools, inspect the network call to `chats` SELECT/INSERT for `anchor_post_id`, and inspect the rendered `<AnchoredPostCard>` props in the React tree.

- [ ] **Step 3: Scenario 2 — re-anchor on reuse**

1. Still as user A, go back to feed.
2. Find a second post P2 also by user B.
3. Tap "💬 שלח הודעה למפרסם" on P2.
4. **Expected:** the SAME chat as Scenario 1 opens, but the card now shows P2 (not P1).

- [ ] **Step 4: Scenario 3 — close-from-chat clears anchor**

1. Sign in as user B (post owner). Open the chat from B's inbox — card shows P2 (the latest anchor from Scenario 2).
2. Tap "סמן כנמסר ✓" → confirm closure.
3. **Expected:** card disappears, system message "הפוסט סומן כנמסר ✓ · תודה!" appears in chat.
4. Open Supabase Studio → table `chats` → find this chat row → confirm `anchor_post_id` IS NULL.

- [ ] **Step 5: Scenario 4 — entering from a 3rd post re-anchors after close**

1. Still as user A, go to feed, find a third post P3 by user B.
2. Tap "💬 שלח הודעה למפרסם".
3. **Expected:** the SAME chat opens, card now shows P3.
4. Verify `chats.anchor_post_id` in DB = P3's post_id.

- [ ] **Step 6: Scenario 5 — realtime sync between participants**

1. Open the chat as user A in browser window 1 (Chrome).
2. Open the same chat as user B in browser window 2 (different browser / incognito).
3. From user A's feed, tap "💬 שלח הודעה למפרסם" on a different post P4 by user B (need to navigate back, find the post, tap).
4. **Expected on user B's screen (in the chat tab):** the card swaps from previous anchor to P4 **without B reloading the chat screen**, within 1-2 seconds.

If swap doesn't happen: check browser console for realtime subscription logs. Verify the chats table is in the `supabase_realtime` publication (`select * from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'chats';` — should return one row).

- [ ] **Step 7: Stop the dev server and record results**

For each scenario, note: pass / fail / observation. If any scenario fails, do NOT proceed to PR — return to the relevant task and fix.

---

## Task 12: Open PR

**Files:**
- None modified — git ops only.

- [ ] **Step 1: Run pre-push gates**

```bash
cd /Users/navesarussi/KC/MVP-2/app
pnpm typecheck && pnpm test && pnpm lint
```

Expected: all green. If anything fails, fix in a follow-up commit on this branch before pushing.

- [ ] **Step 2: Push the branch**

```bash
cd /Users/navesarussi/KC/MVP-2
git push -u origin fix/P1.2.x-chat-anchor-lifecycle
```

- [ ] **Step 3: Create PR with template**

```bash
gh pr create --title "fix(P1.2.x): chat-post anchor lifecycle — re-anchor on reuse + clear on close" --body "$(cat <<'EOF'
Mapped to SRS: FR-CHAT-014 (ext), FR-CLOSURE-001 (ext). Refactor logged: No.

## Summary
- **Adapter fix:** `SupabaseChatRepository.findOrCreateChat` now updates `anchor_post_id` when reusing an existing chat with a different anchor (previously it returned the row as-is, leaving the anchored-post card stale or missing).
- **DB lifecycle:** migration `0026_chat_anchor_lifecycle.sql` extends the closure trigger to clear `anchor_post_id` on every chat anchored to a post that just transitioned `open → closed_*`. System-message fan-out from `0021` is preserved (runs before the clear).
- **Realtime sync:** `ChatStreamCallbacks.onChatChanged` (new, optional) propagates `chats UPDATE` events so both participants see the card swap without a reload.

Domain and application contracts are unchanged.

## Test Plan
- [x] vitest: `OpenOrCreateChatUseCase` covers re-anchor on reuse, no-op on same anchor, untouched on no-anchor inbox flow.
- [x] Manual E2E (5 scenarios) per plan §11:
  - [x] Fresh chat anchored.
  - [x] Re-anchor on entry from a different post.
  - [x] Close-from-chat clears the anchor in DB.
  - [x] Subsequent entry from a 3rd post re-anchors cleanly.
  - [x] Realtime swap visible to both participants without reload.
- [x] Migration manually verified: closing a post nulls `anchor_post_id` on all anchored chats; system messages still arrive.

## Plan / Spec
- Spec: `docs/superpowers/specs/2026-05-11-chat-post-anchor-lifecycle-design.md`
- Plan: `docs/superpowers/plans/2026-05-11-chat-post-anchor-lifecycle.md`

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Confirm CI starts**

```bash
gh pr checks --watch
```

Expected: typecheck, test, lint, and any branch-protection checks queue and run.

- [ ] **Step 5: Auto-merge once green (per repo convention)**

```bash
gh pr merge --auto --squash
```

Per `.cursor/rules/git-workflow.mdc`, auto-merge after green CI is the standard for this repo.

---

## Done Criteria

- All 12 tasks have every checkbox ticked.
- PR merged into `main`, branch deleted.
- `PROJECT_STATUS.md` row for P1.2.x moved from 🟡 In progress to ✅ Done.
- Manual smoke on `main` after merge: scenario 2 (re-anchor on second post) works.
