# 2.4 Posts: Create, Edit, Discover

> **Status:** ✅ Core Complete — Create/edit/delete, images, visibility shipped. FR-POST-007 (local draft autosave) ✅ done under P2.22 (TD-108 resolved). **FR-POST-013 AC1** (300-day status='expired' transition) ships notify-only — full FSM transition is BACKLOG P2.17. **FR-POST-021 AC1** SELECT policy requires `auth.uid() IS NOT NULL` — guest projection defaults to `Public` exposure (no current leak surface; TD-81). Actor-identity projection bypassed on profile-closed-posts + Search (BACKLOG P2.15 / TD-72).



Prefix: `FR-POST-*`

---

## Scope

Authoring posts and the surfaces that show them, excluding feed composition (covered in [`06_feed_and_search.md`](./06_feed_and_search.md)) and closure / reopen (covered in [`05_closure_and_reopen.md`](./05_closure_and_reopen.md)).

Includes:

- Creating a "give" post and a "request" post (a single form with a prominent toggle).
- Required and optional fields, including images, address, location-display level, and post visibility.
- Post detail screen behavior across viewer/owner permutations.
- Editing an existing post, including visibility changes after publish (`FR-POST-009`).
- Deleting a post.
- Local draft autosave.
- Post lifecycle states.

---

## FR-POST-001 — Single creation form with type toggle

**Description.**
Tapping the "+" tab opens one form whose top control toggles between `🎁 Give` and `🔍 Request`. Most fields are shared; some differ.

**Source.**
- PRD: `03_Core_Features.md` §3.3.3, `05_Screen_UI_Mapping.md` §2.4, `04_User_Flows.md` Flows 4 & 5.
- Constraints: `R-MVP-Items-1`, `R-MVP-Items-2`, `R-MVP-Items-11`.

**Acceptance Criteria.**
- AC1. The toggle is the most prominent control on the screen and persists the chosen mode locally so the next visit defaults to the previous selection.
- AC2. Switching the toggle preserves shared fields (title, description, category, address, visibility) and clears type-specific fields (item condition, urgency).
- AC3. The form is the same screen used for editing an existing post (`FR-POST-008`); the route distinguishes them.

**Related.** Screens: 2.4 · Domain: `Post.type`, `Post.status`.

---

## FR-POST-002 — Required fields by type

**Description.**
The set of required fields depends on `Post.type`.

**Source.**
- PRD: `03_Core_Features.md` §3.3.3 (sub-section א).
- Constraints: `R-MVP-Items-1`, `R-MVP-Items-2`, `R-MVP-Items-13`.

**Acceptance Criteria.**
- AC1. For `type = Give`: `title` (≤80 chars) and at least one image are required.
- AC2. For `type = Request`: only `title` (≤80 chars) is required.
- AC3. For both types: `address` (city + street + number) is required (`R-MVP-Items-13`).
- AC4. The "Publish" control stays tappable while required fields are incomplete; tapping it shows a short Hebrew toast listing what is still missing (instead of a disabled-looking control). When all required fields validate, publish proceeds as usual. A second "Publish" control appears at the bottom of the create form for users who scroll past the header action.

**Related.** Screens: 2.4 · Domain: `Post`, `Address`.

---

## FR-POST-003 — Optional fields shared by both types

**Description.**
Shared optional fields and their defaults.

**Source.**
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ב).

**Acceptance Criteria.**
- AC1. `description` accepts up to 500 characters; supports plain text only (no markdown, no rich text in MVP).
- AC2. `category` is selected from the canonical 10-category list (`R-MVP-Items-2`); default is `Other`.
- AC3. `location_display_level` is one of:
   - `CityOnly` 🏙️
   - `CityAndStreet` 🗺️ *(default)*
   - `FullAddress` 📍
- AC4. `visibility` is one of:
   - `Public` 🌍 *(default)*
   - `FollowersOnly` 👥 *(disabled when `User.privacy_mode = Public`)*
   - `OnlyMe` 🔒
- AC5. The disabled `FollowersOnly` option in `Public` profiles shows a tooltip pointing to Settings → Privacy.

**Related.** Domain: `LocationDisplayLevel`, `PostVisibility`.

---

## FR-POST-004 — Type-specific optional fields

**Description.**
Fields that exist for one type only.

**Source.**
- PRD: `03_Core_Features.md` §3.3.3 (sub-sections ג, ד).

**Acceptance Criteria.**
- AC1. For `Give`: up to 5 images total (the first being required), and an `item_condition ∈ { New, LikeNew, Good, Fair, Damaged }` (UI: שבור/תקול for `Damaged`).
- AC2. For `Request`: up to 5 images (all optional); a free-text `urgency` field (≤100 chars, e.g. "Need by Friday"). On the create screen, `urgency` is **not** grouped under the collapsible exposure section; it appears as its own field when type is Request (`FR-POST-003` address/visibility controls remain in exposure).
- AC3. Switching the toggle clears these fields with a confirmation if any value is present (to avoid accidental loss).

