# 2.14 Rides (Hitchhiking V2.0)

> **Status:** 🟡 V2.0 minimal product shipped 2026-05-26 (FR-RIDE-001..010 ✅); UI temporarily hidden 2026-05-28 (D-51) while backend hardens. FR-RIDE-011 schema in place; FR-RIDE-012 application layer ⏳. Requires migrations `0122` + `0127` + `0135` + `0137` + `0138` + `0139` on dev DB before runtime use.

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

## FR-RIDE-011 — Ride participants (request / approve / reject / cancel) 🟡
> Backend-only as of writing (UI hidden under D-31). Adds a structured "intent of record" alongside the chat thread so rides have a real join model with seat enforcement.

- AC1. `ride_participants` table with row per (ride, user, attempt). Status machine: `requested → {approved, rejected, cancelled}`; `approved → cancelled`. `rejected` / `cancelled` are terminal.
- AC2. Unique-active invariant: at most one `requested` or `approved` row per (ride, user) at any time. Terminal rows accumulate as audit trail; a re-request requires a new row (insert-only via RPC).
- AC3. Seat cap enforced atomically at approve time: `count(status = 'approved') < ride.seats_available` (offers); requests have `seats_available = NULL` ⇒ no cap.
- AC4. RPC `rpc_ride_participants_request(p_ride_id, p_note)` — caller authenticated, not the ride owner, ride is `open` + `Public`. Note ≤ 500 chars optional.
- AC5. RPC `rpc_ride_participants_decide(p_participant_id, p_status)` — caller is ride owner, target row is `requested`, p_status ∈ {`approved`, `rejected`}; on `approved` also revalidates ride still `open` and seat cap.
- AC6. RPC `rpc_ride_participants_cancel(p_participant_id)` — caller is the participant; `rejected` rows are not transitionable; `cancelled` is idempotent.
- AC7. RLS SELECT: row visible to its `user_id` or the ride owner. INSERT/UPDATE/DELETE revoked — all mutations through the RPCs.
- AC8. Domain entity `RideParticipant` + value object `RideParticipantStatus`; application use cases mirror the three RPCs.

## FR-RIDE-012 — Ride participants application use cases ⏳
- AC1. `RequestRideJoinUseCase` — wraps `rpc_ride_participants_request`, maps PG errors to domain `RideParticipantError`.
- AC2. `DecideRideJoinUseCase` — wraps `rpc_ride_participants_decide`; rejects non-owner / non-requested / non-open / `ride_full` paths via typed errors.
- AC3. `CancelRideJoinUseCase` — wraps `rpc_ride_participants_cancel`; idempotent on already-cancelled.
- AC4. `ListRideParticipantsUseCase(rideId)` — returns rows for the ride owner (any status); for non-owners, only their own row.
- AC5. `ListUserRideRequestsUseCase(userId)` — returns rows the caller owns, recent first.
