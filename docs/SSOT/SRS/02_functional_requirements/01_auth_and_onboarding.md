# 2.1 Authentication & Onboarding

[← back to Part II index](./README.md)

Prefix: `FR-AUTH-*`

---

## Scope

Everything from app launch through the moment the user lands on the Home Feed for the first time, including:

- Splash / Welcome screen
- Sign-up & sign-in entry points
- Three core authentication methods (Google SSO, Phone OTP, Email + password) plus Apple SSO on iOS
- 3-step onboarding wizard (basic info → profile photo → tour)
- Returning-user session resumption
- Guest preview
- Account deletion & re-registration cooldown

Out of scope here (see referenced files):

- Profile editing after onboarding → [`02_profile_and_privacy.md`](./02_profile_and_privacy.md)
- Settings screen (where the user logs out) → [`11_settings.md`](./11_settings.md)

---

## FR-AUTH-001 — Splash & Welcome screen

**Description.**
Every unauthenticated launch starts on the Splash / Welcome screen showing the value proposition, a primary "Sign up" button, and a secondary "Log in" button.

**Source.**
- PRD: `04_User_Flows.md` Flow 1, `05_Screen_UI_Mapping.md` §1.1.
- Constraints: `R-MVP-Core-2`.

**Acceptance Criteria.**
- AC1. The screen renders within `NFR-PERF-001` (cold-start budget) and exposes both CTAs above the fold on every supported breakpoint.
- AC2. Tapping "Sign up" or "Log in" navigates to the auth screen (`FR-AUTH-002`).
- AC3. A "View as Guest" affordance is visible and routes to `FR-AUTH-014`.
- AC4. The screen is the only screen reachable in the unauthenticated state; any deep link that targets an authenticated screen redirects here first.

**Edge Cases.**
- A user who has a valid session token never sees this screen on launch (see `FR-AUTH-013`).

**Related.** Screens: 1.1 · Domain: `Session`.

---

## FR-AUTH-002 — Authentication entry screen

**Description.**
A single screen exposes all available authentication methods. The set of methods shown is platform-dependent.

**Source.**
- PRD: `03_Core_Features.md` §3.1.1, `05_Screen_UI_Mapping.md` §1.2.
- Constraints: `R-MVP-Core-8`.

**Acceptance Criteria.**
- AC1. On Android and Web, the screen shows: "Continue with Google", "Phone (OTP)" tab, "Email + password" tab.
- AC2. On iOS, the screen additionally shows "Continue with Apple" alongside "Continue with Google" (App Store mandatory parity).
- AC3. The screen offers a single Terms-of-Service consent checkbox required for sign-up; sign-in does not require re-consent.
- AC4. Selecting a method that is unavailable due to a misconfiguration (e.g. Google client not initialized) surfaces a non-blocking error toast and the screen remains usable for the other methods.

**Edge Cases.**
- A user who already linked one method cannot link a second one in MVP (`FR-AUTH-009`).
- A user installing on iOS who previously signed up on Web with email continues to use email; Apple SSO does not auto-link.

**Related.** Screens: 1.2 · Domain: `AuthMethod` enum.

---

## FR-AUTH-003 — Sign up via Google SSO

**Description.**
A new user signs up using Google and lands in the onboarding wizard with name and profile photo prefilled when available.

**Source.**
- PRD: `03_Core_Features.md` §3.1.1, `04_User_Flows.md` Flow 1.
- Constraints: `R-MVP-Core-8`, `R-MVP-Core-9`.

**Acceptance Criteria.**
- AC1. After successful Google authorization, the system creates a `User` record with `auth_method = google`, the verified Google account email, and pre-populates `display_name` and `avatar_url` from the Google profile when permitted.
- AC2. If a `User` already exists for the same Google `sub`, the user is signed in (treated as `FR-AUTH-007`) — no duplicate created.
- AC3. The user proceeds to the onboarding wizard (`FR-AUTH-010`) with the prefilled fields editable.
- AC4. Cancellation of the Google consent screen returns the user to `FR-AUTH-002` with no state change.

**Edge Cases.**
- The Google account has no profile picture: user proceeds with the default silhouette and is offered the upload step in onboarding.
- The Google account email matches a previously deleted account inside the 30-day cooldown (`FR-AUTH-016`): sign-up is rejected with a clear message instructing to retry after the cooldown.

