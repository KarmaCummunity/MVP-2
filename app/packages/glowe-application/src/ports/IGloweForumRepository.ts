// FR-GLOWE-009 — forum groups, threads, replies (backend.js listAll/insertOwned).

import type { GloweListOrder } from './GloweListOrder';

export interface GloweForumGroupRow {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly icon: string;
  readonly created_at?: string;
}

export interface GloweForumThreadRow {
  readonly id: string;
  readonly group_id: string;
  readonly user_id?: string;
  readonly title: string;
  readonly body: string;
  readonly created_at?: string;
}

export interface GloweForumReplyRow {
  readonly id: string;
  readonly thread_id: string;
  readonly user_id?: string;
  readonly body: string;
  readonly created_at?: string;
}

export interface CreateForumThreadInput {
  readonly groupId?: string;
  readonly group_id?: string;
  readonly title: string;
  readonly body: string;
}

export interface CreateForumReplyInput {
  readonly threadId?: string;
  readonly thread_id?: string;
  readonly body: string;
}

export interface IGloweForumRepository {
  listGroups(options?: GloweListOrder): Promise<readonly GloweForumGroupRow[] | null>;
  listThreads(options?: GloweListOrder): Promise<readonly GloweForumThreadRow[] | null>;
  listReplies(options?: GloweListOrder): Promise<readonly GloweForumReplyRow[] | null>;
  createThread(input: CreateForumThreadInput): Promise<GloweForumThreadRow | null>;
  createReply(input: CreateForumReplyInput): Promise<GloweForumReplyRow | null>;
}