**Related.** Domain: `Post.item_condition`, `Post.urgency`.

---

## FR-POST-005 — Image upload constraints

**Description.**
Constraints on uploaded images (both types).

**Source.**
- PRD: `03_Core_Features.md` §3.3.3.

**Acceptance Criteria.**
- AC1. Allowed formats: JPEG, PNG, HEIC (HEIC is converted to JPEG client-side on iOS).
- AC2. Max 5 images per post; max 8 MB per image post-resize.
- AC3. Client-side resize to a max edge of 2048px before upload; further server-side derivatives produced for `feed_thumb` (640px), `detail_main` (1280px), and `original`.
- AC4. EXIF metadata is stripped server-side to prevent location leakage (`NFR-PRIV-002`).
- AC5. Failed uploads block "Publish"; partial successes can be retried individually without re-selecting all images.

**Related.** Domain: `Post.images[]`, `MediaAsset`.

---

## FR-POST-006 — Publish confirmations

**Description.**
Publishing a post confirms or warns based on chosen visibility.

**Source.**
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ה), `04_User_Flows.md` Flow 4.

**Acceptance Criteria.**
- AC1. Visibility `Public`: no extra confirmation; success toast "✅ Your post is live!".
- AC2. Visibility `FollowersOnly`: an interstitial reminds the user how many approved followers will see it, with two CTAs ("Followers only" / "Make it public").
- AC3. Visibility `OnlyMe`: an interstitial reminds the user the post is saved privately and that they can change visibility later from the post **⋮** menu or edit screen; two CTAs ("Save private" / "Cancel").
- AC4. After successful publish, the user lands back on the Home Feed with the new post anchored at the top of the list.

**Related.** Screens: 2.4 · Domain: `PostVisibility`.

---

## FR-POST-007 — Local draft autosave

> **Status:** ✅ Done — implemented under BACKLOG P2.22 (`feat/FR-POST-007-fe-draft-autosave`). Resolves TD-108. Design: [`docs/superpowers/specs/2026-05-17-post-draft-autosave-design.md`](../../superpowers/specs/2026-05-17-post-draft-autosave-design.md).

**Description.**
The form persists its state to local storage to survive accidental closure.

**Source.**
- PRD: `03_Core_Features.md` §3.3.3 (sub-section ו), `04_User_Flows.md` Flow 4.A.

**Acceptance Criteria.**
- AC1. Every input change debounces (300 ms) and writes to local storage.
- AC2. Re-entering the form after backgrounding or app restart, with an unpublished draft present, surfaces a banner: *"You have an unpublished draft. Continue editing / Start fresh."*
- AC3. Drafts include image references (local URIs); if the underlying media is no longer accessible, those slots show a "missing image" placeholder and the user is prompted to re-add.
- AC4. A successful publish, an explicit "Start fresh", or a clean account-deletion clears the draft.
- AC5. Drafts are scoped per signed-in user identity; switching accounts on the same device does not expose drafts to the other user.

**Related.** Domain: `LocalDraft`.

---

## FR-POST-008 — Edit an existing post

**Description.**
The post owner **or** the Super Admin (`users.is_super_admin = true`) can re-open the form to edit fields of an `open` post. The Super Admin uses the same screen and update path; `posts.owner_id` stays immutable on the server.

**Source.**
- PRD: `03_Core_Features.md` §3.3.5, `04_User_Flows.md` Flow 10.
- Constraints: `R-MVP-Items-3`, `R-MVP-Privacy-9`.

**Acceptance Criteria.**
- AC0. **Authorization:** editing is allowed when `auth.uid()` is the post `owner_id` **or** `users.is_super_admin = true` for that session (re-checked by RLS on `posts` / `media_assets` updates; migration `0049_admin_post_edit_rls.sql`).
- AC1. Editable fields: title, description, category, address, location-display level, item condition (give-only), urgency (request-only), images, **and** visibility (any level may be chosen; `FR-POST-009`).
- AC2. The post `type` (Give vs Request) is **not** editable in MVP; the user must delete and recreate.
- AC3. Edits do **not** bump the post to the top of the feed; `created_at` is immutable while `updated_at` advances.
- AC4. Editing a post emits an `audit_event` (`R-MVP-Safety-3`) with the changed fields.
- AC5. When the post transitions to `removed_admin` (via `admin_remove_post`), the prior status is captured in `posts.status_before_admin_removal`. The owner's "פוסטים שהוסרו על ידי מנהל" overflow screen uses this field to split the list into prior-open and prior-closed sections (`D-35`). Legacy rows (NULL) render under the prior-open section.

**Edge Cases.**
- A post that has expired (`Post.status = expired`) cannot be edited; the form is disabled with a hint to "Republish".
- A post that has been auto-removed (`removed_admin`) cannot be edited (only the Super Admin may restore it).

