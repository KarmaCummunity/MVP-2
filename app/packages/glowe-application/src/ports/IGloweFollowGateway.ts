// FR-FOLLOW-001 — KC shared follow graph (backend.js kcFollow* block).

export interface GloweFollowCounts {
  readonly followers: number;
  readonly following: number;
}

export interface GloweFollowTarget {
  readonly userId: string;
  readonly privacyMode: string;
  readonly accountStatus: string;
}

export interface GloweFollowState {
  readonly target: GloweFollowTarget | null;
  readonly followingExists: boolean;
}

export interface GloweFollowEdge {
  readonly follower_id: string;
  readonly followed_id: string;
  readonly created_at: string;
}

export interface GloweFollowUserEmbed {
  readonly user_id: string;
  readonly display_name: string;
  readonly avatar_url: string;
  readonly privacy_mode: string;
  readonly account_status: string;
  readonly followers_count: number;
  readonly following_count: number;
}

export interface IGloweFollowGateway {
  followCounts(): Promise<GloweFollowCounts | null>;
  follow(targetUserId: string): Promise<GloweFollowEdge | null>;
  unfollow(targetUserId: string): Promise<boolean>;
  getFollowState(targetUserId: string): Promise<GloweFollowState>;
  listFollowers(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<readonly GloweFollowUserEmbed[]>;
  listFollowing(
    userId: string,
    limit?: number,
    cursor?: string,
  ): Promise<readonly GloweFollowUserEmbed[]>;
  publicCounts(userId: string): Promise<GloweFollowCounts | null>;
}
