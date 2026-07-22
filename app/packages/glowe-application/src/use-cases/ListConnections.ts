import type { IGloweFollowGateway } from '../ports/IGloweFollowGateway';
import {
  mapFollowListRow,
  type FollowConnectionRow,
  type FollowListGloweProfile,
} from '../helpers/followHelpers';

export type ConnectionsTab = 'followers' | 'following';

export type { FollowConnectionRow };

export interface ListConnectionsDeps {
  readonly follow: IGloweFollowGateway;
}

export interface ListConnectionsInput {
  readonly userId: string;
  readonly tab: ConnectionsTab;
  readonly limit?: number;
  readonly cursor?: string;
  readonly profilesById?: Readonly<Record<string, FollowListGloweProfile>>;
}

export async function listConnections(
  deps: ListConnectionsDeps,
  input: ListConnectionsInput,
): Promise<readonly FollowConnectionRow[]> {
  const userId = String(input.userId || '');
  if (!userId) return [];

  const rows =
    input.tab === 'following'
      ? await deps.follow.listFollowing(userId, input.limit, input.cursor)
      : await deps.follow.listFollowers(userId, input.limit, input.cursor);

  return (rows ?? []).map((row) =>
    mapFollowListRow(row, input.profilesById?.[row.user_id] ?? null),
  );
}