**Related.** Screens: 2.4 · Domain: `Post`.

---

## FR-POST-009 — Post visibility may change after publish

**Description.**
The owner (or a closed-post participant for `surface_visibility`, `FR-POST-021`) may switch post audience among `Public`, `FollowersOnly`, and `OnlyMe` **at any time**, including restricting visibility after the post was already visible to others (e.g. moving from `Public` to `OnlyMe`). Product accepts that prior viewers may have cached or seen content; the control governs **current** discoverability in feeds and profile surfaces, not a retroactive erasure guarantee.

**Source.**
- Prior PRD text (`03_Core_Features.md` §3.2.4 sub-section ו) required upgrade-only; **superseded** by PM decision **`D-32` (2026-05-17)**.

**Acceptance Criteria.**
- AC1. Any transition `Public` ↔ `FollowersOnly` ↔ `OnlyMe` is allowed for `posts.visibility` on **open** posts (subject to `FR-POST-003` / `FR-PROFILE-*`: `FollowersOnly` remains unavailable when `User.privacy_mode = Public` — UI disables that option and surfaces the Settings → Privacy hint).
- AC2. The same freedom applies to each participant's `post_actor_identity.surface_visibility` on **closed** posts (`FR-POST-021`), with the same `FollowersOnly` / public-profile gate.
- AC3. Server and client must stay consistent: DB must **not** reject legal visibility writes solely for being a “downgrade”. Legacy `visibility_downgrade_forbidden` handling may remain in adapters for backwards compatibility with old DB snapshots but must not fire on current schema after migration `0094_posts_visibility_free_change.sql`.
- AC4. Profile mode flipping mid-flight (`Private → Public`) does not retroactively rewrite stored post visibility (`R-MVP-Privacy-13`).
- AC5. On `closed_delivered` and `deleted_no_recipient`, the owner may flip `posts.visibility` via a visibility-only patch through `UpdatePostUseCase`. Triggered by the ⋮ exposure block's "הסתר (רק אני)" toggle so the closed lane of the Hidden screen (`FR-PROFILE-001 AC4`) routes correctly. `removed_admin` and `expired` remain locked (`D-34`).

**Related.** Domain: `Post.visibility`, `canUpgradeVisibility()` (non–no-op helper only), migration `0094_posts_visibility_free_change.sql`.

---

## FR-POST-010 — Delete a post

**Description.**
The owner can permanently delete their own post when it is **`open`**, or when there is **no row in `public.recipients`** for that post and status is **`deleted_no_recipient`** or orphan **`closed_delivered`** (e.g. recipient user removed — `recipients` cascaded away but status stayed closed). If a **`recipients`** row exists (`closed_delivered` with a live mark), owner delete is rejected; use reopen per `FR-CLOSURE-005` or admin paths.

**Source.**
- PRD: `03_Core_Features.md` §3.3.5.
- Constraints: `R-MVP-Items-3`.
- Decision: `D-18` (owner delete when unlinked).

**Acceptance Criteria.**
- AC1. Deletion is exposed only through the `⋮` menu on the post card and the post-detail screen, not as a primary CTA.
- AC2. Confirmation modal lists consequences: *"This post will be permanently deleted. Conversations started about this post will remain in the chat list."* and states which cases allow deletion (`open`; closed states only when there is no recipient / `recipients` row).
- AC3. On confirm, the post is hard-deleted along with its image assets; statistics counters update.
- AC4. Audit event recorded (`R-MVP-Safety-3`).
- AC5. After confirm, the user always gets explicit feedback: a short success toast when deletion succeeds, and a toast (plus inline error on the confirm modal when still open) when deletion fails (e.g. `closed_delivered` **with** a recipient row, `removed_admin`, or RLS no-op).

**Edge Cases.**
- Deleting a post does not delete chat threads that referenced it; those threads carry a "Original post no longer available" banner thereafter.
- A post with a `Recipient` row is treated as linked; owner delete is rejected even if status were inconsistent (defensive `NOT EXISTS` in RLS).
- **Orphan `closed_delivered`:** if the marked recipient's `users` row is removed, `recipients` may CASCADE-delete while `posts.status` still reads `closed_delivered`. Owner delete is allowed in that case (no `recipients` row), same as `deleted_no_recipient` without a mark.

**Related.** Screens: 3.1 · Domain: `Post` · Closure: `FR-CLOSURE-003`, `FR-CLOSURE-005`.

---

## FR-POST-011 — Maximum active posts per user

**Description.**
A user cannot have more than 20 posts in `open` status simultaneously, including `OnlyMe` posts.

**Source.**
- Constraints: `R-MVP-Items-8`, `R-MVP-Items-14`.

