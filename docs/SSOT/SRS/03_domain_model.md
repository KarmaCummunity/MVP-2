# Part III — Domain Model

[← back to SRS index](../SRS.md) · [← back to Part II](./02_functional_requirements/README.md)

---

This part describes the **business domain** in the language of Domain-Driven Design: entities, value objects, relationships, lifecycle state machines, and invariants. It is **technology-neutral**; it does not specify Postgres types, ORM mappings, or class names. Those concretizations belong in `CODE_QUALITY.md`.

The domain layer is the inner core of the Clean Architecture (`D-3`). Nothing in this part may depend on Supabase, React Native, push providers, or any other infrastructure.

---

## 3.1 Aggregates and Entities

The MVP recognizes the following **aggregate roots** (in DDD sense):

| Aggregate | Identity | Lifecycle | Owns |
| --------- | -------- | --------- | ---- |
| `User` | `user_id` | sign-up → onboarding → active → suspended/banned/deleted | `Device[]`, `NotificationPreference`, `AuthIdentity[]`, `LocalDraft` (client-only) |
| `Post` | `post_id` | open → closed_delivered / deleted_no_recipient / expired / removed_admin | `MediaAsset[]`, `Recipient?` (zero or one), `ModerationQueueEntry?` |
| `FollowEdge` | `(follower_id, followed_id)` | created → deleted (no states beyond existence) | — |
| `FollowRequest` | `(requester_id, target_id, created_at)` | pending → accepted / rejected / cancelled | — |
| `Chat` | `chat_id` | active → archived (V1.5+) | `Message[]` |
| `Block` | `(blocker_id, blocked_id)` | created → deleted | — _(schema retained; no writer in MVP per `EXEC-9`)_ |
| `Report` | `report_id` | open → confirmed_violation / dismissed_no_violation | — |
| `AuditEvent` | `event_id` | append-only | — |

Aggregates may reference other aggregates by ID but never by direct memory pointer; cross-aggregate consistency is eventual within a transaction boundary.

The full property listing for each aggregate is documented in [`appendices/B_glossary.md`](./appendices/B_glossary.md), the data dictionary section.

---

## 3.2 Core Entities

### 3.2.1 `User`

Properties (illustrative; concrete column types live in `CODE_QUALITY.md`):

- `user_id` — opaque, immutable.
- `auth_method ∈ AuthMethod` (Google, Apple, Phone, Email).
- `share_handle` — globally unique slug for shareable links (`FR-PROFILE-008`).
- `display_name`, `city`, `biography`, `avatar_url` — user profile fields.
- `privacy_mode ∈ PrivacyMode` — `Public` | `Private`. Default `Public`.
- `privacy_changed_at` — timestamp of the most recent privacy switch.
- `account_status ∈ AccountStatus` — `pending_verification` | `active` | `suspended_for_false_reports` | `suspended_admin` | `banned` | `deleted`.
- `onboarding_state ∈ OnboardingState` — `pending_basic_info` | `pending_avatar` | `completed`.
- `notification_preferences` — `{ critical: bool, social: bool }`.
- `is_super_admin` — bool, single-row truth (`FR-ADMIN-006`).
- `closure_explainer_dismissed`, `first_post_nudge_dismissed` — UX flags.
- Counters: `items_given_count`, `items_received_count`, `active_posts_count_internal`, `followers_count`, `following_count`. Derived/projected; integrity invariant in `FR-CLOSURE-009` & `FR-STATS-005`.
- `created_at`, `updated_at`.

### 3.2.2 `AuthIdentity`

A future-proof one-to-many relationship between `User` and zero-or-more authentication identities (`FR-AUTH-009` AC3). MVP enforces exactly one row per user, but the schema is shaped to accept multiple.

Properties:

- `auth_identity_id`.
- `user_id`.
- `provider ∈ AuthProvider` — `google` | `apple` | `phone` | `email`.
- `provider_subject` — Google `sub`, Apple `sub`, normalized phone, or email.
- `created_at`.

### 3.2.3 `Device`

A registered push-receiving device.

- `device_id`.
- `user_id`.
- `platform ∈ Platform` — `ios` | `android` | `web`.
- `push_token` — opaque, encrypted at rest.
- `last_seen_at`.
- `active` — bool.

### 3.2.4 `Post`

- `post_id`.
- `owner_id` (FK → `User`).
- `type ∈ PostType` — `Give` | `Request`.
- `status ∈ PostStatus` — `open` | `closed_delivered` | `deleted_no_recipient` | `expired` | `removed_admin`.
- `visibility ∈ PostVisibility` — `Public` | `FollowersOnly` | `OnlyMe`.
- `title` — ≤80 chars, required.
- `description` — ≤500 chars, optional.
- `category ∈ Category` — required, default `Other`.
- `address` — value object (`Address`).
- `location_display_level ∈ LocationDisplayLevel`.
- `item_condition ∈ ItemCondition?` — only for `type = Give`.
- `urgency` — string, only for `type = Request`.
- `media_assets[]` — references to `MediaAsset` entities.
- `reopen_count` — integer ≥ 0.
- `delete_after` — timestamp; populated only when `status = deleted_no_recipient`.
- `created_at`, `updated_at`.

