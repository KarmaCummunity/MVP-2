# 2.14 Rides (Hitchhiking V2.0)

> **Status:** ✅ Complete — V2.0 minimal product shipped on `feat/FR-RIDE-rides-v2` (2026-05-26). Requires migration `0122_ride_listings.sql` on dev DB before runtime use.

Prefix: `FR-RIDE-*`

## FR-RIDE-001 — Donations entry: טרמפים tile
- AC1. Donations Hub shows tile **טרמפים** routing to `/(tabs)/donations/rides`.
- AC2. Former **תחבורה** tile href becomes `/(tabs)/donations/rides` (same destination).
- AC3. Tile uses existing `DonationTile` / Card styling (FR-DONATE-006 parity).

## FR-RIDE-002 — Rides Hub feed
- AC1. Screen at `/(tabs)/donations/rides` lists open ride listings, `departs_at` ascending.
- AC2. Mixed offer + request cards with mode badge (Hebrew i18n).
- AC3. Free-text search: 300ms debounce, ≥2 chars on title/description/city names.
- AC4. Filter sheet: origin city, dest city, optional date range, mode (all/offer/request).
- AC5. Footer section renders `<DonationLinksList categorySlug="transport" />`.

## FR-RIDE-003 — Publish ride (FAB + sheet)
- AC1. Single FAB `+` opens bottom sheet: choose **מציע נסיעה** | **מחפש נסיעה**.
- AC2. Defaults: last mode (AsyncStorage `rides.lastMode`), origin city = profile city, departs_at = now, seats = 3 (offer only).
- AC3. Required: origin city, dest city (≠ origin), departs_at. Offer: seats 1–8. Description optional ≤500.
- AC4. Title auto-generated; user does not edit title.
- AC5. On success: sheet dismisses, feed refetches, `rides.lastMode` saved.

## FR-RIDE-004 — Ride detail + contact
- AC1. `/(tabs)/donations/rides/[id]` shows full listing + owner.
- AC2. Non-owner CTA **שלח הודעה** opens anchored chat (`anchorRideId`) with prefilled template.
- AC3. Owner may **סגור** (`closed`) or **בטל** (`cancelled`).

## FR-RIDE-005 — Chat anchor on ride
- AC1. `OpenOrCreateChatUseCase` accepts optional `anchorRideId` (exclusive with `anchorPostId`).
- AC2. Chat header shows ride summary when `anchorRideId` present (new `AnchoredRideCard`).
- AC3. Prefill key `chat.autoMessage.rideInitial` with ride title.

## FR-RIDE-006 — Permissions
- AC1. Any authenticated user may create offer or request and contact listings.
- AC2. RLS: owner insert/update; select respects `visibility` (Public default).

## FR-RIDE-007 — Visibility (V2.0 minimal)
- AC1. Create always `Public` (no UI for FollowersOnly/OnlyMe in V2.0).

## FR-RIDE-008 — Reporting
- AC1. Report owner from ride detail via existing user report flow (FR-MOD-001).

## FR-RIDE-009 — Domain validation
- AC1. `validateRideDraft` rejects origin === dest, missing seats on offer, seats on request.

## FR-RIDE-010 — Extension ports (no UI)
- AC1. `IRideJoinPolicy` + `IRideMatchScorer` interfaces exist; V2.0 uses DirectChat + chronological sort only.
