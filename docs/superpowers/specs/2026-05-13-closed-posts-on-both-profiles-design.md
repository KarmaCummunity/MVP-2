# Closed posts visible on both publisher and respondent profiles

> **Date:** 2026-05-13
> **Status:** Design approved, ready for implementation plan
> **Touches:** `FR-PROFILE-001`, `FR-PROFILE-002`, `FR-POST-017`, `D-7`

---

## Terminology

Two orthogonal axes describe the parties in a closed transaction:

**Identity roles** — who they are in the database (independent of post type):

- **`publisher`** — the user who created the post (`posts.owner_user_id`).
- **`respondent`** — the user picked at closure (`recipients.user_id`).

**Economic roles** — who actually moved the item (depends on `post.type`):

- **`giver`** — the user who handed the item over.
- **`receiver`** — the user who got the item.

Mapping table:

| `post.type` | `publisher` is | `respondent` is |
|---|---|---|
| 🎁 `Give` | giver | receiver |
| 🔍 `Request` | receiver | giver |

The UI shows the economic role per profile owner:

| Profile owner's identity role | `post.type = Give` | `post.type = Request` |
|---|---|---|
| `publisher` | 📤 נתתי | 📥 קיבלתי |
| `respondent` | 📥 קיבלתי | 📤 נתתי |

Note: the legacy column name `recipients.user_id` is now semantically misleading (for a `Request` post the row stores the *giver*). The name stays for this change; a future rename is logged as tech debt.

---

## Problem

A `closed_delivered` post has two natural stakeholders:

- The **publisher** who created the post.
- The **respondent** chosen at closure (the `recipients` row).

Today the post surfaces asymmetrically:

| Surface | Publisher profile | Respondent profile |
|---|---|---|
| "פוסטים סגורים" tab (own view) | ✅ shown | ✅ shown — **but** only posts they published; posts they're a respondent on are absent |
| "פוסטים סגורים" tab (third-party view) | ✅ shown publicly, with respondent identity | ❌ no respondent-side posts shown at all |
| Post detail (respondent view) | — | ✅ but **only the respondent themselves** can open it (FR-POST-017 AC1) |

The community-trail intent is broken: a viewer browsing Moshe's profile cannot see a closed transaction in which Moshe is the respondent, even though the same transaction is publicly visible on the publisher's profile.

## Goal

A closed-delivered post appears in the "פוסטים סגורים" tab of **both** the publisher and the respondent. The economic role label (📤 נתתי / 📥 קיבלתי) is derived per profile owner from `(post.type, identity-role-on-profile)`. Visibility to third parties is governed by the post's original `visibility` field (Public / Followers-only / Only-me) — unchanged. No new visibility option, no automatic visibility upgrade on close.

## Out of scope

- Changing how `visibility` works (`Public` / `Followers only` / `Only me` semantics are untouched).
- Changing closure / reopen / un-mark mechanics (`FR-CLOSURE-*`).
- Counters / statistics (`FR-CLOSURE-009`, `FR-STATS-*`).
- Chat anchor card and system messages (`FR-CHAT-014`, `FR-CHAT-015`).
- Notifications.
- Feed / search discovery of closed posts (closed posts remain excluded from the main feed).
- Renaming `recipients` table / column. Captured as tech debt.

## Design

### Data model — no schema changes

Existing tables suffice:

- `posts` — has `owner_user_id`, `type`, `status`, `visibility`.
- `recipients` — has `post_id`, `user_id` (the respondent — keeping the legacy column name).

The "closed posts of user X" set is now defined as:

```
closed_posts(X, viewer) :=
  -- Publisher side: also includes deleted_no_recipient so the publisher
  -- can still see and reopen posts they closed without a recipient within
  -- the 7-day grace window (FR-CLOSURE-005 AC4, FR-CLOSURE-008). Those rows
  -- are owner-only by is_post_visible_to, so third parties never see them.
  { p ∈ posts : p.owner_user_id = X ∧ p.status ∈ {'closed_delivered','deleted_no_recipient'} }
  ∪
  -- Respondent side: only closed_delivered (deleted_no_recipient has no respondent).
  { p ∈ posts : p.id ∈ (SELECT post_id FROM recipients WHERE recipient_user_id = X)
                ∧ p.status = 'closed_delivered' }
```

Each row carries a derived **identity role** for X: `'publisher'` if `X = p.owner_user_id`, `'respondent'` if `X` appears in `recipients`. The two sets are disjoint (the publisher cannot be picked as respondent — enforced by `FR-CLOSURE-003`).

The **economic role** the UI shows is derived client-side:

```
economicRole(post, identityRole) =
  identityRole == 'publisher' && post.type == 'Give'    → 'giver'
  identityRole == 'publisher' && post.type == 'Request' → 'receiver'
  identityRole == 'respondent' && post.type == 'Give'   → 'receiver'
  identityRole == 'respondent' && post.type == 'Request'→ 'giver'
```

### Query — single RPC for the tab

A new SQL function `profile_closed_posts(profile_user_id uuid, viewer_user_id uuid)` returns the merged list with the identity role, ordered by closure timestamp descending. The function respects RLS the same way the existing `posts` selects do: rows the viewer cannot see under the post's `visibility` are filtered out (Public always returns; Followers-only returns only if `viewer_user_id` is an approved follower of `p.owner_user_id`; Only-me returns only if `viewer_user_id = p.owner_user_id`).

Rationale for an RPC vs. two FE fetches:
- One round-trip; clean ordering by `closed_at`.
- The identity-role decoration lives in one place.
- Keeps RLS authoritative (no client-side trust).

### UI — single mixed tab with role badges

