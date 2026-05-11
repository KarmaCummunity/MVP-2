# Appendix B — Glossary & Data Dictionary

[← back to SRS index](../../SRS.md)

---

## Purpose

A single, alphabetized reference for every domain term and data field used in this SRS. Use this when a word appears in another SRS document and you need a precise definition.

This appendix is paired with [`03_domain_model.md`](../03_domain_model.md), which defines aggregates structurally; this file emphasizes vocabulary.

---

## B.1 Glossary (concepts)

**Active post.** A `Post` whose `status = open`. Posts at any visibility (Public, FollowersOnly, OnlyMe) count as active for the owner; the public-projection counter excludes OnlyMe (`FR-PROFILE-013`).

**Aggregate.** A DDD term: a cluster of entities and value objects that change together inside a single transactional boundary (Part III §3.1).

**Anchor post.** A `Post` that a `Chat` originated from. A chat may have at most one anchor in MVP (`FR-CHAT-004`).

**Application layer.** The Clean-Architecture layer hosting use cases, orchestrating domain operations and the ports to infrastructure. It owns no implementation detail of external systems.

**Auto-message.** A pre-filled message inserted into the composer when a user opens a chat from a post detail page (`FR-CHAT-005`).

**Auto-removal.** The automatic transition of a content target to a hidden state once it accumulates 3 distinct reports (`FR-MOD-005`).

**Block.** _(Deferred post-MVP per `EXEC-9`.)_ A directed relationship that bilaterally hides two users from each other across all surfaces (`FR-MOD-003`). The DB schema (`public.blocks` + `is_blocked()`) is in place but unpopulated in MVP.

**Closed (delivered).** The terminal state of a `Post` after a successful closure with a recipient marked (`closed_delivered`).

**Closed (no recipient).** The state of a `Post` after closure without a recipient — pending hard-delete after 7 days (`deleted_no_recipient`).

**Closure.** The sequence of dialogs that ends an active post (`FR-CLOSURE-001`..`FR-CLOSURE-004`).

**Cold-start fallback.** The mechanism that expands a feed query nationwide when the viewer's city has too few posts (`FR-FEED-007`).

**Community Member.** A signed-in, fully onboarded user (Persona; `01_vision_and_personas.md` §1.3.2).

**Cooldown.** A timed window during which an action is disallowed (re-registration, re-request after rejection, etc.).

**Critical notification.** A user-controllable notification category covering operationally important events (chat, recipient marking, expiry, removals) (`D-5`).

**Deep link.** A canonical URL that resolves to a specific surface across iOS, Android, and Web (`05_external_interfaces.md` §5.7).

**Domain layer.** The innermost Clean-Architecture layer; contains entities, value objects, and pure invariants. Has zero infrastructure dependencies.

**Edge Function.** A Supabase serverless TypeScript function used for cross-cutting orchestration (`05_external_interfaces.md` §5.5).

**Feed.** The chronological list of posts a viewer can see, with filters and search applied (`02_functional_requirements/06_feed_and_search.md`).

**FollowEdge.** A confirmed directed relationship between two users; the basis for `FollowersOnly` visibility (`FR-FOLLOW-001`).

**FollowRequest.** A pending or resolved request to follow a private profile (`FR-FOLLOW-003`).

**Followers-only post.** A post with `visibility = FollowersOnly`; visible to the owner and approved followers (`FR-POST-003`, `INV-V1`).

**Give post.** A post with `type = Give`: an item being given away (`FR-POST-001`).

**Guest.** An unauthenticated visitor, allowed limited read access (`01_vision_and_personas.md` §1.3.1, `FR-AUTH-013`).

**Idempotency.** Behavior under retry: a write with the same `idempotency_key` produces a single side effect (`NFR-RELI-002`).

**Inbox.** The list of conversations for the signed-in user (`FR-CHAT-001`).

**Invariant.** A formal rule the domain model enforces at all times (Part III §3.5).

**Karma Community.** The product brand and the community that uses it.

**KPI.** A Key Performance Indicator from §1.2 used to measure MVP success.

**LocationDisplayLevel.** The amount of address detail visible to non-owners (`CityOnly`, `CityAndStreet`, `FullAddress`).

**Mark as recipient.** Step 2 of the closure flow that credits a specific user with the delivery (`FR-CLOSURE-003`).

**Mutual follow.** When two users follow each other; derived (not stored) and used for analytics (`FR-FOLLOW-010`).

**North Star Metric.** `closed_delivered` posts; the single number that defines MVP success (§1.2.1).

**Onboarding.** The 3-step wizard that runs after sign-up (`FR-AUTH-010`..`FR-AUTH-012`).

**Only-me post.** A post with `visibility = OnlyMe`; visible only to the owner (`INV-V2`).

**PII.** Personally Identifiable Information — never logged, never present in analytics events.

