// Google Identity Services (GIS) adapter for the in-app sign-in sheet (web only).
// Mapped to SRS: FR-AUTH-003 (Google sign-up), FR-AUTH-007 (sign-in).
// The companion native stub lives next door (`googleIdentityServices.ts`) and
// throws if called — Metro/expo router pick the right file by the `.web.ts`
// extension. Google blocks iframe embedding of `accounts.google.com`, so the
// account picker is rendered by GIS itself (FedCM overlay on Chrome/Edge/Brave,
// fallback popup on Safari/Firefox); this module only orchestrates the SDK.
// docs/SSOT/spec/01_auth_and_onboarding.md

declare global {
  // eslint-disable-next-line @typescript-eslint/consistent-type-definitions
  interface Window {
    google?: {
      accounts?: {
        id?: {
          initialize: (config: GisInitializeConfig) => void;
          renderButton: (parent: HTMLElement, options: GisButtonOptions) => void;
          cancel: () => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

interface GisInitializeConfig {
  client_id: string;
  callback: (resp: { credential: string; select_by?: string }) => void;
  ux_mode?: 'popup' | 'redirect';
  use_fedcm_for_prompt?: boolean;
  auto_select?: boolean;
  itp_support?: boolean;
  nonce?: string;
}

interface GisButtonOptions {
  type?: 'standard' | 'icon';
  theme?: 'outline' | 'filled_blue' | 'filled_black';
  size?: 'large' | 'medium' | 'small';
  text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
  shape?: 'rectangular' | 'pill' | 'circle' | 'square';
  logo_alignment?: 'left' | 'center';
  width?: number;
  locale?: string;
}

export class GoogleIdentityServicesUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'GoogleIdentityServicesUnavailable';
  }
}

export interface GoogleCredential {
  readonly idToken: string;
  /** Raw (un-hashed) nonce passed back so the caller can hand it to Supabase. */
  readonly rawNonce: string;
}

export interface RenderGoogleButtonOptions {
  readonly host: HTMLElement;
  readonly clientId: string;
  readonly width: number;
  readonly onCredential: (cred: GoogleCredential) => void;
  readonly onError: (err: Error) => void;
}

/**
 * Wait for the GIS SDK to finish loading (script tag in `+html.tsx`). Times
 * out after `timeoutMs` ms so a network failure surfaces an in-sheet error
 * instead of a silent hang.
 */
export async function waitForGoogleIdentityServices(timeoutMs = 4000): Promise<void> {
  if (typeof window === 'undefined') {
    throw new GoogleIdentityServicesUnavailable('window_undefined');
  }
  if (window.google?.accounts?.id) return;
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (window.google?.accounts?.id) return;
    await new Promise<void>((r) => setTimeout(r, 80));
  }
  throw new GoogleIdentityServicesUnavailable('gis_script_load_timeout');
}

/**
 * Render a Google-styled "Continue with Google" button into `host`. On click,
 * GIS opens its picker (FedCM or popup) and calls `onCredential` with the
 * resulting id_token plus the **raw** nonce — caller passes that pair to
 * Supabase via `signInWithIdToken`.
 */
export async function renderGoogleButton(opts: RenderGoogleButtonOptions): Promise<() => void> {
  await waitForGoogleIdentityServices();
  const id = window.google?.accounts?.id;
  if (!id) throw new GoogleIdentityServicesUnavailable('gis_unavailable_after_wait');

  const rawNonce = await generateRawNonce();
  const hashedNonce = await sha256Hex(rawNonce);

  id.initialize({
    client_id: opts.clientId,
    callback: (resp) => {
      if (!resp?.credential) {
        opts.onError(new Error('gis_no_credential'));
        return;
      }
      opts.onCredential({ idToken: resp.credential, rawNonce });
    },
    ux_mode: 'popup',
    use_fedcm_for_prompt: true,
    auto_select: false,
    itp_support: true,
    nonce: hashedNonce,
  });

  // Clear any previous render before re-rendering (sheet may re-mount).
  opts.host.innerHTML = '';
  id.renderButton(opts.host, {
    type: 'standard',
    theme: 'outline',
    size: 'large',
    text: 'continue_with',
    shape: 'pill',
    logo_alignment: 'left',
    width: opts.width,
    locale: 'he',
  });

  return () => {
    try {
      id.cancel();
    } catch {
      // SDK throws if no prompt is active; safe to ignore.
    }
  };
}

async function generateRawNonce(): Promise<string> {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

async function sha256Hex(input: string): Promise<string> {
  const enc = new TextEncoder().encode(input);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function base64UrlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}
