# 6.5 Background Jobs

[← back to Part VI index](./README.md)

---

## Purpose

This catalog enumerates every scheduled or recurring background job in the MVP. Each entry has a stable `bg-job-*` ID that other SRS sections reference.

The triggering mechanism is **Postgres `pg_cron`** scheduling a Supabase Edge Function execution (or a SQL function for purely-DB jobs). The runtime contract is in [`05_external_interfaces.md`](../05_external_interfaces.md) §5.5.

Reliability guarantees are in `NFR-RELI-006` (≥99% per execution, retries with exponential backoff up to 3 attempts).

---

## Job catalog

### `bg-job-post-expiry`

- **Purpose.** Transition `Post.status` from `open` to `expired` for posts older than `config.post_expiry_days` (default 300). Also send the 7-day-before warning notification.
- **Trigger.** Daily, 03:00 Asia/Jerusalem.
- **Inputs.** Reads `Post` rows with `status = 'open'`.
- **Outputs.**
   - Updates: `Post.status`, `Post.updated_at`.
   - Notifications: `FR-NOTIF-005` for posts whose age == `expiry_days - warning_days`.
   - Metrics: `bg_job_post_expiry_processed_total`, `bg_job_post_expiry_warned_total`.
- **Idempotency.** A post that has already transitioned is skipped; warnings deduplicate by `(post_id, warning_date)`.
- **Failure.** Retries 3× with backoff; alert after exhaustion.
- **Spec source.** `FR-POST-013`.

---

### `bg-job-soft-delete-cleanup`

- **Purpose.** Hard-delete posts that ended in `deleted_no_recipient` after the 7-day grace window expires.
- **Trigger.** Daily, 03:30 Asia/Jerusalem (after `bg-job-post-expiry`).
- **Inputs.** Reads `Post` rows with `status = 'deleted_no_recipient' AND delete_after < now()`.
- **Outputs.**
   - Hard-deletes the row plus its `MediaAsset`s and storage objects.
   - Metrics: `bg_job_soft_delete_processed_total`.
- **Idempotency.** Naturally idempotent (rows are gone after run).
- **Failure.** Per-row failure logs and continues; aggregate failure rate >5% triggers an alert.
- **Spec source.** `FR-CLOSURE-008`.

---

### `bg-job-stats-recompute`

- **Purpose.** Recompute personal counters from event logs and reconcile drift.
- **Trigger.** Nightly, 04:00 Asia/Jerusalem.
- **Inputs.** All `User` rows with activity in the last 7 days; `Post`, `Recipient`, and event tables.
- **Outputs.**
   - Updates `User.items_given_count`, `User.items_received_count`, `User.active_posts_count_internal` if drift is found.
   - Emits `stats_drift_detected` event (`NFR-RELI-005`).
   - Metrics: `bg_job_stats_recompute_processed_total`, `bg_job_stats_drift_total`.
- **Idempotency.** Recompute is deterministic.
- **Failure.** Retries 3× with backoff; alert.
- **Spec source.** `FR-STATS-005`, `FR-CLOSURE-009`.

---

### `bg-job-token-prune`

- **Purpose.** Deactivate push tokens unused for ≥90 days to keep fan-out targets lean.
- **Trigger.** Weekly, Sunday 04:30 Asia/Jerusalem.
- **Inputs.** `Device` rows with `last_seen_at < now() - 90d`.
- **Outputs.**
   - Sets `Device.active = false`.
   - Metrics: `bg_job_token_prune_total`.
- **Idempotency.** Setting `active=false` on already-inactive rows is a no-op.
- **Failure.** Retries 3×; alert if >10% failure rate.
- **Spec source.** `FR-NOTIF-015`.

---

### `bg-job-deleted-account-purge`

- **Purpose.** Hard-delete soft-deleted user rows after the 30-day cooldown.
- **Trigger.** Daily, 04:45 Asia/Jerusalem.
- **Inputs.** `User` rows with `account_status = 'deleted' AND deleted_at < now() - 30d`.
- **Outputs.**
   - Anonymizes any residual fields not already cleared at deletion time.
   - Records the corresponding `DeletedIdentifier` row (already created at deletion; this is a sanity check).
   - Metrics: `bg_job_deleted_account_purged_total`.
- **Idempotency.** Per-row.
- **Failure.** Alert immediately on any failure (privacy-critical).
- **Spec source.** `FR-SETTINGS-012`, `R-MVP-Privacy-6`, `NFR-PRIV-004`.

---

### `bg-job-cooldown-cleanup`

- **Purpose.** Mark expired `FollowRequest.cooldown_until` records as no-longer-blocking and hard-delete `DeletedIdentifier` rows past their cooldown.
- **Trigger.** Daily, 05:00 Asia/Jerusalem.
- **Inputs.** `FollowRequest` and `DeletedIdentifier` rows with elapsed cooldowns.
- **Outputs.**
   - Removes `DeletedIdentifier` rows whose cooldown has passed (these were only for re-registration enforcement).
   - Logs a metric for cleanup count.
- **Idempotency.** Yes.
- **Failure.** Retries 3×; non-critical.
- **Spec source.** `FR-AUTH-016`, `FR-FOLLOW-008`.

---

### `bg-job-moderation-aging`

- **Purpose.** Identify `Report.status = 'open'` rows older than 30 days and emit an alert (`NFR-RELI-005`, `INV-M2`).
- **Trigger.** Daily, 05:30 Asia/Jerusalem.
- **Inputs.** Reports table.
- **Outputs.**
   - Slack alert listing the aged reports and their targets.
- **Idempotency.** Yes; alert deduplicates per day.
- **Failure.** Non-critical.
- **Spec source.** `INV-M2`.

---

### `bg-job-image-cleanup`

- **Purpose.** Garbage-collect orphan `MediaAsset` rows and storage objects that are not referenced by any `Post` (e.g., post creation aborted mid-upload).
- **Trigger.** Weekly, Saturday 02:00 Asia/Jerusalem.
- **Inputs.** `MediaAsset` rows with `post_id IS NULL AND created_at < now() - 24h`.
- **Outputs.**
   - Hard-deletes orphan rows and storage objects.
   - Metric: `bg_job_image_cleanup_total`.
- **Idempotency.** Yes.
- **Failure.** Retries 3×; alert if >5% failure.

---

### `bg-job-analytics-rollup`

- **Purpose.** Aggregate daily KPI rollups from the raw `analytics_events` table into `kpi_daily` for fast dashboarding.
- **Trigger.** Daily, 06:00 Asia/Jerusalem.
- **Inputs.** Previous day's `analytics_events` rows.
- **Outputs.**
   - Inserts / upserts to `kpi_daily`.
   - Metric: `bg_job_analytics_rollup_processed_total`.
- **Idempotency.** Re-running for a date overwrites the previous result deterministically.
- **Failure.** Retries 3×; alert.
- **Spec source.** [`01_analytics_and_events.md`](./01_analytics_and_events.md) ingest / KPI mapping.

---

## Common contract

Every job:

- Logs start, end, duration, and processed-row count.
- Emits structured `info` logs at each phase.
- Records its run in a `bg_job_runs` table with `status` and `duration_ms`.
- Is observable via the dashboards in [`02_observability.md`](./02_observability.md).
- Honors a `kill_switch.bg_jobs` operational flag — when set, all jobs no-op (used for emergencies).

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. 9 jobs total at MVP. |
