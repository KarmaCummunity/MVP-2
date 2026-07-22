import {
  mapForumReplies,
  mapForumThreads,
  threadsForGroup,
  withThreadReplyCounts,
  type ForumReply,
  type ForumThread,
} from '../helpers/forumCatalog';
import type { GloweListOrder } from '../ports/GloweListOrder';
import type { IGloweForumRepository } from '../ports/IGloweForumRepository';

export type { ForumReply, ForumThread };

export interface ListThreadsDeps {
  readonly forums: IGloweForumRepository;
}

export interface ListThreadsInput {
  readonly groupId?: string;
  readonly order?: GloweListOrder;
}

export async function listThreads(
  deps: ListThreadsDeps,
  input: ListThreadsInput = {},
): Promise<readonly ForumThread[]> {
  const [threadRows, replyRows] = await Promise.all([
    deps.forums.listThreads(input.order),
    deps.forums.listReplies({ orderBy: 'created_at', ascending: true }),
  ]);

  const threads = withThreadReplyCounts(
    mapForumThreads(threadRows ?? []),
    mapForumReplies(replyRows ?? []),
  );

  if (!input.groupId) return threads;
  return threadsForGroup(threads, input.groupId);
}
