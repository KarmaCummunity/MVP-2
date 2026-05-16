# 2.2 Profile & Privacy Mode

> **Status:** ✅ Core Complete — Edit profile, privacy toggle, avatar upload all shipped.



Prefix: `FR-PROFILE-*`

---

## Scope

The user-owned and other-user-visible profile surfaces, plus the profile-level privacy switch (`Public` ↔ `Private`).

Includes:

- The "My Profile" screen.
- The "Other User Profile" screen with all variants (public, private-with-approved-follow, private-without-approved-follow).
- Profile editing (name, city, optional street + number — stored for post defaults / proximity; **not** shown on profile headers), biography, avatar).
- Profile privacy toggle and its consequences.
- Public-vs-private counters for active posts.

Out of scope here:

- Follow / unfollow / follow-request mechanics → [`03_following.md`](./03_following.md)
- Per-post visibility level → [`04_posts.md`](./04_posts.md)
- Posts list within the profile → linked from [`04_posts.md`](./04_posts.md)

### Cross-reference — closed post detail

Taps from the profile **Closed Posts** tab open Post Detail per `FR-PROFILE-001 AC5`. When `post.status === 'closed_delivered'`, counterparty identity masking and whether the author/recipient rows deep-link to `/user/{handle}` are specified in **`FR-POST-021`** ([`04_posts.md`](./04_posts.md)) via `PostWithOwner.ownerProfileNavigableFromPost` / `recipientProfileNavigableFromPost` and `public.post_actor_identity`. This is **orthogonal** to profile privacy mode (`FR-PROFILE-002` / `FR-PROFILE-003`); see **`D-26`** in [`../DECISIONS.md`](../DECISIONS.md) (visibility vs per-actor identity).

---

## FR-PROFILE-001 — My Profile screen

**Description.**
The signed-in user's own profile, displaying identity, three headline counters, two tabs (active / closed posts), and edit/share actions.

**Source.**
- PRD: `03_Core_Features.md` §3.2.1, `05_Screen_UI_Mapping.md` §3.1.
- Constraints: `R-MVP-Profile-1`.

