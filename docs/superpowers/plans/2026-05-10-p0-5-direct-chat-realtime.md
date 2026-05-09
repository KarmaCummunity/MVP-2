# P0.5 — Direct Chat with Realtime — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the mock-backed Inbox + Conversation screens with real-time chat over Supabase Realtime, satisfying FR-CHAT-001..013 (full scope band D from the design spec).

**Architecture:** Two-port split — `IChatRepository` (one-shot CRUD) + `IChatRealtime` (subscriptions). Use cases stay pure; subscription lifecycle is owned by a Zustand `chatStore`. Two new migrations seed the super-admin trigger and add three RPCs. Auxiliary minimal additions: `IBlockRepository`, `IReportRepository`, `IUserRepository.findByHandle`.

**Tech Stack:** TypeScript, pnpm + turbo monorepo, Supabase JS v2 (Auth + Postgres + Realtime), Zustand, Expo + React Native + expo-router. Tests via Vitest with hand-written fake repositories.

**Spec:** `docs/superpowers/specs/2026-05-10-p0-5-direct-chat-realtime-design.md`. Read the spec first.

**Branch:** `feat/FR-CHAT-001-chat-realtime` (already created; spec is committed at `45bfc3d`).

---

## File structure

```
app/packages/domain/src/
  entities.ts                          MOD  + Message, Chat, Block, ReportSubmission, related types
  invariants.ts                        MOD  + MESSAGE_MAX_LENGTH, REPORT_NOTE_MAX_LENGTH
  index.ts                             MOD  re-exports

app/packages/application/src/
  ports/
    IChatRepository.ts                 MOD  extend (drop superAdminId; add getUnreadTotal, getCounterpart)
    IChatRealtime.ts                   NEW
    IBlockRepository.ts                NEW
    IReportRepository.ts               NEW
    IUserRepository.ts                 MOD  + findByHandle
  chat/
    errors.ts                          NEW  ChatError + ChatErrorCode
    BuildAutoMessageUseCase.ts         NEW  pure
    SendMessageUseCase.ts              NEW
    OpenOrCreateChatUseCase.ts         NEW
    ListChatsUseCase.ts                NEW
    MarkChatReadUseCase.ts             NEW
    GetUnreadTotalUseCase.ts           NEW
    GetSupportThreadUseCase.ts         NEW
    __tests__/fakeChatRepository.ts    NEW
    __tests__/SendMessageUseCase.test.ts            NEW
    __tests__/OpenOrCreateChatUseCase.test.ts       NEW
    __tests__/BuildAutoMessageUseCase.test.ts       NEW
  block/
    errors.ts                          NEW
    BlockUserUseCase.ts                NEW
    UnblockUserUseCase.ts              NEW
    __tests__/fakeBlockRepository.ts   NEW
    __tests__/BlockUserUseCase.test.ts NEW
  reports/
    errors.ts                          NEW
    ReportChatUseCase.ts               NEW
  index.ts                             MOD  re-exports

supabase/migrations/
  0010_seed_super_admin.sql            NEW
  0011_chat_helpers.sql                NEW

app/packages/infrastructure-supabase/src/
  database.types.ts                    REGEN after migrations
  chat/
    SupabaseChatRepository.ts          NEW
    SupabaseChatRealtime.ts            NEW
    rowMappers.ts                      NEW  row → domain mappers
    index.ts                           NEW
  block/
    SupabaseBlockRepository.ts         NEW
    index.ts                           NEW
  reports/
    SupabaseReportRepository.ts        NEW
    index.ts                           NEW
  users/
    SupabaseUserRepository.ts          MOD  + findByHandle
  index.ts                             MOD

app/apps/mobile/
  src/store/chatStore.ts               NEW
  src/lib/container.ts                 NEW  composition root
  src/components/ChatBadge.tsx         NEW
  src/components/ReportChatModal.tsx   NEW
  app/_layout.tsx                      MOD  start inbox sub on auth
  app/(tabs)/_layout.tsx               MOD  ChatBadge in header (Home tab)
  app/chat/index.tsx                   MOD  replace MOCK_CHATS
  app/chat/[id].tsx                    MOD  replace MOCK_MESSAGES
  app/post/[id].tsx                    MOD  wire "שלח הודעה" with auto-message dedup
  app/user/[handle].tsx                NEW
  app/settings/report-issue.tsx        NEW

docs/SSOT/
  PROJECT_STATUS.md                    MOD
  TECH_DEBT.md                         MOD
  HISTORY.md                           MOD  (append entry on PR merge — last task)
```

**Repo root:** `/Users/navesarussi/KC/MVP-2`. All paths in this plan are relative to the repo root. The actual app source lives under `app/` (e.g. `app/packages/domain/...`).

---

## Phase 1 — Domain types & invariants

### Task 1: Add chat/message/block/report types to `@kc/domain`

**Files:**
- Modify: `app/packages/domain/src/entities.ts`
- Modify: `app/packages/domain/src/invariants.ts`
- Modify: `app/packages/domain/src/index.ts`

- [ ] **Step 1: Append types to `entities.ts`**

Add at the end of the file:

```ts
// ── Chat domain (FR-CHAT-001..013) ─────────────────────────────────────────
export type MessageStatus = 'pending' | 'delivered' | 'read';
export type MessageKind = 'user' | 'system';

export interface Message {
  messageId: string;
  chatId: string;
  senderId: string | null;            // null after sender hard-delete (FR-CHAT-013)
  kind: MessageKind;
  body: string | null;
  systemPayload: Record<string, unknown> | null;
  status: MessageStatus;
  createdAt: string;                  // ISO 8601
  deliveredAt: string | null;
  readAt: string | null;
}

export interface Chat {
  chatId: string;
  participantA: string;               // canonical-ordered (a < b) per migration 0004
  participantB: string;
  anchorPostId: string | null;
  isSupportThread: boolean;
  lastMessageAt: string;              // ISO 8601
  createdAt: string;
}

// ── Block (FR-MOD-009 minimal) ─────────────────────────────────────────────
export interface Block {
  blockerId: string;
  blockedId: string;
  createdAt: string;
}

// ── Report (FR-MOD-001 minimal — submission only) ──────────────────────────
export type ReportTargetType = 'post' | 'user' | 'chat' | 'none';
export type ReportReason = 'Spam' | 'Offensive' | 'Misleading' | 'Illegal' | 'Other';

export interface ReportSubmission {
  targetType: ReportTargetType;
  targetId: string | null;             // null iff targetType === 'none'
  reason: ReportReason;
  note?: string;                       // ≤ REPORT_NOTE_MAX_LENGTH
}
```

- [ ] **Step 2: Append constants to `invariants.ts`**

Add at the end:

```ts
// FR-CHAT-002 AC5
export const MESSAGE_MAX_LENGTH = 2000;

// FR-MOD-001 (DB CHECK on reports.note)
export const REPORT_NOTE_MAX_LENGTH = 500;
```

- [ ] **Step 3: Verify `index.ts` re-exports new symbols**

Open `app/packages/domain/src/index.ts`. If it uses `export *` patterns the new symbols are already exported — confirm visually. If it lists names individually, add: `Message`, `MessageStatus`, `MessageKind`, `Chat`, `Block`, `ReportTargetType`, `ReportReason`, `ReportSubmission`, `MESSAGE_MAX_LENGTH`, `REPORT_NOTE_MAX_LENGTH`.

- [ ] **Step 4: Typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```

Expected: PASS (no consumers yet — types are unused but compile).

- [ ] **Step 5: Commit**

```bash
git add app/packages/domain/src/entities.ts app/packages/domain/src/invariants.ts app/packages/domain/src/index.ts
git commit -m "feat(domain): add Chat/Message/Block/ReportSubmission types

Adds domain types for P0.5 (FR-CHAT-001..013) plus Block/ReportSubmission
contracts at the minimal scope used by FR-CHAT-009 / FR-CHAT-010. All types
mirror the DB shapes from migration 0004 / 0003 / 0005 1:1 — no shadow
'sending' state on Message; optimistic UI lives in chatStore.

MESSAGE_MAX_LENGTH=2000, REPORT_NOTE_MAX_LENGTH=500 invariants align with
the existing CHECK constraints.

Mapped to SRS: FR-CHAT-001..013, FR-MOD-001, FR-MOD-009.
Refactor logged: NA."
```

---

## Phase 2 — Ports (interfaces only)

### Task 2: Extend `IChatRepository`

**Files:**
- Modify: `app/packages/application/src/ports/IChatRepository.ts`

- [ ] **Step 1: Replace the file contents**

```ts
import type { Chat, Message } from '@kc/domain';

export interface ChatWithPreview extends Chat {
  otherParticipant: {
    userId: string | null;            // null when counterpart hard-deleted
    displayName: string;
    avatarUrl: string | null;
    isDeleted: boolean;
  };
  lastMessage: Message | null;
  unreadCount: number;
}

export interface IChatRepository {
  // Conversations
  getMyChats(userId: string): Promise<ChatWithPreview[]>;
  findOrCreateChat(
    userId: string,
    otherUserId: string,
    anchorPostId?: string,
  ): Promise<Chat>;
  findById(chatId: string): Promise<Chat | null>;

  // Messages
  getMessages(
    chatId: string,
    limit: number,
    beforeCreatedAt?: string,
  ): Promise<Message[]>;

  sendMessage(
    chatId: string,
    senderId: string,
    body: string,
  ): Promise<Message>;

  markRead(chatId: string, userId: string): Promise<void>;

  // Counters / counterpart resolution
  getUnreadTotal(userId: string): Promise<number>;
  getCounterpart(
    chat: Chat,
    viewerId: string,
  ): Promise<{
    userId: string | null;
    displayName: string;
    avatarUrl: string | null;
    isDeleted: boolean;
  }>;

  // Support thread (FR-CHAT-007)
  getOrCreateSupportThread(userId: string): Promise<Chat>;
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```

Expected: PASS — there are no production consumers of the existing port; tests would fail if any. If errors surface, they will be in test fakes that we have not written yet.

### Task 3: Create `IChatRealtime` port

**Files:**
- Create: `app/packages/application/src/ports/IChatRealtime.ts`

- [ ] **Step 1: Write the file**

```ts
import type { Chat, Message, MessageStatus } from '@kc/domain';

export interface InboxStreamCallbacks {
  onChatChanged: (chat: Chat) => void;
  onUnreadTotalChanged: (total: number) => void;
}

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
  onError: (err: Error) => void;
}

export type Unsubscribe = () => void;

export interface IChatRealtime {
  subscribeToInbox(userId: string, cb: InboxStreamCallbacks): Unsubscribe;
  subscribeToChat(chatId: string, cb: ChatStreamCallbacks): Unsubscribe;
}
```

### Task 4: Create `IBlockRepository` port

**Files:**
- Create: `app/packages/application/src/ports/IBlockRepository.ts`

- [ ] **Step 1: Write the file**

```ts
export interface IBlockRepository {
  block(blockerId: string, blockedId: string): Promise<void>;
  unblock(blockerId: string, blockedId: string): Promise<void>;
  isBlockedByMe(viewerId: string, otherId: string): Promise<boolean>;
}
```

### Task 5: Create `IReportRepository` port

**Files:**
- Create: `app/packages/application/src/ports/IReportRepository.ts`

- [ ] **Step 1: Write the file**

```ts
import type { ReportSubmission } from '@kc/domain';