**Acceptance Criteria.**
- AC1. The 20-post limit is enforced server-side at publish time; the API returns `LIMIT_EXCEEDED` with the current count and limit.
- AC2. The UI surfaces a friendly modal explaining the limit and offering shortcuts to "View my active posts" and "Close older posts".
- AC3. `OnlyMe` posts count toward the limit (`R-MVP-Items-14`).
- AC4. Closure (`closed_delivered` or `deleted_no_recipient`) frees a slot; expiry frees a slot.

**Related.** Domain: `Post`.

---

## FR-POST-012 — Post lifecycle states

**Description.**
A post moves through a finite state machine.

**Source.**
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
- Constraints: `R-MVP-Items-4`, `R-MVP-Items-5`, `R-MVP-Items-6`, `R-MVP-Items-7`.

**Acceptance Criteria.**
- AC1. States: `open`, `closed_delivered`, `deleted_no_recipient`, `expired`, `removed_admin`. Initial state is `open`.
- AC2. Transitions:
   - `open → closed_delivered` (closure with recipient marked) — `FR-CLOSURE-002`
   - `open → deleted_no_recipient` (closure without recipient marking) — `FR-CLOSURE-003`
   - `closed_delivered → open` (reopen) — `FR-CLOSURE-005`
   - `deleted_no_recipient → open` (reopen, only within 7-day grace window) — `FR-CLOSURE-005`
   - `open → expired` (300 days inactivity) — automated, `FR-POST-013`
   - `* → removed_admin` (admin or 3-report auto-removal) — `FR-MOD-006`
- AC3. State machine is enforced as a pure function in `domain` (`PostStatus.transition()` invariant).
- AC4. The full state machine is diagrammed in [`03_domain_model.md`](../archive/SRS/03_domain_model.md) §3.4.

**Related.** Domain: `Post.status`, `PostStatus`.

---

## FR-POST-013 — Post expiry (300 days)

**Description.**
A post that has remained `open` for 300 days transitions to `expired` automatically.

**Source.**
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
- Constraints: `R-MVP-Items-5`.

**Acceptance Criteria.**
- AC1. A scheduled job (`bg-job-post-expiry`, see [`06_cross_cutting/05_background_jobs.md`](../archive/SRS/06_cross_cutting/05_background_jobs.md)) runs daily and transitions matching posts.
- AC2. Seven days before expiry, the owner receives a notification (`FR-NOTIF-010`) — Critical category.
- AC3. Expired posts disappear from the feed; they remain visible to the owner in the closed-tab area marked `expired`, with a "Republish" CTA that creates a new post pre-filled with the prior content (new ID).
- AC4. Expiry preserves the original `Post` row for audit; image assets may be garbage-collected after 30 additional days.

**Related.** Domain: `Post.status = expired`, `bg-job-post-expiry`.

---

## FR-POST-014 — Post Detail screen (viewer)

**Description.**
The screen rendered when any non-owner viewer opens a post they are allowed to see.

**Source.**
- PRD: `03_Core_Features.md` §3.3.4, `05_Screen_UI_Mapping.md` §2.3.

**Acceptance Criteria.**
- AC1. Renders: image carousel (or large category icon if a request without images), type badge `🎁`/`🔍`, title, category, owner row (avatar + name + city, tap → profile), full description, type-specific fields, computed location string per `location_display_level`, relative timestamp.
- AC2. When `Post.status === 'open'`, the primary CTA is "💬 Send Message to Poster" — opens chat with the contextual auto-message (`FR-CHAT-005`). See AC6 for non-open posts.
- AC3. Secondary CTA: dynamic follow button per `FR-FOLLOW-011`.
- AC4. `⋮` menu: "Report" (`FR-MOD-001`). (Per `EXEC-9`, the "Block User" item is removed from MVP scope.)
- AC5. If the post is no longer visible to the viewer (e.g., follower removed, post auto-removed) the screen renders an empty state: *"This post is no longer available. It may have been removed or limited to followers only."*
- AC6. The primary "Send Message to Poster" CTA (`FR-CHAT-005`) is shown only when `Post.status === 'open'`; it is hidden for any non-open lifecycle state (including `closed_delivered`, `expired`, `removed_admin`, etc.).

**Related.** Screens: 2.3 · Domain: `Post`, `LocationDisplayLevel`.

---

## FR-POST-015 — Post Detail screen (owner, open)

**Description.**
Same screen, owner-mode controls, `Post.status = open`.

**Source.**
- PRD: `03_Core_Features.md` §3.3.5, `05_Screen_UI_Mapping.md` §2.3.

**Acceptance Criteria.**
- AC1. Replaces viewer CTAs with: "Edit" (`FR-POST-008`), "Mark as Delivered" (`FR-CLOSURE-001`), "Delete" (`FR-POST-010`).
- AC2. Posts at visibility `OnlyMe` show a prominent banner: *"🔒 Private — only you can see this post."*
- AC3. Posts at visibility `FollowersOnly` show a small banner: *"👥 Visible to your approved followers."*
- AC4. The address shown to the owner is the **full** address regardless of `location_display_level` (the field affects only the public projection).

