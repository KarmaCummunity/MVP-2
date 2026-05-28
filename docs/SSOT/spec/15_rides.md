# 2.14 Rides (Hitchhiking V2.0)

> **Status:** 🟡 V2.0 minimal product shipped 2026-05-26 (FR-RIDE-001..010 ✅); UI temporarily hidden 2026-05-28 (D-51) while backend hardens. FR-RIDE-011 schema ✅ + FR-RIDE-012 application layer ✅ (no UI yet). Requires migrations `0122` + `0127` + `0135` + `0137` + `0138` + `0139` on dev DB before runtime use.

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

## FR-RIDE-011 — Ride participants (request / approve / reject / cancel) ✅
> Backend-only as of writing (UI hidden under D-31). Adds a structured "intent of record" alongside the chat thread so rides have a real join model with seat enforcement.

- AC1. `ride_participants` table with row per (ride, user, attempt). Status machine: `requested → {approved, rejected, cancelled}`; `approved → cancelled`. `rejected` / `cancelled` are terminal.
- AC2. Unique-active invariant: at most one `requested` or `approved` row per (ride, user) at any time. Terminal rows accumulate as audit trail; a re-request requires a new row (insert-only via RPC).
- AC3. Seat cap enforced atomically at approve time: `count(status = 'approved') < ride.seats_available` (offers); requests have `seats_available = NULL` ⇒ no cap.
- AC4. RPC `rpc_ride_participants_request(p_ride_id, p_note)` — caller authenticated, not the ride owner, ride is `open` + `Public`. Note ≤ 500 chars optional.
- AC5. RPC `rpc_ride_participants_decide(p_participant_id, p_status)` — caller is ride owner, target row is `requested`, p_status ∈ {`approved`, `rejected`}; on `approved` also revalidates ride still `open` and seat cap.
- AC6. RPC `rpc_ride_participants_cancel(p_participant_id)` — caller is the participant; `rejected` rows are not transitionable; `cancelled` is idempotent.
- AC7. RLS SELECT: row visible to its `user_id` or the ride owner. INSERT/UPDATE/DELETE revoked — all mutations through the RPCs.
- AC8. Domain entity `RideParticipant` + value object `RideParticipantStatus`; application use cases mirror the three RPCs.

## FR-RIDE-012 — Ride participants application use cases ✅
- AC1. `RequestRideJoinUseCase` — wraps `rpc_ride_participants_request`, maps PG errors to domain `RideParticipantError`.
- AC2. `DecideRideJoinUseCase` — wraps `rpc_ride_participants_decide`; rejects non-owner / non-requested / non-open / `ride_full` paths via typed errors.
- AC3. `CancelRideJoinUseCase` — wraps `rpc_ride_participants_cancel`; idempotent on already-cancelled.
- AC4. `ListRideParticipantsUseCase(rideId)` — returns rows for the ride owner (any status); for non-owners, only their own row.
- AC5. `ListUserRideRequestsUseCase(userId)` — returns rows the caller owns, recent first.

## FR-RIDE-015 — Chat system message on ride lifecycle ✅
- AC1. When a ride transitions OUT of `status='open'` (closed / cancelled / expired), every chat with `anchor_ride_id = ride_id` receives a Hebrew system message describing the transition and `system_payload = {kind: 'ride_lifecycle', ride_id, status}`.
- AC2. The system message is emitted BEFORE `anchor_ride_id` is cleared (so the SELECT finds the anchored chats).
- AC3. Owner close/cancel via `CloseRideListingUseCase` and cron-driven expiry both trigger the same emission via the AFTER UPDATE trigger.
- AC4. The trigger function `ride_listings_clear_chat_anchor` is replaced (CREATE OR REPLACE) — the 0137 trigger registration still binds to it.

## FR-RIDE-016 — Realtime subscriptions ✅
- AC1. Tables `ride_listings` and `ride_participants` are members of `supabase_realtime` publication (broadcast still gated by RLS).
- AC2. `IRidesRealtime.subscribeToPublicRideInserts(cb)` — INSERT on `ride_listings` filtered to `visibility=Public`. Signals only; consumer refetches.
- AC3. `IRidesRealtime.subscribeToUserParticipantUpdates(userId, cb)` — UPDATE on `ride_participants` filtered to `user_id=eq.<userId>`. Fires for status transitions on the user's own rows.
- AC4. `IRidesRealtime.subscribeToRideParticipantInserts(rideId, cb)` — INSERT on `ride_participants` filtered to `ride_id=eq.<rideId>`. Lets the owner see new join requests live.
- AC5. Adapter `SupabaseRidesRealtime` mirrors `SupabaseFeedRealtime` (unique topics per call; CHANNEL_ERROR / TIMED_OUT → onError; returned unsubscribe calls `removeChannel`).

## FR-RIDE-014 — Inverse-mode ride matches ✅
- AC1. RPC `ride_listings_find_matches(p_ride_id, p_window_hours, p_limit)` returns rides with the inverse `mode` (offer ↔ request), the same origin/dest city pair, `status='open'`, `visibility='Public'`, and `departs_at` within ±`window_hours` of the source ride.
- AC2. Caller must own the source ride (`auth.uid() = ride.owner_id`); otherwise the RPC raises `not_ride_owner`.
- AC3. Results are ordered by absolute time delta from `source.departs_at` ascending; ties break by `created_at` descending.
- AC4. `window_hours` is clamped to [1, 72] (default 12); `limit` to [1, 50] (default 20).
- AC5. Application: `FindRideMatchesUseCase` + `IRideListingRepository.findMatches`.

## FR-RIDE-013 — Ride participants notifications ✅
- AC1. On INSERT (`status = 'requested'`), the ride owner gets a `ride_request` critical notification with the rider's display name and the ride title; deep-link route `/donations/rides/[id]`.
- AC2. On UPDATE `requested → approved`, the participant gets `ride_approved` with the owner's name + ride title.
- AC3. On UPDATE `requested → rejected`, the participant gets `ride_rejected` with the owner's name + ride title.
- AC4. On UPDATE `approved → cancelled` (rider-initiated withdrawal of an approved seat), the ride owner gets `ride_participant_cancelled` with the rider's name + ride title. `requested → cancelled` is intentionally silent (polite withdrawal).
- AC5. Dedupe keys are per (participant, transition) so retries are idempotent.
- AC6. i18n keys live in `apps/mobile/src/i18n/locales/he/modules/notifications.ts` and the matching `supabase/functions/dispatch-notification/i18n.json` (server mirror).