**Acceptance Criteria.**
- AC1. Header renders avatar, `display_name`, location line (**`city` only**; saved street/number from `FR-PROFILE-007` is **not** shown — used for post defaults and proximity, not profile display), optional biography (≤200 chars), and a small lock icon when the profile is in `Private` mode.
- AC2. Three counters appear in a single row: `followers_count`, `following_count`, and `active_posts_count_internal` (includes `Only-me` posts; see `FR-PROFILE-013`).
- AC3. Two action buttons: "Edit Profile" → `FR-PROFILE-007`, "Share Profile" → produces a deep-link URL.
- AC4. Two tabs:
   - **Active Posts** (Hebrew label: *"פוסטים פתוחים"*): unchanged — lists all `open` posts authored by the user including `Public`, `Followers only`, and `Only me`. Each card carries a visual badge showing its visibility.
   - **Closed Posts** (Hebrew label: *"פוסטים סגורים"*): lists posts where the user is **either the publisher or the respondent**. The publisher side covers status `closed_delivered` and (for the user's own view) `deleted_no_recipient` within the 7-day grace window so they can still reopen — FR-CLOSURE-005 AC4, FR-CLOSURE-008. The respondent side covers only `closed_delivered`. Ordered by `closed_at` desc. Each card shows an economic-role badge derived from `(post.type, identity-role)`: 📤 נתתי when the profile owner is the giver, 📥 קיבלתי when the profile owner is the receiver. (Revised 2026-05-13 per D-19.)
   - **Admin-removed posts (owner-only, not a tab):** on *My Profile*, a `⋮` control anchored to the top-start corner of the profile summary card (visual top-right in RTL / top-left in LTR) opens an overflow that mirrors the profile-adjacent Settings destinations from \`app/settings.tsx\` (account details → \`/edit-profile\`, notifications → \`/settings/notifications\`, private profile → \`/settings/privacy\`, follow requests → \`/settings/follow-requests\`, stats → \`/stats\`) and adds an entry for the dedicated \`removed_admin\` posts list (owner visibility per \`FR-POST-008\` / moderation); that list is not a third posts tab.
- AC5. Tapping a post opens Post Detail in "owner mode" (see `FR-POST-016`).
- AC6. **Counters fallback (MVP, pre-DB-schema)**: until `FR-FOLLOW-*` and `FR-POST-*` ship (see `spec/03_following.md` + `spec/04_posts.md`), the three headline counters render as `0` rather than mock values. They begin reflecting reality from `FR-FOLLOW-*` and `FR-POST-*` onward.

**Edge Cases.**
- A user with zero posts sees a warm empty state on each tab (per `D-15`): "No active posts yet — share your first item or browse the community feed".

**Related.** Screens: 3.1 · Domain: `User`, `Post`, `PrivacyMode`, `PostVisibility`.

---

## FR-PROFILE-002 — Other-user profile (public mode)

**Description.**
Viewing the profile of another user whose `privacy_mode = Public` shows their identity, counters, the "Active Posts" tab, and the follow & message CTAs.

**Source.**
- PRD: `03_Core_Features.md` §3.2.2, `05_Screen_UI_Mapping.md` §3.3.

**Acceptance Criteria.**
- AC1. Header parity with `FR-PROFILE-001` minus edit/share; replaces them with "Follow / Following" and "Send Message" CTAs and a `⋮` menu (`Report`, `Block`).
- AC2. The "Closed Posts" tab on another user's profile follows the same UNION rule as `FR-PROFILE-001 AC4` (publisher ∪ respondent), filtered by each post's `visibility`. Third-party viewers see the same cards but the tap target opens a read-only post detail. (Revised 2026-05-13 per D-19.)
- AC3. Counters reflect the **public** active-posts count, which excludes posts at visibility `Only me` (see `FR-PROFILE-013`).
- AC4. The "Active Posts" tab lists `Public` posts; if I am an approved follower, `Followers only` posts also appear. Posts at `Only me` are never visible to non-owners.

**Related.** Screens: 3.3.

---

## FR-PROFILE-003 — Other-user profile (private mode, not an approved follower)

**Description.**
Viewing the profile of another user whose `privacy_mode = Private` and to whom I am not an approved follower renders **identically to a Public profile** (`FR-PROFILE-002`); the only differences are the follow CTA and the lock indicator.

**Source.**
- PRD: `03_Core_Features.md` §3.2.2 (revised by D-21 — see `DECISIONS.md`).
- Constraints: `R-MVP-Privacy-11` (superseded by D-21).

**Acceptance Criteria.**
- AC1. Header, counters, tabs, and post lists behave exactly as in `FR-PROFILE-002`. There is no locked panel; followers/following lists are reachable from the counters per `FR-PROFILE-010`.
- AC2. Per-post visibility still applies: `FollowersOnly` posts are hidden from non-approved followers regardless of profile privacy; `OnlyMe` posts are hidden from everyone except the owner.
- AC3. Action buttons replace "Follow" with "Send Follow Request" / "Cancel Request" depending on state (see `FR-FOLLOW-006`); "Send Message" remains available (a private profile does not block DMs).
- AC4. The lock icon next to the display name (`FR-PROFILE-012`) is the single user-facing signal that this profile is private.

**Related.** Screens: 3.3 · D-21.

---

## FR-PROFILE-004 — Other-user profile (private mode, approved follower)

**Description.**
Viewing a `Private` profile when I am an approved follower is identical to viewing a `Public` profile where I am an approved follower.

**Source.**
- PRD: `03_Core_Features.md` §3.2.2 (revised by D-21).

**Acceptance Criteria.**
- AC1. Lists, tabs, and counters behave exactly as in `FR-PROFILE-002`.
- AC2. `Followers-only` posts of the profile owner are **included** in the "Active Posts" tab. This is per-post follow-edge logic and is unaffected by the owner's profile privacy.
- AC3. `Only-me` posts of the profile owner are **never** included, even for approved followers.
- AC4. The "Closed Posts" tab is included; behaves as in `FR-PROFILE-002` AC2.

**Related.** Screens: 3.3.

---

## FR-PROFILE-005 — Privacy mode toggle: Public → Private

**Description.**
The user toggles their profile privacy mode from `Public` to `Private` from Settings.

**Source.**
- PRD: `03_Core_Features.md` §3.2.3 ("Public → Private"), `04_User_Flows.md` Flow 12.
- Constraints: `R-MVP-Profile-9`, `R-MVP-Privacy-13`.

**Acceptance Criteria.**
- AC1. The toggle is reachable only via Settings → Privacy (`FR-SETTINGS-003`); it is not exposed inside Edit Profile.
- AC2. Activating the switch shows a confirmation modal explaining the consequences:
   - new follow attempts will require approval,
   - existing followers remain (the user may remove them manually),
   - existing public posts remain public,
   - new posts can now opt for visibility `Followers only`.
- AC3. On confirmation, `User.privacy_mode = Private` and `User.privacy_changed_at = now()`.
- AC4. The mode change is **non-retroactive** for already-published posts (`R-MVP-Privacy-13`).
- AC5. Push notification topics that the user is subscribed to are updated to include `follow_request_received`.

**Related.** Screens: 5.1 · Domain: `User.privacy_mode`.

---

## FR-PROFILE-006 — Privacy mode toggle: Private → Public

**Description.**
The user toggles their profile privacy mode from `Private` to `Public`.

**Source.**
- PRD: `03_Core_Features.md` §3.2.3 ("Private → Public"), `04_User_Flows.md` Flow 12.
- Constraints: `R-MVP-Privacy-13`.

**Acceptance Criteria.**
- AC1. Activating the switch shows a confirmation modal stating that all pending follow requests will be auto-approved and that posts at `Followers only` visibility will remain visible to every new follower from now on.
- AC2. On confirmation, every record in `FollowRequest` for this user with status `pending` transitions atomically to `accepted` and emits a `follow_approved` notification to each requester (`FR-NOTIF-008`).
- AC3. The Follow Requests entry in Settings (`FR-SETTINGS-004`) becomes hidden.
- AC4. `User.privacy_mode = Public` and `User.privacy_changed_at = now()`.

**Edge Cases.**
- A pending request from a user who became blocked in the meantime is **not** auto-approved; it is dropped silently.
- Auto-approval batching: if the user has thousands of pending requests, the system processes them in idempotent chunks; the user-visible state shows zero pending immediately.

**Related.** Screens: 5.1 · Domain: `FollowRequest`.

---

## FR-PROFILE-007 — Edit Profile

**Description.**
The user can change avatar, display name, city, optional street and building number (full address), and biography.

**Source.**
- PRD: `03_Core_Features.md` §3.2.5, `05_Screen_UI_Mapping.md` §3.2.
- Constraints: `R-MVP-Profile-1`, `R-MVP-Profile-6`.

**Acceptance Criteria.**
- AC1. Editable fields: avatar (replace / remove), `display_name` (1–50 chars), `city` (dropdown), optional `street` (1–80 chars) + `street_number` (same pattern as post pickup addresses: digits with optional trailing letter), `biography` (≤200 chars). Street fields are optional as a pair: both empty keeps a city-only profile; when either is filled, both must be valid.
- AC2. Email/phone/Google ID/Apple ID are **read-only** in MVP; the screen shows them but the controls are disabled with a note pointing to Support.
- AC3. Biography validation rejects content matching a configurable URL regex (anti-spam, `R-MVP-Profile-6`); the error is shown inline.
- AC4. Save is atomic: avatar upload completes before the textual fields are persisted; on partial failure, the previous state is preserved.
- AC5. The `display_name` change emits a `profile_updated` analytics event but **no** push notification to followers (privacy / spam control).

**Related.** Screens: 3.2 · Domain: `User`.

---

## FR-PROFILE-008 — Share Profile (deep link)

**Description.**
The user generates a shareable link to their profile.

**Source.**
- PRD: `03_Core_Features.md` §3.2.1.

**Acceptance Criteria.**
- AC1. The link uses the platform's Universal Link / App Link / Web URL scheme defined in [`05_external_interfaces.md`](../archive/SRS/05_external_interfaces.md) §5.7.
- AC2. Opening the link on a device with the app installed deep-links to the profile screen; without the app, it opens the responsive Web profile.
- AC3. Sharing surface uses the OS native share sheet on mobile and `navigator.share` (with clipboard fallback) on Web.
- AC4. The link is canonical and stable: `https://app.karma.community/u/{handle_or_id}`.

**Related.** Domain: `User.share_handle` (assigned at registration).

---

## FR-PROFILE-009 — Followers / Following list (own profile)

**Description.**
Tapping a counter on My Profile opens a list with two tabs.

**Source.**
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ד), `05_Screen_UI_Mapping.md` §3.4.