**Related.** Screens: 1.2, 1.4–1.6 · Domain: `User`, `Session`, `AuthMethod`.

---

## FR-AUTH-004 — Sign up via Apple SSO (iOS only)

**Description.**
On iOS, a user may sign up with "Sign in with Apple". The flow is otherwise identical to `FR-AUTH-003`.

**Source.**
- PRD: `03_Core_Features.md` §3.1.1, `06_Navigation_Structure.md` §6.6.3.
- Constraints: `R-MVP-Core-8`.

**Acceptance Criteria.**
- AC1. On iOS, the button is rendered with parity to Google. On Android and Web, the button is **not** rendered.
- AC2. The system creates a `User` with `auth_method = apple`. Apple's "hide email" relay is stored as the canonical email; the user is informed once that email change requires support.
- AC3. Apple's `name` payload is captured and pre-populated into the onboarding wizard. Re-authentications do not re-deliver this payload — the system must not depend on it after the first completion.

**Edge Cases.**
- The user revokes Apple authorization later (Settings > Apple ID): existing app session remains valid until token expiry; subsequent re-auth attempts route to `FR-AUTH-002`.

**Related.** Screens: 1.2 · Domain: `User`, `Session`, `AuthMethod`.

---

## FR-AUTH-005 — Sign up via phone (OTP)

**Description.**
A user signs up with an Israeli mobile number, receives a 6-digit OTP via SMS, and confirms.

**Source.**
- PRD: `03_Core_Features.md` §3.1.1, `05_Screen_UI_Mapping.md` §1.3.
- Constraints: `R-MVP-Core-8`, `R-MVP-Privacy-2`.

**Acceptance Criteria.**
- AC1. Country code is fixed to `+972` and not user-editable in MVP.
- AC2. The OTP code is exactly 6 digits, valid for 10 minutes, and consumable once.
- AC3. After 5 failed attempts on the same OTP, the user is locked out for 60 minutes and a security event is logged.
- AC4. After successful verification, the system creates a `User` with `auth_method = phone`. The phone number is stored normalized (E.164) and is the unique identifier for that user.
- AC5. A "Resend code" button is offered after a 60-second cooldown; total resends per request: 3.

**Edge Cases.**
- Phone is already registered: the flow becomes sign-in (`FR-AUTH-007`); the registration step is skipped.
- Phone matches a deleted-account cooldown: rejected per `FR-AUTH-016`.

**Related.** Screens: 1.2, 1.3 · Domain: `User`, `OtpChallenge`.

---

## FR-AUTH-006 — Sign up via email + password

**Description.**
A user signs up with email and a password, with a verification email containing a magic link to confirm.

**Source.**
- PRD: `03_Core_Features.md` §3.1.1.
- Constraints: `R-MVP-Core-8`.

**Acceptance Criteria.**
- AC1. Password is at least 8 characters, contains at least one letter and one digit, and does not appear in the top-100k breached-passwords list at sign-up time.
- AC2. The account is created in `pending_verification` state until the email link is clicked. In `pending_verification`, the user can sign in but cannot create posts, send messages, or follow others. The home screen shows a non-dismissible banner explaining what is missing.
- AC3. The verification email is sent via the platform's transactional email service and arrives within 60 seconds at p95.
- AC4. The link is single-use, valid for 24 hours, and expires after consumption.
- AC5. "Forgot password" sends a single-use reset link valid for 30 minutes.

**Edge Cases.**
- Email already used: shown with a benign message ("An account exists. Try logging in or reset your password") that does not confirm registration status (anti-enumeration).
- Email matches a deleted-account cooldown: rejected per `FR-AUTH-016`.

**Related.** Screens: 1.2 · Domain: `User`, `EmailVerification`, `PasswordReset`.

---

## FR-AUTH-007 — Sign in (any method)

**Description.**
A returning user authenticates using the method they originally signed up with.

**Source.**
- PRD: `03_Core_Features.md` §3.1.1, `04_User_Flows.md` Flow 2.

**Acceptance Criteria.**
- AC1. After successful authentication, the user lands on the Home Feed (`FR-FEED-001`), bypassing the onboarding wizard if `User.onboarding_state = completed`.
- AC2. If onboarding is incomplete (`pending_basic_info` or `pending_avatar`), the wizard resumes at the appropriate step on next session start.
- AC3. The session token is stored in platform-secure storage (Keychain on iOS, EncryptedSharedPreferences on Android, a secure HTTP-only cookie on Web).
- AC4. Session expiry is 30 days of inactivity. Active use silently refreshes the token.

