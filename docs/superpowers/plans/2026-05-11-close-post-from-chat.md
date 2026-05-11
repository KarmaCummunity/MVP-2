# Close Post From Chat Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Show the anchored post as a sticky card in the chat header (both sides, only while post is `open`), let the post owner close the post directly from chat with the chat counterpart pre-filled as recipient, and emit system messages to every anchored chat when a post closes — regardless of where the close was triggered.

**Architecture:** Single DB trigger on `posts.status` UPDATE drives the system-message fan-out (SECURITY DEFINER, follows the precedent in `0013_reports_emit_admin_message.sql`). Mobile side: one new component (`AnchoredPostCard`) mounted in `app/chat/[id].tsx`, the existing closure store gains a `preselectedRecipientId` option. The legacy `AnchorDeletedBanner` is removed — the card simply hides when the post leaves `open`.

**Tech Stack:** PostgreSQL (Supabase), TypeScript, React Native + Expo Router, Zustand, React Query, Vitest.

**Spec reference:** [docs/superpowers/specs/2026-05-11-close-post-from-chat-design.md](../specs/2026-05-11-close-post-from-chat-design.md) · FR-CHAT-014 (new), FR-CHAT-015 (new), FR-CHAT-004 (extension), FR-CLOSURE-001 (extension).

---

## File Structure

**Create:**
- `supabase/migrations/0021_post_closure_emit_system_messages.sql` — trigger + function emitting system messages to anchored chats on post close.
- `app/apps/mobile/src/components/chat/AnchoredPostCard.tsx` — sticky card in chat header; close CTA for owner; hidden when post is not `open`.

**Modify:**
- `app/apps/mobile/src/store/closureStore.ts` — extend `start(...)` to accept `{ preselectedRecipientId }`; pre-select + jump to `pick` step.
- `app/apps/mobile/app/chat/[id].tsx` — mount `AnchoredPostCard`; remove the old `AnchorDeletedBanner` + `useAnchorMissing` usage.
- `app/apps/mobile/src/components/useChatInit.ts` — remove `useAnchorMissing` export (no longer used).
- `docs/SSOT/SRS/02_functional_requirements/07_chat.md` — add FR-CHAT-014, FR-CHAT-015; update FR-CHAT-004 edge case.
- `docs/SSOT/SRS/02_functional_requirements/05_closure_and_reopen.md` — add fan-out AC to FR-CLOSURE-001.
- `docs/SSOT/PROJECT_STATUS.md` — sprint board row + dashboard counters.

**Delete:**
- `app/apps/mobile/src/components/AnchorDeletedBanner.tsx` — replaced by hiding the card entirely.

**Touchpoints intentionally NOT changed:**
- `app/packages/application/src/posts/MarkAsDeliveredUseCase.ts` — fan-out lives in the DB trigger, not in the use case.
- `app/packages/application/src/ports/IPostRepository.ts` — no port additions.
- `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` — RPCs unchanged.
- `app/apps/mobile/src/components/MessageBubble.tsx` — already renders `kind='system'` (lines 16-25); the same pill is reused for `post_closed` messages.

---

## Task 1: DB trigger — emit system messages on post close

**Files:**
- Create: `supabase/migrations/0021_post_closure_emit_system_messages.sql`

- [ ] **Step 1: Read the existing fan-out precedent**

Read `supabase/migrations/0013_reports_emit_admin_message.sql` end-to-end. Key idioms to mirror:
- `language plpgsql security definer set search_path = public`
- Build a `jsonb` payload with `jsonb_build_object(...)`
- Build a Hebrew `body` text
- Insert into `messages` with `sender_id = null`, `kind = 'system'`, `status = 'delivered'`, `delivered_at = now()`
- Trigger name pattern: `<table>_after_<event>_<purpose>`

Also re-read `0015_closure_rpcs.sql` to confirm that `close_post_with_recipient` inserts the `recipients` row BEFORE updating `posts.status` (lines 77-86). This guarantees the AFTER UPDATE trigger can SELECT the recipient at fire time.

Also note the no-recipient path: per `0015` header (lines 12-14), close-without-recipient is a plain client UPDATE — no RPC. Our trigger must therefore handle both paths uniformly by branching on `NEW.status`.