`FR-PROFILE-001` and `FR-PROFILE-002` already render a "פוסטים סגורים" tab. The card list is fed by the new RPC. Each card shows a small **economic role** badge next to the title, computed per the mapping above:

- 🎁 **נתתי** — when the profile owner is the giver.
- 🎀 **קיבלתי** — when the profile owner is the receiver.

Sort order: by `closed_at` descending, mixed.

The card body itself remains identical to today's closed-post card (image, title, type tag, transaction line). The economic-role badge is the only new visual element.

### Tap behavior — opens the right post-detail variant

Tapping a card opens Post Detail. The variant rendered depends on `(viewer, post)`:

| Viewer | Identity role for viewer on this post | Variant |
|---|---|---|
| Profile owner viewing themselves, viewer = publisher | publisher | `FR-POST-016` (publisher closed_delivered — Reopen CTA) |
| Profile owner viewing themselves, viewer = respondent | respondent | `FR-POST-017` (respondent view — "Remove my recipient mark" CTA) |
| Third party | n/a | Read-only public closed view (existing pattern from `FR-PROFILE-002 AC2`) |

This matrix is already implementable from the post + recipients data the screen has; no new variants need to be authored.

Note: `FR-POST-017` retains its name and the "Remove my recipient mark" wording — even though the respondent on a `Request` post is the giver, not the receiver. Renaming the FR / CTA copy is captured as a follow-up.

### Reversal of D-7 / FR-POST-017 AC1

The current spec deliberately keeps the respondent view private to the respondent. This design reverses that:

- A user picked as respondent on a public post is now publicly visible as such, on their own profile.
- For followers-only and only-me posts, visibility remains as the original post's setting — so closed-but-private posts surface only to the audience that could see the original.

This is an intentional product change. Recorded as a new decision (see DECISIONS update below).

### Edge cases

- **Respondent un-marks** (`FR-CLOSURE-007`): the `recipients` row is deleted → the post falls out of the respondent's closed-posts set immediately. Already covered by the UNION semantics — no extra code path.
- **Publisher reopens** (`FR-CLOSURE-005`): post status returns to `open` → post falls out of both profiles' closed-posts sets.
- **Admin removal** (`removed_admin`): post excluded from both sets (status filter).
- **Soft-deleted account on either side**: handled by existing RLS rules on `users` joins.
- **Only-me visibility on a closed post**: the respondent still sees their card. The new RPC explicitly permits a row to be returned when `viewer_user_id` is either the publisher OR the respondent, regardless of `visibility`. Third parties are still gated by `visibility` as today. In practice, an Only-me post can have a respondent only via direct chat with the publisher — uncommon but legal.
- **Publisher = respondent impossible**: enforced by the recipient-picker (`FR-CLOSURE-003`); no UNION duplicate possible.

## Acceptance criteria (additions to existing FRs)

**FR-PROFILE-001 AC4 (revised)**:
> Closed Posts tab lists posts where the profile user is **either the publisher or the respondent**, status `closed_delivered`, ordered by `closed_at` desc. Each card shows an economic-role badge derived from `(post.type, identity-role)`: 📤 נתתי when the profile owner is the giver, 📥 קיבלתי when the profile owner is the receiver.

**FR-PROFILE-002 AC2 (revised)**:
> Closed Posts tab on another user's profile follows the same UNION rule, filtered by each post's `visibility`. Third-party viewers see the same cards but with a read-only post detail.

**FR-POST-017 AC1 (revised, reversing D-7)**:
> A user picked as the respondent of a `closed_delivered` post sees that post in their own profile's "פוסטים סגורים" tab. The post is **also** visible to other viewers of the respondent's profile, subject to the post's original `visibility` setting (Public / Followers-only / Only-me). The "Remove my recipient mark" CTA remains exclusive to the respondent themselves.

**New AC — FR-POST-017 AC5**:
> When a third party opens the post via the respondent's profile, the detail screen renders a read-only public view (no Reopen, no Remove-mark, no Edit). Banner reflects the transaction: *"X מסר ל-Y בתאריך D"* for `Give` posts, *"X קיבל מ-Y בתאריך D"* for `Request` posts.

## Migration / rollout

- **Migration 1** — `profile_closed_posts(profile_user_id, viewer_user_id)` RPC, definer-rights set to respect RLS. Tested with viewer in three positions (self, follower, stranger) against posts at three visibilities, for both `Give` and `Request` post types.
- **FE** — `apps/mobile` profile screen swaps its closed-posts query to call the RPC; card component gains an `identityRoleForViewedProfile: 'publisher' | 'respondent'` prop, derives the economic role from `post.type`, and renders the badge.
- **Spec updates** — revise the three FRs above; append new decision to `DECISIONS.md` reversing D-7.
- **Backfill** — none required (existing rows already carry all the data).

## Decisions log entry

> **D-19 (2026-05-13)** — Closed-delivered posts surface on both the publisher's and the respondent's profile, subject to the post's original `visibility`. The economic-role badge (📤 נתתי / 📥 קיבלתי) is derived from `(post.type, identity-role)`. Reverses the respondent-privacy carve-out previously stated in D-7 / FR-POST-017 AC1. Rationale: a public karma trail is more important than the implicit privacy of being a respondent on a public post; users who want privacy can publish posts as Followers-only or Only-me, and the closed visibility inherits accordingly.

## Tech debt notes

- **TD (new)** — Rename `recipients` table → `respondents` (or similar) and adjust column/CTA copy. The legacy name is semantically incorrect for `Request` posts where the row stores the giver, not the receiver. Touches schema, RLS, RPCs, FE types, and `FR-POST-017` copy ("Remove my recipient mark"). Out of scope for this change; should be logged in `TECH_DEBT.md` under the BE lane.