**Related.** Screens: 2.3.

---

## FR-POST-016 — Post Detail screen (owner, closed_delivered)

**Description.**
Owner-mode controls when the post is closed with a recipient marked.

**Source.**
- PRD: `03_Core_Features.md` §3.3.5.

**Acceptance Criteria.**
- AC1. Replaces all viewer CTAs with: "📤 Reopen" (`FR-CLOSURE-005`).
- AC2. Banner: *"Closed — delivered to [recipient name] on [date]."*
- AC3. The recipient row shows the recipient's avatar/name with a tap target to their profile (subject to that user's privacy mode).
- AC4. Closure metadata cannot be edited (the only mutation is reopen).

**Related.** Screens: 2.3.

---

## FR-POST-017 — Post Detail screen (recipient view)

**Description.**
A user marked as the recipient of a `closed_delivered` post sees a special view in their "Closed Posts" section, mirroring `FR-POST-016` minus owner controls plus a self-removal action.

**Source.**
- Decisions: `D-7`.

**Acceptance Criteria.**
- AC1. A user picked as the respondent of a `closed_delivered` post sees the post in their own profile's "פוסטים סגורים" tab. The post is **also** visible to other viewers of the respondent's profile, subject to the **respondent's** `post_actor_identity.surface_visibility` for that post (Public / FollowersOnly / OnlyMe; default `Public`). The publisher's `posts.visibility` no longer gates third-party access to the closed-post listing — each participant's `surface_visibility` governs their own profile tab independently (`D-28`, supersedes the `D-19` clause that read "subject to the post's original `visibility` setting"). The "Remove my recipient mark" CTA remains exclusive to the respondent themselves.
- AC2. Detail view renders the post's content read-only with a banner: *"You were marked as the recipient by [owner]."*
- AC3. CTA: "Remove my recipient mark" (`FR-CLOSURE-007`).
- AC4. No other actions are available; the recipient cannot reopen or edit the post.
- AC5. When a third party opens the post via the respondent's profile, the detail screen renders a read-only public view (no Reopen, no Remove-mark, no Edit). The `RecipientCallout` already adapts to post type — "נמסר ל-X" for `Give` posts, "ניתן על-ידי X" for `Request` posts — and is the canonical surfaced banner.

**Related.** Screens: 2.3 · Domain: `Recipient`, `Post`.

---

## FR-POST-018 — Quick-message affordance from feed card

**Description.**
A small message icon on each feed card opens the chat for that post directly from the feed.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.2, `05_Screen_UI_Mapping.md` §2.1.

**Acceptance Criteria.**
- AC1. Tapping the icon is equivalent to opening the post and tapping the primary CTA, but skips the post detail screen.
- AC2. The icon is hidden on the user's own posts.
- AC3. ~~The icon respects block state (`FR-MOD-009`).~~ Deferred — `FR-MOD-009` is deprecated per `EXEC-9`; no block state exists in MVP.

**Related.** Screens: 2.1.

---

## FR-POST-019 — Address validation

**Description.**
Address fields are validated for shape only, not against a geocoder.

**Source.**
- PRD: `06_Navigation_Structure.md` §6.6.4 ("city-name geographic, no geocoding").

**Acceptance Criteria.**
- AC1. `city` is selected from the canonical seeded list (no free text).
- AC2. `street` is 1–80 chars, trimmed. On Create Post + Edit Post the UI is a city-dependent canonical picker over `public.streets` (`D-36`) with a free-text fallback row for new construction / source gaps; the picker is disabled with helper text "בחרו עיר תחילה" until a city is selected, and tapping the disabled field surfaces an ephemeral toast. Switching the city resets street + number so a Tel Aviv street can never accompany a Jerusalem submission. The DB column remains `text` — what the UI saves is what the user picked or typed.
- AC3. `street_number` accepts digits and an optional single-letter suffix. The suffix may be a Latin letter (`12A`, `12B`) or a Hebrew letter (`12א`, `15ב`) to support Israeli street numbering conventions. Punctuation and multi-character suffixes are rejected.
- AC4. Geocoding to lat/lon is **not** performed in MVP.
- AC5. The composed display string follows `location_display_level`:
   - `CityOnly` → "Tel Aviv"
   - `CityAndStreet` → "Tel Aviv · Hayarkon"
   - `FullAddress` → "Tel Aviv · Hayarkon 12A"

**Related.** Domain: `Address`, `LocationDisplayLevel`.

---

## FR-POST-020 — Forbidden content guardrails (advisory)

**Description.**
At publish time, an advisory check warns users against posting forbidden categories.

**Source.**
- Constraints: `R-MVP-Items-9`, `R-MVP-Items-10`.

