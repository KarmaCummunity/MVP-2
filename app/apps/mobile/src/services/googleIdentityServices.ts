// Native (iOS/Android) stub for the Google Identity Services adapter.
// Native sign-in uses the existing `WebBrowser.openAuthSessionAsync` PKCE flow
// in `authComposition.ts`; this module exists only so the shared types can be
// imported from cross-platform code without bundling the browser SDK on native.
// docs/SSOT/spec/01_auth_and_onboarding.md

export class GoogleIdentityServicesUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleIdentityServicesUnavailable';
  }
}

export interface GoogleCredential {
  readonly idToken: string;
  readonly rawNonce: string;
}

export interface RenderGoogleButtonOptions {
  readonly host: unknown;
  readonly clientId: string;
  readonly width: number;
  readonly onCredential: (cred: GoogleCredential) => void;
  readonly onError: (err: Error) => void;
}

export async function waitForGoogleIdentityServices(_timeoutMs?: number): Promise<void> {
  throw new GoogleIdentityServicesUnavailable('native_unsupported');
}

export async function renderGoogleButton(_opts: RenderGoogleButtonOptions): Promise<() => void> {
  throw new GoogleIdentityServicesUnavailable('native_unsupported');
}
