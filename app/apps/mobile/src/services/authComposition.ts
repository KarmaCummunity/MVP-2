// ─────────────────────────────────────────────
// Composition root — wires Supabase adapter into application use cases.
// Lives in the mobile app (composition root); not in /domain or /application.
// Mapped to SRS: FR-AUTH-003 (Google sign-up), FR-AUTH-006 (email sign-up),
// FR-AUTH-007 (sign-in, all paths), FR-AUTH-013 (cold-start restore), FR-AUTH-017 (sign-out).
// docs/SSOT/spec/01_auth_and_onboarding.md
// ─────────────────────────────────────────────

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
  getSupabaseClient,
  SupabaseAccountGateRepository,
  SupabaseAuthService,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  RestoreSessionUseCase,
  SignInWithEmailUseCase,
  SignInWithGoogleUseCase,
  SignOutUseCase,
  SignUpWithEmailUseCase,
  ResendVerificationEmailUseCase,
  VerifyEmailUseCase,
  type AuthSession as KcAuthSession,
  type IAuthService,
  type OpenAuthSession,
} from '@kc/application';

let _authService: IAuthService | null = null;
let _signUp: SignUpWithEmailUseCase | null = null;
let _signIn: SignInWithEmailUseCase | null = null;
let _signInGoogle: SignInWithGoogleUseCase | null = null;
let _signOut: SignOutUseCase | null = null;
let _restore: RestoreSessionUseCase | null = null;
let _resend: ResendVerificationEmailUseCase | null = null;
let _verifyEmail: VerifyEmailUseCase | null = null;

/**
 * Deep link the verification email lands on. Production: web universal link
 * claimed by AASA + assetlinks. Dev (Expo Go without universal links): a
 * custom scheme that opens the app directly.
 */
export const AUTH_VERIFY_URL =
  process.env.EXPO_PUBLIC_AUTH_VERIFY_URL ?? 'https://karma-community-kc.com/auth/verify';

/**
 * Web localStorage exposes async-compatible sync methods; AsyncStorage is for native.
 * Without this, refreshing the web preview drops the session (FR-AUTH-013 regresses on web).
 */
function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

function getAuthService(): IAuthService {
  if (_authService) return _authService;
  const client = getSupabaseClient({ storage: pickStorage() });
  _authService = new SupabaseAuthService(client);
  return _authService;
}

const openAuthSession: OpenAuthSession = async (url, redirectTo) => {
  const result = await WebBrowser.openAuthSessionAsync(url, redirectTo);
  if (result.type === 'success') return result.url;
  return null;
};

/** Deep link the OAuth provider redirects back to. Resolves per-platform via AuthSession. */
export function getOAuthRedirectUri(): string {
  return AuthSession.makeRedirectUri({
    scheme: 'karmacommunity',
    path: 'auth/callback',
  });
}

export function getSignUpUseCase(): SignUpWithEmailUseCase {
  if (!_signUp) _signUp = new SignUpWithEmailUseCase(getAuthService());
  return _signUp;
}

export function getSignInUseCase(): SignInWithEmailUseCase {
  if (!_signIn) _signIn = new SignInWithEmailUseCase(getAuthService());
  return _signIn;
}

export function getSignInWithGoogleUseCase(): SignInWithGoogleUseCase {
  if (!_signInGoogle) {
    _signInGoogle = new SignInWithGoogleUseCase(getAuthService(), openAuthSession);
  }
  return _signInGoogle;
}

export function getSignOutUseCase(): SignOutUseCase {
  if (!_signOut) _signOut = new SignOutUseCase(getAuthService());
  return _signOut;
}

export function getRestoreSessionUseCase(): RestoreSessionUseCase {
  if (!_restore) {
    // TD-68: cold-start restore consults the same server-side gate the 60s
    // in-session poll uses, so a suspended/banned user is signed out before
    // any session-scoped query runs.
    const gate = new SupabaseAccountGateRepository(getSupabaseClient({ storage: pickStorage() }));
    _restore = new RestoreSessionUseCase(getAuthService(), gate);
  }
  return _restore;
}

export function getResendVerificationEmailUseCase(): ResendVerificationEmailUseCase {
  if (!_resend) _resend = new ResendVerificationEmailUseCase(getAuthService());
  return _resend;
}

export function getVerifyEmailUseCase(): VerifyEmailUseCase {
  if (!_verifyEmail) _verifyEmail = new VerifyEmailUseCase(getAuthService());
  return _verifyEmail;
}

/** Used by the `/auth/callback` route to exchange an OAuth code for a session. */
export function exchangeOAuthCode(code: string): Promise<KcAuthSession> {
  return getAuthService().exchangeCodeForSession(code);
}

export function subscribeToSession(
  listener: (session: ReturnType<IAuthService['getCurrentSession']> extends Promise<infer S> ? S : never) => void,
): () => void {
  return getAuthService().onSessionChange(listener);
}