**Acceptance Criteria.**
- AC1. The check scans `title + description` for keywords from a configurable list (weapons, drugs, live animals, currency / sale terms).
- AC2. A match raises a soft warning modal: *"This may violate community rules — please review before publishing."* The user may proceed; the post is flagged for moderation telemetry.
- AC3. False negatives are expected; the moderator pipeline (`FR-MOD-*`) is the authoritative enforcement layer.

**Related.** Domain: `ContentAdvisory`.

---

## FR-POST-021 — Per-participant audience on closed posts + counterparty identity mask

**Description.**
Participants control **who may see the post** (audience), not a separate “identity chrome” tier in the MVP UI.

- **Open posts (`status = open`, owner on post detail):** the same three-level control as `FR-POST-003` edits `posts.visibility` (subject to `FR-POST-009` free changes + public-profile gate for `FollowersOnly`). Shown in the post-detail **⋮** menu (open or closed) for quick changes.
- **Closed posts (`status = closed_delivered`, owner or marked respondent):** each participant edits their own `post_actor_identity.surface_visibility` (`Public` / `FollowersOnly` / `OnlyMe`, default `Public`) — who, beyond the two participants, can discover the post **through that participant's surface** (their "פוסטים סגורים" profile tab and generic third-party fetch). Changes follow the same rules as open-post visibility (`FR-POST-009`, including the public-profile gate for `FollowersOnly`). UI: the post-detail **⋮** menu (same surface as open-post visibility controls).
- **Third-party mask on the counterparty's profile surface (`hide_from_counterparty`):** when a marked respondent exists, each participant may toggle this flag so **non-participant viewers** who discover the post through the **counterparty's** "פוסטים סגורים" profile context see anonymous post chrome for that actor (name / avatar / profile link from the post row). The **counterparty** still sees the actor's real identity on post chrome (they already coordinate in chat, where identity stays real per `FR-POST-021` AC6). The historical column name `hide_from_counterparty` is retained in `public.post_actor_identity`; product semantics are defined in **`D-31`**.

The column `identity_visibility` remains in `public.post_actor_identity` for projection compatibility and is **written as `Public` by the app**; migration `0092_post_actor_identity_public_chrome.sql` normalizes legacy non-`Public` values. Advanced identity-chrome rules (`FollowersOnly` / `Hidden` on chrome only) are **out of MVP UI scope** (`D-30`).

**Source.**
- Design: `docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md` (original) + addendum (2026-05-16) + PM revision (2026-05-16).
- Decisions: `D-26`, `D-28`, `D-30`, `D-31`.

**Acceptance Criteria.**
- AC1. Table `public.post_actor_identity` stores per `(post_id, user_id)`: `surface_visibility ∈ {Public, FollowersOnly, OnlyMe}` (default `Public`), `identity_visibility` (app writes `Public` only in MVP), and `hide_from_counterparty boolean` (default `false`). RLS allows read when the viewer may read the post; write only by the participant for their own row. The SELECT policy uses a `SECURITY DEFINER` helper to avoid recursion with `is_post_visible_to`.
- AC2. **Counterparty read invariant.** `posts.owner_id` and active `recipients.recipient_user_id` always retain read access to the post regardless of either participant's `surface_visibility`. Surface visibility governs **third-party** access only.
- AC3. **Closed-post third-party access.** `is_post_visible_to(post, viewer)` for `closed_delivered` returns true to a non-participant `V` iff **either** participant's `surface_visibility` admits `V` (Public always; FollowersOnly iff `V` follows that participant; OnlyMe never for `V`). `profile_closed_posts(profile, viewer)` gates each row by **that row's role-actor** `surface_visibility` (publisher rows by owner's; respondent rows by respondent's) — not by `posts.visibility` (`D-28`).
- AC4. **Identity projection (pure domain).** `projectActorIdentityForViewer` runs per participant after fetch. The viewer sees full identity unless **(a)** `D-26` coupling: the viewer is the counterparty **and** the owner's `posts.visibility = OnlyMe` (owner anonymized to counterparty on post chrome), **(b)** `D-31` + `hide_from_counterparty`: the viewer is a **third party** (not actor, not counterparty) **and** the hydration context is the counterparty's closed-post profile surface (`identityListingHostUserId = counterparty`), **(c)** legacy non-`Public` `identity_visibility` rows until migration `0092` runs, or **(d)** surface-coupling rules where implemented in the projection pipeline / SQL (`D-28` addendum).
- AC5. When projection marks an identity as anonymous, post-detail must not offer a one-tap profile deep-link from that row (`ownerProfileNavigableFromPost` / `recipientProfileNavigableFromPost = false`).
- AC6. Chat headers and profile shells remain real-user surfaces; masking applies to **post chrome** only (`D-26`).
- AC7. **Create-time preference.** The new-post screen lets the publisher set `hide_from_counterparty` before publish. When enabled, the client upserts the owner's `post_actor_identity` row at publish time with `surface_visibility = posts.visibility` (at publish), `identity_visibility = Public`, and `hide_from_counterparty = true` (semantics per **`D-31`** — third parties on the counterparty's closed-post profile surface, not hiding from the counterparty in chat). When disabled, no row is written at create unless the user later changes closed-post surface settings from the post-detail **⋮** menu.

