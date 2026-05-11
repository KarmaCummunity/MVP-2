# 6.1 Analytics & Event Taxonomy

[← back to Part VI index](./README.md)

---

## Purpose

The MVP's success depends on accurate measurement of the KPIs defined in [`01_vision_and_personas.md`](../01_vision_and_personas.md) §1.2. This document specifies **every** product analytics event we emit, the data shape, and which KPI it instruments.

Analytics is **first-party only** (`NFR-PRIV-007`). Events are emitted from the application layer to a dedicated `analytics_events` ingest endpoint and are PII-redacted (`NFR-PRIV-012`).

---

## Common envelope

Every event carries a common envelope:

```
{
  event_name:    string,            // see catalog below
  event_id:      uuid v4,            // client-generated
  occurred_at:   ISO 8601 timestamp,  // client clock
  user_id:       uuid | null,         // null for guest events
  session_id:    uuid,                // rotates per app session
  device_id:     uuid,                // installation-scoped
  platform:      "ios" | "android" | "web",
  app_version:   semver string,
  locale:        BCP-47 string,        // e.g. "he-IL"
  properties:    object                // event-specific keys
}
```

The `properties` object never contains PII fields (`display_name`, `email`, `phone`, `address`, message body). It contains hashed IDs, enums, and counts.

---

## Event catalog

Each event lists `Properties` and `KPIs supported`.

### Auth & onboarding

#### `app_launched`
- **Properties.** `is_first_launch: bool`, `cold_start: bool`.
- **KPIs.** Retention (W1, W4).

#### `auth_method_selected`
- **Properties.** `method ∈ {google, apple, phone, email, view_as_guest}`.
- **KPIs.** Funnel diagnostics for KPI #1.

#### `signup_completed`
- **Properties.** `method`, `prefilled_from_sso: bool`.
- **KPIs.** KPI #1 (registered users).