### 3.2.5 `Recipient`

A post may have zero or one `Recipient`. Its presence indicates a `closed_delivered` outcome with credit.

- `post_id`.
- `recipient_user_id`.
- `marked_at`.

### 3.2.6 `MediaAsset`

- `media_asset_id`.
- `post_id` (or `null` for orphans during upload).
- `path` — storage path of the original.
- `derivatives` — references to thumbnail and detail-size versions.
- `mime_type`, `size_bytes`.
- `created_at`.

### 3.2.7 `FollowEdge`

A directed relationship.

- `(follower_id, followed_id)` — composite key.
- `created_at`.

### 3.2.8 `FollowRequest`

- `(requester_id, target_id, created_at)` — composite key (allows historical re-requests).
- `status ∈ FollowRequestStatus` — `pending` | `accepted` | `rejected` | `cancelled`.
- `cooldown_until` — timestamp, populated when `status = rejected`.

### 3.2.9 `Chat`

- `chat_id`.
- `participant_ids` — exactly two distinct `User` IDs in MVP.
- `anchor_post_id` — `null` or `Post.post_id` if the chat originated from a post.
- `is_support_thread` — bool, `true` for the user-↔-Super Admin support channel.
- `last_message_at`.
- `created_at`.

### 3.2.10 `Message`

- `message_id`.
- `chat_id`.
- `sender_id` — `null` for system messages.
- `kind ∈ MessageKind` — `user` | `system`.
- `body` — text, ≤2,000 chars.
- `system_payload` — `null` or a structured payload for system messages (e.g., a serialized moderation alert).
- `status ∈ MessageStatus` — `pending` | `delivered` | `read` (transitions per `FR-CHAT-011`).
- `created_at`, `delivered_at`, `read_at`.

### 3.2.11 `Block` — deferred per `EXEC-9`

- `(blocker_id, blocked_id)` — composite key.
- `created_at`.

> Table exists in the DB schema (`public.blocks`) and the `is_blocked()` / `has_blocked()` predicates are referenced from chat / feed visibility queries. No domain entity, port, or adapter ships in MVP — see `EXEC-9` (2026-05-11). The fields above describe the post-MVP shape that the schema is already prepared for.

### 3.2.12 `Report`

- `report_id`.
- `reporter_id`.
- `target_type ∈ ReportTargetType` — `post` | `user` | `chat` | `none`.
- `target_id` — nullable when `target_type = none` (issue reports).
- `reason ∈ ReportReason` — `Spam` | `Offensive` | `Misleading` | `Illegal` | `Other`.
- `note` — ≤500 chars, optional.
- `status ∈ ReportStatus` — `open` | `confirmed_violation` | `dismissed_no_violation`.
- `created_at`, `resolved_at`.

### 3.2.13 `ReporterHide`

- `(reporter_id, target_type, target_id)` — composite key.
- `created_at`.

### 3.2.14 `AuditEvent`

- `event_id`.
- `actor_id` — `null` for system-originated events.
- `action ∈ AuditAction` — enumerated set, see [`06_cross_cutting/06_audit_trail.md`](./06_cross_cutting/06_audit_trail.md).
- `target_type`, `target_id`.
- `metadata` — structured payload.
- `created_at`.

### 3.2.15 `DeletedIdentifier`

- `identifier_hash`.
- `provider ∈ AuthProvider`.
- `deleted_at`.
- `cooldown_until` — `deleted_at + 30 days`.

### 3.2.16 `ModerationQueueEntry`

- `entry_id`.
- `target_type`, `target_id`.
- `reason ∈ QueueReason` — `excessive_reopens` | `forbidden_keyword` | `manual_flag`.
- `created_at`, `resolved_at`.

### 3.2.17 `City`

A seeded reference table.

- `city_id` — slug.
- `name_he`, `name_en`.

### 3.2.18 `CommunityStats` (read-model)

A materialized view-style projection populated by background jobs and event handlers.

- `metric_id` — `users_total`, `posts_open_public`, `posts_closed_delivered_total`.
- `value`.
- `as_of`.

---

## 3.3 Value Objects

Value objects are immutable and equality-by-value.