export interface IReportRepository {
  submit(reporterId: string, input: ReportSubmission): Promise<void>;
}
```

### Task 6: Add `findByHandle` to `IUserRepository`

**Files:**
- Modify: `app/packages/application/src/ports/IUserRepository.ts`

- [ ] **Step 1: Inspect the existing interface**

```bash
cat /Users/navesarussi/KC/MVP-2/app/packages/application/src/ports/IUserRepository.ts
```

- [ ] **Step 2: Add the method to the `IUserRepository` interface**

Insert into the interface (location: after the existing `findById` method, or alphabetically — match the file's style):

```ts
  /** FR-CHAT-006 — resolve a user by their public handle. Returns null when not found. */
  findByHandle(handle: string): Promise<User | null>;
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```

Expected: FAIL on `SupabaseUserRepository` (does not yet implement `findByHandle`). This is expected — Task 26 will fix it. **Continue past the failure for now.** Confirm the only error is the missing implementation.

### Task 7: Update `@kc/application` index re-exports

**Files:**
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Inspect existing exports**

```bash
cat /Users/navesarussi/KC/MVP-2/app/packages/application/src/index.ts
```

- [ ] **Step 2: Add re-exports for new ports**

Append to the section that re-exports ports:

```ts
export type { IChatRealtime, InboxStreamCallbacks, ChatStreamCallbacks, Unsubscribe } from './ports/IChatRealtime';
export type { IBlockRepository } from './ports/IBlockRepository';
export type { IReportRepository } from './ports/IReportRepository';
```

The existing `IChatRepository` re-export (if present) does not need changes.

- [ ] **Step 3: Commit Phase 2**

```bash
git add app/packages/application/src/ports/ app/packages/application/src/index.ts
git commit -m "feat(application,contract): chat/realtime/block/report ports

Extends IChatRepository (drops superAdminId from getOrCreateSupportThread,
adds getUnreadTotal + getCounterpart). New ports IChatRealtime (subscriptions
returning Unsubscribe), IBlockRepository, IReportRepository. IUserRepository
gains findByHandle for FR-CHAT-006. Adapter implementations follow.

Mapped to SRS: FR-CHAT-001..013, FR-MOD-001, FR-MOD-009.
Refactor logged: NA."
```

Typecheck will fail at this commit on `SupabaseUserRepository`. The commit captures the contract change atomically — adapter follows in Phase 5.

---

## Phase 3 — Use cases (TDD where applicable)

### Task 8: Create `chat/errors.ts`

**Files:**
- Create: `app/packages/application/src/chat/errors.ts`

- [ ] **Step 1: Write the file (mirror `posts/errors.ts` shape)**

```ts
// Chat orchestration errors. Mirrors posts/errors.ts.
// Mapped to SRS: FR-CHAT-002, FR-CHAT-003, FR-CHAT-007.

export type ChatErrorCode =
  | 'message_body_required'
  | 'message_too_long'
  | 'chat_not_found'
  | 'chat_forbidden'
  | 'send_to_deleted_user'
  | 'super_admin_not_found'
  | 'unknown';

export class ChatError extends Error {
  readonly code: ChatErrorCode;
  readonly cause?: unknown;

  constructor(code: ChatErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ChatError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, ChatError.prototype);
  }
}
```

### Task 9: `BuildAutoMessageUseCase` (pure — TDD)

**Files:**
- Create: `app/packages/application/src/chat/BuildAutoMessageUseCase.ts`
- Create: `app/packages/application/src/chat/__tests__/BuildAutoMessageUseCase.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
// app/packages/application/src/chat/__tests__/BuildAutoMessageUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { BuildAutoMessageUseCase } from '../BuildAutoMessageUseCase';

describe('BuildAutoMessageUseCase', () => {
  const uc = new BuildAutoMessageUseCase();

  it('renders the Hebrew template with the post title', () => {
    expect(uc.execute({ postTitle: 'ספה תלת מושבית' })).toBe(
      'היי! ראיתי את הפוסט שלך על ספה תלת מושבית. אשמח לדעת עוד.',
    );
  });

  it('trims whitespace around the title', () => {
    expect(uc.execute({ postTitle: '  כיסא משרדי  ' })).toBe(
      'היי! ראיתי את הפוסט שלך על כיסא משרדי. אשמח לדעת עוד.',
    );
  });
});
```

- [ ] **Step 2: Run test — verify it fails**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test -- BuildAutoMessageUseCase
```

Expected: FAIL — `Cannot find module '../BuildAutoMessageUseCase'`.

- [ ] **Step 3: Implement**

```ts
// app/packages/application/src/chat/BuildAutoMessageUseCase.ts
/** FR-CHAT-005 AC1 — render the auto-message for a post-anchored chat entry. */
export interface BuildAutoMessageInput {
  postTitle: string;
}

export class BuildAutoMessageUseCase {
  execute(input: BuildAutoMessageInput): string {
    const title = input.postTitle.trim();
    return `היי! ראיתי את הפוסט שלך על ${title}. אשמח לדעת עוד.`;
  }
}
```

- [ ] **Step 4: Run test — verify it passes**

```bash
pnpm --filter @kc/application test -- BuildAutoMessageUseCase
```

Expected: PASS, 2 tests.

### Task 10: Create `fakeChatRepository.ts` for use-case tests

**Files:**
- Create: `app/packages/application/src/chat/__tests__/fakeChatRepository.ts`

- [ ] **Step 1: Write the fake**

```ts
// Hand-written fake for IChatRepository — mirrors fakePostRepository.ts pattern.
import type { Chat, Message } from '@kc/domain';
import type { IChatRepository, ChatWithPreview } from '../../ports/IChatRepository';

export class FakeChatRepository implements IChatRepository {
  chats: Chat[] = [];
  messages: Message[] = [];
  unread: Record<string, number> = {};
  sendCallCount = 0;

  async getMyChats(userId: string): Promise<ChatWithPreview[]> {
    return this.chats
      .filter((c) => c.participantA === userId || c.participantB === userId)
      .map((c) => ({
        ...c,
        otherParticipant: { userId: 'other', displayName: 'other', avatarUrl: null, isDeleted: false },
        lastMessage: this.messages.filter((m) => m.chatId === c.chatId).at(-1) ?? null,
        unreadCount: this.unread[c.chatId] ?? 0,
      }));
  }

  async findOrCreateChat(userId: string, otherUserId: string, anchorPostId?: string): Promise<Chat> {
    const [a, b] = [userId, otherUserId].sort();
    const existing = this.chats.find((c) => c.participantA === a && c.participantB === b);
    if (existing) return existing;
    const chat: Chat = {
      chatId: `chat-${this.chats.length + 1}`,
      participantA: a,
      participantB: b,
      anchorPostId: anchorPostId ?? null,
      isSupportThread: false,
      lastMessageAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };
    this.chats.push(chat);
    return chat;
  }

  async findById(chatId: string): Promise<Chat | null> {
    return this.chats.find((c) => c.chatId === chatId) ?? null;
  }

  async getMessages(chatId: string, limit: number): Promise<Message[]> {
    return this.messages
      .filter((m) => m.chatId === chatId)
      .slice(-limit)
      .reverse();
  }

  async sendMessage(chatId: string, senderId: string, body: string): Promise<Message> {
    this.sendCallCount += 1;
    const msg: Message = {
      messageId: `msg-${this.messages.length + 1}`,
      chatId,
      senderId,
      kind: 'user',
      body,
      systemPayload: null,
      status: 'pending',
      createdAt: new Date().toISOString(),
      deliveredAt: null,
      readAt: null,
    };
    this.messages.push(msg);
    return msg;
  }

  async markRead(chatId: string, _userId: string): Promise<void> {
    this.unread[chatId] = 0;
  }

  async getUnreadTotal(_userId: string): Promise<number> {
    return Object.values(this.unread).reduce((a, b) => a + b, 0);
  }

  async getCounterpart(chat: Chat, viewerId: string) {
    const other = chat.participantA === viewerId ? chat.participantB : chat.participantA;
    return { userId: other, displayName: 'fake', avatarUrl: null, isDeleted: false };
  }

  async getOrCreateSupportThread(userId: string): Promise<Chat> {
    return this.findOrCreateChat(userId, 'super-admin');
  }
}
```

### Task 11: `SendMessageUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/chat/SendMessageUseCase.ts`
- Create: `app/packages/application/src/chat/__tests__/SendMessageUseCase.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// app/packages/application/src/chat/__tests__/SendMessageUseCase.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { SendMessageUseCase } from '../SendMessageUseCase';
import { ChatError } from '../errors';
import { FakeChatRepository } from './fakeChatRepository';

describe('SendMessageUseCase', () => {
  let repo: FakeChatRepository;
  let uc: SendMessageUseCase;
  beforeEach(() => {
    repo = new FakeChatRepository();
    uc = new SendMessageUseCase(repo);
  });

  it('rejects empty body', async () => {
    await expect(uc.execute({ chatId: 'c1', senderId: 'u1', body: '' }))
      .rejects.toMatchObject({ code: 'message_body_required' });
  });

  it('rejects whitespace-only body', async () => {
    await expect(uc.execute({ chatId: 'c1', senderId: 'u1', body: '   \n\t  ' }))
      .rejects.toMatchObject({ code: 'message_body_required' });
  });

  it('rejects body longer than MESSAGE_MAX_LENGTH', async () => {
    const body = 'x'.repeat(2001);
    await expect(uc.execute({ chatId: 'c1', senderId: 'u1', body }))
      .rejects.toMatchObject({ code: 'message_too_long' });
  });

  it('forwards a valid trimmed body to the repository', async () => {
    const result = await uc.execute({ chatId: 'c1', senderId: 'u1', body: '  hello  ' });
    expect(result.body).toBe('hello');
    expect(repo.sendCallCount).toBe(1);
  });
});
```

- [ ] **Step 2: Run — verify failure**

```bash
pnpm --filter @kc/application test -- SendMessageUseCase
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

```ts
// app/packages/application/src/chat/SendMessageUseCase.ts
/** FR-CHAT-002 AC5, FR-CHAT-003 — validate body length, forward to repo. */
import { MESSAGE_MAX_LENGTH } from '@kc/domain';
import type { Message } from '@kc/domain';
import type { IChatRepository } from '../ports/IChatRepository';
import { ChatError } from './errors';

export interface SendMessageInput {
  chatId: string;
  senderId: string;
  body: string;
}

export class SendMessageUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: SendMessageInput): Promise<Message> {
    const trimmed = input.body.trim();
    if (trimmed.length === 0) {
      throw new ChatError('message_body_required', 'message_body_required');
    }
    if (trimmed.length > MESSAGE_MAX_LENGTH) {
      throw new ChatError(
        'message_too_long',
        `message_too_long (>${MESSAGE_MAX_LENGTH})`,
      );
    }
    return this.repo.sendMessage(input.chatId, input.senderId, trimmed);
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
pnpm --filter @kc/application test -- SendMessageUseCase
```

Expected: PASS, 4 tests.

### Task 12: `OpenOrCreateChatUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/chat/OpenOrCreateChatUseCase.ts`
- Create: `app/packages/application/src/chat/__tests__/OpenOrCreateChatUseCase.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// app/packages/application/src/chat/__tests__/OpenOrCreateChatUseCase.test.ts
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

  it('returns the existing chat (first-anchor-wins) on second call', async () => {
    await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p1' });
    const second = await uc.execute({ viewerId: 'a', otherUserId: 'b', anchorPostId: 'p2' });
    expect(second.anchorPostId).toBe('p1');                 // first wins
    expect(repo.chats).toHaveLength(1);                     // no duplicate
  });

  it('handles no-anchor entry (profile flow)', async () => {
    const chat = await uc.execute({ viewerId: 'a', otherUserId: 'b' });
    expect(chat.anchorPostId).toBeNull();
  });
});
```

- [ ] **Step 2: Run — verify failure**

```bash
pnpm --filter @kc/application test -- OpenOrCreateChatUseCase
```

- [ ] **Step 3: Implement**

```ts
// app/packages/application/src/chat/OpenOrCreateChatUseCase.ts
/** FR-CHAT-004 AC1 + FR-CHAT-006 — locates or creates the chat. First-anchor-wins. */
import type { Chat } from '@kc/domain';
import type { IChatRepository } from '../ports/IChatRepository';

export interface OpenOrCreateChatInput {
  viewerId: string;
  otherUserId: string;
  anchorPostId?: string;
}