**Acceptance Criteria.**
- AC1. Two tabs: `Followers` (people who follow me), `Following` (people I follow).
- AC2. Each row: avatar, name, city, dynamic follow button reflecting the **target's** privacy mode and current edge state.
- AC3. Search by name within the list (case-insensitive, prefix match).
- AC4. Each row in the `Followers` tab carries a `⋮` menu with "Remove follower" (`FR-FOLLOW-009`).
- AC5. Lists are paginated server-side at 50 rows per page.

**Related.** Screens: 3.4 · Domain: `FollowEdge`.

---

## FR-PROFILE-010 — Followers / Following list (other user)

**Description.**
Visibility of another user's followers/following lists depends on their privacy mode and my follow state.

**Source.**
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ד).
- Constraints: `R-MVP-Privacy-11`.

**Acceptance Criteria.**
- AC1. Followers and Following lists of any active user are visible to any signed-in viewer, regardless of the target's `privacy_mode`. Blocked counterparts are filtered out per `FR-MOD-009` (when block is reintroduced post-MVP per EXEC-9). Revised by D-21.
- AC2. The actions on each row (Follow / Following / Send Follow Request / Send Message) respect the row target's privacy mode independently — a row representing a Private user shows "Send Follow Request" instead of "Follow".
- AC3. Lists remain paginated server-side at 50 rows per page.

