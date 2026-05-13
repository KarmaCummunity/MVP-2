# Closed posts visible on both giver and recipient profiles

> **Date:** 2026-05-13
> **Status:** Design approved, ready for implementation plan
> **Touches:** `FR-PROFILE-001`, `FR-PROFILE-002`, `FR-POST-017`, `D-7`

---

## Problem

A `closed_delivered` post has two natural stakeholders:

- The **owner** who published and handed over the item.
- The **recipient** who received it (the `recipients` row).

Today the post surfaces asymmetrically:

| Surface | Owner profile | Recipient profile |
|---|---|---|
| "פוסטים סגורים" tab (own view) | ✅ shown | ✅ shown — **but** only the owner's own closed posts; received posts are absent |
| "פוסטים סגורים" tab (third-party view) | ✅ shown publicly, with "נמסר ל-X" | ❌ no received posts shown at all |
| Post detail (recipient view) | — | ✅ but **only the recipient themselves** can open it (FR-POST-017 AC1) |

The community-trail intent is broken: a viewer browsing Moshe's profile cannot see that Moshe received a sofa from Nave, even though the same transaction is publicly visible on Nave's profile.

## Goal

A closed-delivered post appears in the "פוסטים סגורים" tab of **both** the giver and the recipient. Visibility to third parties is governed by the post's original `visibility` field (Public / Followers-only / Only-me) — unchanged. No new visibility option, no automatic visibility upgrade on close.

## Out of scope

- Changing how `visibility` works (`Public` / `Followers only` / `Only me` semantics are untouched).
- Changing closure / reopen / un-mark mechanics (`FR-CLOSURE-*`).
- Counters / statistics (`FR-CLOSURE-009`, `FR-STATS-*`).
- Chat anchor card and system messages (`FR-CHAT-014`, `FR-CHAT-015`).
- Notifications.
- Feed / search discovery of closed posts (closed posts remain excluded from the main feed).

## Design

### Data model — no schema changes

Existing tables suffice:

- `posts` — has `owner_user_id`, `status`, `visibility`.
- `recipients` — has `post_id`, `user_id` (the recipient).

The "closed posts of user X" set is now defined as:

```
closed_posts(X) :=
  { p ∈ posts : p.owner_user_id = X ∧ p.status = 'closed_delivered' }
  ∪
  { p ∈ posts : p.id ∈ (SELECT post_id FROM recipients WHERE user_id = X)
                ∧ p.status = 'closed_delivered' }
```