export class OpenOrCreateChatUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: OpenOrCreateChatInput): Promise<Chat> {
    return this.repo.findOrCreateChat(
      input.viewerId,
      input.otherUserId,
      input.anchorPostId,
    );
  }
}
```

- [ ] **Step 4: Run — verify pass**

```bash
pnpm --filter @kc/application test -- OpenOrCreateChatUseCase
```

Expected: PASS, 3 tests.

### Task 13: Remaining chat use cases (thin wrappers, no TDD)

**Files:**
- Create: `app/packages/application/src/chat/ListChatsUseCase.ts`
- Create: `app/packages/application/src/chat/MarkChatReadUseCase.ts`
- Create: `app/packages/application/src/chat/GetUnreadTotalUseCase.ts`
- Create: `app/packages/application/src/chat/GetSupportThreadUseCase.ts`

- [ ] **Step 1: `ListChatsUseCase.ts`**

```ts
/** FR-CHAT-001 — list my chats sorted by lastMessageAt desc. */
import type { IChatRepository, ChatWithPreview } from '../ports/IChatRepository';

export class ListChatsUseCase {
  constructor(private readonly repo: IChatRepository) {}

  async execute(input: { userId: string }): Promise<ChatWithPreview[]> {
    const chats = await this.repo.getMyChats(input.userId);
    return [...chats].sort(
      (a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt),
    );
  }
}
```

- [ ] **Step 2: `MarkChatReadUseCase.ts`**

```ts
/** FR-CHAT-011 AC2 — bulk mark all unread messages in chat as read. */
import type { IChatRepository } from '../ports/IChatRepository';

export class MarkChatReadUseCase {
  constructor(private readonly repo: IChatRepository) {}
  async execute(input: { chatId: string; userId: string }): Promise<void> {
    await this.repo.markRead(input.chatId, input.userId);
  }
}
```

- [ ] **Step 3: `GetUnreadTotalUseCase.ts`**

```ts
/** FR-CHAT-012 — total unread count across all my chats (for top-bar badge). */
import type { IChatRepository } from '../ports/IChatRepository';

export class GetUnreadTotalUseCase {
  constructor(private readonly repo: IChatRepository) {}
  async execute(input: { userId: string }): Promise<number> {
    return this.repo.getUnreadTotal(input.userId);
  }
}
```

- [ ] **Step 4: `GetSupportThreadUseCase.ts`**

```ts
/** FR-CHAT-007 — open or resume the support thread with the Super Admin. */
import type { Chat } from '@kc/domain';
import type { IChatRepository } from '../ports/IChatRepository';

export class GetSupportThreadUseCase {
  constructor(private readonly repo: IChatRepository) {}
  async execute(input: { userId: string }): Promise<Chat> {
    return this.repo.getOrCreateSupportThread(input.userId);
  }
}
```

- [ ] **Step 5: Verify all chat use-case files compile**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```

Expected: PASS for `@kc/application`. The known `SupabaseUserRepository` failure persists — ignore.

### Task 14: Block use cases + errors + TDD

**Files:**
- Create: `app/packages/application/src/block/errors.ts`
- Create: `app/packages/application/src/block/BlockUserUseCase.ts`
- Create: `app/packages/application/src/block/UnblockUserUseCase.ts`
- Create: `app/packages/application/src/block/__tests__/fakeBlockRepository.ts`
- Create: `app/packages/application/src/block/__tests__/BlockUserUseCase.test.ts`

- [ ] **Step 1: `errors.ts`**

```ts
export type BlockErrorCode = 'self_block_forbidden' | 'unknown';

export class BlockError extends Error {
  readonly code: BlockErrorCode;
  readonly cause?: unknown;
  constructor(code: BlockErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'BlockError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, BlockError.prototype);
  }
}
```

- [ ] **Step 2: `fakeBlockRepository.ts`**

```ts
import type { IBlockRepository } from '../../ports/IBlockRepository';

export class FakeBlockRepository implements IBlockRepository {
  pairs: Array<{ blocker: string; blocked: string }> = [];
  async block(blockerId: string, blockedId: string) {
    this.pairs.push({ blocker: blockerId, blocked: blockedId });
  }
  async unblock(blockerId: string, blockedId: string) {
    this.pairs = this.pairs.filter((p) => !(p.blocker === blockerId && p.blocked === blockedId));
  }
  async isBlockedByMe(viewerId: string, otherId: string) {
    return this.pairs.some((p) => p.blocker === viewerId && p.blocked === otherId);
  }
}
```

- [ ] **Step 3: Failing test for `BlockUserUseCase`**

```ts
// app/packages/application/src/block/__tests__/BlockUserUseCase.test.ts
import { describe, it, expect } from 'vitest';
import { BlockUserUseCase } from '../BlockUserUseCase';
import { FakeBlockRepository } from './fakeBlockRepository';

describe('BlockUserUseCase', () => {
  it('blocks another user', async () => {
    const repo = new FakeBlockRepository();
    await new BlockUserUseCase(repo).execute({ blockerId: 'a', blockedId: 'b' });
    expect(await repo.isBlockedByMe('a', 'b')).toBe(true);
  });

  it('rejects self-block', async () => {
    const repo = new FakeBlockRepository();
    await expect(
      new BlockUserUseCase(repo).execute({ blockerId: 'a', blockedId: 'a' }),
    ).rejects.toMatchObject({ code: 'self_block_forbidden' });
  });
});
```

- [ ] **Step 4: Run — failure expected**

```bash
pnpm --filter @kc/application test -- BlockUserUseCase
```

- [ ] **Step 5: Implement `BlockUserUseCase.ts`**

```ts
/** FR-CHAT-009 entry — viewer-initiated block from chat ⋮ menu. */
import type { IBlockRepository } from '../ports/IBlockRepository';
import { BlockError } from './errors';

export class BlockUserUseCase {
  constructor(private readonly repo: IBlockRepository) {}
  async execute(input: { blockerId: string; blockedId: string }): Promise<void> {
    if (input.blockerId === input.blockedId) {
      throw new BlockError('self_block_forbidden', 'self_block_forbidden');
    }
    await this.repo.block(input.blockerId, input.blockedId);
  }
}
```

- [ ] **Step 6: Implement `UnblockUserUseCase.ts`**

```ts
/** FR-CHAT-009 / D-11 — paired unblock. */
import type { IBlockRepository } from '../ports/IBlockRepository';

export class UnblockUserUseCase {
  constructor(private readonly repo: IBlockRepository) {}
  async execute(input: { blockerId: string; blockedId: string }): Promise<void> {
    await this.repo.unblock(input.blockerId, input.blockedId);
  }
}
```

- [ ] **Step 7: Run — verify pass**

```bash
pnpm --filter @kc/application test -- BlockUserUseCase
```

Expected: PASS, 2 tests.

### Task 15: Report use case + errors

**Files:**
- Create: `app/packages/application/src/reports/errors.ts`
- Create: `app/packages/application/src/reports/ReportChatUseCase.ts`

- [ ] **Step 1: `errors.ts`**

```ts
export type ReportErrorCode = 'invalid_target' | 'duplicate_within_24h' | 'unknown';

export class ReportError extends Error {
  readonly code: ReportErrorCode;
  readonly cause?: unknown;
  constructor(code: ReportErrorCode, message: string, cause?: unknown) {
    super(message);
    this.name = 'ReportError';
    this.code = code;
    this.cause = cause;
    Object.setPrototypeOf(this, ReportError.prototype);
  }
}
```

- [ ] **Step 2: `ReportChatUseCase.ts`**

```ts
/** FR-CHAT-010 — submit a report against an entire chat thread. */
import type { ReportReason, ReportSubmission } from '@kc/domain';
import type { IReportRepository } from '../ports/IReportRepository';

export interface ReportChatInput {
  reporterId: string;
  chatId: string;
  reason: ReportReason;
  note?: string;
}

export class ReportChatUseCase {
  constructor(private readonly repo: IReportRepository) {}

  async execute(input: ReportChatInput): Promise<void> {
    const submission: ReportSubmission = {
      targetType: 'chat',
      targetId: input.chatId,
      reason: input.reason,
      note: input.note,
    };
    await this.repo.submit(input.reporterId, submission);
  }
}
```

### Task 16: Re-export everything from `@kc/application/src/index.ts`

**Files:**
- Modify: `app/packages/application/src/index.ts`

- [ ] **Step 1: Append new re-exports**

Append (preserving existing exports):

```ts
// Chat use cases
export { BuildAutoMessageUseCase } from './chat/BuildAutoMessageUseCase';
export { SendMessageUseCase } from './chat/SendMessageUseCase';
export type { SendMessageInput } from './chat/SendMessageUseCase';
export { OpenOrCreateChatUseCase } from './chat/OpenOrCreateChatUseCase';
export type { OpenOrCreateChatInput } from './chat/OpenOrCreateChatUseCase';
export { ListChatsUseCase } from './chat/ListChatsUseCase';
export { MarkChatReadUseCase } from './chat/MarkChatReadUseCase';
export { GetUnreadTotalUseCase } from './chat/GetUnreadTotalUseCase';
export { GetSupportThreadUseCase } from './chat/GetSupportThreadUseCase';
export { ChatError } from './chat/errors';
export type { ChatErrorCode } from './chat/errors';

// Block use cases
export { BlockUserUseCase } from './block/BlockUserUseCase';
export { UnblockUserUseCase } from './block/UnblockUserUseCase';
export { BlockError } from './block/errors';
export type { BlockErrorCode } from './block/errors';

// Report use cases
export { ReportChatUseCase } from './reports/ReportChatUseCase';
export type { ReportChatInput } from './reports/ReportChatUseCase';
export { ReportError } from './reports/errors';
export type { ReportErrorCode } from './reports/errors';
```

- [ ] **Step 2: Run all application tests**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm --filter @kc/application test
```

Expected: PASS — 9 new tests on top of the existing suite (4 SendMessage + 3 OpenOrCreateChat + 2 BuildAutoMessage = 9; plus 2 BlockUser).

- [ ] **Step 3: Lint architecture rules**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm lint:arch
```

Expected: PASS (≤200 LOC + domain-error rule).

- [ ] **Step 4: Commit Phase 3**

```bash
git add app/packages/application/src/chat app/packages/application/src/block app/packages/application/src/reports app/packages/application/src/index.ts
git commit -m "feat(application): chat/block/report use cases (TDD)

Adds BuildAutoMessage (pure), SendMessage (validation), OpenOrCreateChat
(first-anchor-wins delegation), ListChats, MarkChatRead, GetUnreadTotal,
GetSupportThread; BlockUser (self-block guard) + UnblockUser; ReportChat.

11 new vitest tests with hand-written fake repositories. Realtime stays
out of use cases — managed in chatStore directly.

Mapped to SRS: FR-CHAT-001..012, FR-MOD-001 (entry), FR-MOD-009.
Refactor logged: NA."
```

---

## Phase 4 — Migrations + types regeneration

### Task 17: Migration `0010_seed_super_admin.sql`

**Files:**
- Create: `supabase/migrations/0010_seed_super_admin.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0010_seed_super_admin | P0.5 — auto-promote canonical super-admin email
-- FR-CHAT-007 AC1.
--
-- We cannot insert into public.users directly without a corresponding
-- auth.users row (FK). Instead, this trigger sets is_super_admin=true
-- whenever the public.users insert corresponds to the canonical email.
-- Plus a backfill for the case where the super admin already signed up.

create or replace function public.users_auto_promote_super_admin()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if exists (
    select 1 from auth.users au
    where au.id = new.user_id
      and au.email = 'karmacommunity2.0@gmail.com'
  ) then
    new.is_super_admin := true;
  end if;
  return new;
end;
$$;

drop trigger if exists users_before_insert_super_admin_flag on public.users;
create trigger users_before_insert_super_admin_flag
  before insert on public.users
  for each row execute function public.users_auto_promote_super_admin();

-- Idempotent backfill.
update public.users u
set is_super_admin = true
from auth.users au
where au.id = u.user_id
  and au.email = 'karmacommunity2.0@gmail.com'
  and u.is_super_admin = false;
```

### Task 18: Migration `0011_chat_helpers.sql`

**Files:**
- Create: `supabase/migrations/0011_chat_helpers.sql`

- [ ] **Step 1: Write the migration**

