# 2.11 Settings

> **Status:** ✅ Core Complete — Settings layout, privacy, legal, about, logout shipped. FR-SETTINGS-006 (Notifications toggles) shipped in P1.5 PR-1.



Prefix: `FR-SETTINGS-*`

---

## Scope

The Settings screen and its sub-pages:

- Account info (read-only in MVP except where noted).
- Notification preferences (`Critical` / `Social` toggles).
- Privacy controls (profile mode, follow requests entry; blocked-users entry deferred per `EXEC-9`).
- Stats shortcut.
- Support & legal.
- Logout.
- Account deletion.
- **About (in-app):** long-form narrative (vision beyond MVP, roadmap, FAQ, team, Instagram embed) with section navigation; marketing alias route `/about-site` and optional `hideTopBar` / `hideBottomBar` query flags for embedded web shells.
  - **AC (About refresh, 2026-05-16):** Problems / Features / Goals share a synchronized MVP↔Vision scope toggle (default MVP on each screen visit; not persisted). Vision uses a short lead plus a single expandable block for deeper KPI-style prose. Roadmap phases show a summary with independently expandable per-phase details. Mission and Team are one scroll target (dual section anchors). Values copy reflects product transparency plus optional user anonymity (no “privacy by default” product framing). Contact lists WhatsApp (community + personal), two mailto links, in-app report CTA, and an explicit out-of-app Bit/PayBox note with the published phone number. Instagram on web uses no embedded browser module—static card + external open only.

---

## FR-SETTINGS-001 — Settings screen layout

**Description.**
A single screen of grouped rows. Tapping a group either toggles inline or navigates deeper.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `05_Screen_UI_Mapping.md` §5.1.

**Acceptance Criteria.**
- AC1. Sections (in this order): Account, Notifications, Privacy, My Stats, Support, Legal, Logout, Delete Account.
- AC2. Section headers are localized; their order does not change on tap or scroll.
- AC3. Destructive actions (Logout, Delete Account) are visually subdued unless tapped.

**Related.** Screens: 5.1.

---

## FR-SETTINGS-002 — Account section

**Description.**
Read-only display of identity fields plus a "Change password" affordance for email-method users.

**Source.**
- PRD: `03_Core_Features.md` §3.5.

**Acceptance Criteria.**
- AC1. Shown: `display_name` (read-only here, edited via `FR-PROFILE-007`), the masked phone or email (read-only), the auth method label.
- AC2. "Change password" is shown only when `auth_method = email` and routes to a dedicated screen requiring the current password.
- AC3. SSO users see a small note: "Your sign-in is managed by Google" (or Apple) with a link to those services.

**Related.** Domain: `User`, `AuthMethod`.

---

## FR-SETTINGS-003 — Privacy section: profile mode toggle

**Description.**
The privacy mode toggle (`Public` ↔ `Private`) lives here, not in Edit Profile.

**Source.**
- PRD: `03_Core_Features.md` §3.2.5, §3.5, `05_Screen_UI_Mapping.md` §5.1.

**Acceptance Criteria.**
- AC1. The control is a single switch labeled "Private profile" (off by default = `Public`).
- AC2. Toggling triggers `FR-PROFILE-005` or `FR-PROFILE-006` accordingly.
- AC3. The current mode is reflected immediately on the user's profile screens.

**Related.** Screens: 5.1.

---

## FR-SETTINGS-004 — Privacy section: follow-requests entry

**Description.**
A row entry leading to the Follow Requests screen, visible only when the profile is `Private`.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `05_Screen_UI_Mapping.md` §5.4.

**Acceptance Criteria.**
- AC1. Row label: "Follow requests (X)" with X being the current pending count.
- AC2. Tapping navigates to `FR-FOLLOW-007` (screen 5.4).
- AC3. The row is hidden when `User.privacy_mode = Public`.
- AC4. The My Profile card `⋮` overflow omits the same entry when `User.privacy_mode = Public` (parity with the Settings list).

**Related.** Screens: 5.4.

---

## FR-SETTINGS-005 — Privacy section: blocked users entry — **DEPRECATED (post-MVP)**

**Status.** ⚠️ Out of MVP scope per `EXEC-9` (2026-05-11). No row is rendered in Settings → Privacy because `FR-MOD-004` (Unblock a user) is deferred post-MVP.

**Description.**
A row entry leading to the Blocked Users screen.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `05_Screen_UI_Mapping.md` §5.3.

**Acceptance Criteria.**
- AC1. Row label: "Blocked users".
- AC2. Tapping navigates to a list (`FR-MOD-004` — deferred).
- AC3. The row is always shown regardless of privacy mode.