**Privacy mode.** A boolean profile-level setting `Public` ↔ `Private` (`FR-PROFILE-005`, `FR-PROFILE-006`).

**Public profile.** A profile with `privacy_mode = Public`; followers join without approval.

**RLS.** Row-Level Security policies in Postgres; the authoritative authorization layer (`NFR-SEC-002`).

**Recipient.** The user marked as having received a delivered post (`FR-CLOSURE-003`).

**Recipient un-mark.** A self-service action by a recipient to remove their credit (`FR-CLOSURE-007`, `D-7`).

**Reopen.** The owner's action to return a closed or no-recipient post to `open` (`FR-CLOSURE-005`).

**Report.** A user-submitted moderation request against content or another user (`FR-MOD-001`).

**Request post.** A post with `type = Request`: a user looking for an item (`FR-POST-001`).

**Soft gate.** A modal that requires the user to complete missing onboarding fields before performing meaningful actions (`FR-AUTH-015`, `D-10`).

**Social notification.** A user-controllable notification category covering courtesy events (new follower, follow approval) (`D-5`).

**Super Admin.** The single privileged account that performs moderation through the support thread (`02_Personas_Roles.md`, `FR-ADMIN-*`).

**Support thread.** The chat between a user and the Super Admin used for issue reports and moderation responses (`FR-CHAT-007`).

**Suspect flag.** A non-user-visible marker added to a post for moderator review (`FR-MOD-008`).

**Visibility.** A post-level setting `Public | FollowersOnly | OnlyMe`; upgrade-only (`FR-POST-009`).

**Warm empty state.** A friendly, helpful empty state with at least one suggested action (`D-15`).

---

## B.2 Data Dictionary

This section formalizes every persistent field of the MVP. Lengths and types are illustrative; the concrete column types are documented in `CODE_QUALITY.md`.

### B.2.1 `User`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `user_id` | UUID | PK |
| `share_handle` | string(32) | unique slug for `/u/:handle` |
| `display_name` | string(50) | required, non-empty |
| `city` | string(64) | FK → `City.city_id` |
| `biography` | string(200) | optional |
| `avatar_url` | string | own bucket path |
| `auth_method` | enum | derived from primary AuthIdentity |
| `privacy_mode` | enum | `Public` \| `Private` |
| `privacy_changed_at` | timestamptz | nullable |
| `account_status` | enum | see Part III §3.4.2 |
| `onboarding_state` | enum | see Part III §3.4.3 |
| `notification_preferences` | jsonb | `{ critical: bool, social: bool }` |
| `is_super_admin` | bool | invariant: at most one row `true` |
| `closure_explainer_dismissed` | bool | default false |
| `first_post_nudge_dismissed` | bool | default false |
| `items_given_count` | int ≥ 0 | denormalized counter |
| `items_received_count` | int ≥ 0 | denormalized counter |
| `active_posts_count_internal` | int ≥ 0 | denormalized counter |
| `followers_count` | int ≥ 0 | denormalized counter |
| `following_count` | int ≥ 0 | denormalized counter |
| `false_reports_count` | int ≥ 0 | rolling 30-day count |
| `locale_preference` | BCP-47 | nullable; default OS locale |
| `created_at` | timestamptz | immutable |
| `updated_at` | timestamptz | bumped on row update |
| `deleted_at` | timestamptz | populated when soft-deleted |

### B.2.2 `AuthIdentity`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `auth_identity_id` | UUID | PK |
| `user_id` | UUID | FK → User |
| `provider` | enum | `google`/`apple`/`phone`/`email` |
| `provider_subject` | string | normalized identifier |
| `created_at` | timestamptz | immutable |

### B.2.3 `Device`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `device_id` | UUID | PK |
| `user_id` | UUID | FK → User |
| `platform` | enum | `ios`/`android`/`web` |
| `push_token` | encrypted text | provider opaque |
| `last_seen_at` | timestamptz |  |
| `active` | bool | pruned by `bg-job-token-prune` |

### B.2.4 `Post`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `post_id` | UUID | PK |
| `owner_id` | UUID | FK → User |
| `type` | enum | `Give` \| `Request` |
| `status` | enum | see Part III §3.4.1 |
| `visibility` | enum | `Public` \| `FollowersOnly` \| `OnlyMe` |
| `title` | string(80) | required |
| `description` | string(500) | optional |
| `category` | enum | one of 10 + `Other` |
| `address_city_id` | string | FK → City |
| `address_street` | string(80) | required |
| `address_street_number` | string(10) | required |
| `location_display_level` | enum | default `CityAndStreet` |
| `item_condition` | enum | nullable; only for `Give` |
| `urgency` | string(100) | nullable; only for `Request` |
| `reopen_count` | int ≥ 0 | default 0 |
| `delete_after` | timestamptz | nullable; populated when `deleted_no_recipient` |
| `created_at` | timestamptz | immutable |
| `updated_at` | timestamptz |  |