| Name | Shape | Used by |
| ---- | ----- | ------- |
| `Address` | `{ city: City, street: string, street_number: string }` | `Post` |
| `LocationDisplayLevel` | enum `CityOnly` \| `CityAndStreet` \| `FullAddress` | `Post` |
| `PostVisibility` | enum `Public` \| `FollowersOnly` \| `OnlyMe` | `Post` |
| `PostType` | enum `Give` \| `Request` | `Post` |
| `PostStatus` | enum (see 3.4) | `Post` |
| `ItemCondition` | enum `New` \| `LikeNew` \| `Good` \| `Fair` | `Post` |
| `Category` | enum, 10 values + `Other` default | `Post` |
| `PrivacyMode` | enum `Public` \| `Private` | `User` |
| `AccountStatus` | enum (see 3.4) | `User` |
| `OnboardingState` | enum (see 3.4) | `User` |
| `AuthProvider` | enum `google` \| `apple` \| `phone` \| `email` | `AuthIdentity` |
| `AuthMethod` | derived alias from primary `AuthIdentity.provider` | `User` |
| `Platform` | enum `ios` \| `android` \| `web` | `Device` |
| `ReportReason` | enum (see 3.2.12) | `Report` |
| `ReportTargetType` | enum (see 3.2.12) | `Report` |
| `ReportStatus` | enum (see 3.2.12) | `Report` |
| `MessageKind` | enum `user` \| `system` | `Message` |
| `MessageStatus` | enum `pending` \| `delivered` \| `read` | `Message` |
| `FollowRequestStatus` | enum `pending` \| `accepted` \| `rejected` \| `cancelled` | `FollowRequest` |
| `QueueReason` | enum (see 3.2.16) | `ModerationQueueEntry` |
| `AuditAction` | enum (see 06_cross_cutting/06_audit_trail.md) | `AuditEvent` |
| `RelativeTimestamp` | display-only formatter wrapper around an ISO timestamp | UI |

Value objects are constructed via factory functions that validate invariants (e.g., `Address.create({...})` enforces `street` non-empty when `street_number` is given).

---

## 3.4 Lifecycle State Machines

### 3.4.1 `Post.status`

```
                +-----------+
                |   open    | <----- (FR-CLOSURE-005 reopen)
                +-----+-----+
                      |
   +------------------+--------------------+------------------+
   |                  |                    |                  |
   v                  v                    v                  v
closed_delivered   deleted_no_           expired         removed_admin
                   recipient             (300 days)      (3 reports OR admin)
   |                  |                    |
   |                  +--→ hard delete after 7 days
   |                       (FR-CLOSURE-008)
   +--→ recipient un-mark (FR-CLOSURE-007) → deleted_no_recipient
```

Transitions are guarded:

- `open → closed_delivered` requires the closure flow (`FR-CLOSURE-002` + `FR-CLOSURE-003`).
- `open → deleted_no_recipient` requires the closure flow without a recipient pick.
- `open → expired` is automatic (`FR-POST-013`).
- `* → removed_admin` happens via auto-removal (`FR-MOD-005`) or explicit admin action (`FR-ADMIN-005`).
- `closed_delivered → open` is the reopen path.
- `deleted_no_recipient → open` is allowed within 7 days (`FR-CLOSURE-005`).
- `removed_admin → open` is reachable only via `FR-ADMIN-002` (restore).

### 3.4.2 `User.account_status`

```
pending_verification ──(email verified or non-email signup)──▶ active
active ──(suspension, false reports)──▶ suspended_for_false_reports
suspended_for_false_reports ──(timer or appeal)──▶ active or banned
active ──(admin ban)──▶ banned
active ──(self-delete)──▶ deleted (soft) ──(30d)──▶ hard-deleted
suspended_admin ──(restore)──▶ active
```

`banned` is terminal except by manual admin action.

### 3.4.3 `User.onboarding_state`

```
pending_basic_info ──(FR-AUTH-010)──▶ pending_avatar
pending_avatar ──(FR-AUTH-011 or skip)──▶ completed
```

A user may sign in with `pending_basic_info` and post-onboard later via the soft gate (`FR-AUTH-015`).

### 3.4.4 `FollowRequest.status`

```
pending ──(FR-FOLLOW-005)──▶ accepted
pending ──(FR-FOLLOW-006)──▶ rejected (cooldown_until = now + 14d)
pending ──(FR-FOLLOW-004)──▶ cancelled
```

`accepted` and `rejected` are terminal for that row; a new request creates a new row.

### 3.4.5 `Message.status`

```
pending ──(server ack)──▶ delivered ──(recipient view)──▶ read
```

A `pending` message that fails after retries transitions to a UI-only `failed` flag; the row remains `pending` server-side until reconciliation or expiry.

---

## 3.5 Domain Invariants

These are the formal expressions of `R-MVP-*` rules at the domain layer. They are enforced by pure functions in the `domain` package and replicated as RLS / DB constraints in the infrastructure layer (see `CODE_QUALITY.md`).