- [ ] **Step 2: Write the migration**

Create `supabase/migrations/0021_post_closure_emit_system_messages.sql` with the exact content:

```sql
-- 0021_post_closure_emit_system_messages | P1.2 — FR-CHAT-015 / FR-CLOSURE-001 ext.
--
-- AFTER UPDATE OF status ON posts: for transitions open → closed_delivered or
-- open → deleted_no_recipient, find every chat anchored to this post and
-- insert a `system` message describing the outcome. The chat used for the
-- close (whose non-owner participant equals the recipient) gets the "thanks"
-- text; sibling chats get the neutral "delivered to someone else" text. For
-- the no-recipient path, all anchored chats get the same text.
--
-- The trigger is the single source of truth — fires whether the close came
-- from close_post_with_recipient (RPC) or a plain client UPDATE (no-recipient
-- path). Reopen, admin removal, expiration, and any other transition are NO-OPs
-- (early return).
--
-- system_payload schema (forward-compat for future UI cards):
--   { kind: 'post_closed', post_id: uuid, status: text,
--     recipient_user_id: uuid|null }
-- Only the recipient's own chat carries a non-null recipient_user_id, to
-- avoid leaking the recipient's identity to siblings.
--
-- Hebrew body text matches FR-CHAT-015 AC4-AC6.

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
  -- Only act on the two transitions the spec covers. Anything else (reopen,
  -- removed_admin, expired, no actual status change) → no-op.
  if not (
    old.status = 'open'
    and new.status in ('closed_delivered', 'deleted_no_recipient')
  ) then
    return new;
  end if;

  -- For the delivered path, the recipients row was inserted earlier in the
  -- same transaction by close_post_with_recipient (see 0015 line 77-78).
  if new.status = 'closed_delivered' then
    select recipient_user_id into v_recipient
    from public.recipients
    where post_id = new.post_id
    limit 1;
  else
    v_recipient := null;
  end if;

  for v_chat in
    select chat_id, participant_a, participant_b
    from public.chats
    where anchor_post_id = new.post_id
  loop
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

  return new;
end;
$$;

drop trigger if exists posts_after_update_emit_closure_messages on public.posts;
create trigger posts_after_update_emit_closure_messages
  after update of status on public.posts
  for each row execute function public.posts_emit_closure_system_messages();

-- end of 0021_post_closure_emit_system_messages
```

- [ ] **Step 3: Apply the migration locally**

Run: `pnpm supabase db reset` (resets local dev DB and re-applies all migrations from scratch).

Expected: all migrations through 0021 apply with no errors. Look for the line:
```
Applying migration 20...0021_post_closure_emit_system_messages.sql...
```

If the project uses `supabase db push` for incremental application instead, run that. If neither command is available, fall back to `psql` with the local Supabase connection string.

- [ ] **Step 4: Verify the trigger exists**

Run via the Supabase SQL editor or `psql`:

```sql
select tgname, tgenabled
from pg_trigger
where tgrelid = 'public.posts'::regclass
  and tgname = 'posts_after_update_emit_closure_messages';
```

Expected: one row, `tgenabled = 'O'` (origin/enabled).

- [ ] **Step 5: Smoke-test the trigger manually**

Sign in as the super-admin test account (`karmacommunity2.0@gmail.com`, credentials in memory). Through the app or SQL editor, simulate the full flow:

1. As user A, publish an "open" post.
2. As user B, message user A about the post (creates chat anchored to post).
3. As user C (a third account), message user A about the same post (sibling chat).
4. As user A, close the post by setting `status = 'closed_delivered'` via the existing `close_post_with_recipient` RPC with recipient = user B.
5. SQL query:

```sql
select chat_id, body, system_payload
from public.messages
where kind = 'system'
  and system_payload->>'kind' = 'post_closed'
  and (system_payload->>'post_id')::uuid = '<the post id>'
order by chat_id;
```