**Related.** Screens: 3.4 · D-21.

---

## FR-PROFILE-011 — Privacy indicator on My Profile

**Description.**
A small lock icon (🔒) is rendered next to the user's display name when the profile is in `Private` mode.

**Source.**
- PRD: `05_Screen_UI_Mapping.md` §3.1 (Profile state indicator).

**Acceptance Criteria.**
- AC1. The icon is rendered if and only if `User.privacy_mode = Private`.
- AC2. Tapping the icon navigates to Settings → Privacy (`FR-SETTINGS-003`) for quick toggling.
- AC3. The icon has an accessible label "Profile is private; tap to manage" per `NFR-A11Y-002`.

**Related.** Screens: 3.1.

---

## FR-PROFILE-012 — Privacy indicator on Other User Profile

**Description.**
The same lock icon appears on another user's profile when they are in `Private` mode.

**Source.**
- PRD: `03_Core_Features.md` §3.2.2.

**Acceptance Criteria.**
- AC1. The icon is informational only on other users' profiles (no tap target).
- AC2. The icon is rendered regardless of my follow state with that user.

**Related.** Screens: 3.3.

---

## FR-PROFILE-013 — Public vs internal active-posts counter

**Description.**
The "Active Posts" headline counter is **split**: a private (internal) value visible to the owner and a public value visible to others.