**Related.** Screens: 1.2, 1.3 · Domain: `Session`.

---

## FR-AUTH-008 — Forgot password (email method only)

**Description.**
A user with the email method can request a password reset link.

**Source.**
- PRD: `03_Core_Features.md` §3.1.3.

**Acceptance Criteria.**
- AC1. The reset request returns a uniform success message regardless of whether the email is registered (anti-enumeration).
- AC2. The reset link is single-use, expires in 30 minutes, and invalidates all existing sessions when consumed.
- AC3. After password change, the user is prompted to sign in again on every device.

**Related.** Domain: `PasswordReset`.

---

## FR-AUTH-009 — One auth method per account

**Description.**
The MVP does not allow linking multiple authentication methods to the same account.

**Source.**
- PRD: `03_Core_Features.md` §3.1.4.
- Constraints: `R-MVP-Core-6`, `R-MVP-Core-8`.

**Acceptance Criteria.**
- AC1. The data model represents `auth_method` as a single value on `User`.
- AC2. Attempting a second sign-up with a Google account whose email matches a phone-registered user creates a **separate** account; the system informs the user that account linking is not yet supported and offers to use the original method.
- AC3. The schema must be future-compatible with multi-method linking (the `auth_method` field is part of a one-to-many `AuthIdentity` relationship in the domain model — see [`03_domain_model.md`](../03_domain_model.md)).

---

## FR-AUTH-010 — Onboarding step 1: Basic Info

**Description.**
Captures `display_name` and `city` as the first onboarding step.

**Source.**
- PRD: `03_Core_Features.md` §3.1.2, `05_Screen_UI_Mapping.md` §1.4.
- Constraints: `R-MVP-Profile-1`, `R-MVP-Core-5`.

**Acceptance Criteria.**
- AC1. `display_name` accepts up to 50 characters; whitespace-only is rejected.
- AC2. `city` is a dropdown of the canonical Israeli city list seeded by the system. No free-text city.
- AC3. A "Skip" option exists. Skipping advances to step 2 but marks `User.onboarding_state = pending_basic_info`. The first attempt at a meaningful action (post creation, follow, sending the first chat message) re-prompts to fill these fields (see `FR-AUTH-015`).
- AC4. SSO-prefilled values are editable and persisted upon "Continue".

**Edge Cases.**
- The city list is updated post-launch: existing users with an obsolete city retain it; an inline notice shown next time they edit their profile suggests selecting a current city.

**Related.** Screens: 1.4 · Domain: `User`, `City`.

---

## FR-AUTH-011 — Onboarding step 2: Profile Photo

**Description.**
Captures an optional profile photo.

**Source.**
- PRD: `03_Core_Features.md` §3.1.2, `05_Screen_UI_Mapping.md` §1.5.

**Acceptance Criteria.**
- AC1. Two source options: camera capture (mobile only) and gallery / file upload.
- AC2. Image is resized client-side to a max edge of 1024px and re-encoded to JPEG q=85 before upload.
- AC3. Skipping leaves the user with a generated initial-letter silhouette as avatar.
- AC4. SSO-prefilled photo is shown by default; the user may replace or remove it.
- AC5. Upload errors are recoverable: the user can proceed without a photo and add it later via Edit Profile (`FR-PROFILE-007`).

**Related.** Screens: 1.5 · Domain: `User.avatar_url`.

---

## FR-AUTH-012 — Onboarding step 3: Welcome Tour

**Description.**
A 3-slide explanation of the core value loop, followed by entry to the Home Feed.

**Source.**
- PRD: `03_Core_Features.md` §3.1.2, `05_Screen_UI_Mapping.md` §1.6.

**Acceptance Criteria.**
- AC1. Three slides with the messages defined in PRD §3.1.2 (paraphrased to fit copy guidelines, but conceptually identical).
- AC2. A "Skip" link is present on every slide and routes directly to the Home Feed.
- AC3. On completion, `User.onboarding_state = completed` and the user lands on `FR-FEED-001`.
- AC4. The tour is shown only once per account; subsequent sign-ins skip it.

