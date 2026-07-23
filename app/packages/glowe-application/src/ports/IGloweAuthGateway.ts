// FR-GLOWE-023 / D-62 — GloWe auth session port (isolated from KC web session).

export interface GloweAuthSession {
  readonly userId: string;
  readonly email?: string;
}

export interface GloweGoogleSignInResult {
  readonly url?: string;
}

export interface IGloweAuthGateway {
  signInWithGoogle(redirectTo: string): Promise<GloweGoogleSignInResult | null>;
  /** D-62 — `scope: 'local'` clears only GloWe's storage key. */
  signOut(): Promise<boolean | null>;
  getSession(): Promise<GloweAuthSession | null>;
}
