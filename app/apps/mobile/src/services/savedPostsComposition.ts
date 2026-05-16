// FR-POST-022 — composition root for ISavedPostsRepository.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseSavedPostsRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  SavePostUseCase,
  UnsavePostUseCase,
  IsPostSavedUseCase,
  ListSavedPostsUseCase,
  type ISavedPostsRepository,
} from '@kc/application';

let _repo: ISavedPostsRepository | null = null;
let _savePost: SavePostUseCase | null = null;
let _unsavePost: UnsavePostUseCase | null = null;
let _isPostSaved: IsPostSavedUseCase | null = null;
let _listSavedPosts: ListSavedPostsUseCase | null = null;

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

function getRepo(): ISavedPostsRepository {
  if (_repo) return _repo;
  _repo = new SupabaseSavedPostsRepository(getSupabaseClient({ storage: pickStorage() }));
  return _repo;
}

export function getSavePostUseCase(): SavePostUseCase {
  if (!_savePost) _savePost = new SavePostUseCase(getRepo());
  return _savePost;
}

export function getUnsavePostUseCase(): UnsavePostUseCase {
  if (!_unsavePost) _unsavePost = new UnsavePostUseCase(getRepo());
  return _unsavePost;
}

export function getIsPostSavedUseCase(): IsPostSavedUseCase {
  if (!_isPostSaved) _isPostSaved = new IsPostSavedUseCase(getRepo());
  return _isPostSaved;
}

export function getListSavedPostsUseCase(): ListSavedPostsUseCase {
  if (!_listSavedPosts) _listSavedPosts = new ListSavedPostsUseCase(getRepo());
  return _listSavedPosts;
}
