# Appendix C — Decisions Log

[← back to SRS index](../../SRS.md)

---

## Purpose

A chronological record of every product- or architecture-level decision (`D-*`) taken during the SRS authoring phase. Each entry captures **what** was decided, **why**, and **what alternatives were rejected** — so that future contributors can understand the trade-offs without rediscovering them.

A decision should be re-opened only when one of the following triggers fires:

- A KPI shows a clear regression caused by the decision.
- A new constraint (regulatory, scale, security) invalidates a premise.
- The user explicitly asks to revisit it.

---

## D-1 — Three-platform single codebase via React Native + RNW

**Decision.** Build iOS, Android, and Web from a single codebase using React Native 0.74+ and React Native Web. Web is a **first-class** target (parity with mobile per `R-MVP-Core-7`).

**Rationale.** A single team needs to ship 3 platforms. Splitting into native + web would multiply work and divergence. RN+RNW pays a moderate complexity tax in exchange for shared business logic, shared design system, and shared analytics.

**Alternatives rejected.**

- *Native iOS/Android + separate Web app.* Higher quality ceiling, but tripled implementation effort and ongoing parity drift.
- *PWA-only.* Misses native features (camera capture, push UX, deep links).
- *Flutter.* Strong runtime but the team's React/TS muscle is stronger; ecosystem for Supabase realtime/auth is weaker on Flutter.

**Trade-offs accepted.** RNW is a moving target; we accept the maintenance overhead and document divergences in `CODE_QUALITY.md`.

**Affected docs.** `NFR-PLAT-*`, `CODE_QUALITY.md` (entire build pipeline).

---

## D-2 — Supabase as the unified backend

**Decision.** Use Supabase (Postgres, Auth, Storage, Realtime, Edge Functions) as the only backend.

**Rationale.** Single integrated platform, mature RLS for the SRS's authorization model, native Realtime for our chat/feed UX, EU residency available, generous free tier for MVP.

**Alternatives rejected.**

- *Custom Node/PG stack.* Too much yak-shaving for an MVP team.
- *Firebase.* Strong push/auth but weaker Postgres expressiveness; long-term migration risk if we need richer SQL.
- *AWS Amplify.* Powerful but heavyweight for MVP scale.

**Trade-offs accepted.** Vendor lock-in; mitigated by keeping all business logic in `domain` + `application` packages and by treating `infrastructure-supabase` as an interchangeable adapter.

**Affected docs.** [`05_external_interfaces.md`](../05_external_interfaces.md), every `infrastructure-*` package.

---

## D-3 — Clean Architecture monorepo with Turborepo

**Decision.** Organize source as a Turborepo monorepo with these top-level packages:

- `packages/domain` (pure entities, value objects, invariants)
- `packages/application` (use cases, ports)
- `packages/infrastructure-supabase` (adapter)
- `packages/ui` (shared components, theme, i18n)
- `apps/mobile` (Expo + Dev Client)
- `apps/web` (Next.js or Vite + RNW; chosen in `CODE_QUALITY.md`)

**Rationale.** Inverted dependency direction (`infrastructure → application → domain`) lets the team grow features without coupling business rules to Supabase or React. Strong layering supports the maintainability NFRs.

**Alternatives rejected.**

- *Single-package app.* Faster initially, but architecture decay is rapid; the user's priority is "modular foundation".
- *Multiple repos.* Splits ownership too early for a single-team MVP.

**Trade-offs accepted.** Initial setup overhead (Turborepo, dependency-cruiser, build matrix). Mitigated by templating in `CODE_QUALITY.md`.

**Affected docs.** `NFR-MAINT-*`, `CODE_QUALITY.md`.

---

## D-4 — Phone OTP supported in MVP, not deferred

**Decision.** Include phone OTP as a sign-in/up method at MVP launch, alongside Google, Apple, and Email/Password.

**Rationale.** The audience explicitly includes users who don't use Gmail or AppleID. Removing phone would push them to email + password, raising friction.

**Alternatives rejected.**

- *Phone-only (no email/password).* OK for some markets but loses Web onboarding ease.
- *Defer phone to V1.5.* Reduces TAM for MVP retention experiments.

**Trade-offs accepted.** Twilio cost; alpha sender-ID Israeli compliance setup.

**Affected docs.** `FR-AUTH-004`, `FR-AUTH-005`, `05_external_interfaces.md` §5.10.

---

## D-5 — Two notification categories: Critical & Social

**Decision.** Expose exactly two user-controllable notification toggles: **Critical** and **Social**. Both default `on`.