```sql
-- 0011_chat_helpers | P0.5 — RPCs for read receipts, unread totals, support thread.
-- FR-CHAT-007, FR-CHAT-011, FR-CHAT-012.

-- ── 1. Bulk mark-read (FR-CHAT-011 AC2) ────────────────────────────────────
-- Single round-trip; the existing messages_update_status_recipient policy
-- and messages_on_status_change trigger handle authorization + timestamps.
create or replace function public.rpc_chat_mark_read(p_chat_id uuid)
returns void
language sql
security invoker
set search_path = public
as $$
  update public.messages
  set status = 'read'
  where chat_id = p_chat_id
    and sender_id <> auth.uid()
    and status <> 'read';
$$;

grant execute on function public.rpc_chat_mark_read(uuid) to authenticated;

-- ── 2. Unread total across visible chats (FR-CHAT-012) ─────────────────────
create or replace function public.rpc_chat_unread_total()
returns bigint
language sql
security invoker
stable
set search_path = public
as $$
  select count(*)::bigint
  from public.messages m
  join public.chats c on c.chat_id = m.chat_id
  where auth.uid() in (c.participant_a, c.participant_b)
    and m.sender_id is distinct from auth.uid()
    and m.status <> 'read'
    and public.is_chat_visible_to(c, auth.uid());
$$;

grant execute on function public.rpc_chat_unread_total() to authenticated;

-- ── 3. Get-or-create support thread (FR-CHAT-007) ──────────────────────────
-- SECURITY DEFINER so the caller can locate the super-admin user_id even
-- though their RLS doesn't grant SELECT on that row through normal policies.
-- The function still validates auth.uid() is non-null so it cannot be called
-- anonymously.
create or replace function public.rpc_get_or_create_support_thread()
returns public.chats
language plpgsql
security definer
set search_path = public
as $$
declare
  v_admin_id uuid;
  v_viewer   uuid := auth.uid();
  v_a        uuid;
  v_b        uuid;
  v_chat     public.chats;
begin
  if v_viewer is null then
    raise exception 'not_authenticated' using errcode = '28000';
  end if;

  select user_id into v_admin_id
  from public.users
  where is_super_admin = true
  limit 1;

  if v_admin_id is null then
    raise exception 'super_admin_not_found' using errcode = 'P0001';
  end if;

  if v_admin_id = v_viewer then
    raise exception 'super_admin_self_thread_forbidden' using errcode = 'P0001';
  end if;

  -- Canonical pair ordering matches chats_canonicalize_participants.
  if v_viewer < v_admin_id then v_a := v_viewer; v_b := v_admin_id;
  else v_a := v_admin_id; v_b := v_viewer; end if;

  select * into v_chat
  from public.chats
  where participant_a = v_a and participant_b = v_b;

  if found then return v_chat; end if;

  insert into public.chats (participant_a, participant_b, is_support_thread)
  values (v_a, v_b, true)
  returning * into v_chat;

  return v_chat;
end;
$$;

grant execute on function public.rpc_get_or_create_support_thread() to authenticated;
```

### Task 19: Apply migrations + regenerate types

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/database.types.ts`

- [ ] **Step 1: Apply migrations to local Supabase**

```bash
cd /Users/navesarussi/KC/MVP-2 && supabase db reset --no-backup
```

Expected: all migrations 0001..0011 apply cleanly. If you see errors, fix the migration syntax first; do not proceed.

If `supabase db reset` is not available, use:

```bash
cd /Users/navesarussi/KC/MVP-2 && supabase migration up
```

- [ ] **Step 2: Regenerate `database.types.ts`**

```bash
cd /Users/navesarussi/KC/MVP-2 && supabase gen types typescript --local > app/packages/infrastructure-supabase/src/database.types.ts
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```

Expected: still failing on `SupabaseUserRepository.findByHandle` — fixed in Phase 5.

- [ ] **Step 4: Commit migrations + types**

```bash
git add supabase/migrations/0010_seed_super_admin.sql supabase/migrations/0011_chat_helpers.sql app/packages/infrastructure-supabase/src/database.types.ts
git commit -m "feat(supabase): super-admin auto-promote + chat RPCs (0010,0011)

0010 — BEFORE INSERT trigger on public.users that flips is_super_admin
true when the corresponding auth.users.email is the canonical
karmacommunity2.0@gmail.com. Plus idempotent backfill.

0011 — three RPCs: rpc_chat_mark_read (bulk-read for FR-CHAT-011 AC2),
rpc_chat_unread_total (FR-CHAT-012 source of truth), and
rpc_get_or_create_support_thread (SECURITY DEFINER lookup of admin
through RLS, canonical-ordered insert).

Regenerated database.types.ts.

Mapped to SRS: FR-CHAT-007, FR-CHAT-011, FR-CHAT-012.
Refactor logged: NA."
```

---

## Phase 5 — Adapters

### Task 20: `chat/rowMappers.ts`

**Files:**
- Create: `app/packages/infrastructure-supabase/src/chat/rowMappers.ts`

- [ ] **Step 1: Write mapper helpers**

```ts
import type { Chat, Message, MessageStatus, MessageKind } from '@kc/domain';
import type { Database } from '../database.types';

type ChatRow = Database['public']['Tables']['chats']['Row'];
type MessageRow = Database['public']['Tables']['messages']['Row'];

export function rowToChat(r: ChatRow): Chat {
  return {
    chatId: r.chat_id,
    participantA: r.participant_a,
    participantB: r.participant_b,
    anchorPostId: r.anchor_post_id,
    isSupportThread: r.is_support_thread,
    lastMessageAt: r.last_message_at,
    createdAt: r.created_at,
  };
}

export function rowToMessage(r: MessageRow): Message {
  return {
    messageId: r.message_id,
    chatId: r.chat_id,
    senderId: r.sender_id,
    kind: r.kind as MessageKind,
    body: r.body,
    systemPayload: (r.system_payload ?? null) as Record<string, unknown> | null,
    status: r.status as MessageStatus,
    createdAt: r.created_at,
    deliveredAt: r.delivered_at,
    readAt: r.read_at,
  };
}
```

### Task 21: `SupabaseChatRepository.ts` — skeleton + simple methods

**Files:**
- Create: `app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts`

- [ ] **Step 1: Write the file**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IChatRepository,
  ChatWithPreview,
} from '@kc/application';
import type { Chat, Message } from '@kc/domain';
import { ChatError } from '@kc/application';
import type { Database } from '../database.types';
import { rowToChat, rowToMessage } from './rowMappers';

export class SupabaseChatRepository implements IChatRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findById(chatId: string): Promise<Chat | null> {
    const { data, error } = await this.client
      .from('chats').select('*').eq('chat_id', chatId).maybeSingle();
    if (error) throw mapError(error);
    return data ? rowToChat(data) : null;
  }

  async findOrCreateChat(
    userId: string,
    otherUserId: string,
    anchorPostId?: string,
  ): Promise<Chat> {
    const [a, b] = userId < otherUserId ? [userId, otherUserId] : [otherUserId, userId];

    const existing = await this.client
      .from('chats').select('*')
      .eq('participant_a', a).eq('participant_b', b).maybeSingle();
    if (existing.error) throw mapError(existing.error);
    if (existing.data) return rowToChat(existing.data);

    const insert = await this.client
      .from('chats')
      .insert({ participant_a: a, participant_b: b, anchor_post_id: anchorPostId ?? null })
      .select('*').single();
    if (insert.error) throw mapError(insert.error);
    return rowToChat(insert.data);
  }

  async getMessages(chatId: string, limit: number, beforeCreatedAt?: string): Promise<Message[]> {
    let q = this.client.from('messages').select('*')
      .eq('chat_id', chatId).order('created_at', { ascending: false }).limit(limit);
    if (beforeCreatedAt) q = q.lt('created_at', beforeCreatedAt);
    const { data, error } = await q;
    if (error) throw mapError(error);
    return (data ?? []).map(rowToMessage);
  }

  async sendMessage(chatId: string, senderId: string, body: string): Promise<Message> {
    const { data, error } = await this.client
      .from('messages')
      .insert({ chat_id: chatId, sender_id: senderId, body, kind: 'user', status: 'pending' })
      .select('*').single();
    if (error) throw mapError(error);
    return rowToMessage(data);
  }

  async markRead(chatId: string, _userId: string): Promise<void> {
    const { error } = await this.client.rpc('rpc_chat_mark_read', { p_chat_id: chatId });
    if (error) throw mapError(error);
  }

  async getUnreadTotal(_userId: string): Promise<number> {
    const { data, error } = await this.client.rpc('rpc_chat_unread_total');
    if (error) throw mapError(error);
    return Number(data ?? 0);
  }

  async getOrCreateSupportThread(_userId: string): Promise<Chat> {
    const { data, error } = await this.client.rpc('rpc_get_or_create_support_thread');
    if (error) throw mapError(error);
    if (!data) throw new ChatError('super_admin_not_found', 'super_admin_not_found');
    // RPC returns a single row of public.chats — normalize via mapper
    return rowToChat(data as unknown as Database['public']['Tables']['chats']['Row']);
  }

  async getMyChats(userId: string): Promise<ChatWithPreview[]> {
    // Fetch chats + last message + unread count via two queries; reconcile in TS.
    // (Reverting to a single LATERAL query if perf becomes an issue.)
    const chatsRes = await this.client
      .from('chats').select('*')
      .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)
      .order('last_message_at', { ascending: false });
    if (chatsRes.error) throw mapError(chatsRes.error);
    const chats = (chatsRes.data ?? []).map(rowToChat);
    if (chats.length === 0) return [];

    const chatIds = chats.map((c) => c.chatId);

    // Latest message per chat — sort all messages desc and take first per chatId in TS.
    const msgsRes = await this.client
      .from('messages').select('*')
      .in('chat_id', chatIds).order('created_at', { ascending: false });
    if (msgsRes.error) throw mapError(msgsRes.error);
    const lastMessageByChat = new Map<string, Message>();
    for (const m of (msgsRes.data ?? []).map(rowToMessage)) {
      if (!lastMessageByChat.has(m.chatId)) lastMessageByChat.set(m.chatId, m);
    }

    // Unread per chat
    const unreadRes = await this.client
      .from('messages').select('chat_id, status, sender_id')
      .in('chat_id', chatIds);
    if (unreadRes.error) throw mapError(unreadRes.error);
    const unreadByChat: Record<string, number> = {};
    for (const r of unreadRes.data ?? []) {
      if (r.status !== 'read' && r.sender_id !== userId) {
        unreadByChat[r.chat_id] = (unreadByChat[r.chat_id] ?? 0) + 1;
      }
    }

    // Counterparts (one query)
    const otherIds = chats.map((c) => (c.participantA === userId ? c.participantB : c.participantA));
    const usersRes = await this.client
      .from('users').select('user_id, display_name, avatar_url')
      .in('user_id', otherIds);
    if (usersRes.error) throw mapError(usersRes.error);
    const userMap = new Map<string, { displayName: string; avatarUrl: string | null }>();
    for (const u of usersRes.data ?? []) {
      userMap.set(u.user_id, { displayName: u.display_name, avatarUrl: u.avatar_url });
    }

    return chats.map((c) => {
      const otherId = c.participantA === userId ? c.participantB : c.participantA;
      const found = userMap.get(otherId);
      return {
        ...c,
        otherParticipant: found
          ? { userId: otherId, displayName: found.displayName, avatarUrl: found.avatarUrl, isDeleted: false }
          : { userId: null, displayName: 'משתמש שנמחק', avatarUrl: null, isDeleted: true },
        lastMessage: lastMessageByChat.get(c.chatId) ?? null,
        unreadCount: unreadByChat[c.chatId] ?? 0,
      };
    });
  }

  async getCounterpart(chat: Chat, viewerId: string) {
    const otherId = chat.participantA === viewerId ? chat.participantB : chat.participantA;
    const { data, error } = await this.client
      .from('users').select('user_id, display_name, avatar_url')
      .eq('user_id', otherId).maybeSingle();
    if (error) throw mapError(error);
    if (!data) return { userId: null, displayName: 'משתמש שנמחק', avatarUrl: null, isDeleted: true };
    return { userId: data.user_id, displayName: data.display_name, avatarUrl: data.avatar_url, isDeleted: false };
  }
}

function mapError(err: { code?: string; message?: string }): Error {
  const code = err.code ?? '';
  if (code === '23503') return new ChatError('send_to_deleted_user', err.message ?? 'send_to_deleted_user', err);
  if (code === '42501') return new ChatError('chat_forbidden', err.message ?? 'chat_forbidden', err);
  if (code === '23514') return new ChatError('message_too_long', err.message ?? 'message_too_long', err);
  if (err.message?.includes('super_admin_not_found')) return new ChatError('super_admin_not_found', err.message, err);
  return new ChatError('unknown', err.message ?? 'unknown', err);
}
```