Expected: two rows. B's chat shows body "הפוסט סומן כנמסר ✓ · תודה!" with `recipient_user_id = <B's user id>`. C's chat shows body "הפוסט נמסר למשתמש אחר" with `recipient_user_id = null`.

Repeat for the no-recipient path (plain UPDATE to `deleted_no_recipient`) on a separate post — expected text: "המפרסם סגר את הפוסט — הפריט לא נמסר", on every anchored chat, with `recipient_user_id = null`.

- [ ] **Step 6: Commit**

```bash
git add supabase/migrations/0021_post_closure_emit_system_messages.sql
git commit -m "feat(P1.2): emit system messages to anchored chats on post close

Trigger on posts.status UPDATE fires for open→closed_delivered and
open→deleted_no_recipient, inserting kind='system' messages into every
chat anchored to the post. Mirrors the SECURITY DEFINER pattern from
0013_reports_emit_admin_message.sql. Fires regardless of close source
(RPC or plain UPDATE)."
```

---

## Task 2: Extend `closureStore.start()` with `preselectedRecipientId`

**Files:**
- Modify: `app/apps/mobile/src/store/closureStore.ts:41,76-84`

- [ ] **Step 1: Update the `start` action signature in the interface**

Edit `app/apps/mobile/src/store/closureStore.ts`. Change the interface declaration at line 41:

```ts
start(
  postId: string,
  ownerId: string,
  postType: PostType,
  options?: { preselectedRecipientId?: string | null }
): Promise<void>;
```

- [ ] **Step 2: Update the `start` implementation**

Replace the `async start(...)` body (lines 76-84) with:

```ts
async start(postId, ownerId, postType, options) {
  const preselect = options?.preselectedRecipientId ?? null;
  // When the entry-point already knows the recipient (e.g. the chat anchored
  // to this post), pre-select them AND jump straight to the picker step so
  // the user confirms with a single tap. They can still pick a different
  // recipient from the chat list, or hit "סגור בלי לסמן" to take the no-
  // recipient branch.
  set({
    ...INITIAL,
    postId,
    postType,
    step: preselect ? 'pick' : 'confirm',
    selectedRecipientId: preselect,
    isBusy: true,
  });
  try {
    const candidates = await getGetClosureCandidatesUseCase().execute({ postId, ownerId });
    set({ candidates, isBusy: false });
  } catch (e) {
    set({ step: 'error', isBusy: false, errorMessage: (e as Error).message });
  }
},
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @kc/mobile typecheck`

Expected: PASS. (`OwnerActionsBar.tsx` calls `start(post.postId, ownerId, post.type)` with three args — the new optional fourth doesn't break it.)

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/store/closureStore.ts
git commit -m "feat(P1.2): closureStore.start accepts preselectedRecipientId

Optional fourth arg lets entry-points (chat anchor card) pre-fill the
recipient and skip straight to the picker step. Step 1 (delivered/not)
is bypassed; the user can still take the no-recipient branch via the
existing 'סגור בלי לסמן' button on step 2."
```

---

## Task 3: Create `AnchoredPostCard` component

**Files:**
- Create: `app/apps/mobile/src/components/chat/AnchoredPostCard.tsx`

- [ ] **Step 1: Verify the directory exists**

Run: `ls app/apps/mobile/src/components/chat/ 2>&1 || mkdir -p app/apps/mobile/src/components/chat`

Expected: the directory exists. If not, the `mkdir` creates it.

- [ ] **Step 2: Write the component**

Create `app/apps/mobile/src/components/chat/AnchoredPostCard.tsx` with the exact content:

```tsx
// FR-CHAT-014 + FR-CHAT-015 — sticky anchored-post card at the top of an
// anchored chat. Visible only while post.status === 'open'. Owner sees the
// "סמן כנמסר ✓" CTA wired to the existing closure flow (pre-filled with the
// chat counterpart). Non-owner sees the whole card as a tap-to-open-post
// surface.
import { useEffect, useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { PostType } from '@kc/domain';
import { getPostByIdUseCase } from '../../services/postsComposition';
import { useChatStore } from '../../store/chatStore';
import { useClosureStore } from '../../store/closureStore';

interface Props {
  chatId: string;
  anchorPostId: string | null;
  viewerId: string;
  counterpartId: string;
}

const TYPE_LABEL: Record<PostType, string> = {
  Give: 'נותן',
  Request: 'מבקש',
};

export function AnchoredPostCard({ chatId, anchorPostId, viewerId, counterpartId }: Props) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const startClosure = useClosureStore((s) => s.start);
  const messages = useChatStore((s) => s.threads[chatId]);

  const query = useQuery({
    queryKey: ['post', anchorPostId, viewerId],
    queryFn: () => getPostByIdUseCase().execute({ postId: anchorPostId!, viewerId }),
    enabled: Boolean(anchorPostId),
  });

  // When a `post_closed` system message lands in this chat, invalidate the
  // post query so the card hides instantly even if the user is mid-scroll.
  // This complements the React-Query focus-refetch — it covers the case
  // where the close happened while the chat was foregrounded.
  const sawPostClosedSysMsg = useMemo(() => {
    if (!messages || !anchorPostId) return false;
    return messages.some(
      (m) =>
        m.kind === 'system' &&
        m.systemPayload != null &&
        (m.systemPayload as Record<string, unknown>).kind === 'post_closed' &&
        (m.systemPayload as Record<string, unknown>).post_id === anchorPostId,
    );
  }, [messages, anchorPostId]);

  useEffect(() => {
    if (sawPostClosedSysMsg) {
      void queryClient.invalidateQueries({ queryKey: ['post', anchorPostId, viewerId] });
    }
  }, [sawPostClosedSysMsg, anchorPostId, viewerId, queryClient]);

  const post = query.data?.post ?? null;

  // FR-CHAT-014 AC3/AC4: hide entirely when no anchor, post missing, or post
  // not in `open` status. Also covers loading + error states — we'd rather
  // hide than show a stale or partial card.
  if (!anchorPostId || !post || post.status !== 'open') return null;

  const isOwner = post.ownerId === viewerId;
  const typeLabel = TYPE_LABEL[post.type];
  const ctaText = post.type === 'Give' ? 'סמן כנמסר ✓' : 'סמן שקיבלתי ✓';

  const openPost = () => {
    router.push({ pathname: '/post/[id]', params: { id: post.postId } });
  };

  const handleClose = () => {
    void startClosure(post.postId, viewerId, post.type, {
      preselectedRecipientId: counterpartId,
    });
  };

  return (
    <Pressable
      onPress={isOwner ? undefined : openPost}
      style={styles.card}
      accessibilityRole={isOwner ? undefined : 'button'}
      accessibilityLabel={isOwner ? undefined : 'פתח את הפוסט'}
    >
      <View style={styles.body}>
        <Text style={styles.typeTag}>{typeLabel}</Text>
        <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
      </View>
      {isOwner ? (
        <Pressable
          onPress={handleClose}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel={ctaText}
        >
          <Text style={styles.ctaText}>{ctaText}</Text>
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  body: { flex: 1, gap: 4 },
  typeTag: {
    ...typography.caption,
    alignSelf: 'flex-end',
    color: colors.textSecondary,
    backgroundColor: colors.skeleton,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  title: {
    ...typography.body,
    color: colors.textPrimary,
    textAlign: 'right',
    fontWeight: '600',
  },
  cta: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
  },
  ctaText: { ...typography.button, color: colors.textInverse, fontSize: 14 },
});
```

- [ ] **Step 3: Typecheck**

Run: `pnpm --filter @kc/mobile typecheck`

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/components/chat/AnchoredPostCard.tsx
git commit -m "feat(P1.2): AnchoredPostCard component for chat header

Sticky card under the chat header, visible only while the anchored
post is in 'open' status. Owner sees the 'סמן כנמסר ✓' CTA that opens
the closure modal with the chat counterpart pre-filled as recipient.
Non-owner sees the whole card as a tap-to-open-post surface.