**Rationale.** Per-event control overwhelms users; a single switch wastes information. Two categories cover both axes (importance + courtesy) without UI clutter.

**Alternatives rejected.**

- *Per-event toggles.* Too granular for MVP UX.
- *Single global mute.* Too coarse — users would either suffer noise or miss recipient marking.
- *Quiet hours.* Out of scope; OS-level Do-Not-Disturb suffices.

**Affected docs.** `FR-NOTIF-014`, [`02_functional_requirements/09_notifications.md`](../02_functional_requirements/09_notifications.md).

---

## D-6 — Reopen silently decrements recipient counter

**Decision.** When a `closed_delivered` post is reopened, the previously-marked recipient's `items_received_count` decrements by 1, **without** notifying them.

**Rationale.** KPI integrity requires the counter reflect reality. A notification on every reopen would create social friction (the recipient might feel "uncredited"); silent decrement preserves data quality and avoids drama.

**Alternatives rejected.**

- *Notify on reopen.* Worse UX for the recipient with no clear benefit.
- *Keep the counter incremented after reopen.* Pollutes KPI #3 / North Star.

**Trade-offs accepted.** A recipient who keeps their stats screen open might notice the number drop without explanation; we accept this as edge-case noise.

**Affected docs.** `FR-CLOSURE-005`, `FR-NOTIF-013`, `FR-STATS-002`.

---

## D-7 — Recipient may un-mark themselves; owner notified

**Decision.** A user marked as a recipient can remove their own credit. When they do, the owner is notified, both counters decrement, and the post moves to `deleted_no_recipient` with the 7-day grace.

**Rationale.** Users should not be involuntary participants in their public stats. Symmetry with the owner's right to reopen.

**Alternatives rejected.**

- *Recipient cannot un-mark.* Forced association is a privacy violation.
- *Silent un-mark.* The owner would not know the post is now uncredited and might assume it's still closed.

**Affected docs.** `FR-CLOSURE-007`, `FR-NOTIF-010`, `FR-POST-017`.

---

## D-8 — Cold-start fallback expands to nationwide

**Decision.** When a viewer's city has fewer than 3 visible open posts, the feed expands to all-Israel and shows a banner. The user can revert to city-only with a chip.