- [ ] **Step 2: Verify the file is under 200 lines**

```bash
wc -l /Users/navesarussi/KC/MVP-2/app/packages/infrastructure-supabase/src/chat/SupabaseChatRepository.ts
```

If >200, split `getMyChats` into a helper module (`getMyChats.ts`) imported by the class. The 200-LOC cap is enforced by `pnpm lint:arch`.

### Task 22: `SupabaseChatRealtime.ts`

**Files:**
- Create: `app/packages/infrastructure-supabase/src/chat/SupabaseChatRealtime.ts`

- [ ] **Step 1: Write the file**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  IChatRealtime,
  InboxStreamCallbacks,
  ChatStreamCallbacks,
  Unsubscribe,
} from '@kc/application';
import type { Database } from '../database.types';
import { rowToChat, rowToMessage } from './rowMappers';

const UNREAD_DEBOUNCE_MS = 200;

export class SupabaseChatRealtime implements IChatRealtime {
  constructor(private readonly client: SupabaseClient<Database>) {}

  subscribeToChat(chatId: string, cb: ChatStreamCallbacks): Unsubscribe {
    const channel = this.client
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => cb.onMessage(rowToMessage(payload.new as never)),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (payload) => {
          const m = rowToMessage(payload.new as never);
          cb.onMessageStatusChanged({
            messageId: m.messageId, status: m.status, deliveredAt: m.deliveredAt, readAt: m.readAt,
          });
        },
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          cb.onError(new Error(`chat channel ${status.toLowerCase()}`));
        }
      });
    return () => { void channel.unsubscribe(); };
  }

  subscribeToInbox(userId: string, cb: InboxStreamCallbacks): Unsubscribe {
    let unreadTimer: ReturnType<typeof setTimeout> | null = null;
    const fireUnreadDebounced = () => {
      if (unreadTimer) clearTimeout(unreadTimer);
      unreadTimer = setTimeout(async () => {
        const { data, error } = await this.client.rpc('rpc_chat_unread_total');
        if (!error) cb.onUnreadTotalChanged(Number(data ?? 0));
      }, UNREAD_DEBOUNCE_MS);
    };

    const channel = this.client
      .channel(`inbox:${userId}`)
      // RLS filters server-side: only events on visible chats reach the client.
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        () => fireUnreadDebounced(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        () => fireUnreadDebounced(),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chats' },
        (payload) => cb.onChatChanged(rowToChat(payload.new as never)),
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          cb.onError(new Error(`inbox channel ${status.toLowerCase()}`));
        }
      });

    return () => {
      if (unreadTimer) clearTimeout(unreadTimer);
      void channel.unsubscribe();
    };
  }
}
```

### Task 23: Block + Report adapters

**Files:**
- Create: `app/packages/infrastructure-supabase/src/block/SupabaseBlockRepository.ts`
- Create: `app/packages/infrastructure-supabase/src/reports/SupabaseReportRepository.ts`

- [ ] **Step 1: `SupabaseBlockRepository.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IBlockRepository } from '@kc/application';
import { BlockError } from '@kc/application';
import type { Database } from '../database.types';

export class SupabaseBlockRepository implements IBlockRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async block(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await this.client
      .from('blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId });
    if (error && error.code !== '23505') {
      throw new BlockError('unknown', error.message, error);
    }
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    const { error } = await this.client
      .from('blocks')
      .delete().eq('blocker_id', blockerId).eq('blocked_id', blockedId);
    if (error) throw new BlockError('unknown', error.message, error);
  }

  async isBlockedByMe(viewerId: string, otherId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from('blocks').select('blocker_id')
      .eq('blocker_id', viewerId).eq('blocked_id', otherId).maybeSingle();
    if (error) throw new BlockError('unknown', error.message, error);
    return !!data;
  }
}
```

- [ ] **Step 2: `SupabaseReportRepository.ts`**

```ts
import type { SupabaseClient } from '@supabase/supabase-js';
import type { IReportRepository } from '@kc/application';
import { ReportError } from '@kc/application';
import type { ReportSubmission } from '@kc/domain';
import type { Database } from '../database.types';

export class SupabaseReportRepository implements IReportRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async submit(reporterId: string, input: ReportSubmission): Promise<void> {
    const { error } = await this.client.from('reports').insert({
      reporter_id: reporterId,
      target_type: input.targetType,
      target_id: input.targetId,
      reason: input.reason,
      note: input.note ?? null,
    });
    if (error) {
      if (error.code === '23505') throw new ReportError('duplicate_within_24h', error.message, error);
      if (error.code === '23514' || error.code === '23502')
        throw new ReportError('invalid_target', error.message, error);
      throw new ReportError('unknown', error.message, error);
    }
  }
}
```

### Task 24: `findByHandle` on `SupabaseUserRepository`

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`

- [ ] **Step 1: Read current file shape**

```bash
cat /Users/navesarussi/KC/MVP-2/app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts | head -80
```

- [ ] **Step 2: Add the method**

Insert near the existing `findById` (or anywhere inside the class). Replace `User` with the project's actual import — likely `import type { User } from '@kc/domain'`.

```ts
  async findByHandle(handle: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users').select('*').eq('handle', handle).maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return this.rowToUser(data);            // reuse the file's existing mapper helper
  }
```

If the file does not have a `rowToUser` helper, mirror the existing `findById` mapping inline.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```

Expected: PASS now (the contract added in Task 6 is satisfied).

### Task 25: Adapter index re-exports

**Files:**
- Create: `app/packages/infrastructure-supabase/src/chat/index.ts`
- Create: `app/packages/infrastructure-supabase/src/block/index.ts`
- Create: `app/packages/infrastructure-supabase/src/reports/index.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts`

- [ ] **Step 1: Write the three sub-indexes**

```ts
// chat/index.ts
export { SupabaseChatRepository } from './SupabaseChatRepository';
export { SupabaseChatRealtime } from './SupabaseChatRealtime';
```

```ts
// block/index.ts
export { SupabaseBlockRepository } from './SupabaseBlockRepository';
```

```ts
// reports/index.ts
export { SupabaseReportRepository } from './SupabaseReportRepository';
```

- [ ] **Step 2: Add re-exports to root `index.ts`**

```ts
export * from './chat';
export * from './block';
export * from './reports';
```

(Append; don't remove existing exports.)

- [ ] **Step 3: Lint architecture**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm lint:arch && pnpm typecheck && pnpm --filter @kc/application test
```

Expected: all PASS.

- [ ] **Step 4: Commit Phase 5**

```bash
git add app/packages/infrastructure-supabase/src/chat app/packages/infrastructure-supabase/src/block app/packages/infrastructure-supabase/src/reports app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): chat/realtime/block/report Supabase adapters

SupabaseChatRepository implements IChatRepository over the migration-0004
schema with three query helpers consuming rpc_chat_mark_read,
rpc_chat_unread_total, rpc_get_or_create_support_thread. Postgres errors
mapped to typed ChatError codes (FK→send_to_deleted_user, RLS→
chat_forbidden, CHECK→message_too_long, RPC→super_admin_not_found).

SupabaseChatRealtime opens postgres_changes channels per chat and a single
inbox channel that relies on RLS server-side filtering. Unread total is
debounced (200ms) to absorb bursts.

SupabaseBlockRepository + SupabaseReportRepository ship the minimal
viable insert/delete paths over migrations 0003 and 0005. SupabaseUser
gains findByHandle (FR-CHAT-006).

Mapped to SRS: FR-CHAT-001..013, FR-MOD-001 (entry), FR-MOD-009.
Refactor logged: NA."
```

---

## Phase 6 — FE: store + composition root

### Task 26: `chatStore.ts`

**Files:**
- Create: `app/apps/mobile/src/store/chatStore.ts`

- [ ] **Step 1: Write the store**

```ts
// FR-CHAT-001..013 — Zustand store owning chat state + realtime subscription lifecycle.
import { create } from 'zustand';
import type { Chat, Message, MessageStatus } from '@kc/domain';
import type {
  ChatWithPreview,
  IChatRepository,
  IChatRealtime,
  Unsubscribe,
} from '@kc/application';

export interface OptimisticMessage extends Message {
  clientId: string;          // present until server-ack
  failed?: boolean;
}

interface ChatState {
  inbox: ChatWithPreview[] | null;
  unreadTotal: number;
  threads: Record<string, OptimisticMessage[]>;  // asc by createdAt
  inboxSub: Unsubscribe | null;
  threadSubs: Record<string, Unsubscribe>;

  setInbox(chats: ChatWithPreview[]): void;
  upsertChatPreview(chat: Chat): void;
  setUnreadTotal(n: number): void;

  setThreadMessages(chatId: string, msgs: Message[]): void;
  appendOptimistic(chatId: string, msg: OptimisticMessage): void;
  reconcileSent(chatId: string, clientId: string, server: Message): void;
  markFailed(chatId: string, clientId: string): void;
  applyIncomingMessage(chatId: string, msg: Message): void;
  applyStatusChange(
    chatId: string,
    patch: { messageId: string; status: MessageStatus; deliveredAt: string | null; readAt: string | null },
  ): void;

  startInboxSub(userId: string, repo: IChatRepository, realtime: IChatRealtime): Promise<void>;
  startThreadSub(chatId: string, repo: IChatRepository, realtime: IChatRealtime): Promise<void>;
  stopThreadSub(chatId: string): void;
  resetOnSignOut(): void;
}

const compareCreatedAt = (a: { createdAt: string }, b: { createdAt: string }) =>
  Date.parse(a.createdAt) - Date.parse(b.createdAt);

export const useChatStore = create<ChatState>((set, get) => ({
  inbox: null,
  unreadTotal: 0,
  threads: {},
  inboxSub: null,
  threadSubs: {},

  setInbox: (chats) => set({ inbox: chats }),

  upsertChatPreview: (chat) => {
    const inbox = get().inbox ?? [];
    const idx = inbox.findIndex((c) => c.chatId === chat.chatId);
    const next = idx >= 0
      ? inbox.map((c, i) => (i === idx ? { ...c, ...chat } : c))
      : inbox; // new chats discovered via realtime are filled when getMyChats refreshes
    next.sort((a, b) => Date.parse(b.lastMessageAt) - Date.parse(a.lastMessageAt));
    set({ inbox: next });
  },

  setUnreadTotal: (n) => set({ unreadTotal: n }),

  setThreadMessages: (chatId, msgs) => {
    const next = [...msgs].sort(compareCreatedAt) as OptimisticMessage[];
    set((s) => ({ threads: { ...s.threads, [chatId]: next } }));
  },

  appendOptimistic: (chatId, msg) =>
    set((s) => ({ threads: { ...s.threads, [chatId]: [...(s.threads[chatId] ?? []), msg] } })),

  reconcileSent: (chatId, clientId, server) =>
    set((s) => {
      const list = s.threads[chatId] ?? [];
      const next = list.map((m) =>
        m.clientId === clientId
          ? { ...server, clientId, failed: false }
          : m,
      );
      return { threads: { ...s.threads, [chatId]: next } };
    }),

  markFailed: (chatId, clientId) =>
    set((s) => ({
      threads: {
        ...s.threads,
        [chatId]: (s.threads[chatId] ?? []).map((m) =>
          m.clientId === clientId ? { ...m, failed: true } : m,
        ),
      },
    })),

  applyIncomingMessage: (chatId, msg) =>
    set((s) => {
      const list = s.threads[chatId] ?? [];
      if (list.some((m) => m.messageId === msg.messageId)) return s;
      const next = [...list, { ...msg, clientId: msg.messageId }].sort(compareCreatedAt);
      return { threads: { ...s.threads, [chatId]: next } };
    }),

  applyStatusChange: (chatId, patch) =>
    set((s) => ({
      threads: {
        ...s.threads,
        [chatId]: (s.threads[chatId] ?? []).map((m) =>
          m.messageId === patch.messageId
            ? { ...m, status: patch.status, deliveredAt: patch.deliveredAt, readAt: patch.readAt }
            : m,
        ),
      },
    })),

  startInboxSub: async (userId, repo, realtime) => {
    if (get().inboxSub) return;
    const [chats, unread] = await Promise.all([
      repo.getMyChats(userId),
      repo.getUnreadTotal(userId),
    ]);
    set({ inbox: chats, unreadTotal: unread });
    const unsub = realtime.subscribeToInbox(userId, {
      onChatChanged: (chat) => get().upsertChatPreview(chat),
      onUnreadTotalChanged: (total) => set({ unreadTotal: total }),
    });
    set({ inboxSub: unsub });
  },

  startThreadSub: async (chatId, repo, realtime) => {
    if (get().threadSubs[chatId]) return;
    const msgs = await repo.getMessages(chatId, 50);
    get().setThreadMessages(chatId, msgs);
    const unsub = realtime.subscribeToChat(chatId, {
      onMessage: (m) => get().applyIncomingMessage(chatId, m),
      onMessageStatusChanged: (p) => get().applyStatusChange(chatId, p),
      onError: () => {/* surface in screen via a separate channel-status hook later */},
    });
    set((s) => ({ threadSubs: { ...s.threadSubs, [chatId]: unsub } }));
  },

  stopThreadSub: (chatId) =>
    set((s) => {
      const unsub = s.threadSubs[chatId];
      if (unsub) unsub();
      const { [chatId]: _, ...rest } = s.threadSubs;
      return { threadSubs: rest };
    }),

  resetOnSignOut: () => {
    const s = get();
    if (s.inboxSub) s.inboxSub();
    Object.values(s.threadSubs).forEach((u) => u());
    set({ inbox: null, unreadTotal: 0, threads: {}, inboxSub: null, threadSubs: {} });
  },
}));
```

