// ─────────────────────────────────────────────
// Composition root for IPostRepository — mirrors authComposition.ts.
// Mapped to SRS: FR-POST-001..010, FR-POST-014, FR-POST-016, FR-FEED-001..005, FR-STATS-003..004.
// ─────────────────────────────────────────────

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseFeedRealtime,
  SupabasePostRepository,
  SupabaseStatsRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CreatePostUseCase,
  DismissFirstPostNudgeUseCase,
  GetActivePostsCountUseCase,
  GetClosureCandidatesUseCase,
  GetCommunityStatsSnapshotUseCase,
  GetFeedUseCase,
  GetMyPostsUseCase,
  GetProfileClosedPostsUseCase,
  GetPostByIdUseCase,
  ListMyActivityTimelineUseCase,
  MarkAsDeliveredUseCase,
  ReopenPostUseCase,
  UnmarkRecipientSelfUseCase,
  UpdatePostUseCase,
  type IFeedRealtime,
  type IPostRepository,
  type IStatsRepository,
} from '@kc/application';
import { getUserRepo } from './userComposition';

let _repo: IPostRepository | null = null;
let _realtime: IFeedRealtime | null = null;
let _stats: IStatsRepository | null = null;
let _create: CreatePostUseCase | null = null;
let _update: UpdatePostUseCase | null = null;
let _getFeed: GetFeedUseCase | null = null;
let _getById: GetPostByIdUseCase | null = null;
let _myPosts: GetMyPostsUseCase | null = null;
let _profileClosedPosts: GetProfileClosedPostsUseCase | null = null;
let _markDelivered: MarkAsDeliveredUseCase | null = null;
let _reopen: ReopenPostUseCase | null = null;
let _unmrkRecipientSelf: UnmarkRecipientSelfUseCase | null = null;
let _getClosureCandidates: GetClosureCandidatesUseCase | null = null;
let _getActivePostsCount: GetActivePostsCountUseCase | null = null;
let _communityStatsSnapshot: GetCommunityStatsSnapshotUseCase | null = null;
let _listMyActivityTimeline: ListMyActivityTimelineUseCase | null = null;
let _dismissFirstPostNudge: DismissFirstPostNudgeUseCase | null = null;

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

function getRepo(): IPostRepository {
  if (_repo) return _repo;
  _repo = new SupabasePostRepository(getSupabaseClient({ storage: pickStorage() }));
  return _repo;
}

export function getCreatePostUseCase(): CreatePostUseCase {
  if (!_create) _create = new CreatePostUseCase(getRepo());
  return _create;
}

export function getUpdatePostUseCase(): UpdatePostUseCase {
  if (!_update) _update = new UpdatePostUseCase(getRepo());
  return _update;
}

export function getFeedUseCase(): GetFeedUseCase {
  if (!_getFeed) _getFeed = new GetFeedUseCase(getRepo());
  return _getFeed;
}

export function getPostByIdUseCase(): GetPostByIdUseCase {
  if (!_getById) _getById = new GetPostByIdUseCase(getRepo());
  return _getById;
}

export function getMyPostsUseCase(): GetMyPostsUseCase {
  if (!_myPosts) _myPosts = new GetMyPostsUseCase(getRepo());
  return _myPosts;
}

export function getProfileClosedPostsUseCase(): GetProfileClosedPostsUseCase {
  if (!_profileClosedPosts) _profileClosedPosts = new GetProfileClosedPostsUseCase(getRepo());
  return _profileClosedPosts;
}

/** Re-export for callers that need to issue raw queries (e.g. countOpenByUser). */
export function getPostRepo(): IPostRepository {
  return getRepo();
}

// ── Closure (FR-CLOSURE-001..005) ─────────────────────────────────────────
export function getMarkAsDeliveredUseCase(): MarkAsDeliveredUseCase {
  if (!_markDelivered) _markDelivered = new MarkAsDeliveredUseCase(getRepo());
  return _markDelivered;
}

export function getReopenPostUseCase(): ReopenPostUseCase {
  if (!_reopen) _reopen = new ReopenPostUseCase(getRepo());
  return _reopen;
}

export function getUnmarkRecipientSelfUseCase(): UnmarkRecipientSelfUseCase {
  if (!_unmrkRecipientSelf) _unmrkRecipientSelf = new UnmarkRecipientSelfUseCase(getRepo());
  return _unmrkRecipientSelf;
}

export function getGetClosureCandidatesUseCase(): GetClosureCandidatesUseCase {
  if (!_getClosureCandidates) {
    _getClosureCandidates = new GetClosureCandidatesUseCase(getRepo());
  }
  return _getClosureCandidates;
}

// ── P1.2 — feed discovery (FR-FEED-009, 014, 015) ─────────────────────────
export function getFeedRealtime(): IFeedRealtime {
  if (!_realtime) {
    _realtime = new SupabaseFeedRealtime(getSupabaseClient({ storage: pickStorage() }));
  }
  return _realtime;
}

export function getStatsRepo(): IStatsRepository {
  if (!_stats) {
    _stats = new SupabaseStatsRepository(getSupabaseClient({ storage: pickStorage() }));
  }
  return _stats;
}

export function getActivePostsCountUseCase(): GetActivePostsCountUseCase {
  if (!_getActivePostsCount) _getActivePostsCount = new GetActivePostsCountUseCase(getStatsRepo());
  return _getActivePostsCount;
}

export function getCommunityStatsSnapshotUseCase(): GetCommunityStatsSnapshotUseCase {
  if (!_communityStatsSnapshot) {
    _communityStatsSnapshot = new GetCommunityStatsSnapshotUseCase(getStatsRepo());
  }
  return _communityStatsSnapshot;
}

export function getListMyActivityTimelineUseCase(): ListMyActivityTimelineUseCase {
  if (!_listMyActivityTimeline) {
    _listMyActivityTimeline = new ListMyActivityTimelineUseCase(getStatsRepo());
  }
  return _listMyActivityTimeline;
}

export function getDismissFirstPostNudgeUseCase(): DismissFirstPostNudgeUseCase {
  if (!_dismissFirstPostNudge) {
    _dismissFirstPostNudge = new DismissFirstPostNudgeUseCase(getUserRepo());
  }
  return _dismissFirstPostNudge;
}