Each post carries a derived **role-for-X** label: `'giver'` if `X = p.owner_user_id`, `'recipient'` if `X` appears in `recipients`. The two sets are disjoint (a post's owner cannot mark themselves as recipient).

### Query — single RPC for the tab

A new SQL function `profile_closed_posts(profile_user_id uuid, viewer_user_id uuid)` returns the merged list with the role label, ordered by closure timestamp descending. The function respects RLS the same way the existing `posts` selects do: rows the viewer cannot see under the post's `visibility` are simply filtered out (Public always returns; Followers-only returns only if `viewer_user_id` is an approved follower of `p.owner_user_id`; Only-me returns only if `viewer_user_id = p.owner_user_id`).

Rationale for an RPC vs. two FE fetches:
- One round-trip; clean ordering by `closed_at`.
- The role-decoration logic lives in one place.
- Keeps RLS authoritative (no client-side trust).

### UI — single mixed tab with role badges

`FR-PROFILE-001` and `FR-PROFILE-002` already render a "פוסטים סגורים" tab. The card list is fed by the new RPC. Each card shows a small role badge next to the title:

- 🎁 **נתתי** — when the profile owner is the post owner.
- 🎀 **קיבלתי** — when the profile owner is the recipient.

Sort order: by `closed_at` descending, mixed.

The card body itself remains identical to today's closed-post card (image, title, type tag, "נמסר מ-X ל-Y" line). The badge is the only new visual element.

### Tap behavior — opens the right post-detail variant

Tapping a card opens Post Detail. The variant rendered depends on `(viewer, post)`:

| Viewer | Post role for viewer | Variant |
|---|---|---|
| Profile owner viewing themselves, viewer = post owner | giver | `FR-POST-016` (owner closed_delivered — Reopen CTA) |
| Profile owner viewing themselves, viewer = recipient | recipient | `FR-POST-017` (recipient view — "Remove my recipient mark" CTA) |
| Third party | n/a | Read-only public closed view (existing pattern from `FR-PROFILE-002 AC2`) |

This matrix is already implementable from the post + recipients data the screen has; no new variants need to be authored.

### Reversal of D-7 / FR-POST-017 AC1

The current spec deliberately keeps the recipient view private to the recipient. This design reverses that:

- A user marked as a recipient on a public post is now publicly visible as such, on their own profile.
- For followers-only and only-me posts, visibility remains as the original post's setting — so received-but-private posts surface only to the audience that could see the original.

This is an intentional product change. Recorded as a new decision (see DECISIONS update below).

### Edge cases

- **Recipient un-marks** (`FR-CLOSURE-007`): the `recipients` row is deleted → the post falls out of the recipient's closed-posts set immediately. Already covered by the UNION semantics — no extra code path.
- **Owner reopens** (`FR-CLOSURE-005`): post status returns to `open` → post falls out of both profiles' closed-posts sets.
- **Admin removal** (`removed_admin`): post excluded from both sets (status filter).
- **Soft-deleted account on either side**: handled by existing RLS rules on `users` joins.
- **Only-me visibility on a closed post**: the recipient still sees their received card. The new RPC explicitly permits a row to be returned when `viewer_user_id` is either the post owner OR the recipient, regardless of `visibility`. Third parties are still gated by `visibility` as today. Note: in practice, an Only-me post can have a recipient only via direct chat with the owner — uncommon but legal.
- **Owner = recipient impossible**: enforced by the recipient-picker (`FR-CLOSURE-003`); no UNION duplicate possible.

## Acceptance criteria (additions to existing FRs)

**FR-PROFILE-001 AC4 (revised)**:
> Closed Posts tab lists posts where the profile user is **either the owner or the recipient**, status `closed_delivered`, ordered by `closed_at` desc. Each card shows a role badge (🎁 נתתי / 🎀 קיבלתי).

**FR-PROFILE-002 AC2 (revised)**:
> Closed Posts tab on another user's profile follows the same UNION rule, filtered by each post's `visibility`. Third-party viewers see the same cards but with a read-only post detail.

**FR-POST-017 AC1 (revised, reversing D-7)**:
> A user marked as the recipient of a `closed_delivered` post sees that post in their own profile's "פוסטים סגורים" tab. The post is **also** visible to other viewers of the recipient's profile, subject to the post's original `visibility` setting (Public / Followers-only / Only-me). The "Remove my recipient mark" CTA remains exclusive to the recipient themselves.

**New AC — FR-POST-017 AC5**:
> When a third party opens the post via the recipient's profile, the detail screen renders a read-only public view (no Reopen, no Remove-mark, no Edit). Banner: *"X מסר ל-Y בתאריך D"*.

## Migration / rollout

- **Migration 1** — `profile_closed_posts(profile_user_id, viewer_user_id)` RPC, definer-rights set to respect RLS. Tested with viewer in three positions (self, follower, stranger) against posts at three visibilities.
- **FE** — `apps/mobile` profile screen swaps its closed-posts query to call the RPC; card component gains a `roleForViewedProfile: 'giver' | 'recipient'` prop and renders the badge.
- **Spec updates** — revise the three FRs above; append new decision to `DECISIONS.md` reversing D-7.
- **Backfill** — none required (existing rows already carry all the data).

## Decisions log entry

> **D-19 (2026-05-13)** — Closed-delivered posts surface on both the giver's and the recipient's profile, subject to the post's original `visibility`. Reverses the recipient-privacy carve-out previously stated in D-7 / FR-POST-017 AC1. Rationale: a public karma trail is more important than the implicit privacy of receiving an item; users who want privacy can publish posts as Followers-only or Only-me, and the closed visibility inherits accordingly.

## Tech debt notes

None new. The RPC consolidates two FE queries into one — net simplification.