**Migrations.** `0083_post_actor_identity.sql`, `0085_post_actor_identity_audience_split.sql`, `0092_post_actor_identity_public_chrome.sql`.

**Related.** `FR-POST-003`, `FR-POST-009`, `FR-POST-014`, `FR-POST-017` AC1, `FR-PROFILE-001` AC4, `FR-PROFILE-002` AC2, `FR-CLOSURE-005`, `FR-CLOSURE-007`.

---

## FR-POST-023 — Share post via link with image preview

> **Status:** 🟡 In progress — ships under BACKLOG P2.33.

**Description.**
A signed-in viewer of a `Public`, `open` post may share a link to that post from the post-detail screen. The link is browsable to anyone (signed-in or not); social-media crawlers see an Open Graph card with the first post image, the post title, and the description; non-authenticated humans landing in the app are routed to the sign-in screen and, after sign-in, deep-linked back to the original post.

**Source.**
- Product request (2026-05-23). Not in original PRD; added for organic distribution / network growth ahead of P1.5 push notifications.

**Acceptance Criteria.**
- AC1. The post-detail screen exposes a share affordance in the header — **in the trailing corner** (rightmost in RTL), with the existing ⋮ menu placed to its left — to **any** viewer (owner or third party) when `post.status === 'open'` **and** `post.visibility === 'Public'`. Image presence is intentionally **not** required: Request posts (where images are optional per `FR-POST-004` AC2) remain shareable; the Edge Function falls back to a generic community OG card when the post has no media. Private (`OnlyMe`), `FollowersOnly`, expired, removed, and closed posts hide the affordance — sharing a non-public post leaks no preview surface and dodges follower-gating questions.
- AC2. Tapping the affordance opens the platform share sheet:
   - **iOS** — when the post has at least one image, the binary is downloaded into the OS cache via `expo-file-system` and attached via `Share.share({ message: <text+url>, url: <localFileUri> })` so the recipient sees the actual item image even in chats that don't fetch OG link previews (raw SMS, older iMessage). When the post has no media, `Share.share({ message, url })` is used (URL field renders the OG card).
   - **Android** — `Share.share({ message: <text+url>, url })`. RN's `Share` API does not honor `url` for binaries on Android, so the image surfaces via the OG preview rendered by the receiving chat (WhatsApp, Telegram, Messenger).
   - **Web** — `navigator.share({ title, text: <text+url>, url, files: [imageFile] })` when `navigator.canShare({ files })` is true (Web Share Level 2); otherwise `navigator.share({ title, text, url })`; otherwise the URL is copied to the clipboard and a Hebrew toast confirms the copy (`post.detail.shareCopiedToast`).
   - The accompanying `message` body is **composed per-post** by `buildPostShareMessage` from building-block i18n keys: `shareHeadlineGive` / `shareHeadlineRequest` (per-type cue) + the post title on its own line + `📍 city [· category]` (category omitted when `Other`) + (optional) description preview truncated to 160 characters + `shareCtaGive` / `shareCtaRequest`. When the binary is attached (iOS file path, Web `files`), the OG URL is appended on its own line at the end of the message so the receiver still has a tappable deep link alongside the image.
- AC3. The share payload's URL is `${EXPO_PUBLIC_SUPABASE_URL}/functions/v1/share-post/<post_id>`. `EXPO_PUBLIC_SHARE_BASE_URL` is honored as an override **only** when the override host renders per-post OG meta (either by proxying to this Edge Function or via its own SSR); a SPA-only host would silently downgrade the preview image to the site favicon. The URL builder throws when `EXPO_PUBLIC_SUPABASE_URL` is missing — no static fallback to the marketing host.
- AC4. That URL is served by an Edge Function (`share-post`) that, for **`Public` + `open`** posts only, returns HTML with Open Graph + Twitter Card meta tags (`og:title`, `og:description`, `og:image`, `og:url`, `twitter:card=summary_large_image`, `twitter:image`) so crawlers (WhatsApp, Telegram, Twitter, Facebook, iMessage, Signal) render an image preview. For any post that is not `Public` + `open` (including not-found, `OnlyMe`, `FollowersOnly`, `expired`, `removed_admin`, `closed_delivered`, `deleted_no_recipient`), the function returns a generic 200 OG card pointing at the app's marketing landing — never the post's image or title.
- AC5. Human visitors hitting the same URL with a browser UA receive an HTTP 302 redirect to `https://karma-community-kc.com/post/<post_id>` (the existing universal-link path covered by AASA + assetlinks, `TD-66`); crawlers (UA matches `facebookexternalhit|WhatsApp|Twitterbot|TelegramBot|Slackbot|LinkedInBot|SkypeUriPreview|Discordbot|Applebot|googlebot|bingbot`) receive the OG HTML body directly with a 200.
- AC6. **Unauthenticated landing:** when an unauthenticated user follows `/post/<id>` (web or native universal link), the AuthGate captures the path **before** redirecting to `(auth)`, persists it in an in-memory redirect-intent store keyed by an optional TTL of 10 minutes, and after successful sign-in / onboarding completion navigates the user to the captured path (`router.replace(pendingPath)`), then clears the intent. Refresh / app restart loses the intent, falling back to the regular `(tabs)` post-auth landing.
- AC7. The OG image is the post's `mediaAssets[0]` `detail_main` derivative (1280px) — falls back to `original` if `detail_main` is missing, and to a generic site card if `mediaAssets[]` is empty. Image URLs use the public Supabase Storage host so crawlers don't need auth headers.
- AC8. The share action does not mutate post state, does not require a network round-trip on the client (the Edge Function is hit only when the link is opened, not when sharing), and emits no `audit_event` (read-only intent).

