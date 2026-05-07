// ─────────────────────────────────────────────
// Composition root for IPostRepository — mirrors authComposition.ts.
// Mapped to SRS: FR-POST-001..010, FR-POST-014, FR-POST-016, FR-FEED-001..005.
// ─────────────────────────────────────────────

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabasePostRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CreatePostUseCase,
  DeletePostUseCase,
  GetFeedUseCase,
  GetMyPostsUseCase,
  GetPostByIdUseCase,
  UpdatePostUseCase,
  type IPostRepository,
} from '@kc/application';

let _repo: IPostRepository | null = null;
let _create: CreatePostUseCase | null = null;
let _update: UpdatePostUseCase | null = null;
let _del: DeletePostUseCase | null = null;
let _getFeed: GetFeedUseCase | null = null;
let _getById: GetPostByIdUseCase | null = null;
let _myPosts: GetMyPostsUseCase | null = null;

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

export function getDeletePostUseCase(): DeletePostUseCase {
  if (!_del) _del = new DeletePostUseCase(getRepo());
  return _del;
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

/** Re-export for callers that need to issue raw queries (e.g. countOpenByUser). */
export function getPostRepo(): IPostRepository {
  return getRepo();
}