### B.2.5 `Recipient`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `post_id` | UUID | FK → Post (PK) |
| `recipient_user_id` | UUID | FK → User |
| `marked_at` | timestamptz |  |

### B.2.6 `MediaAsset`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `media_asset_id` | UUID | PK |
| `post_id` | UUID? | FK → Post (nullable for orphan during upload) |
| `path_original` | string | bucket path |
| `path_detail` | string | derivative |
| `path_thumb` | string | derivative |
| `mime_type` | string | image/* |
| `size_bytes` | int | post-resize |
| `created_at` | timestamptz |  |

### B.2.7 `FollowEdge`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `follower_id` | UUID | composite PK |
| `followed_id` | UUID | composite PK |
| `created_at` | timestamptz |  |

### B.2.8 `FollowRequest`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `requester_id` | UUID | composite PK |
| `target_id` | UUID | composite PK |
| `created_at` | timestamptz | composite PK |
| `status` | enum |  |
| `cooldown_until` | timestamptz | nullable |
| `resolved_at` | timestamptz | nullable |

### B.2.9 `Chat`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `chat_id` | UUID | PK |
| `participant_a_id` | UUID | always sorted `a < b` |
| `participant_b_id` | UUID | composite uniqueness `(a, b)` |
| `anchor_post_id` | UUID? | FK → Post |
| `is_support_thread` | bool | true for user↔SuperAdmin |
| `last_message_at` | timestamptz |  |
| `created_at` | timestamptz |  |

### B.2.10 `Message`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `message_id` | UUID | PK |
| `chat_id` | UUID | FK → Chat |
| `sender_id` | UUID? | nullable for system messages |
| `kind` | enum | `user` \| `system` |
| `body` | string(2000) | nullable for some system messages |
| `system_payload` | jsonb? | structured for system messages |
| `status` | enum | `pending` \| `delivered` \| `read` |
| `created_at` | timestamptz |  |
| `delivered_at` | timestamptz? |  |
| `read_at` | timestamptz? |  |

### B.2.11 `Block` — deferred per `EXEC-9`

> Schema retained in `0003_init_following_blocking.sql`; no writer in MVP. Fields documented for post-MVP restoration.

| Field | Type | Notes |
| ----- | ---- | ----- |
| `blocker_id` | UUID | composite PK |
| `blocked_id` | UUID | composite PK |
| `created_at` | timestamptz |  |

### B.2.12 `Report`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `report_id` | UUID | PK |
| `reporter_id` | UUID | FK → User |
| `target_type` | enum | `post`/`user`/`chat`/`none` |
| `target_id` | UUID? |  |
| `reason` | enum | `Spam`/`Offensive`/`Misleading`/`Illegal`/`Other` |
| `note` | string(500) | optional |
| `status` | enum | `open`/`confirmed_violation`/`dismissed_no_violation` |
| `resolved_at` | timestamptz? |  |
| `created_at` | timestamptz |  |

### B.2.13 `ReporterHide`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `reporter_id` | UUID | composite PK |
| `target_type` | enum | composite PK |
| `target_id` | UUID | composite PK |
| `created_at` | timestamptz |  |

### B.2.14 `AuditEvent`

See [`06_cross_cutting/06_audit_trail.md`](../06_cross_cutting/06_audit_trail.md) §6.6.1.

### B.2.15 `DeletedIdentifier`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `identifier_hash` | text | PK; sha256 of normalized identifier |
| `provider` | enum | which auth provider |
| `deleted_at` | timestamptz |  |
| `cooldown_until` | timestamptz | `deleted_at + 30 days` |

### B.2.16 `ModerationQueueEntry`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `entry_id` | UUID | PK |
| `target_type` | enum |  |
| `target_id` | UUID |  |
| `reason` | enum | `excessive_reopens`/`forbidden_keyword`/`manual_flag` |
| `created_at` | timestamptz |  |
| `resolved_at` | timestamptz? |  |

### B.2.17 `City`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `city_id` | string | slug PK |
| `name_he` | string |  |
| `name_en` | string |  |

### B.2.18 `CommunityStats`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `metric_id` | string | PK |
| `value` | int |  |
| `as_of` | timestamptz |  |

### B.2.19 `analytics_events`

See [`06_cross_cutting/01_analytics_and_events.md`](../06_cross_cutting/01_analytics_and_events.md) for schema and taxonomy.

### B.2.20 `bg_job_runs`

| Field | Type | Notes |
| ----- | ---- | ----- |
| `run_id` | UUID | PK |
| `job_id` | string |  |
| `status` | enum | `succeeded`/`failed`/`running` |
| `started_at` | timestamptz |  |
| `ended_at` | timestamptz? |  |
| `duration_ms` | int? |  |
| `metadata` | jsonb |  |

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Glossary + complete data dictionary. |