**Edge Cases.**
- A user shares a `Public` post; before the link is opened the owner deletes / closes it. The Edge Function fetches at open time and renders the generic OG card (AC4 fallback). No stale image is served.
- A user shares while online, then loses network. The OS Share Sheet is offline-capable; the URL is still copied. The link's recipient receives a valid URL whose resolution depends on their own connectivity.

**Related.** Screens: 2.3 (post detail). Domain: `Post.visibility`, `Post.status`. Cross-refs: `FR-POST-014` (viewer detail), `FR-AUTH-014` (guest entry), `TD-66` (deep-link manifests). Edge Function: `supabase/functions/share-post/index.ts`.

---

## FR-POST-022 — Save / unsave post

**Description.**
A signed-in user may bookmark any post they can currently read (their own or another user's) for later access from My Profile.

**Source.**
- Product request (2026-05-16); deferred V2 bookmarks revived for MVP bookmark-lite.

**Acceptance Criteria.**
- AC1. Only authenticated users see save actions (guests have no post ⋮ menu).
- AC2. The user may save any post that passes `is_post_visible_to` at save time (owner, public, followers-only when following, closed-post rules, etc.).
- AC3. Post ⋮ menu shows **Save** when not bookmarked and **Remove from saved** when bookmarked (mutually exclusive). Applies to own posts and others' posts.
- AC4. Save is idempotent (duplicate save is a no-op).
- AC5. Unsave deletes the bookmark row.
- AC6. When the underlying post is hard-deleted, bookmark rows are removed via `ON DELETE CASCADE`.

**Related.** Screens: 2.3, 3.1 · Domain: `saved_posts` · Profile list: `FR-PROFILE-016`.

---

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.10 | 2026-05-23 | `FR-POST-023` AC1/AC2 — share icon moved to the trailing corner (⋮ to its left); iOS attaches the first image binary alongside the OG link; Web Share Level 2 attaches via `navigator.canShare({ files })`. |
| 0.9 | 2026-05-23 | `FR-POST-023` — share post via link with OG image preview + post-login deep-link restoration (P2.33). |
| 0.1 | 2026-05-05 | Initial draft from PRD §3.3.3–§3.3.5 and Flows 4, 5, 10. |
| 0.2 | 2026-05-12 | `FR-POST-008` — Super Admin may edit any open post; RLS `0049_admin_post_edit_rls.sql`; post overflow menu shows *Remove as admin* on own posts (`FR-ADMIN-009`). |
| 0.8 | 2026-05-17 | `FR-POST-008` AC5 + `D-35` — `posts.status_before_admin_removal` captured by `admin_remove_post`; `/profile/removed` splits by prior status. |
| 0.7 | 2026-05-17 | `FR-POST-009` AC5 + `D-34` — owner-driven Hide on `closed_delivered` / `deleted_no_recipient` writes `posts.visibility`; mobile fans out to owner's `surface_visibility`. |
| 0.6 | 2026-05-17 | `FR-POST-009` — visibility may change freely after publish (incl. hide after exposure); `FR-POST-021`/`FR-POST-006`/`FR-POST-008` aligned; migration `0094_posts_visibility_free_change.sql`; decision `D-32`. |
| 0.4 | 2026-05-16 | `FR-POST-022` — save/unsave post bookmarks; migration `0086_saved_posts.sql`. |
| 0.3 | 2026-05-16 | `FR-POST-021` rewritten for the three-axis per-participant model (`surface_visibility` × `identity_visibility` × `hide_from_counterparty`); `FR-POST-017` AC1 updated to point at per-participant `surface_visibility` instead of `posts.visibility` for closed posts. Driven by `D-28` (supersedes `D-19`'s third-party visibility clause; refines `D-26`). Migration `0085_post_actor_identity_audience_split.sql`. |