**Rationale.** An empty feed kills retention in week 1 (KPI #5). Nationwide fallback ensures the first-time experience never feels dead.

**Alternatives rejected.**

- *Empty state with explanation only.* Undermines retention.
- *Suggested cities widget.* Too complex for MVP UX.

**Affected docs.** `FR-FEED-007`, `FR-FEED-008`.

---

## D-9 — First-post nudge as dismissible card

**Decision.** Users with zero posts see a dismissible card on top of the feed prompting them to share their first item. Once dismissed, it never reappears for that user.

**Rationale.** Activation (KPI #2) needs a gentle push. A persistent card is less invasive than a modal, and dismissibility respects user autonomy.

**Alternatives rejected.**

- *Modal interstitial.* Too aggressive.
- *No nudge.* Activation rate suffers.

**Affected docs.** `FR-FEED-015`.

---

## D-10 — Soft gate after skipped onboarding

**Decision.** If a user skipped onboarding, before performing any meaningful action (post, message, follow), the app shows a modal requiring `display_name` and `city`.

**Rationale.** Skipping onboarding is OK for browsing; meaningful interactions need basic identity to keep the community functional.

**Alternatives rejected.**

- *Block skip entirely.* Higher friction at sign-up; lower funnel.
- *No gate.* Users contribute content with empty profiles, hurting trust.

**Affected docs.** `FR-AUTH-015`.

---

## D-11 — Unblock restores visibility of older content

**Decision.** When user A unblocks user B, A and B can see each other's older posts and re-establish chat visibility. Follow edges are not auto-restored.

**Rationale.** Unblocking signals reconciliation; hiding their history would surprise the user.

**Alternatives rejected.**

- *Permanent hide of older content.* Confusing and inconsistent with the unblock action's intent.
- *Auto-restore follow edges.* Implies a relationship the user may not want.

**Affected docs.** `FR-MOD-004`.

---

## D-12 — Two-step delete confirmation (modal + name typing)

**Decision.** Account deletion requires a confirmation modal and typing the user's display name as the second confirmation.

**Rationale.** Prevents accidental deletion. Industry-standard pattern.

**Alternatives rejected.**

- *Single confirmation.* Too easy to misclick.
- *Email confirmation link.* Adds latency; breaks the SSO-only flow.

**Affected docs.** `FR-SETTINGS-012`.

---

## D-13 — Graduated false-report sanctions: 5/30d → 7d, then 30d, then permanent

**Decision.** A user who accumulates **5 dismissed reports within 30 days** is suspended for **7 days**. A second trigger after returning leads to **30 days**. A third leads to permanent suspension.

**Rationale.** Discourages weaponized reporting without punishing genuine mistakes.

**Alternatives rejected.**

- *Single permanent sanction at 5 dismissed reports.* Disproportionate; high false-positive risk on first offenders.
- *No sanction.* Enables abuse.

**Affected docs.** `FR-MOD-010`, `R-MVP-Privacy-10`.

---

## D-14 — Deleted user → "Deleted user" placeholder in chats

**Decision.** When one party deletes their account, the counterpart retains the conversation; the deleted user appears as "Deleted user" with a generic avatar. Their messages remain visible.

**Rationale.** Hard-deleting messages would erase context the counterpart may need (e.g., coordination history). The placeholder respects privacy without breaking continuity.

**Alternatives rejected.**

- *Hard-delete the entire thread.* Counterpart loses context.
- *Show real name forever.* Privacy violation post-deletion.

**Affected docs.** `FR-CHAT-013`, `NFR-PRIV-004`.

---

## D-15 — Warm empty states with at least one suggested action

**Decision.** Every empty list, empty feed, empty inbox state shows a friendly explanation **and** at least one CTA that helps the user proceed (post, browse, clear filters).

**Rationale.** Empty states are first-impression moments; making them helpful raises activation and retention.

**Alternatives rejected.**

- *Generic empty state.* Cold and uninviting.

**Affected docs.** `FR-FEED-008`, `FR-PROFILE-001`, `FR-FOLLOW-007`, etc.

---

## D-16 — Reintroduce Donations and Search tabs in MVP

**Decision.** Add dedicated `💝 תרומות` (Donations) and `🔍 חיפוש` (Search) tabs to the bottom bar (5 tabs total), reversing the prior PRD §6.4 exclusion of both from MVP.

- **Donations** ships fully: a Hub with three tiles (Items / Time / Money). Items routes to the Home Feed unchanged; Time routes to a coming-soon screen with an external link to `we-me.app` plus an inline volunteer-message composer (intent stored locally in MVP-core; full chat wiring deferred to TD-114 post-P0.5); Money routes to a coming-soon screen with an external link to `jgive.com`.
- **Search** ships as a placeholder (`FR-FEED-016`) — a screen that explains the search location today (in-feed, `FR-FEED-003`) and offers a CTA back to the feed. The universal-search engine itself (across people, items, future donation categories) is deferred to end-of-MVP / P2.

**Rationale.**

- The Donations Hub is the spine of the product narrative — items are only one of three donation modalities. External partner integrations (`jgive`, `Lev Echad`) need a permanent home.
- A dedicated Search tab signals discoverability intent and reserves the slot now, even though the engine ships later.

**Alternatives rejected.**

- *Keep 3 tabs and add Donations/Search as flyout menu items.* Less discoverable; navigation patterns in similar apps consistently use bottom tabs for primary IA.
- *Ship universal search now.* Adds BE work (people search index, RLS-aware query) on the critical path. Preferred to ship the placeholder and defer the engine.
- *Pre-filter the feed when entering via the Items tile.* Considered, rejected: the Items tile is a navigation shortcut, not a filter shortcut. The user can apply filters via the existing `FR-FEED-004` Filter Modal.
- *Build the volunteer-message use-case + ports plumbing now.* Considered, rejected: chat infra is fully mocked (no `SupabaseChatRepository`, `chat/[id].tsx` uses `MOCK_MESSAGES`); the use-case would be unreachable. We defer to TD-114, with the FE storing intent locally so messages aren't lost.

**Trade-offs accepted.**

- 5 tabs are tighter than 3 on small phones; we monitor for tap-error reports.
- Search tab is a placeholder until P2 lands — risk of user confusion mitigated by explicit copy ("בקרוב") and a CTA back to the feed.
- Volunteer messages aren't actually delivered to the Super Admin chat in MVP-core; they're stored locally and migrated post-P0.5. We accept the lag in exchange for not blocking on chat infra.

**Affected docs.** `FR-DONATE-001..005`, `FR-FEED-016`, `FR-CHAT-008` (extended), PRD `06_Navigation_Structure.md` §6.1 + §6.4, PRD `05_Screen_UI_Mapping.md` §5.1–§5.3.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial decisions log; D-1..D-15. |
| 0.2 | 2026-05-09 | Added `D-16` (Reintroduce Donations and Search tabs in MVP). |
