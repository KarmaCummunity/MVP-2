// Composition root for ride listings — mirrors searchComposition.ts.
// Mapped to spec: FR-RIDE-002..005.
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseRideListingRepository,
  SupabaseCityRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CreateRideListingUseCase,
  SearchRideListingsUseCase,
  GetRideListingUseCase,
  CloseRideListingUseCase,
  type IRideListingRepository,
  type ICityRepository,
} from '@kc/application';
import { container } from '../../../lib/container';
import { CachedCityRepository } from '../../../services/cityStreetCache';

let _repo: IRideListingRepository | null = null;
let _cities: ICityRepository | null = null;
let _search: SearchRideListingsUseCase | null = null;
let _create: CreateRideListingUseCase | null = null;
let _getById: GetRideListingUseCase | null = null;
let _close: CloseRideListingUseCase | null = null;

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

function getClient() {
  return getSupabaseClient({ storage: pickStorage() });
}

function getRepo(): IRideListingRepository {
  if (!_repo) _repo = new SupabaseRideListingRepository(getClient());
  return _repo;
}

function getCityRepo(): ICityRepository {
  // PERF-6: wraps in CachedCityRepository so both onboarding and rides flows
  // share the same AsyncStorage-backed catalog cache.
  if (!_cities) _cities = new CachedCityRepository(new SupabaseCityRepository(getClient()));
  return _cities;
}

export function getSearchRideListingsUseCase(): SearchRideListingsUseCase {
  if (!_search) _search = new SearchRideListingsUseCase(getRepo());
  return _search;
}

export function getCreateRideListingUseCase(): CreateRideListingUseCase {
  if (!_create) _create = new CreateRideListingUseCase(getRepo(), getCityRepo());
  return _create;
}

export function getRideListingUseCase(): GetRideListingUseCase {
  if (!_getById) _getById = new GetRideListingUseCase(getRepo());
  return _getById;
}

export function getCloseRideListingUseCase(): CloseRideListingUseCase {
  if (!_close) _close = new CloseRideListingUseCase(getRepo());
  return _close;
}

export const ridesComposition = {
  openOrCreateChat: container.openOrCreateChat,
};