- [ ] **Step 2: Verify under 200 lines**

```bash
wc -l /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/store/chatStore.ts
```

If over 200, extract reducers to `chatStore/reducers.ts` and import.

### Task 27: Composition root `container.ts`

**Files:**
- Create: `app/apps/mobile/src/lib/container.ts`

- [ ] **Step 1: Identify the existing Supabase client export**

```bash
grep -rn "createClient\|supabase\b" /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/lib /Users/navesarussi/KC/MVP-2/app/apps/mobile/src/supabase 2>/dev/null | head
```

Note the path used elsewhere (likely `apps/mobile/src/supabase/client.ts` or similar).

- [ ] **Step 2: Write `container.ts`**

```ts
// Composition root — singleton instances of all use cases bound to Supabase adapters.
// Screens import the *use cases* from here, not from @kc/application directly.
import {
  SupabaseChatRepository,
  SupabaseChatRealtime,
  SupabaseBlockRepository,
  SupabaseReportRepository,
} from '@kc/infrastructure-supabase';
import {
  ListChatsUseCase,
  OpenOrCreateChatUseCase,
  SendMessageUseCase,
  MarkChatReadUseCase,
  GetUnreadTotalUseCase,
  GetSupportThreadUseCase,
  BuildAutoMessageUseCase,
  BlockUserUseCase,
  UnblockUserUseCase,
  ReportChatUseCase,
} from '@kc/application';
import { supabase } from './supabaseClient';   // adjust import to match repo's actual path

const chatRepo = new SupabaseChatRepository(supabase);
const chatRealtime = new SupabaseChatRealtime(supabase);
const blockRepo = new SupabaseBlockRepository(supabase);
const reportRepo = new SupabaseReportRepository(supabase);

export const container = {
  // Repos / realtime — exposed for chatStore subscription wiring.
  chatRepo,
  chatRealtime,

  // Chat use cases
  listChats: new ListChatsUseCase(chatRepo),
  openOrCreateChat: new OpenOrCreateChatUseCase(chatRepo),
  sendMessage: new SendMessageUseCase(chatRepo),
  markChatRead: new MarkChatReadUseCase(chatRepo),
  getUnreadTotal: new GetUnreadTotalUseCase(chatRepo),
  getSupportThread: new GetSupportThreadUseCase(chatRepo),
  buildAutoMessage: new BuildAutoMessageUseCase(),

  // Block / Report
  blockUser: new BlockUserUseCase(blockRepo),
  unblockUser: new UnblockUserUseCase(blockRepo),
  reportChat: new ReportChatUseCase(reportRepo),
} as const;
```

If the existing screens already use a different DI pattern (e.g. each screen imports adapters directly), adapt this file to mirror that pattern instead of fighting it. Look at `app/apps/mobile/app/post/[id].tsx` for the precedent.

- [ ] **Step 3: Typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit Phase 6**

```bash
git add app/apps/mobile/src/store/chatStore.ts app/apps/mobile/src/lib/container.ts
git commit -m "feat(mobile): chatStore + composition root

chatStore (Zustand) owns inbox, threads, unread total, and the lifecycle
of inbox + per-chat subscriptions. Reducers are thin and side-effect free;
business logic stays in use cases. Optimistic flow uses a clientId field
on OptimisticMessage that is reconciled to the server messageId on ack.

container.ts wires Supabase adapters to use-case singletons so screens
import a concrete container, not concrete adapters.

Mapped to SRS: FR-CHAT-001..013.
Refactor logged: NA."
```

---

## Phase 7 — FE: screens

### Task 28: AuthGate / `_layout.tsx` — start inbox sub on auth

**Files:**
- Modify: `app/apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Read the current AuthGate effect**

```bash
sed -n '1,80p' /Users/navesarussi/KC/MVP-2/app/apps/mobile/app/_layout.tsx
```

- [ ] **Step 2: Wire `chatStore.startInboxSub` after sign-in / `chatStore.resetOnSignOut` on sign-out**

In the same effect that responds to `useAuthStore(s => s.session)`, add:

```tsx
import { useChatStore } from '../src/store/chatStore';
import { container } from '../src/lib/container';
// ...
useEffect(() => {
  const session = useAuthStore.getState().session;
  if (session) {
    void useChatStore.getState().startInboxSub(
      session.userId,
      container.chatRepo,
      container.chatRealtime,
    );
  } else {
    useChatStore.getState().resetOnSignOut();
  }
}, [session?.userId]);
```

(The exact session-id field name follows your existing `AuthSession` shape — the existing AuthGate file shows it.)

### Task 29: Top-bar `<ChatBadge />`

**Files:**
- Create: `app/apps/mobile/src/components/ChatBadge.tsx`
- Modify: `app/apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Step 1: Write `ChatBadge.tsx`**

```tsx
// FR-CHAT-012 — unread badge in top-bar.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useChatStore } from '../store/chatStore';
import { colors, typography } from '@kc/ui';

export function ChatBadge() {
  const router = useRouter();
  const total = useChatStore((s) => s.unreadTotal);
  const display = total > 9 ? '9+' : String(total);
  return (
    <TouchableOpacity onPress={() => router.push('/chat')} style={styles.wrap} accessibilityLabel="שיחות">
      <Ionicons name="chatbubbles-outline" size={22} color={colors.textPrimary} />
      {total > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{display}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.primary, borderRadius: 10,
    minWidth: 18, height: 18, paddingHorizontal: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' as const, fontSize: 10 },
});
```

- [ ] **Step 2: Insert badge into the Home tab header**

