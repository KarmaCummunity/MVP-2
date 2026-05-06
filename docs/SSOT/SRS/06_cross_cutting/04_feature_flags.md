# 6.4 Feature Flags

[← back to Part VI index](./README.md)

---

## Purpose

Feature flags let us decouple **deployment** from **release**, ship safely, and operate kill switches. At MVP scale, flags are intentionally minimal — most of the product is "always on" — but we establish the conventions now so V1.5+ can roll out by-cohort changes without architectural rework.

---

## 6.4.1 Flag types

The MVP recognizes three kinds:

1. **Operational flags (kill switches).** Disable a feature without redeploying when something goes wrong. Default: `enabled`.
2. **Rollout flags.** Gate a feature to a subset of users (cohort, percentage). Default: `disabled` until graduation.
3. **Configuration flags.** Tune numbers (cooldowns, thresholds) without code change. Default: documented per-flag.

---

## 6.4.2 Storage and resolution

- Flag definitions live in a dedicated `feature_flags` table in Postgres, with row-level access only to admin and Edge Functions.
- Each flag has columns: `key`, `description`, `kind`, `default_value`, `current_value`, `targeting_rules` (JSON), `created_at`, `updated_at`.
- The application layer reads flags via a thin `FeatureFlagService` port; the infrastructure adapter caches flag values for **60 s** to limit DB round-trips.
- Flag changes propagate to all clients within **120 s** (cache TTL + refresh probe).

---

## 6.4.3 Targeting rules

Rules use a small declarative grammar (kept simple by design):

```
targeting_rules: {
  enabled: bool,
  cohorts: [
    { match: { user.is_super_admin: true }, value: <override> },
    { match: { user.country: "IL", percent: 0.5 }, value: <override> }
  ],
  default: <fallback value>
}
```

Cohort matching is evaluated server-side by the same Edge Function or RLS function that the client queries; the client never decides cohort membership independently.

---

## 6.4.4 MVP flag catalog

The MVP ships with this exact list (no more, no less):

| Key | Kind | Purpose | Default |
| --- | ---- | ------- | ------- |
| `kill_switch.feed` | Operational | Disable the feed if a regression is detected; users see a banner with a help link. | `enabled` |
| `kill_switch.realtime` | Operational | Force clients to manual-refresh mode when Realtime is unstable. | `enabled` |
| `kill_switch.image_upload` | Operational | Disable image upload globally; allow text-only posts (`Request` only). | `enabled` |
| `kill_switch.notifications.push` | Operational | Suspend push fan-out; users still see content in-app. | `enabled` |
| `kill_switch.signup` | Operational | Block new sign-ups (e.g., during a security incident). | `enabled` |
| `config.followers_only_visibility` | Operational | If `false`, hides the `FollowersOnly` choice in the post composer (does not retroactively change existing posts). | `true` |
| `config.guest_preview_enabled` | Operational | Toggle the entire guest preview surface. | `true` |
| `config.feed_fallback_enabled` | Operational | Disable the cold-start "expand to nationwide" fallback. | `true` |
| `config.report_threshold_auto_remove` | Configuration | Number of distinct reports that auto-removes content. | `3` |
| `config.follow_request_cooldown_days` | Configuration | Days to wait after rejection before a re-request is allowed. | `14` |
| `config.post_expiry_days` | Configuration | Days before an open post auto-expires. | `300` |
| `config.post_expiry_warning_days` | Configuration | Days before expiry to warn the owner. | `7` |
| `config.deleted_no_recipient_grace_days` | Configuration | Days before a no-recipient close is hard-deleted. | `7` |
| `config.deleted_account_cooldown_days` | Configuration | Days before a deleted identifier may re-register. | `30` |
| `config.max_active_posts_per_user` | Configuration | Cap on `Post.status='open'` per user. | `20` |
| `config.max_images_per_post` | Configuration | Cap on `MediaAsset[]` per `Post`. | `5` |
| `rollout.web_app_enabled` | Rollout | Whether the Web app is visible in production for end-users. | `true` (already in MVP per `D-1`) |

Adding a new flag requires:

1. A `Q-*` entry justifying the flag (kill switches, configuration changes >7 days require justification).
2. Updating this catalog.
3. Adding the targeting rule via Supabase admin.

---

## 6.4.5 Removing a flag

Flags are removed when they have been at their default for **≥30 days** without intervention. A removal PR:

- Deletes the flag row.
- Removes the conditional from the codebase.
- Updates this catalog.

Stale flags accumulate complexity; we resist hoarding them.

---

## 6.4.6 Kill switches and runbooks

Each `kill_switch.*` flag has a runbook in `CODE_QUALITY.md` that documents:

- Symptoms that should trigger the switch.
- The exact admin action to flip it.
- The user-facing copy that the app displays in the disabled state.
- How to re-enable safely.

---

## 6.4.7 Audit

- Flag changes are recorded in `AuditEvent` with `action = 'feature_flag_changed'` and metadata `{ key, from, to }`.
- Only the Super Admin or an automated incident response system may change flags.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft. Minimal MVP catalog with kill switches and key thresholds. |
