# Part II — Functional Requirements

[← back to SRS index](../../SRS.md) · [← back to Part I](../01_vision_and_personas.md)

---

This part defines **what the system must do** in user-observable terms. Each functional requirement (`FR-*`) is bound to one or more business rules (`R-MVP-*`) and to specific PRD sections. Acceptance Criteria are testable predicates and form the contract for QA, code reviews, and CI.

## Domains

| # | File | Prefix | Scope |
| - | ---- | ------ | ----- |
| 2.1 | [`01_auth_and_onboarding.md`](./01_auth_and_onboarding.md) | `FR-AUTH-*` | Sign-up, sign-in, OTP, SSO, onboarding wizard, sessions, account deletion. |
| 2.2 | [`02_profile_and_privacy.md`](./02_profile_and_privacy.md) | `FR-PROFILE-*` | My profile, other users' profiles, privacy mode toggle, profile editing. |
| 2.3 | [`03_following.md`](./03_following.md) | `FR-FOLLOW-*` | Follow / unfollow, follow requests, request approval/rejection, remove existing follower. |
| 2.4 | [`04_posts.md`](./04_posts.md) | `FR-POST-*` | Create, edit, delete a post; visibility levels; address & location-display levels; drafts. |
| 2.5 | [`05_closure_and_reopen.md`](./05_closure_and_reopen.md) | `FR-CLOSURE-*` | Multi-step closure dialog, recipient picker, no-recipient cleanup, reopen flow, recipient un-mark. |
| 2.6 | [`06_feed_and_search.md`](./06_feed_and_search.md) | `FR-FEED-*` | Feed composition, search, filters, sort, persistent state, cold-start fallback. |
| 2.7 | [`07_chat.md`](./07_chat.md) | `FR-CHAT-*` | Inbox, conversation, message send/read/receipts, contextual auto-message. |
| 2.8 | [`08_moderation.md`](./08_moderation.md) | `FR-MOD-*` | Content reports, issue reports, blocking/unblocking, auto-removal threshold, false-report sanctions. |
| 2.9 | [`09_notifications.md`](./09_notifications.md) | `FR-NOTIF-*` | Notification taxonomy (Critical / Social), delivery channels, user preferences. |
| 2.10 | [`10_statistics.md`](./10_statistics.md) | `FR-STATS-*` | Personal stat counters, community stats, activity timeline. |
| 2.11 | [`11_settings.md`](./11_settings.md) | `FR-SETTINGS-*` | Settings screen, account info, privacy controls, blocked users, support, legal, logout, account deletion. |
| 2.12 | [`12_super_admin.md`](./12_super_admin.md) | `FR-ADMIN-*` | In-chat moderation surface, restore-on-system-message, manual ban / delete. |

## Reading conventions

- Every requirement starts with `### FR-{DOMAIN}-{NNN} — {Title}`.
- Numbers are zero-padded, monotonic per file, never reused.
- The `Source` block traces the requirement back to one or more `PRD_MVP/*.md` sections and `R-MVP-*` rules.
- `Acceptance Criteria` is the contract: every AC must be expressible as an automated or semi-automated test.

See [`../00_meta.md`](../00_meta.md) §0.3 for the full requirement template.

---

*Next: [`01_auth_and_onboarding.md`](./01_auth_and_onboarding.md)*