#### `onboarding_step_completed`
- **Properties.** `step ∈ {basic_info, avatar, tour}`, `skipped: bool`.
- **KPIs.** Activation funnel (KPI #2).

#### `signin_completed`
- **Properties.** `method`.
- **KPIs.** Retention.

#### `account_deleted`
- **Properties.** `tenure_days: int`.
- **KPIs.** Churn diagnostics.

#### `guest_overlay_shown`
- **Properties.** `trigger ∈ {scroll_limit, tap_post, tap_profile, tap_plus, tap_message}`.
- **KPIs.** Guest → user conversion.

### Posts

#### `post_created`
- **Properties.** `type ∈ {give, request}`, `visibility ∈ {public, followers, only_me}`, `category`, `has_image: bool`, `image_count: int`, `location_display_level`.
- **KPIs.** KPI #2 (activation), Thesis T1.

#### `post_edited`
- **Properties.** `fields_changed: string[]`, `visibility_upgraded: bool`.

#### `post_deleted`
- **Properties.** `tenure_open_seconds: int`, `interaction_count: int`.

#### `post_viewed_detail`
- **Properties.** `post_id_hash`, `is_owner: bool`, `from_surface ∈ {feed, profile, deep_link, search}`.
- **KPIs.** Engagement; thesis T3.

#### `post_quick_message_tapped`
- **Properties.** `post_id_hash`.
- **KPIs.** Conversion (post → chat).

#### `post_visibility_change_attempted`
- **Properties.** `from`, `to`, `result ∈ {allowed, downgrade_blocked}`.

#### `post_expired`
- **Properties.** `lifetime_days: int`, `interaction_count: int`.

### Closure & reopen

#### `closure_step1_completed`
- **Properties.** `post_id_hash`, `time_open_days: int`.
- **KPIs.** Conversion.

#### `closure_completed`
- **Properties.** `with_recipient: bool`, `chat_partners_count: int`, `time_open_days: int`.
- **KPIs.** **North Star** (`closed_delivered`), KPI #3, KPI #4.

#### `post_reopened`
- **Properties.** `was_marked: bool`, `tenure_closed_days: int`, `reopen_count: int`.

#### `recipient_unmarked_self`
- **Properties.** `post_id_hash`.
- **KPIs.** Data quality.

#### `closure_cleanup_executed`
- **Properties.** `count_deleted: int`. *(Server-emitted from `bg-job-soft-delete-cleanup`.)*

### Feed & search

#### `feed_loaded`
- **Properties.** `posts_returned: int`, `filters_active: int`, `sort`, `fallback_applied: bool`.
- **KPIs.** Engagement; KPI #7.

#### `feed_fallback_applied`
- **Properties.** `viewer_city_hash`.
- **KPIs.** Cold-start health (`D-8`).

#### `search_performed`
- **Properties.** `term_length: int`, `results_returned: int`.

#### `filter_applied`
- **Properties.** `filter_keys: string[]`.

#### `feed_realtime_new_posts_banner_tapped`
- **Properties.** `new_post_count: int`.

### Follow

#### `follow_initiated`
- **Properties.** `target_privacy ∈ {public, private}`, `result ∈ {edge_created, request_sent, blocked, cooldown}`.

#### `follow_request_resolved`
- **Properties.** `result ∈ {approved, rejected, cancelled}`.

#### `follower_removed`
- **Properties.** *(no extras)*.
- **KPIs.** Health of private profiles.

### Chat

#### `chat_first_message`
- **Properties.** `from_post: bool`, `from_profile: bool`, `from_settings: bool`, `mutual_follow: bool`, `auto_message_edited: bool`.
- **KPIs.** Thesis T3, KPI #4.

#### `chat_message_sent`
- **Properties.** `message_length_bucket ∈ {1-10, 11-50, 51-200, 201-2000}`.

#### `chat_marked_read`
- **Properties.** `unread_batch: int`.

### Notifications

#### `notification_received`
- **Properties.** `category ∈ {critical, social}`, `kind` (one of the FR-NOTIF subjects).

#### `notification_opened`
- **Properties.** `kind`.

#### `notification_preference_changed`
- **Properties.** `key ∈ {critical, social}`, `value: bool`.

### Privacy mode

#### `privacy_mode_changed`
- **Properties.** `from`, `to`, `pending_requests_at_change: int`.

### Moderation

#### `report_submitted`
- **Properties.** `target_type`, `reason`.

#### `auto_remove_triggered`
- **Properties.** `target_type`, `target_id_hash`, `report_count: int`. *(Server-emitted.)*

#### ~~`block_user`~~ — deferred per `EXEC-9`
Not emitted in MVP. Restored when block is reintroduced post-MVP.
- **Properties.** `from_surface ∈ {profile, post, chat}`.

#### ~~`unblock_user`~~ — deferred per `EXEC-9`
Not emitted in MVP. Restored when block is reintroduced post-MVP.
- **Properties.** *(no extras)*.

### Stats

#### `stats_screen_opened`
- **Properties.** *(no extras)*.

### Drift / health

#### `stats_drift_detected`
- **Properties.** `counter ∈ {given, received, active}`, `delta: int`. *(Server-emitted; serves `NFR-RELI-005`.)*

---

## KPI mapping

| KPI (from §1.2.2) | Primary events |
| ----------------- | -------------- |
| #1 Registered users | `signup_completed` |
| #2 Activation (≥1 post in 7d) | `post_created` joined to `signup_completed` |
| #3 Conversion (`closed_delivered` rate) | `closure_completed` / `post_created` |
| #4 Time-to-close | `closure_completed.time_open_days` |
| #5 W1 retention | `app_launched` cohort analysis vs `signup_completed` |
| #6 W4 retention | same as #5 over 28 days |
| #7 Active inventory | derived from DB snapshot, supplemented by `post_created` − terminal events |
| #8 NPS | out-of-product survey (link in app) |
| #9 Reports as % of posts | `report_submitted` / `post_created` |

---

## Ingest contract

- The client batches events and posts to an Edge Function endpoint `/analytics/ingest`.
- The endpoint validates the envelope schema and writes to the `analytics_events` table.
- Failed validations are logged but do not return a 4xx to the client (analytics never breaks user flows).
- Retention: **24 months** in the warehouse; older data is aggregated to KPI tables and the raw rows are purged.

---

## Schema evolution

- Adding a new event or new property is non-breaking.
- Renaming an event or removing a property is breaking; requires:
   - A `Q-*` entry,
   - A 90-day overlap where both names emit,
   - A version note in this file's change log.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial event catalog instrumented for the §1.2 KPIs. |