**Source.**
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו), §3.2.1.
- Constraints: `R-MVP-Items-14`.

**Acceptance Criteria.**
- AC1. `active_posts_count_internal` = count of all `open` posts owned by the user, regardless of visibility.
- AC2. `active_posts_count_public` = count of `open` posts where `visibility ∈ {Public, FollowersOnly}` and the post is currently visible to **the viewer** (i.e., a `FollowersOnly` post counts only when I'm an approved follower).
- AC3. The owner sees `active_posts_count_internal` on their own profile.
- AC4. Anyone else sees `active_posts_count_public`. The system never reveals to a viewer that the owner has hidden `Only-me` posts.
- AC5. The counters are computed server-side and projected via Realtime to keep multiple clients in sync (`NFR-PERF-005`).

**Related.** Screens: 3.1, 3.3 · Domain: `Post`, `User`.

---

## FR-PROFILE-014 — Biography URL filter

**Description.**
The biography text rejects external URLs to prevent spam.

**Source.**
- Constraints: `R-MVP-Profile-6`.

**Acceptance Criteria.**
- AC1. The validator runs both client- and server-side; the server is authoritative.
- AC2. The pattern flags `http(s)://`, bare domains containing `.`, and well-known shorteners (`bit.ly`, `t.co`, `tinyurl`, etc.).
- AC3. Rejection produces an inline error: *"Links are not allowed in the biography."*
- AC4. Existing biographies that violate the rule due to retroactive policy changes are preserved but flagged for moderation review.

**Related.** Domain: `User.biography`.

---

## FR-PROFILE-015 — Profile photo from SSO at sign-up

**Description.**
At sign-up via Google or Apple, if the SSO provides a profile photo URL, the system imports it.

**Source.**
- PRD: `04_User_Flows.md` Flow 1, `03_Core_Features.md` §3.1.2.

**Acceptance Criteria.**
- AC1. The system fetches the photo at sign-up time, re-encodes it, and stores it in our own bucket; no live dependency on the SSO host.
- AC2. If the SSO photo is unavailable or blocked, sign-up proceeds with a default avatar.
- AC3. Subsequent SSO photo changes do **not** automatically update our copy; the user updates via Edit Profile.

**Related.** Domain: `User.avatar_url`.

---

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.5 | 2026-05-16 | Cross-reference: closed-post detail navigability and counterparty masking (`FR-POST-021`, `D-26`) linked from Scope; profile tabs unchanged. |
| 0.4 | 2026-05-15 | D-21: Privacy mode reframed as a **follow-approval flag only**. FR-PROFILE-003 rewritten to match FR-PROFILE-002 (no locked panel, no hidden counters/lists). FR-PROFILE-010 ACs collapsed — lists visible to all viewers. FR-PROFILE-004 simplified — per-post `FollowersOnly` follow-edge rule is unchanged but no longer entangled with profile privacy. Implementation: migration `0069_privacy_mode_follow_approval_only.sql` drops `users_select_public` + `users_select_private_approved_follower`; replaces them with `users_select_active`. |
| 0.3 | 2026-05-11 | Implementation note: FR-PROFILE-006 AC2 auto-approve-on-Public is enforced at the DB layer by `users_after_privacy_mode_change` (migration 0023). No application-level fan-out required; the existing on-accept trigger handles edge creation per row. |
| 0.2 | 2026-05-11 | FR-PROFILE-002 AC2 + FR-PROFILE-004 AC4 updated: closed posts now shown on other-user profiles (Public / Private-approved-follower). Reverses prior PRD §3.2.2 carveout; see EXEC-7. |
| 0.1 | 2026-05-05 | Initial draft from PRD §3.2, §3.5, and Decisions D-10. |
