// ─────────────────────────────────────────────
// Composition root for IUserRepository + ICityRepository — wires Supabase
// adapters into use cases and exposes helpers for AuthGate / dev tools.
// Mapped to SRS: FR-AUTH-007 AC2, FR-AUTH-010, FR-AUTH-012.
// ─────────────────────────────────────────────

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseUserRepository,
  SupabaseCityRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CompleteBasicInfoUseCase,
  CompleteOnboardingUseCase,
  DeleteAccountUseCase,
  DismissClosureExplainerUseCase,
  SearchUsersForClosureUseCase,
  SetAvatarUseCase,
  UpdateProfileUseCase,
  type ICityRepository,
  type IUserRepository,
} from '@kc/application';
import type { City, OnboardingState } from '@kc/domain';

let _userRepo: IUserRepository | null = null;
let _cityRepo: ICityRepository | null = null;
let _completeBasicInfo: CompleteBasicInfoUseCase | null = null;
let _completeOnboarding: CompleteOnboardingUseCase | null = null;
let _setAvatar: SetAvatarUseCase | null = null;
let _updateProfile: UpdateProfileUseCase | null = null;
let _dismissClosureExplainer: DismissClosureExplainerUseCase | null = null;
let _searchUsersForClosure: SearchUsersForClosureUseCase | null = null;
let _deleteAccount: DeleteAccountUseCase | null = null;

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

export function getUserRepo(): IUserRepository {
  if (_userRepo) return _userRepo;
  _userRepo = new SupabaseUserRepository(getSupabaseClient({ storage: pickStorage() }));
  return _userRepo;
}

function getCityRepo(): ICityRepository {
  if (_cityRepo) return _cityRepo;
  _cityRepo = new SupabaseCityRepository(getSupabaseClient({ storage: pickStorage() }));
  return _cityRepo;
}

export function getCompleteBasicInfoUseCase(): CompleteBasicInfoUseCase {
  if (!_completeBasicInfo) {
    _completeBasicInfo = new CompleteBasicInfoUseCase(getUserRepo());
  }
  return _completeBasicInfo;
}

export function getCompleteOnboardingUseCase(): CompleteOnboardingUseCase {
  if (!_completeOnboarding) {
    _completeOnboarding = new CompleteOnboardingUseCase(getUserRepo());
  }
  return _completeOnboarding;
}

export function getSetAvatarUseCase(): SetAvatarUseCase {
  if (!_setAvatar) {
    _setAvatar = new SetAvatarUseCase(getUserRepo());
  }
  return _setAvatar;
}

export function getUpdateProfileUseCase(): UpdateProfileUseCase {
  if (!_updateProfile) {
    _updateProfile = new UpdateProfileUseCase(getUserRepo());
  }
  return _updateProfile;
}

/** FR-PROFILE-007: read editable fields for the Edit Profile form. */
export function getEditableProfile(userId: string) {
  return getUserRepo().getEditableProfile(userId);
}

/** Read state directly through the repo — used by AuthGate before routing. */
export function getOnboardingState(userId: string): Promise<OnboardingState> {
  return getUserRepo().getOnboardingState(userId);
}

/** Direct setter used by the dev reset button (Settings). No validation — dev tool. */
export function setOnboardingStateDirect(
  userId: string,
  state: OnboardingState,
): Promise<void> {
  return getUserRepo().setOnboardingState(userId, state);
}

/** Lists every Israeli city from `public.cities` ordered by Hebrew name. */
export function listCities(): Promise<City[]> {
  return getCityRepo().listAll();
}

/** FR-CLOSURE-004 AC3 — flips users.closure_explainer_dismissed = true. */
export function getDismissClosureExplainerUseCase(): DismissClosureExplainerUseCase {
  if (!_dismissClosureExplainer) {
    _dismissClosureExplainer = new DismissClosureExplainerUseCase(getUserRepo());
  }
  return _dismissClosureExplainer;
}

/** FR-CLOSURE-003 (extension) — search any user for the closure recipient picker. */
export function getSearchUsersForClosureUseCase(): SearchUsersForClosureUseCase {
  if (!_searchUsersForClosure) {
    _searchUsersForClosure = new SearchUsersForClosureUseCase(getUserRepo());
  }
  return _searchUsersForClosure;
}

/** FR-SETTINGS-012 V1 — self-delete the currently authenticated user. */
export function getDeleteAccountUseCase(): DeleteAccountUseCase {
  if (!_deleteAccount) {
    _deleteAccount = new DeleteAccountUseCase(getUserRepo());
  }
  return _deleteAccount;
}
