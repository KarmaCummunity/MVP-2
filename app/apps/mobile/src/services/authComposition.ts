// ─────────────────────────────────────────────
// Composition root — wires Supabase adapter into application use cases.
// Lives in the mobile app (composition root); not in /domain or /application.
// Mapped to SRS: FR-AUTH-006, FR-AUTH-007, FR-AUTH-013, FR-AUTH-017
// ─────────────────────────────────────────────

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseAuthService,
} from '@kc/infrastructure-supabase';
import {
  RestoreSessionUseCase,
  SignInWithEmailUseCase,
  SignOutUseCase,
  SignUpWithEmailUseCase,
  type IAuthService,
} from '@kc/application';

let _authService: IAuthService | null = null;
let _signUp: SignUpWithEmailUseCase | null = null;
let _signIn: SignInWithEmailUseCase | null = null;
let _signOut: SignOutUseCase | null = null;
let _restore: RestoreSessionUseCase | null = null;

function getAuthService(): IAuthService {
  if (_authService) return _authService;
  const client = getSupabaseClient({ storage: AsyncStorage });
  _authService = new SupabaseAuthService(client);
  return _authService;
}

export function getSignUpUseCase(): SignUpWithEmailUseCase {
  if (!_signUp) _signUp = new SignUpWithEmailUseCase(getAuthService());
  return _signUp;
}

export function getSignInUseCase(): SignInWithEmailUseCase {
  if (!_signIn) _signIn = new SignInWithEmailUseCase(getAuthService());
  return _signIn;
}

export function getSignOutUseCase(): SignOutUseCase {
  if (!_signOut) _signOut = new SignOutUseCase(getAuthService());
  return _signOut;
}

export function getRestoreSessionUseCase(): RestoreSessionUseCase {
  if (!_restore) _restore = new RestoreSessionUseCase(getAuthService());
  return _restore;
}

export function subscribeToSession(
  listener: (session: ReturnType<IAuthService['getCurrentSession']> extends Promise<infer S> ? S : never) => void,
): () => void {
  return getAuthService().onSessionChange(listener);
}