**Related.** Screens: 5.3.

---

## FR-SETTINGS-006 — Notifications section

**Description.**
Two toggles for Critical and Social notifications.

**Source.**
- PRD: `03_Core_Features.md` §3.5.
- Decisions: `D-5`.

**Acceptance Criteria.**
- AC1. Toggles: `Critical` (on by default) and `Social` (on by default).
- AC2. Tapping a toggle calls `FR-NOTIF-014` and persists preferences.
- AC3. A short caption beneath each toggle explains what is included (per the lists in [`09_notifications.md`](./09_notifications.md)).

**Related.** Screens: 5.1.

---

## FR-SETTINGS-007 — My stats shortcut

**Description.**
A row that opens the personal stats screen.

**Source.**
- PRD: `03_Core_Features.md` §3.5.

**Acceptance Criteria.**
- AC1. Label: "My stats".
- AC2. Tapping navigates to `FR-STATS-001`.

**Related.** Screens: 5.2.

---

## FR-SETTINGS-008 — Support: report an issue

**Description.**
The Settings entry into the Super Admin support thread.

**Source.**
- PRD: `03_Core_Features.md` §3.5, `04_User_Flows.md` Flow 9.B.
- Constraints: `R-MVP-Privacy-4a`.

**Acceptance Criteria.**
- AC1. Label: "Report an issue".
- AC2. Tapping opens the Report Issue modal (`FR-MOD-002`).
- AC3. After modal submission, the user lands on the conversation screen (`FR-CHAT-007`).

**Related.** Screens: 5.1, 6.1b.

---

## FR-SETTINGS-009 — Support: backup contact email

**Description.**
A non-actionable line offering an out-of-app contact for emergencies.

**Source.**
- PRD: `03_Core_Features.md` §3.5.

**Acceptance Criteria.**
- AC1. Displays a `mailto:support@karma.community` link as a fallback.
- AC2. The link opens the user's default mail composer with no subject.

---

## FR-SETTINGS-010 — Legal section

**Description.**
Links to Terms of Service and Privacy Policy.

**Source.**
- PRD: `03_Core_Features.md` §3.5.

**Acceptance Criteria.**
- AC1. Two rows that open in-app web views with the canonical URLs.
- AC2. Both URLs are configurable via remote config.
- AC3. Older user must re-acknowledge if the legal documents have a newer effective date than the user's last acceptance (`FR-AUTH-002`).

---

## FR-SETTINGS-011 — Logout

**Description.**
Triggers `FR-AUTH-017`.

**Acceptance Criteria.**
- AC1. Single tap with a confirmation modal: *"Sign out of Karma Community?"*.
- AC2. On confirm, the device is signed out and routed to Splash.

---

## FR-SETTINGS-012 — Delete account

**Description.**
The user permanently deletes their own account.

**Source.**
- PRD: `03_Core_Features.md` §3.5.
- Constraints: `R-MVP-Privacy-6`.
- Decisions: `D-12`, `D-14`.

**Acceptance Criteria.**
- AC1. The action requires a two-step confirmation: a warning modal listing consequences, followed by typing the user's display name to confirm.
- AC2. On confirm:
   - All `Post`s owned by the user are hard-deleted (with image assets), regardless of status.
   - All `Chat`s and `Message`s authored by the user are kept on the counterpart side as per `D-14` ("Deleted user" placeholder).
   - The `User` row is moved to a soft-deleted state (`account_status = deleted`, anonymized fields).
   - A `DeletedIdentifier` cooldown row is created (`FR-AUTH-016`).
   - All `FollowEdge` and `FollowRequest` rows involving the user are hard-deleted.
   - All push tokens are unregistered.
- AC3. After 30 days, a hard-delete job purges the soft-deleted `User` row.
- AC4. An email confirmation (`FR-NOTIF-012`) is sent on initial deletion if an email is on file.
- AC5. Audit event recorded.

**Related.** Domain: `User`, `Post`, `Chat`, `FollowEdge`, `DeletedIdentifier`.

---

## FR-SETTINGS-013 — Read-only contact change

**Description.**
The MVP does not allow self-service phone/email changes; the Settings screen explains how to request a change.

**Source.**
- PRD: `03_Core_Features.md` §3.2.5.

**Acceptance Criteria.**
- AC1. Tapping the masked phone/email row reveals a friendly modal: *"Need to change your phone or email? Please contact Support."*
- AC2. The modal contains a CTA that opens the Report Issue flow (`FR-MOD-002`) pre-categorized as `Account`.

---

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft from PRD §3.5 and Decisions D-5, D-12, D-14. |
