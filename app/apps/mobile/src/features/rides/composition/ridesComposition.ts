// Composition root for ride listings — mirrors searchComposition.ts.
// Mapped to spec: FR-RIDE-002..005, FR-RIDE-016 (realtime), FR-RIDE-011..014 (participants),
//                 FR-RIDE-021..022 (templates), FR-RIDE-024..025 (dashboard + my-requests).
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseRideListingRepository,
  SupabaseRideParticipantRepository,
  SupabaseRideTemplateRepository,
  SupabaseRidesRealtime,
  SupabaseCityRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CreateRideListingUseCase,
  SearchRideListingsUseCase,
  GetRideListingUseCase,
  CloseRideListingUseCase,
  FindRideMatchesUseCase,
  UpdateRideVisibilityUseCase,
  ListMyRidesUseCase,
  RequestRideJoinUseCase,
  DecideRideJoinUseCase,
  CancelRideJoinUseCase,
  ListRideParticipantsUseCase,
  ListUserRideRequestsUseCase,
  CreateRideTemplateUseCase,
  ListMyRideTemplatesUseCase,
  SetRideTemplateStatusUseCase,
  DeleteRideTemplateUseCase,
  type IRideListingRepository,
  type IRideParticipantRepository,
  type IRideTemplateRepository,
  type IRidesRealtime,
  type ICityRepository,
} from '@kc/application';
import { container } from '../../../lib/container';
import { CachedCityRepository } from '../../../services/cityStreetCache';

let _repo: IRideListingRepository | null = null;
let _participants: IRideParticipantRepository | null = null;
let _templates: IRideTemplateRepository | null = null;
let _realtime: IRidesRealtime | null = null;
let _cities: ICityRepository | null = null;
let _search: SearchRideListingsUseCase | null = null;
let _create: CreateRideListingUseCase | null = null;
let _getById: GetRideListingUseCase | null = null;
let _close: CloseRideListingUseCase | null = null;
let _findMatches: FindRideMatchesUseCase | null = null;
let _updateVisibility: UpdateRideVisibilityUseCase | null = null;
let _listMyRides: ListMyRidesUseCase | null = null;
let _requestJoin: RequestRideJoinUseCase | null = null;
let _decideJoin: DecideRideJoinUseCase | null = null;
let _cancelJoin: CancelRideJoinUseCase | null = null;
let _listParticipants: ListRideParticipantsUseCase | null = null;
let _listMyRequests: ListUserRideRequestsUseCase | null = null;
let _createTemplate: CreateRideTemplateUseCase | null = null;
let _listMyTemplates: ListMyRideTemplatesUseCase | null = null;
let _setTemplateStatus: SetRideTemplateStatusUseCase | null = null;
let _deleteTemplate: DeleteRideTemplateUseCase | null = null;

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

function getParticipantRepo(): IRideParticipantRepository {
  if (!_participants) _participants = new SupabaseRideParticipantRepository(getClient());
  return _participants;
}

function getTemplateRepo(): IRideTemplateRepository {
  if (!_templates) _templates = new SupabaseRideTemplateRepository(getClient());
  return _templates;
}

export function getRidesRealtime(): IRidesRealtime {
  if (!_realtime) _realtime = new SupabaseRidesRealtime(getClient());
  return _realtime;
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

export function getFindRideMatchesUseCase(): FindRideMatchesUseCase {
  if (!_findMatches) _findMatches = new FindRideMatchesUseCase(getRepo());
  return _findMatches;
}

export function getUpdateRideVisibilityUseCase(): UpdateRideVisibilityUseCase {
  if (!_updateVisibility) _updateVisibility = new UpdateRideVisibilityUseCase(getRepo());
  return _updateVisibility;
}

export function getListMyRidesUseCase(): ListMyRidesUseCase {
  if (!_listMyRides) _listMyRides = new ListMyRidesUseCase(getRepo());
  return _listMyRides;
}

export function getRequestRideJoinUseCase(): RequestRideJoinUseCase {
  if (!_requestJoin) _requestJoin = new RequestRideJoinUseCase(getParticipantRepo());
  return _requestJoin;
}

export function getDecideRideJoinUseCase(): DecideRideJoinUseCase {
  if (!_decideJoin) _decideJoin = new DecideRideJoinUseCase(getParticipantRepo());
  return _decideJoin;
}

export function getCancelRideJoinUseCase(): CancelRideJoinUseCase {
  if (!_cancelJoin) _cancelJoin = new CancelRideJoinUseCase(getParticipantRepo());
  return _cancelJoin;
}

export function getListRideParticipantsUseCase(): ListRideParticipantsUseCase {
  if (!_listParticipants) _listParticipants = new ListRideParticipantsUseCase(getParticipantRepo());
  return _listParticipants;
}

export function getListUserRideRequestsUseCase(): ListUserRideRequestsUseCase {
  if (!_listMyRequests) _listMyRequests = new ListUserRideRequestsUseCase(getParticipantRepo());
  return _listMyRequests;
}

export function getCreateRideTemplateUseCase(): CreateRideTemplateUseCase {
  if (!_createTemplate)
    _createTemplate = new CreateRideTemplateUseCase(getTemplateRepo(), getCityRepo());
  return _createTemplate;
}

export function getListMyRideTemplatesUseCase(): ListMyRideTemplatesUseCase {
  if (!_listMyTemplates) _listMyTemplates = new ListMyRideTemplatesUseCase(getTemplateRepo());
  return _listMyTemplates;
}

export function getSetRideTemplateStatusUseCase(): SetRideTemplateStatusUseCase {
  if (!_setTemplateStatus)
    _setTemplateStatus = new SetRideTemplateStatusUseCase(getTemplateRepo());
  return _setTemplateStatus;
}

export function getDeleteRideTemplateUseCase(): DeleteRideTemplateUseCase {
  if (!_deleteTemplate) _deleteTemplate = new DeleteRideTemplateUseCase(getTemplateRepo());
  return _deleteTemplate;
}

export const ridesComposition = {
  openOrCreateChat: container.openOrCreateChat,
};