### Visibility & privacy invariants

- **INV-V1.** A `Post` with `visibility = FollowersOnly` is readable by `viewer` iff `FollowEdge { follower = viewer, followed = post.owner }` exists. *(R-MVP-Items-12, FR-FOLLOW-012)*
- **INV-V2.** A `Post` with `visibility = OnlyMe` is readable only by its owner. *(R-MVP-Items-12)*
- **INV-V3.** A `Post` may upgrade visibility but not downgrade. *(R-MVP-Privacy-9, FR-POST-009)*
- **INV-V4.** A profile in `Private` mode hides `Post` lists, follower/following lists, and closed-post history from non-approved followers. *(R-MVP-Privacy-11)*
- **INV-V5.** Profile mode change does not retroactively mutate post visibility. *(R-MVP-Privacy-13)*

### Closure & statistics invariants

- **INV-C1.** `User.items_given_count` and `User.items_received_count` are conservation-correct under the closure / reopen / un-mark operations. *(FR-CLOSURE-009)*
- **INV-C2.** `User.active_posts_count_internal` equals the count of `Post` where `owner = user` and `status = open`. *(FR-PROFILE-013, FR-STATS-002)*
- **INV-C3.** `Post.reopen_count >= 5` ⇒ a `ModerationQueueEntry` with `reason = excessive_reopens` exists for that post. *(R-MVP-Items-7)*

### Moderation invariants

- **INV-M1.** ~~If `Block { A, B }` exists, no `FollowEdge` involving both A and B exists, and no `FollowRequest` between them is `pending`. *(FR-MOD-003)*~~ Deferred per `EXEC-9` — no `Block` rows are produced in MVP.
- **INV-M2.** A `Report` with `status = open` has been resolved within 30 days, otherwise an SRE alert fires. *(operational, NFR-RELI-005)*
- **INV-M3.** A user in `banned` or `suspended_for_false_reports` cannot create new `Report`s. *(FR-MOD-010)*

### Limits

- **INV-L1.** A user owns at most 20 `Post`s with `status = open` at any time, including `OnlyMe`. *(R-MVP-Items-8, R-MVP-Items-14)*
- **INV-L2.** Each `Post` carries at most 5 `MediaAsset`s. *(FR-POST-005)*
- **INV-L3.** Each `Chat` has exactly two `participant_ids`, both distinct. *(R-MVP-Chat-1)*

### Identity invariants

- **INV-I1.** Within MVP scope, each `User` has exactly one `AuthIdentity` row. *(FR-AUTH-009)*
- **INV-I2.** A `DeletedIdentifier` row blocks re-registration with the same identifier until `cooldown_until`. *(FR-AUTH-016)*
- **INV-I3.** At most one `User` may carry `is_super_admin = true`. *(FR-ADMIN-006)*

---

## 3.6 Cross-Aggregate Operations

Operations that span aggregates execute within a single transaction at the application layer:

- **Closure (with recipient)**: writes to `Post`, `Recipient`, `User.items_given_count`, `User.items_received_count`, `Notification` (queued), `AuditEvent`.
- **Reopen**: writes to `Post`, deletes `Recipient` if any, decrements counters, `AuditEvent`.
- **Block** _(deferred per `EXEC-9` — listed for post-MVP restoration)_: writes to `Block`, deletes `FollowEdge` (both directions), drops pending `FollowRequest`, `AuditEvent`.
- **Privacy → Public**: writes to `User.privacy_mode`, batch-updates `FollowRequest.status` to `accepted`, queues a fan-out of `Notification`s, `AuditEvent`.
- **Account deletion**: writes `User.account_status = deleted`, hard-deletes owned `Post`/`MediaAsset`s, retains `Message`s with placeholder, hard-deletes `FollowEdge`/`FollowRequest`, creates `DeletedIdentifier`, `AuditEvent`.

The exact orchestration of these operations is the responsibility of the application layer (use cases). They are not duplicated in the domain layer except for invariants.

---

## 3.7 Anti-Corruption Layer Boundaries

The infrastructure boundary is at:

- **Database**: domain entities are mapped to/from rows; the mapping is part of `infrastructure-supabase`, not `domain`.
- **Auth providers**: SSO subject/email/phone are normalized into `AuthIdentity` by `infrastructure-supabase`.
- **Push providers**: `Notification` aggregates are translated to FCM/APNs/Web Push payloads at the boundary.
- **UI events**: HTTP / Realtime / RPC events are translated into application-layer commands; the domain never imports them.

The domain layer must compile and run **without** any of these boundaries. The `domain` package's tests run with no external services configured.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Aggregates, value objects, state machines, and invariants extracted from PRD and FRs. |
