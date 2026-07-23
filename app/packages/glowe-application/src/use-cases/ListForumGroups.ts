import {
  mapForumGroups,
  mapForumReplies,
  mapForumThreads,
  withGroupStats,
  type ForumGroup,
} from '../helpers/forumCatalog';
import type { GloweListOrder } from '../ports/GloweListOrder';
import type { IGloweForumRepository } from '../ports/IGloweForumRepository';

export type { ForumGroup };

export interface ListForumGroupsDeps {
  readonly forums: IGloweForumRepository;
}

export interface ListForumGroupsInput {
  readonly order?: GloweListOrder;
}

export async function listForumGroups(
  deps: ListForumGroupsDeps,
  input: ListForumGroupsInput = {},
): Promise<readonly ForumGroup[]> {
  const order = input.order ?? { orderBy: 'created_at', ascending: true };
  const [groupRows, threadRows, replyRows] = await Promise.all([
    deps.forums.listGroups(order),
    deps.forums.listThreads(),
    deps.forums.listReplies({ orderBy: 'created_at', ascending: true }),
  ]);

  const groups = mapForumGroups(groupRows ?? []);
  const threads = mapForumThreads(threadRows ?? []);
  const replies = mapForumReplies(replyRows ?? []);

  return withGroupStats(groups, threads, replies);
}