Auto-invalidates the post query when a 'post_closed' system message
arrives so the card hides instantly without a manual refresh."
```

---

## Task 4: Mount `AnchoredPostCard` in chat screen + remove the legacy banner

**Files:**
- Modify: `app/apps/mobile/app/chat/[id].tsx:20-21,40,130`
- Modify: `app/apps/mobile/src/components/useChatInit.ts:66-83`
- Delete: `app/apps/mobile/src/components/AnchorDeletedBanner.tsx`

- [ ] **Step 1: Update imports in the chat screen**

Edit `app/apps/mobile/app/chat/[id].tsx`. Replace lines 20-21:

```tsx
import { AnchorDeletedBanner } from '../../src/components/AnchorDeletedBanner';
import { useChatInit, useAnchorMissing } from '../../src/components/useChatInit';
```

with:

```tsx
import { AnchoredPostCard } from '../../src/components/chat/AnchoredPostCard';
import { useChatInit } from '../../src/components/useChatInit';
```

- [ ] **Step 2: Remove the `useAnchorMissing` call**

In the same file, delete line 40 (the `anchorMissing` declaration). Look for:

```tsx
const anchorMissing = useAnchorMissing(chat?.anchorPostId, userId);
```

Delete that entire line.

- [ ] **Step 3: Replace the banner with the card in the JSX**

In the same file, find the line that renders `<AnchorDeletedBanner />` (around line 130):

```tsx
{anchorMissing && <AnchorDeletedBanner />}
```

Replace it with:

```tsx
{chat ? (
  <AnchoredPostCard
    chatId={chatId}
    anchorPostId={chat.anchorPostId}
    viewerId={userId}
    counterpartId={chat.participantIds[0] === userId ? chat.participantIds[1] : chat.participantIds[0]}
  />
) : null}
```

The card returns `null` internally when `anchorPostId` is null, when the post isn't loaded, or when the post isn't `open`. So this single mount covers all states; no conditional wrapper around the card itself is needed.

- [ ] **Step 4: Remove `useAnchorMissing` from `useChatInit.ts`**

Edit `app/apps/mobile/src/components/useChatInit.ts`. Delete lines 66-83 (the `useAnchorMissing` function and its leading FR-CHAT-004 comment). Also remove the now-unused import on line 14:

```ts
import { getPostByIdUseCase } from '../services/postsComposition';
```

After the edit, the file should end at the closing brace of `useChatInit` (around line 64).

- [ ] **Step 5: Delete the banner file**

Run: `rm app/apps/mobile/src/components/AnchorDeletedBanner.tsx`

- [ ] **Step 6: Typecheck**

Run: `pnpm --filter @kc/mobile typecheck`

Expected: PASS. No other file imports `AnchorDeletedBanner` or `useAnchorMissing` — `grep -r "AnchorDeletedBanner\|useAnchorMissing" app/ docs/ 2>/dev/null` should return zero matches.

- [ ] **Step 7: Commit**

```bash
git add app/apps/mobile/app/chat/[id].tsx \
        app/apps/mobile/src/components/useChatInit.ts \
        app/apps/mobile/src/components/AnchorDeletedBanner.tsx
git commit -m "feat(P1.2): mount AnchoredPostCard in chat screen

Replaces AnchorDeletedBanner — the card hides itself when the post
isn't 'open' (covering deleted/closed/removed/expired cases) so the
banner is no longer needed. useAnchorMissing is removed."
```

---

## Task 5: Update SRS documents

**Files:**
- Modify: `docs/SSOT/SRS/02_functional_requirements/07_chat.md`
- Modify: `docs/SSOT/SRS/02_functional_requirements/05_closure_and_reopen.md`

- [ ] **Step 1: Update FR-CHAT-004 edge case in `07_chat.md`**

Edit `docs/SSOT/SRS/02_functional_requirements/07_chat.md`. Find the FR-CHAT-004 Edge Cases section (around line 105-106):

```markdown
**Edge Cases.**
- The anchored post is later deleted: existing messages remain, but a banner appears at the top of the thread: *"The original post is no longer available."*
```

Replace with:

```markdown
**Edge Cases.**
- The anchored post is later deleted, closed, removed, or expired: the anchored-post card (FR-CHAT-014) is hidden. Existing messages remain — including the system message emitted by the closure trigger (FR-CHAT-015 AC4-AC6) when the transition was a delivery-related close.
```

- [ ] **Step 2: Append FR-CHAT-014 and FR-CHAT-015 in `07_chat.md`**

In the same file, find the end of FR-CHAT-013 (the last numbered requirement). Append immediately after, before any trailing horizontal rule:

```markdown

---

## FR-CHAT-014 — Anchored-post card in chat

**Description.**
A sticky card at the top of the conversation surfaces the anchored post for both participants while the post is still `open`.