**Related.** Screens: 1.6.

---

## FR-AUTH-013 — Returning user fast path

**Description.**
A user with a valid session token who launches the app skips Splash and Auth and lands on the Home Feed.

**Source.**
- PRD: `04_User_Flows.md` Flow 2.

**Acceptance Criteria.**
- AC1. Session validity is checked against the auth backend on every cold start; expired or revoked sessions route the user to Splash.
- AC2. If the user was inactive for >24 hours, deep links from the OS resume to the Home Feed rather than the deep-linked screen, then optionally re-route after 1 second to honor the deep link (see `FR-AUTH-013.b`).
- AC3. While the session check is pending, a branded loading splash is shown for at most 2 seconds; longer durations show a "Tap to retry" affordance.

**Edge Cases.**
- Token revoked server-side: user is silently logged out and redirected to Splash.

**Related.** Domain: `Session`.

---

## FR-AUTH-014 — Guest Preview

**Description.**
A non-authenticated user may view a sample of the feed (3 posts) before being asked to sign up.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.4, `05_Screen_UI_Mapping.md` §1.7.
- Constraints: `R-MVP-Core-2`.

**Acceptance Criteria.**
- AC1. The guest feed shows the 3 most recent **public** posts in chronological order across all of Israel.
- AC2. Guest interactions are blocked: tapping a post / a profile / the "+" button / the message icon all surface the sign-up overlay (`FR-AUTH-014.a`).
- AC3. The overlay copy emphasizes the size of the active community (parameterized count, see `FR-FEED-014`).
- AC4. Closing the overlay returns the user to the guest feed; sign-up routes to `FR-AUTH-002`.

**Edge Cases.**
- Fewer than 3 public posts exist system-wide: show all available; do not pad with closed posts.

**Related.** Screens: 1.7.

---

## FR-AUTH-015 — Soft gate before first meaningful action

**Description.**
A user whose `onboarding_state` is `pending_basic_info` and who attempts to create a post, follow another user, or send the first chat message is interrupted by a non-bypassable modal asking for `display_name` and `city`.

**Source.**
- Decisions: `D-10`.
- PRD: `03_Core_Features.md` §3.1.2 (in spirit).

**Acceptance Criteria.**
- AC1. The modal contains the same fields as Onboarding step 1 and a single "Save and continue" button.
- AC2. Cancelling the modal returns the user to the previous screen with no side effects.
- AC3. After save, the system continues into the originally attempted action.

**Edge Cases.**
- The user closes the app mid-modal: the next launch shows the modal again upon attempting any meaningful action.

**Related.** Domain: `User.onboarding_state`.

---

## FR-AUTH-016 — Account deletion & re-registration cooldown

**Description.**
A deleted account's primary identifier (phone, email, or SSO `sub`) cannot be reused for re-registration for 30 days after deletion.

**Source.**
- Decisions: `D-12`.
- PRD: `03_Core_Features.md` §3.5 (Account deletion).
- Constraints: `R-MVP-Privacy-6`.

**Acceptance Criteria.**
- AC1. On account deletion, the system retains an opaque hash of the identifier with a `deleted_at` timestamp until `deleted_at + 30 days`, after which the record is hard-deleted.
- AC2. Sign-up attempts whose identifier hashes match an entry in the cooldown table are rejected with the message: *"This identifier was used by an account that was recently deleted. You can register again 30 days after deletion."*
- AC3. Cooldown rejection events are counted into security telemetry; >5 rejections from the same device fingerprint within 7 days triggers a soft-block on the device.

**Edge Cases.**
- Phone reuse by a different person within the cooldown is impossible — by design, prevents privacy leaks (the new owner could see leftover artifacts otherwise).

**Related.** Domain: `DeletedIdentifier`.

---

## FR-AUTH-017 — Logout

**Description.**
The user can log out from the Settings screen, terminating the local session.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `05_Screen_UI_Mapping.md` §5.1.

**Acceptance Criteria.**
- AC1. Logout invalidates the local session token immediately and returns the user to Splash.
- AC2. Server-side session is also revoked; subsequent uses of the old token are rejected.
- AC3. Pending realtime subscriptions and push tokens registered for the device are unsubscribed before redirect.

**Related.** Screens: 5.1.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft from PRD §3.1, §3.5, and Decisions D-10, D-12. |
