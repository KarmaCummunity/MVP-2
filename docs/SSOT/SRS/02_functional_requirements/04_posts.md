# 2.4 Posts: Create, Edit, Discover

[← back to Part II index](./README.md)

Prefix: `FR-POST-*`

---

## Scope

Authoring posts and the surfaces that show them, excluding feed composition (covered in [`06_feed_and_search.md`](./06_feed_and_search.md)) and closure / reopen (covered in [`05_closure_and_reopen.md`](./05_closure_and_reopen.md)).

Includes:

- Creating a "give" post and a "request" post (a single form with a prominent toggle).
- Required and optional fields, including images, address, location-display level, and post visibility.
- Post detail screen behavior across viewer/owner permutations.
- Editing an existing post, including the upgrade-only visibility rule.
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
- AC4. The "Publish" button is disabled until all required fields validate; disabled state surfaces inline error markers on the offending fields.

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
- AC1. For `Give`: up to 5 images total (the first being required), and an `item_condition ∈ { New, LikeNew, Good, Fair }`.
- AC2. For `Request`: up to 5 images (all optional); a free-text `urgency` field (≤100 chars, e.g. "Need by Friday").
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
- AC3. Visibility `OnlyMe`: an interstitial reminds the user the post is saved privately and that future visibility upgrades are allowed but not downgrades; two CTAs ("Save private" / "Cancel").
- AC4. After successful publish, the user lands back on the Home Feed with the new post anchored at the top of the list.

**Related.** Screens: 2.4 · Domain: `PostVisibility`.

---

## FR-POST-007 — Local draft autosave

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
The owner can re-open the form to edit fields of an `open` post.

**Source.**
- PRD: `03_Core_Features.md` §3.3.5, `04_User_Flows.md` Flow 10.
- Constraints: `R-MVP-Items-3`, `R-MVP-Privacy-9`.

**Acceptance Criteria.**
- AC1. Editable fields: title, description, category, address, location-display level, item condition (give-only), urgency (request-only), images, **and** visibility (subject to the upgrade-only rule, `FR-POST-009`).
- AC2. The post `type` (Give vs Request) is **not** editable in MVP; the user must delete and recreate.
- AC3. Edits do **not** bump the post to the top of the feed; `created_at` is immutable while `updated_at` advances.
- AC4. Editing a post emits an `audit_event` (`R-MVP-Safety-3`) with the changed fields.

**Edge Cases.**
- A post that has expired (`Post.status = expired`) cannot be edited; the form is disabled with a hint to "Republish".
- A post that has been auto-removed (`removed_admin`) cannot be edited (only the Super Admin may restore it).

**Related.** Screens: 2.4 · Domain: `Post`.

---

## FR-POST-009 — Visibility upgrade-only rule

**Description.**
Visibility changes after publish must move strictly toward greater exposure.

**Source.**
- PRD: `03_Core_Features.md` §3.2.4 (sub-section ו).
- Constraints: `R-MVP-Privacy-9`, `R-MVP-Items-12`.

**Acceptance Criteria.**
- AC1. Allowed transitions:
   - `OnlyMe → FollowersOnly` (only if `User.privacy_mode = Private`)
   - `OnlyMe → Public`
   - `FollowersOnly → Public`
- AC2. Disallowed transitions are rejected at both UI and API layers; API returns `DOMAIN_ERROR { code: 'visibility_downgrade_forbidden' }`.
- AC3. Disallowed targets in the edit form are rendered disabled with a tooltip: *"Lowering visibility is not allowed after publishing."*
- AC4. Profile mode flipping mid-flight (`Private → Public`) does not retroactively change post visibility (`R-MVP-Privacy-13`).

**Related.** Domain: `Post.visibility`, `Post.upgradeVisibility()` invariant.

---

## FR-POST-010 — Delete a post

**Description.**
The owner can permanently delete an `open` post.

**Source.**
- PRD: `03_Core_Features.md` §3.3.5.
- Constraints: `R-MVP-Items-3`.

**Acceptance Criteria.**
- AC1. Deletion is exposed only through the `⋮` menu on the post card and the post-detail screen, not as a primary CTA.
- AC2. Confirmation modal lists consequences: *"This post will be permanently deleted. Conversations started about this post will remain in the chat list."*
- AC3. On confirm, the post is hard-deleted along with its image assets; statistics counters update.
- AC4. Audit event recorded (`R-MVP-Safety-3`).

**Edge Cases.**
- Deleting a post does not delete chat threads that referenced it; those threads carry a "Original post no longer available" banner thereafter.

**Related.** Screens: 3.1 · Domain: `Post`.

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
- AC4. The full state machine is diagrammed in [`03_domain_model.md`](../03_domain_model.md) §3.4.

**Related.** Domain: `Post.status`, `PostStatus`.

---

## FR-POST-013 — Post expiry (300 days)

**Description.**
A post that has remained `open` for 300 days transitions to `expired` automatically.

**Source.**
- PRD: `03_Core_Features.md` §3.3.6 (sub-section ד).
- Constraints: `R-MVP-Items-5`.

**Acceptance Criteria.**
- AC1. A scheduled job (`bg-job-post-expiry`, see [`06_cross_cutting/05_background_jobs.md`](../06_cross_cutting/05_background_jobs.md)) runs daily and transitions matching posts.
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
- AC2. Primary CTA: "💬 Send Message to Poster" — opens chat with the contextual auto-message (`FR-CHAT-005`).
- AC3. Secondary CTA: dynamic follow button per `FR-FOLLOW-011`.
- AC4. `⋮` menu: "Report" (`FR-MOD-001`). (Per `EXEC-9`, the "Block User" item is removed from MVP scope.)
- AC5. If the post is no longer visible to the viewer (e.g., follower removed, post auto-removed) the screen renders an empty state: *"This post is no longer available. It may have been removed or limited to followers only."*

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
- AC1. The post is listed under the recipient's "Closed Posts" tab inside their own profile (only visible to themselves).
- AC2. Detail view renders the post's content read-only with a banner: *"You were marked as the recipient by [owner]."*
- AC3. CTA: "Remove my recipient mark" (`FR-CLOSURE-007`).
- AC4. No other actions are available; the recipient cannot reopen or edit the post.

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
- AC2. `street` is free text (1–80 chars), trimmed.
- AC3. `street_number` accepts digits and an optional letter suffix (e.g., `12A`).
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

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft from PRD §3.3.3–§3.3.5 and Flows 4, 5, 10. |