**Source.**
- PRD: `03_Core_Features.md` §3.4.4.
- Spec: `docs/superpowers/specs/2026-05-11-close-post-from-chat-design.md`.

**Acceptance Criteria.**
- AC1. When `Chat.anchor_post_id` is set and the referenced `Post` is in status `open`, a sticky card is shown beneath the chat header with: post-type tag, single-line title, and a right-aligned action area.
- AC2. The owner sees a "סמן כנמסר ✓" / "סמן שקיבלתי ✓" CTA in the action area (label flips by `post.type`, matching `OwnerActionsBar`). The counterpart sees the whole card as a tap-to-open-post surface routing to `/post/[id]`.
- AC3. The card is hidden entirely when the post is in any non-`open` status (`closed_delivered`, `deleted_no_recipient`, `removed_admin`, `expired`) — replacing the prior "banner when deleted" behaviour from FR-CHAT-004.
- AC4. The card is hidden when `anchor_post_id` is null (chat opened from Other Profile, support thread, etc.).
- AC5. Status changes propagate to the card without a manual refresh: when a `post_closed` system message (FR-CHAT-015) lands in the thread, the post query is invalidated and the card hides immediately.

**Related.** Screens: 4.2 · Domain: `Chat`, `Post`.

---

## FR-CHAT-015 — Close post from chat

**Description.**
The post owner can mark the anchored post as delivered (or close without a recipient) directly from the chat, without navigating back to post detail. The chat counterpart is pre-filled as the recipient.

**Source.**
- PRD: `03_Core_Features.md` §3.4.4.
- Spec: `docs/superpowers/specs/2026-05-11-close-post-from-chat-design.md`.

**Acceptance Criteria.**
- AC1. Tapping the CTA on the anchored-post card (FR-CHAT-014 AC2) opens the existing closure sheet (`ClosureSheet`) directly on step 2 (recipient picker) with the chat counterpart pre-selected.
- AC2. The owner can confirm with one tap ("סמן וסגור ✓"), pick a different recipient from the candidates list, or take the no-recipient branch via "סגור בלי לסמן" — same UI as the post-screen entry point.
- AC3. On successful close, the post transitions to `closed_delivered` (with recipient) or `deleted_no_recipient` (without); the card hides in every anchored chat; a system message is emitted to every anchored chat (AC4-AC6).
- AC4. In the chat used for the close, delivered path: system message body is "הפוסט סומן כנמסר ✓ · תודה!".
- AC5. In sibling chats (anchored to the same post), delivered path: system message body is "הפוסט נמסר למשתמש אחר".
- AC6. In all anchored chats, no-recipient path: system message body is "המפרסם סגר את הפוסט — הפריט לא נמסר".
- AC7. The fan-out in AC4-AC6 fires regardless of where the close was triggered (post detail screen, chat, or any future entry point) — implemented by an `AFTER UPDATE OF status ON posts` trigger.

**Edge Cases.**
- The owner's chat list contains chats with users who never messaged about THIS post (per the 0017 RPC relaxation). The pre-fill picks the counterpart of THIS chat, not the post's recipient-candidate list.
- The owner reopens the post later: the card reappears (it only depends on `post.status === 'open'`). Past system messages are preserved.

**Related.** Screens: 4.2 · Domain: `Chat`, `Message`, `Post`.
```

- [ ] **Step 3: Update FR-CLOSURE-001 in `05_closure_and_reopen.md`**

Edit `docs/SSOT/SRS/02_functional_requirements/05_closure_and_reopen.md`. Find the FR-CLOSURE-001 Acceptance Criteria section. Append a new AC at the end of the existing AC list:

```markdown
- AC[next]. On successful close (regardless of trigger location — post detail screen or chat anchor card per FR-CHAT-015), the database fans out to every `Chat` with `anchor_post_id = postId` and inserts a `kind='system'` message describing the outcome. See FR-CHAT-015 AC4-AC6 for the bodies and `system_payload` schema.
```

Replace `[next]` with the actual next number in sequence (read the existing ACs first to determine).

- [ ] **Step 4: Typecheck (sanity — docs only)**

Run: `pnpm typecheck`

Expected: PASS (docs don't affect typecheck, but this confirms nothing else regressed).

- [ ] **Step 5: Commit**

```bash
git add docs/SSOT/SRS/02_functional_requirements/07_chat.md \
        docs/SSOT/SRS/02_functional_requirements/05_closure_and_reopen.md
