# Appendix D — Open Questions

[← back to SRS index](../../SRS.md)

---

## Purpose

Open questions are issues we deliberately deferred because they are **not blocking for MVP launch** but should be answered before V1.5 planning. Each `Q-*` records the question, the current default behavior in the SRS (so the system remains shippable), and the trigger that should escalate the question to a decision.

Each entry is intentionally scoped: when a `Q-*` is resolved, it becomes a `D-*` in [`C_decisions_log.md`](./C_decisions_log.md), and the corresponding `Q-*` is closed (kept for history with status `resolved`).

---

## Q-001 — Quiet hours / Do-Not-Disturb scheduling

**Question.** Should users be able to schedule notification quiet hours (e.g., 22:00–08:00) within the app, or is OS-level Do-Not-Disturb sufficient?

**MVP default.** OS-level DND only; app does not schedule (`FR-NOTIF-016`).

**Trigger to revisit.** ≥10% of support tickets request quiet hours, or NPS feedback flags notification noise.

**Affects.** `FR-NOTIF-014`, [`02_functional_requirements/09_notifications.md`](../02_functional_requirements/09_notifications.md).

---

## Q-002 — Algorithmic feed ranking

**Question.** Should the feed introduce light personalization (boost city, recency, follow-ranking) in V1.5?

**MVP default.** Strictly chronological; no personalization (`FR-FEED-001`, `R-MVP-Profile-7`).

**Trigger to revisit.** KPI #5 (W1 retention) plateaus below target despite content volume.

**Affects.** `FR-FEED-001`, `FR-FEED-006`.

---

## Q-003 — Pinning the support thread

**Question.** Should the Super Admin support thread be visually pinned at the top of the inbox?

**MVP default.** Not pinned; treated as a normal thread (`FR-CHAT-001` AC5).

**Trigger to revisit.** Support thread response rate from users drops; users miss admin replies.

**Affects.** `FR-CHAT-001`, `FR-CHAT-007`.

---

## Q-004 — In-app notifications screen

**Question.** Should the app gain an in-app notification center (history, mark-as-read) in addition to OS push?

**MVP default.** No in-app notification center. OS push only.

**Trigger to revisit.** Users frequently report missing past notifications.

**Affects.** All `FR-NOTIF-*`.

---

## Q-005 — CSAM scanning on uploaded images

**Question.** Should image uploads pass through a CSAM detection service (e.g., PhotoDNA, Cloudflare Image Moderation)?

**MVP default.** No automated CSAM scan; manual moderation via reports + the EXIF strip (`NFR-SEC-007`, `NFR-PRIV-002`).

**Trigger to revisit.** First confirmed report; or before any expansion of the user base outside Israel.

**Affects.** `NFR-SEC-007`, `FR-POST-005`.

---

## Q-006 — Audit log anonymization job

**Question.** Should the 24-month anonymization job be live at MVP launch or deferred to V1.5?

**MVP default.** Documented retention is 24 months; the actual anonymization runner is built in V1.5. MVP retains all audit data within the 24-month window without anonymization.

**Trigger to revisit.** When MVP approaches 18 months in production (i.e., when the first audit rows are 18 months old).

**Affects.** [`06_cross_cutting/06_audit_trail.md`](../06_cross_cutting/06_audit_trail.md) §6.6.3.

---

## Q-007 — Account merging (linking SSO + phone + email)

**Question.** Should a user be able to merge multiple authentication identities into a single account in V1.5?

**MVP default.** One `AuthIdentity` per user (`INV-I1`). No merging UI in MVP.

**Trigger to revisit.** Support volume for "I made two accounts" requests becomes meaningful (≥1% of users).

**Affects.** `FR-AUTH-009`, `INV-I1`.

---

## Q-008 — Post sharing outside the app

**Question.** Should users be able to share a post link to external apps (WhatsApp, etc.) directly from the post detail screen?

**MVP default.** Profile sharing exists (`FR-PROFILE-008`); post sharing is **not** in MVP. Users may copy the URL from the address bar (Web).

**Trigger to revisit.** Recurrent user feedback; first organic case where a user posts an item that a community wants to share off-platform.

**Affects.** `FR-POST-014`.

---

## Q-009 — Recipient acknowledgment ("I received this") UX

**Question.** Should the recipient have a one-tap "I confirm I received this" instead of (or in addition to) un-marking?

**MVP default.** Only un-mark exists (`FR-CLOSURE-007`); receipt is implied by the owner's mark.

**Trigger to revisit.** A V2 trust score / reputation system would lean on bilateral confirmation.

**Affects.** `FR-CLOSURE-007`, future reputation features.

---

## Q-010 — Locale switcher in MVP UI

**Question.** Should we expose a "Language" choice in Settings at MVP, even though only Hebrew is shipped?

**MVP default.** No UI; Hebrew is the only locale (`R-MVP-Core-4`).

**Trigger to revisit.** When the second locale (English) ships in V1.5.

**Affects.** `FR-SETTINGS-001`, [`06_cross_cutting/03_i18n_rtl.md`](../06_cross_cutting/03_i18n_rtl.md).

---

## Q-011 — City list management

**Question.** Should the city list be admin-editable via UI (vs. seeded migration)?

**MVP default.** Seeded migration only; new cities require a code change (`FR-POST-019` AC1).

**Trigger to revisit.** Frequent requests for new cities; admin time-to-update becomes a bottleneck.

**Affects.** `FR-POST-019`, `Domain.City`.

---

## Q-012 — Web Push opt-in flow

**Question.** When and how should the Web app request notification permission? Immediately on sign-in, or only contextually (e.g., when the user enables a Critical category in Settings)?

**MVP default.** Request on sign-in (after onboarding completes), with a clear pre-prompt explaining the value (`FR-NOTIF-015`).

**Trigger to revisit.** Web Push opt-in rate <30% indicates a flow problem.

**Affects.** `FR-NOTIF-015`, `FR-AUTH-012`.

---

## Q-013 — Address geocoding

**Question.** Should we eventually geocode `Address` to lat/lon (for distance-based discovery in V2)?

**MVP default.** No geocoding (`FR-POST-019` AC4); city-equality sort only.

**Trigger to revisit.** When proximity-based discovery becomes a roadmap priority.

**Affects.** `FR-POST-019`, `FR-FEED-006`.

---

## Q-014 — Display-name change cooldown

**Question.** Should `display_name` changes have a cooldown to discourage impersonation?

**MVP default.** No cooldown; users can rename freely (`FR-PROFILE-007`).

**Trigger to revisit.** First impersonation incident; or when reputation features arrive.

**Affects.** `FR-PROFILE-007`.

---

## Q-015 — Notification batching for high-volume events

**Question.** Should the system batch high-volume Critical notifications (e.g., 50 chat messages from the same sender in 5 minutes) into a digest?

**MVP default.** Coalescing exists for OS-level notifications (`FR-NOTIF-001` AC3) but no in-app digest.

**Trigger to revisit.** Power users complain about notification volume.

**Affects.** `FR-NOTIF-001`.

---

## How to use this register

- The Super Admin and the product owner review this list at the start of each planning cycle.
- Resolved questions migrate to [`C_decisions_log.md`](./C_decisions_log.md) as new `D-*` entries.
- New questions are appended with the next free `Q-*` number; numbers are never reused.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial register; Q-001..Q-015. |
