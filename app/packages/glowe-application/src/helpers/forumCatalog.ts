import type {
  GloweForumGroupRow,
  GloweForumReplyRow,
  GloweForumThreadRow,
} from '../ports/IGloweForumRepository';

export interface ForumGroup {
  readonly id: string;
  readonly title: string;
  readonly description: string;
  readonly tags: readonly string[];
  readonly icon: string;
  readonly members: number;
  readonly posts: number;
  readonly threads: readonly ForumThread[];
}

export interface ForumThread {
  readonly id: string;
  readonly groupId: string;
  readonly authorId: string;
  readonly title: string;
  readonly body: string;
  readonly createdAt: string;
  readonly replies: number;
}

export interface ForumReply {
  readonly id: string;
  readonly threadId: string;
  readonly authorId: string;
  readonly body: string;
  readonly createdAt: string;
}

type ForumGroupRowInput = Partial<GloweForumGroupRow> | null | undefined;
type ForumThreadRowInput = Partial<GloweForumThreadRow> | null | undefined;
type ForumReplyRowInput = Partial<GloweForumReplyRow> | null | undefined;

export function mapForumGroupRow(row: ForumGroupRowInput): ForumGroup {
  const source = row ?? {};
  return {
    id: source.id == null ? '' : String(source.id),
    title: source.title ?? '',
    description: source.description ?? '',
    tags: Array.isArray(source.tags) ? source.tags : [],
    icon: source.icon ?? '',
    members: 0,
    posts: 0,
    threads: [],
  };
}

export function mapForumGroups(
  rows: readonly ForumGroupRowInput[] | null | undefined,
): readonly ForumGroup[] {
  return (rows ?? [])
    .map(mapForumGroupRow)
    .filter((group) => group.id !== '');
}

export function mapForumThreadRow(row: ForumThreadRowInput): ForumThread {
  const source = row ?? {};
  return {
    id: source.id == null ? '' : String(source.id),
    groupId: source.group_id ?? '',
    authorId: source.user_id ?? '',
    title: source.title ?? '',
    body: source.body ?? '',
    createdAt: source.created_at ?? '',
    replies: 0,
  };
}

export function mapForumThreads(
  rows: readonly ForumThreadRowInput[] | null | undefined,
): readonly ForumThread[] {
  return (rows ?? [])
    .map(mapForumThreadRow)
    .filter((thread) => thread.id !== '');
}

export function threadsForGroup(
  threads: readonly ForumThread[] | null | undefined,
  groupId: string,
): readonly ForumThread[] {
  return (threads ?? []).filter((thread) => thread.groupId === groupId);
}

export function mapForumReplyRow(row: ForumReplyRowInput): ForumReply {
  const source = row ?? {};
  return {
    id: source.id == null ? '' : String(source.id),
    threadId: source.thread_id ?? '',
    authorId: source.user_id ?? '',
    body: source.body ?? '',
    createdAt: source.created_at ?? '',
  };
}

export function mapForumReplies(
  rows: readonly ForumReplyRowInput[] | null | undefined,
): readonly ForumReply[] {
  return (rows ?? [])
    .map(mapForumReplyRow)
    .filter((reply) => reply.id !== '');
}

export function repliesForThread(
  replies: readonly ForumReply[] | null | undefined,
  threadId: string,
): readonly ForumReply[] {
  return (replies ?? []).filter((reply) => reply.threadId === threadId);
}

export function countRepliesByThread(
  replies: readonly ForumReply[] | null | undefined,
): Readonly<Record<string, number>> {
  return (replies ?? []).reduce<Record<string, number>>((acc, reply) => {
    if (!reply.threadId) return acc;
    acc[reply.threadId] = (acc[reply.threadId] ?? 0) + 1;
    return acc;
  }, {});
}

export function groupThreadCounts(
  threads: readonly ForumThread[] | null | undefined,
): Readonly<Record<string, number>> {
  return (threads ?? []).reduce<Record<string, number>>((acc, thread) => {
    if (!thread.groupId) return acc;
    acc[thread.groupId] = (acc[thread.groupId] ?? 0) + 1;
    return acc;
  }, {});
}

export function groupMemberCounts(
  threads: readonly ForumThread[] | null | undefined,
  replies: readonly ForumReply[] | null | undefined,
): Readonly<Record<string, number>> {
  const threadList = threads ?? [];
  const threadGroup = threadList.reduce<Record<string, string>>((acc, thread) => {
    if (thread.id) acc[thread.id] = thread.groupId;
    return acc;
  }, {});

  const memberSets: Record<string, Set<string>> = {};
  const addMember = (groupId: string, authorId: string): void => {
    if (!groupId || !authorId) return;
    (memberSets[groupId] ??= new Set()).add(authorId);
  };

  threadList.forEach((thread) => addMember(thread.groupId, thread.authorId));
  (replies ?? []).forEach((reply) => addMember(threadGroup[reply.threadId] ?? '', reply.authorId));

  return Object.keys(memberSets).reduce<Record<string, number>>((acc, groupId) => {
    acc[groupId] = memberSets[groupId]?.size ?? 0;
    return acc;
  }, {});
}

export function withGroupStats(
  groups: readonly ForumGroup[],
  threads: readonly ForumThread[],
  replies: readonly ForumReply[],
): readonly ForumGroup[] {
  const posts = groupThreadCounts(threads);
  const members = groupMemberCounts(threads, replies);

  return groups.map((group) => ({
    ...group,
    posts: posts[group.id] ?? group.posts,
    members: members[group.id] ?? group.members,
  }));
}

export function withThreadReplyCounts(
  threads: readonly ForumThread[],
  replies: readonly ForumReply[],
): readonly ForumThread[] {
  const counts = countRepliesByThread(replies);
  return threads.map((thread) => ({
    ...thread,
    replies: counts[thread.id] ?? thread.replies,
  }));
}