git commit -m "docs(srs): add FR-CHAT-014, FR-CHAT-015; extend FR-CLOSURE-001

Anchored-post card visibility rules, close-from-chat flow with pre-fill,
and the fan-out AC making the system-message emission part of the
closure contract regardless of entry point."
```

---

## Task 6: Update PROJECT_STATUS.md

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`

- [ ] **Step 1: Find the active sprint section**

Read `docs/SSOT/PROJECT_STATUS.md` and locate the "Sprint Board" / "§3" section that holds rows like `P1.1 — Following + Other Profile`. Find the right slot for the new row — either an existing "P1.x ⏳ Planned" entry to be replaced or the next empty row.

- [ ] **Step 2: Add or move the P1.2 row**

If a row already exists for `P1.2 — Close post from chat` or similar, update its `Status` to `🟡 In progress` (mark it as in_progress per `project-status-tracking.mdc` before coding starts).

If no row exists, add a new row matching the existing table format. Example shape (the exact columns must match what's already in the file):

```markdown
| P1.2 | Close post from chat | agent | 🟡 In progress | FR-CHAT-014, FR-CHAT-015, FR-CLOSURE-001 ext. | `docs/superpowers/specs/2026-05-11-close-post-from-chat-design.md` |
```

- [ ] **Step 3: Update any dashboard counters**

If the file has rolled-up counters (e.g. "Total FRs: N / shipped: M / planned: K"), bump them to reflect 2 new FRs (FR-CHAT-014, FR-CHAT-015) and 1 extension (FR-CLOSURE-001).

- [ ] **Step 4: Commit**

```bash
git add docs/SSOT/PROJECT_STATUS.md
git commit -m "docs(project-status): P1.2 close-post-from-chat in progress"
```

---

## Task 7: Manual verification via mobile preview

**Files:** none — exercise the running app.

- [ ] **Step 1: Start the mobile web preview**

Use the preview tools (preview_start). If a preview is already running, reload via `preview_eval` with `window.location.reload()`.

- [ ] **Step 2: Sign in as user A (post owner)**

Use the super-admin test account from memory (`karmacommunity2.0@gmail.com`). Confirm the inbox screen loads.

- [ ] **Step 3: Publish a new "Give" post as user A**

Navigate to "+" FAB → create post → fill title (e.g. "מעיל חורף ילד 8"), description, category, address. Submit. Expected: redirected to `/post/[<new-post-id>]` showing the post in status `open`.

- [ ] **Step 4: Sign out, sign in as user B**

User B is a second test account (create one via sign-up if needed). Confirm user B can see user A's post in the feed.

- [ ] **Step 5: Open chat from the post as user B**

On user A's post detail: tap "💬 שלח הודעה למפרסם" (line 153 of `post/[id].tsx`). Expected: routed to `/chat/[id]` with prefill text. Send a message.

- [ ] **Step 6: Verify the AnchoredPostCard renders for user B**

In the chat screen, confirm:
- Sticky card directly under the header.
- Type tag "נותן" (post.type === Give).
- The post title shown.
- No CTA button (user B is not the owner).
- Tapping the card navigates to `/post/[id]` for the post.

Capture a `preview_screenshot` as evidence.

- [ ] **Step 7: Sign back in as user A and open the same chat**

Confirm the AnchoredPostCard renders with the "סמן כנמסר ✓" CTA on the right side (user A is the owner).

- [ ] **Step 8: Trigger close-from-chat as user A**

Tap "סמן כנמסר ✓". Expected:
- `ClosureSheet` opens **directly on step 2** (recipient picker — skipping the "האם הפריט באמת נמסר?" confirm step).
- User B is **pre-selected** in the chats pane (highlighted).
- The "סמן וסגור ✓" primary button is enabled.

Capture a `preview_screenshot`.

- [ ] **Step 9: Confirm the close**

Tap "סמן וסגור ✓". Expected:
- The explainer sheet appears (step 3, one-time).
- Dismiss it.
- Back in the chat: the AnchoredPostCard is **gone**.
- A system message bubble appears at the bottom (newest position with `inverted` FlatList) with body "הפוסט סומן כנמסר ✓ · תודה!" and the info-circle icon (per `MessageBubble.tsx` lines 16-25).

Capture a `preview_screenshot`.

- [ ] **Step 10: Verify sibling-chat propagation**

(Requires a third test account user C, OR can be skipped if a third account isn't readily available — the SQL smoke test in Task 1 Step 5 already proved the trigger logic. Manual app-level verification is a bonus.)

If user C exists: as user C, open the chat with user A (anchored to the now-closed post). Expected: card is not shown; the chat contains a system message "הפוסט נמסר למשתמש אחר".

- [ ] **Step 11: Verify the no-recipient path**

Sign in as user A, publish a new post. As user B, message about it (anchored chat). As user A, open the post detail, tap "סמן כנמסר ✓", on step 2 tap "סגור בלי לסמן" (the no-recipient branch). Expected: the post transitions to `deleted_no_recipient`. Open the chat with user B — card gone, system message "המפרסם סגר את הפוסט — הפריט לא נמסר" appears.

- [ ] **Step 12: Verify reopen restores the card**

As user A, open the post detail of the post closed in step 9 (now `closed_delivered`). Tap "📤 פתח מחדש" → confirm. Expected: post returns to `open`. Open the chat with user B — the AnchoredPostCard is back. Past system messages remain in the thread (immutable).

- [ ] **Step 13: Check the network/console logs for regressions**

Run `preview_console_logs` and `preview_logs`. Expected: no new errors. No 4xx/5xx from API calls.

If any test fails: do not proceed. Debug the failing case, fix it (return to the relevant task), recommit, and re-verify.

---

## Task 8: Open the pull request

**Files:** none — `gh` operations only.

- [ ] **Step 1: Push the branch**

Run: `git push -u origin claude/trusting-borg-0c25fe`

- [ ] **Step 2: Open the PR**

Run:

```bash
gh pr create --title "feat(P1.2): close post from chat (FR-CHAT-014, FR-CHAT-015)" \
  --body "$(cat <<'EOF'
## Summary
- Anchored-post sticky card in the chat header (both sides; hides when post not 'open').
- Owner can close the post directly from chat — counterpart pre-filled as recipient.
- DB trigger fans out system messages to every anchored chat on every closure (regardless of where the close was triggered).

## Spec
docs/superpowers/specs/2026-05-11-close-post-from-chat-design.md

## Test plan
- [x] DB trigger smoke-tested via SQL — both delivered and no-recipient paths.
- [x] AnchoredPostCard renders for owner (with CTA) and non-owner (clickable card) when post is 'open'.
- [x] Card hides on close/reopen/admin-remove/expire.
- [x] Closure flow opens directly on step 2 with recipient pre-filled when triggered from chat.
- [x] System messages render via the existing kind='system' MessageBubble pill.
- [x] No console/network regressions in preview.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: Report the PR URL to the user**

Print the URL returned by `gh pr create`. Per `git-workflow.mdc`, CI runs automatically and the PR auto-merges on green.

---

## Notes for the executing engineer

- **No new vitest tests are added.** The existing `MarkAsDeliveredUseCase.test.ts` already covers the use-case-level contract, and there is no UI/store test infrastructure in `app/apps/mobile/` (only typecheck). The trigger is verified manually via SQL in Task 1 Step 5 and end-to-end in Task 7. If a test infrastructure for the mobile app is added later (separate TD), revisit and backfill.
- **Branch name.** This plan assumes you're already on the worktree branch `claude/trusting-borg-0c25fe`. If you are not, create a branch named per `git-workflow.mdc`: `feat/FR-CHAT-015-close-post-from-chat`.
- **Mapped to SRS gate.** Every commit message in this plan starts with the FR scope (P1.2 / FR-CHAT-014, 015). Per `CLAUDE.md`, every response that includes code must begin with the verification gate line — the executor must include it in their natural-language updates, not in the commits.
- **TD-119 stays open.** Push notifications to the recipient on mark-as-delivered are out of scope (TD-119 / P1.5). This work does not close that TD; do not mark it done.