Open `app/apps/mobile/app/(tabs)/_layout.tsx`. Locate the Tabs.Screen entry for Home (per `06_Navigation_Structure` it's the leftmost in RTL — likely `name="index"`). Add `headerRight: () => <ChatBadge />` to its `options`. Import `ChatBadge` from `../../src/components/ChatBadge`.

If the layout uses a single top header rather than per-tab headers, add the badge there.

### Task 30: Replace Inbox screen `chat/index.tsx`

**Files:**
- Modify: `app/apps/mobile/app/chat/index.tsx`

- [ ] **Step 1: Replace contents (preserving the same visual style as the current MOCK file)**

```tsx
// Chat list (Inbox) — FR-CHAT-001.
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useChatStore } from '../../src/store/chatStore';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { EmptyState } from '../../src/components/EmptyState';

const PAGE = 30;

export default function ChatListScreen() {
  const router = useRouter();
  const inbox = useChatStore((s) => s.inbox);
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    if (!inbox) return [];
    const needle = q.trim().toLowerCase();
    const list = needle
      ? inbox.filter((c) => c.otherParticipant.displayName.toLowerCase().startsWith(needle))
      : inbox;
    return list.slice(0, visible);
  }, [inbox, q, visible]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>שיחות</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={q}
          onChangeText={setQ}
          placeholder="חפש לפי שם..."
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.chatId}
        onEndReached={() => setVisible((v) => v + PAGE)}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatRow}
            onPress={() => router.push(`/chat/${item.chatId}`)}
          >
            <AvatarInitials
              name={item.otherParticipant.displayName}
              avatarUrl={item.otherParticipant.avatarUrl}
              size={48}
            />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTime}>{relativeTime(item.lastMessageAt)}</Text>
                <Text style={styles.chatName}>{item.otherParticipant.displayName}</Text>
              </View>
              <Text style={styles.chatPreview} numberOfLines={1}>
                {item.lastMessage?.body ?? ''}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unreadCount > 9 ? '9+' : String(item.unreadCount)}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="אין שיחות עדיין"
            subtitle="פנה למפרסמים ישירות מתוך הפוסטים."
          />
        }
      />
    </SafeAreaView>
  );
}

function relativeTime(iso: string): string {
  const diffMin = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.round(hours / 24);
  return `לפני ${days} ימים`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  searchWrap: { padding: spacing.sm, backgroundColor: colors.surface },
  search: {
    backgroundColor: colors.background, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    ...typography.body, color: colors.textPrimary,
    borderWidth: 1.5, borderColor: colors.border,
  },
  chatRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: spacing.base, gap: spacing.md, backgroundColor: colors.surface,
  },
  chatInfo: { flex: 1, gap: 4 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { ...typography.body, fontWeight: '600' as const, color: colors.textPrimary, textAlign: 'right' },
  chatTime: { ...typography.caption, color: colors.textSecondary },
  chatPreview: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  badge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' as const },
  separator: { height: 1, backgroundColor: colors.border, marginRight: spacing.base },
});
```

### Task 31: `ReportChatModal.tsx`

**Files:**
- Create: `app/apps/mobile/src/components/ReportChatModal.tsx`

- [ ] **Step 1: Write the modal**

```tsx
// FR-CHAT-010 — Report modal opened from chat ⋮ menu.
import React, { useState } from 'react';
import { Modal, View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from 'react-native';
import type { ReportReason } from '@kc/domain';
import { container } from '../lib/container';
import { ReportError } from '@kc/application';
import { useAuthStore } from '../store/authStore';
import { colors, typography, spacing, radius } from '@kc/ui';

const REASONS: Array<{ value: ReportReason; label: string }> = [
  { value: 'Spam',       label: 'ספאם' },
  { value: 'Offensive',  label: 'תוכן פוגעני' },
  { value: 'Misleading', label: 'מטעה' },
  { value: 'Illegal',    label: 'בלתי חוקי' },
  { value: 'Other',      label: 'אחר' },
];

interface Props { chatId: string; visible: boolean; onClose: () => void; }

export function ReportChatModal({ chatId, visible, onClose }: Props) {
  const userId = useAuthStore((s) => s.session?.userId);
  const [reason, setReason] = useState<ReportReason>('Spam');
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!userId) return;
    setSubmitting(true);
    try {
      await container.reportChat.execute({ reporterId: userId, chatId, reason, note: note.trim() || undefined });
      onClose();
      Alert.alert('הדיווח נשלח', 'תודה, נבחן את הדיווח.');
    } catch (err) {
      if (err instanceof ReportError && err.code === 'duplicate_within_24h') {
        Alert.alert('כבר דיווחת', 'דיווחת על השיחה הזו ב-24 השעות האחרונות.');
        onClose();
      } else {
        Alert.alert('שגיאה', 'נסה שוב מאוחר יותר.');
      }
    } finally { setSubmitting(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <Text style={styles.title}>דיווח על השיחה</Text>
          {REASONS.map((r) => (
            <TouchableOpacity key={r.value} style={styles.option} onPress={() => setReason(r.value)}>
              <View style={[styles.radio, reason === r.value && styles.radioActive]} />
              <Text style={styles.optionLabel}>{r.label}</Text>
            </TouchableOpacity>
          ))}
          <TextInput
            style={styles.note}
            value={note}
            onChangeText={setNote}
            placeholder="תיאור (אופציונלי, עד 500 תווים)"
            placeholderTextColor={colors.textDisabled}
            multiline
            maxLength={500}
            textAlign="right"
          />
          <View style={styles.actions}>
            <TouchableOpacity style={[styles.btn, styles.btnGhost]} onPress={onClose}>
              <Text style={styles.btnGhostText}>ביטול</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btn, styles.btnPrimary]} onPress={submit} disabled={submitting}>
              <Text style={styles.btnPrimaryText}>{submitting ? '...' : 'שלח דיווח'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg, padding: spacing.base, gap: spacing.sm },
  title: { ...typography.h3, color: colors.textPrimary, textAlign: 'right' },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', paddingVertical: spacing.sm, gap: spacing.sm },
  radio: { width: 18, height: 18, borderRadius: 9, borderWidth: 2, borderColor: colors.border },
  radioActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  optionLabel: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  note: {
    backgroundColor: colors.background, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, ...typography.body, color: colors.textPrimary, minHeight: 80, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm },
  btn: { flex: 1, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnPrimary: { backgroundColor: colors.primary },
  btnPrimaryText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
  btnGhost: { borderWidth: 1, borderColor: colors.border },
  btnGhostText: { ...typography.body, color: colors.textPrimary },
});
```

### Task 32: Replace Conversation screen `chat/[id].tsx`

**Files:**
- Modify: `app/apps/mobile/app/chat/[id].tsx`

This is the longest single change in the plan. Watch the LOC cap.

- [ ] **Step 1: Replace contents**

```tsx
// Chat conversation screen — FR-CHAT-002, 003, 004, 005, 010, 011, 013.
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { v4 as uuid } from 'uuid';
import type { Chat } from '@kc/domain';
import { MESSAGE_MAX_LENGTH } from '@kc/domain';
import { ChatError } from '@kc/application';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useChatStore, type OptimisticMessage } from '../../src/store/chatStore';
import { useAuthStore } from '../../src/store/authStore';
import { container } from '../../src/lib/container';
import { ReportChatModal } from '../../src/components/ReportChatModal';

export default function ChatScreen() {
  const { id, prefill } = useLocalSearchParams<{ id: string; prefill?: string }>();
  const chatId = id!;
  const navigation = useNavigation();
  const userId = useAuthStore((s) => s.session?.userId)!;

  const messages = useChatStore((s) => s.threads[chatId] ?? []);
  const [chat, setChat] = useState<Chat | null>(null);
  const [counterpart, setCounterpart] = useState<{ displayName: string; isDeleted: boolean }>({ displayName: '', isDeleted: false });
  const [input, setInput] = useState(prefill ?? '');
  const [reportOpen, setReportOpen] = useState(false);
  const listRef = useRef<FlatList<OptimisticMessage>>(null);

  // Subscribe + initial load.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await container.chatRepo.findById(chatId);
      if (cancelled || !c) return;
      const cp = await container.chatRepo.getCounterpart(c, userId);
      if (cancelled) return;
      setChat(c);
      setCounterpart({ displayName: cp.displayName, isDeleted: cp.isDeleted });
      await useChatStore.getState().startThreadSub(chatId, container.chatRepo, container.chatRealtime);
      await container.markChatRead.execute({ chatId, userId });
    })();
    return () => {
      cancelled = true;
      useChatStore.getState().stopThreadSub(chatId);
    };
  }, [chatId, userId]);

  // Bulk-read on incoming messages while focused (FR-CHAT-011 AC2).
  const unreadIncoming = useMemo(
    () => messages.some((m) => m.senderId !== userId && m.status !== 'read'),
    [messages, userId],
  );
  useEffect(() => {
    if (unreadIncoming) void container.markChatRead.execute({ chatId, userId });
  }, [unreadIncoming, chatId, userId]);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: counterpart.isDeleted ? 'משתמש שנמחק' : counterpart.displayName,
      headerRight: () => chat?.isSupportThread ? null : (
        <TouchableOpacity
          onPress={() =>
            Alert.alert('פעולות', undefined, [
              { text: 'חסום', style: 'destructive', onPress: () => doBlock() },
              { text: 'דווח על השיחה', onPress: () => setReportOpen(true) },
              { text: 'ביטול', style: 'cancel' },
            ])
          }
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, counterpart, chat?.isSupportThread]);

  const doBlock = async () => {
    if (!chat) return;
    const otherId = chat.participantA === userId ? chat.participantB : chat.participantA;
    try {
      await container.blockUser.execute({ blockerId: userId, blockedId: otherId });
      Alert.alert('המשתמש נחסם');
      navigation.goBack();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לחסום כעת.');
    }
  };

  const send = async (overrideClientId?: string, overrideBody?: string) => {
    const body = (overrideBody ?? input).trim();
    if (body.length === 0 || body.length > MESSAGE_MAX_LENGTH) return;
    const clientId = overrideClientId ?? uuid();
    const optimistic: OptimisticMessage = {
      messageId: clientId, clientId, chatId, senderId: userId, kind: 'user',
      body, systemPayload: null, status: 'pending',
      createdAt: new Date().toISOString(), deliveredAt: null, readAt: null,
    };
    if (!overrideClientId) {
      useChatStore.getState().appendOptimistic(chatId, optimistic);
      setInput('');
    }
    try {
      const server = await container.sendMessage.execute({ chatId, senderId: userId, body });
      useChatStore.getState().reconcileSent(chatId, clientId, server);
    } catch (err) {
      useChatStore.getState().markFailed(chatId, clientId);
      if (err instanceof ChatError && err.code === 'send_to_deleted_user') {
        Alert.alert('משתמש לא זמין', 'המשתמש כבר לא קיים במערכת.');
      }
    }
  };

  const counter = input.length;
  const showCounter = counter >= 1900;
  const sendDisabled = counter === 0 || counter > MESSAGE_MAX_LENGTH;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={88}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.clientId}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <Bubble m={item} mine={item.senderId === userId} onRetry={() => send(item.clientId, item.body ?? '')} />
          )}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity style={[styles.sendBtn, sendDisabled && styles.sendBtnDisabled]} onPress={() => send()} disabled={sendDisabled}>
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="כתוב הודעה..."
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
              multiline
              maxLength={MESSAGE_MAX_LENGTH}
            />
            {showCounter && <Text style={styles.counter}>{counter}/{MESSAGE_MAX_LENGTH}</Text>}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReportChatModal chatId={chatId} visible={reportOpen} onClose={() => setReportOpen(false)} />
    </SafeAreaView>
  );
}

function Bubble({ m, mine, onRetry }: { m: OptimisticMessage; mine: boolean; onRetry: () => void }) {
  const [showTime, setShowTime] = useState(false);
  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTime((s) => !s)}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextOther]}>{m.body}</Text>
        <View style={styles.bubbleMeta}>
          {m.failed && (
            <TouchableOpacity onPress={onRetry}><Ionicons name="refresh" size={14} color={colors.textInverse} /></TouchableOpacity>
          )}
          {mine && !m.failed && <Text style={styles.readReceipt}>{m.status === 'read' ? '✓✓' : '✓'}</Text>}
          {showTime && <Text style={[styles.timeText, mine && { color: 'rgba(255,255,255,0.7)' }]}>
            {new Date(m.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
          </Text>}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messageList: { padding: spacing.base, gap: spacing.sm },
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg, gap: 4 },
  bubbleMine: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderBottomLeftRadius: 4 },
  bubbleOther: { alignSelf: 'flex-end', backgroundColor: colors.surface, borderBottomRightRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { ...typography.body },
  bubbleTextMine: { color: colors.textInverse },
  bubbleTextOther: { color: colors.textPrimary, textAlign: 'right' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  timeText: { ...typography.caption, color: colors.textSecondary },
  readReceipt: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm,
  },
  input: {
    minHeight: 40, maxHeight: 100, backgroundColor: colors.background, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.textPrimary,
    borderWidth: 1.5, borderColor: colors.border,
  },
  counter: { ...typography.caption, color: colors.textSecondary, alignSelf: 'flex-start', paddingHorizontal: spacing.sm },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
```

- [ ] **Step 2: Verify file is under 200 lines**

```bash
wc -l /Users/navesarussi/KC/MVP-2/app/apps/mobile/app/chat/[id].tsx
```

If over, extract `Bubble` to `app/apps/mobile/src/components/MessageBubble.tsx`.

- [ ] **Step 3: Verify `uuid` is installed**

```bash
cd /Users/navesarussi/KC/MVP-2/app/apps/mobile && pnpm list uuid
```

If absent: `pnpm add uuid && pnpm add -D @types/uuid`. (React Native may need `react-native-get-random-values` shim — already commonly installed by Expo crypto. If not, install and import once at app top.)

### Task 33: Wire `app/post/[id].tsx` "שלח הודעה" CTA

**Files:**
- Modify: `app/apps/mobile/app/post/[id].tsx`

- [ ] **Step 1: Locate the existing "שלח הודעה" / contact button**

```bash
grep -n 'שלח הודעה\|chat\|sendMessage' /Users/navesarussi/KC/MVP-2/app/apps/mobile/app/post/\[id\].tsx
```

- [ ] **Step 2: Replace its `onPress` with the auto-message flow**

```tsx
import { container } from '../../src/lib/container';
import { useAuthStore } from '../../src/store/authStore';
import { useRouter } from 'expo-router';
// ...
const router = useRouter();
const userId = useAuthStore((s) => s.session?.userId);

const handleContact = async () => {
  if (!userId || !post) return;
  const chat = await container.openOrCreateChat.execute({
    viewerId: userId, otherUserId: post.authorId, anchorPostId: post.postId,
  });
  // FR-CHAT-005 AC4 — skip prefill if I already sent the auto-message before.
  const recent = await container.chatRepo.getMessages(chat.chatId, 50);
  const template = container.buildAutoMessage.execute({ postTitle: post.title });
  const sentBefore = recent.some((m) => m.senderId === userId && m.body === template);
  router.push({
    pathname: '/chat/[id]',
    params: sentBefore ? { id: chat.chatId } : { id: chat.chatId, prefill: template },
  });
};
```

(Hook this into the existing CTA's `onPress`.)

### Task 34: New screen — `app/user/[handle].tsx`

**Files:**
- Create: `app/apps/mobile/app/user/[handle].tsx`

- [ ] **Step 1: Write the screen (minimal — closes part of TD-40)**

```tsx
// Other-user profile (minimal) — FR-CHAT-006 entry point.
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '@kc/domain';
import { container } from '../../src/lib/container';
import { useAuthStore } from '../../src/store/authStore';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { colors, typography, spacing, radius } from '@kc/ui';

// IUserRepository is injected via container in screens that have it; here we
// call the repo through a temporary container-side accessor:
import { SupabaseUserRepository } from '@kc/infrastructure-supabase';
import { supabase } from '../../src/lib/supabaseClient';
const userRepo = new SupabaseUserRepository(supabase);

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const [u, setU] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    (async () => setU(await userRepo.findByHandle(handle!)))();
  }, [handle]);

  if (u === undefined) return <ActivityIndicator style={{ marginTop: 80 }} />;
  if (u === null) return (
    <SafeAreaView style={styles.container}><Text style={styles.title}>משתמש לא נמצא</Text></SafeAreaView>
  );

  const startChat = async () => {
    if (!me) return;
    const chat = await container.openOrCreateChat.execute({ viewerId: me, otherUserId: u.userId });
    router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } });
  };

  const block = async () => {
    if (!me) return;
    try {
      await container.blockUser.execute({ blockerId: me, blockedId: u.userId });
      Alert.alert('המשתמש נחסם');
      router.back();
    } catch { Alert.alert('שגיאה'); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>{u.displayName}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.body}>
        <AvatarInitials name={u.displayName} avatarUrl={u.avatarUrl} size={96} />
        <Text style={styles.handle}>@{u.handle}</Text>
        {u.bio && <Text style={styles.bio}>{u.bio}</Text>}

        <TouchableOpacity style={styles.btnPrimary} onPress={startChat}>
          <Text style={styles.btnPrimaryText}>שלח הודעה</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={block}>
          <Text style={styles.btnGhostText}>חסום משתמש</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { padding: spacing.base, alignItems: 'center', gap: spacing.md },
  handle: { ...typography.body, color: colors.textSecondary },
  bio: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  btnPrimary: {
    backgroundColor: colors.primary, paddingVertical: spacing.md, paddingHorizontal: spacing.lg,
    borderRadius: radius.md, alignSelf: 'stretch', alignItems: 'center',
  },
  btnPrimaryText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
  btnGhost: { paddingVertical: spacing.md, alignItems: 'center' },
  btnGhostText: { ...typography.body, color: colors.danger ?? colors.textPrimary },
});
```

(If `User` doesn't expose `handle` / `bio` fields by those exact names, mirror the actual `@kc/domain` `User` shape.)

### Task 35: New screen — `app/settings/report-issue.tsx`

**Files:**
- Create: `app/apps/mobile/app/settings/report-issue.tsx`

- [ ] **Step 1: Write the screen**

```tsx
// FR-CHAT-007 — Settings → "דווח על תקלה" → opens or resumes support thread.
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChatError } from '@kc/application';
import { container } from '../../src/lib/container';
import { useAuthStore } from '../../src/store/authStore';
import { colors, typography, spacing, radius } from '@kc/ui';

export default function ReportIssueScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.userId);
  const [busy, setBusy] = useState(false);

  const open = async () => {
    if (!userId) return;
    setBusy(true);
    try {
      const chat = await container.getSupportThread.execute({ userId });
      router.replace({ pathname: '/chat/[id]', params: { id: chat.chatId } });
    } catch (err) {
      if (err instanceof ChatError && err.code === 'super_admin_not_found') {
        Alert.alert('שירות התמיכה לא זמין', 'נסה שוב מאוחר יותר.');
      } else {
        Alert.alert('שגיאה');
      }
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.body}>
        <Text style={styles.title}>דווח על תקלה</Text>
        <Text style={styles.body}>פתח שיחת תמיכה ישירה עם הצוות. נחזור אליך בהקדם.</Text>
        <TouchableOpacity style={styles.btn} onPress={open} disabled={busy}>
          {busy ? <ActivityIndicator color={colors.textInverse} /> : <Text style={styles.btnText}>פתח שיחת תמיכה</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  body: { padding: spacing.base, gap: spacing.md, alignItems: 'stretch' },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  btn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  btnText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
});
```

- [ ] **Step 2: Add a row to the existing Profile/Settings hub**

Open `app/apps/mobile/app/(tabs)/profile.tsx` (or whichever screen lists settings rows). Add a row that routes to `/settings/report-issue`.

- [ ] **Step 3: Lint architecture + typecheck**

```bash
cd /Users/navesarussi/KC/MVP-2/app && pnpm lint:arch && pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit Phase 7**

```bash
git add app/apps/mobile/app app/apps/mobile/src/components app/apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): live chat screens (Inbox, Thread, Profile, Report-issue)

- _layout: starts chatStore inbox subscription on auth, resets on sign-out.
- (tabs)/_layout: ChatBadge in Home tab header (FR-CHAT-012).
- chat/index: replaces MOCK_CHATS with chatStore.inbox + client-side
  prefix search (FR-CHAT-001 AC3) + paged infinite scroll (AC4).
- chat/[id]: replaces MOCK_MESSAGES with thread sub. Optimistic flow
  with retry-on-failure, char counter, ⋮ menu (block/report unless
  is_support_thread), counterpart-deleted header treatment with
  composer enabled per FR-CHAT-013 AC2.
- post/[id]: 'שלח הודעה' opens or resumes the chat with auto-message
  prefill, deduplicating on the 50-message lookback (FR-CHAT-005 AC4).
- user/[handle]: minimal other-profile with Send-message + Block CTAs.
- settings/report-issue: opens or resumes the support thread.

Mapped to SRS: FR-CHAT-001..013, FR-MOD-009.
Refactor logged: NA."
```

---

## Phase 8 — Status updates + verification + ship

### Task 36: Update SSOT documents

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`
- Modify: `docs/SSOT/TECH_DEBT.md`

- [ ] **Step 1: `PROJECT_STATUS.md` — move P0.5 to In Progress**

Edit §1 (Last Updated, completion %), §2 (P0.5 row → 🟡 In progress), §3 (Sprint Board: row 1 = P0.5; P1.7 parked pending TD-114).

- [ ] **Step 2: `TECH_DEBT.md` — add new TDs and update existing**

Add:
- `TD-115 (FE)` — push notifications wiring for chat (FR-CHAT-003 AC4 / FR-NOTIF / P1.5).
- `TD-116 (BE)` — full report processing pipeline: 24h dedup trigger, auto-removal, false-report sanctions (FR-MOD-001/004/008 / P1.3).
- `TD-117 (BE)` — system-message-with-report-summary on support thread (FR-CHAT-007 AC3 / FR-MOD-002 / P1.3).

Update:
- `TD-40` — `findByHandle` closed; remaining items still open (counters, follow lists).
- `TD-114` — annotate "P0.5 ready; awaiting separate PR to wire Donations · Time → support thread."

### Task 37: Manual verification (per spec §12)

- [ ] **Step 1: Apply migrations to dev Supabase project**

(Equivalent to running `supabase db push` against the configured dev project — adapt to your team's procedure.)

- [ ] **Step 2: Sign up the canonical super-admin once**

Sign up `karmacommunity2.0@gmail.com` through the app. Verify in `public.users` that `is_super_admin = true` is set automatically (the trigger from migration 0010).

- [ ] **Step 3: Two-browser chat verification**

- Two profiles (regular + incognito) — User A and User B.
- A creates a Give post; B navigates to it; B taps "שלח הודעה" → chat opens with auto-message prefilled.
- B sends; A receives in inbox (unread badge increments). A opens — B's bubble flips to ✓✓ (read).
- A replies; B sees optimistic → delivered → read.
- A toggles airplane mode briefly while sending — bubble shows retry icon; tap retry; sends.

- [ ] **Step 4: Block flow**

- A blocks B from chat ⋮; thread vanishes from A's inbox; B sends a message → it stays `pending` in B's view forever.
- A unblocks (via Settings management — out of scope this PR; verify via SQL `delete from blocks` instead). Confirm A's inbox restores.

- [ ] **Step 5: Auto-message dedup**

- B re-enters the same post → "שלח הודעה" → navigates without prefill.

- [ ] **Step 6: Support thread**

- Sign in as a regular user (not the super admin). Settings → "דווח על תקלה" → opens a chat where `chat.is_support_thread = true`.

- [ ] **Step 7: Counterpart deletion**

- In Supabase admin SQL, hard-delete user B (`delete from auth.users where id = ...`). On A's side, refresh the thread → header reads "משתמש שנמחק"; composer remains enabled; A sends → message stays `pending` (correct per FR-CHAT-013 AC2).

### Task 38: Open PR

- [ ] **Step 1: Push the branch**

```bash
git push -u origin feat/FR-CHAT-001-chat-realtime
```

- [ ] **Step 2: Open the PR**

```bash
gh pr create --title "feat(P0.5): direct chat with realtime (FR-CHAT-001..013)" --body "$(cat <<'EOF'
## Summary
- Replaces mock-backed chat with real Supabase Realtime + RLS-aware adapters.
- Two-port architecture: IChatRepository (one-shot) + IChatRealtime (subscriptions).
- Two new migrations (0010 super-admin trigger; 0011 RPCs) + minimal Block/Report adapters.
- Closes part of TD-40 via IUserRepository.findByHandle + minimal `/user/[handle]` profile.

## Test plan
- [ ] Two-browser optimistic / delivered / read transitions across A and B.
- [ ] Unread badge increments on background, decrements on bulk-read.
- [ ] Block — thread filtered for blocker; messages pending forever for blocked side.
- [ ] Auto-message prefill once; re-entry from same post navigates without prefill.
- [ ] Super admin support thread auto-flagged; opens from Settings → Report issue.
- [ ] Counterpart hard-delete → "משתמש שנמחק" header + composer remains enabled.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 3: After PR merges — append HISTORY.md**

```bash
# On main, after merge:
# Append a single bullet to docs/SSOT/HISTORY.md (top of file):
# - 2026-MM-DD — P0.5 — direct chat + realtime (FR-CHAT-001..013) · feat/FR-CHAT-001-chat-realtime → main · 11 vitest · TD-40 partial / TD-114 ready / TD-115 + TD-116 + TD-117 added · open: push notifs, full report flow, support thread system message
# Also flip §2 P0.5 in PROJECT_STATUS.md from 🟡 In Progress to 🟢 Done.
```

---

## Self-review

### Spec coverage check

Walking the spec section-by-section:

- §3 (architecture) — Tasks 2-7, 10, 22, 26 cover the two-port split, use-case purity, store ownership of subs. ✅
- §4 (domain entities) — Task 1 ✅
- §5 (errors) — Tasks 8, 14, 15 ✅
- §6 (ports) — Tasks 2-6 ✅
- §7 (use cases) — Tasks 9-15 (BuildAutoMessage TDD, SendMessage TDD, OpenOrCreateChat TDD, ListChats, MarkChatRead, GetUnreadTotal, GetSupportThread, BlockUser TDD, UnblockUser, ReportChat) ✅
- §8 (FE: chatStore, screens, auto-message wiring, optimistic flow) — Tasks 26, 28, 30, 32, 33, 34, 35 ✅
- §9 (migrations) — Tasks 17, 18, 19 ✅
- §10 (adapters) — Tasks 20-25 ✅
- §11 (open questions for plan) — answered: PR breakdown is 7 commits across 7 phases; types regen in Task 19; AuthGate in Task 28; 24h dedup deferred (TD-116). ✅
- §12 (testing) — Tasks 9, 11, 12, 14 cover the listed unit tests. Task 37 covers manual verification. ✅
- §13 (status updates) — Task 36 + Task 38 ✅

### Placeholder scan

No "TBD", "TODO", "implement later", or vague "add error handling" / "handle edge cases" steps. Every code step has the actual code. Each test step has the assertions.

Two notes worth surfacing as known acceptable plan-time vagueness rather than placeholders:
- Task 24 says "If the file does not have a `rowToUser` helper, mirror the existing `findById` mapping inline" — this conditional is acceptable because we know the file exists and has *some* mapper pattern; the engineer chooses the matching style. Not a TBD.
- Task 27 says "If the existing screens already use a different DI pattern, adapt this file to mirror that pattern" — same reasoning; precedent is concrete (`post/[id].tsx` has the existing pattern).
- Task 28 references `session?.userId` — exact field name follows `AuthSession`. The existing AuthGate file demonstrates it. Acceptable conditional.

### Type / signature consistency

- `Message`, `Chat`, `Block`, `ReportSubmission` declared once in Task 1; consumed identically in Tasks 2-15, 20-23, 26, 32-35. ✅
- `IChatRepository.getMessages(chatId, limit, beforeCreatedAt?)` declared in Task 2; implemented in Task 21; consumed in Task 26 (`startThreadSub`) and Task 33 (auto-message dedup). ✅
- `OptimisticMessage extends Message + { clientId, failed? }` defined in Task 26; consumed in Task 32 (Bubble + send flow). ✅
- `ChatError`/`BlockError`/`ReportError` codes consistent across tasks 8/14/15 and adapters 21/23. ✅
- `ChatStreamCallbacks.onMessageStatusChanged` payload signature matches between port (Task 3), adapter (Task 22), and store (Task 26). ✅
- `container` shape is referenced in Tasks 31, 32, 33, 34, 35; matches Task 27 definition. ✅

No drift detected.

---

## Execution

Plan saved to `docs/superpowers/plans/2026-05-10-p0-5-direct-chat-realtime.md`.
