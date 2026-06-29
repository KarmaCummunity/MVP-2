# Appendix C — Decisions Log

[← back to CLAUDE.md](../../CLAUDE.md)

---

## Purpose

A chronological record of every product- or architecture-level decision (`D-*`) taken during the SRS authoring phase. Each entry captures **what** was decided, **why**, and **what alternatives were rejected** — so that future contributors can understand the trade-offs without rediscovering them.

A decision should be re-opened only when one of the following triggers fires:

- A KPI shows a clear regression caused by the decision.
- A new constraint (regulatory, scale, security) invalidates a premise.
- The user explicitly asks to revisit it.

---

## D-1 — Three-platform single codebase via React Native + RNW

> **Note (2026-05-11):** `CODE_QUALITY.md` was never authored; its content lives in `CLAUDE.md` §5–§8. References to it below are historical.

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

> **Note (2026-05-11):** `CODE_QUALITY.md` was never authored; its content lives in `CLAUDE.md` §5–§8. References to it below are historical.

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

## D-11 — Unblock restores visibility of older content — **SUPERSEDED (by EXEC-9, 2026-05-11)**

**Status.** ⚠️ Superseded by `EXEC-9` (2026-05-11). Block / unblock removed from MVP scope; the unblock-restoration semantics below remain the intended behavior when block is reintroduced post-MVP.

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

---

## EXEC-7 — פוסטים סגורים מוצגים בפרופיל יוזר אחר (הפוך PRD §3.2.2)

**Decision.**
פוסטים סגורים (`closed_delivered`) מוצגים בפרופיל של יוזר אחר כאשר הפרופיל הוא `Public` או `Private` עם עוקב מאושר. זהות המקבל ("נמסר ל-X") מוצגת בהתאם לאותם הכללים כמו בפרופיל האישי (`FR-PROFILE-001`). פוסטים `Only-me` ממשיכים להיות מוסתרים מגולשים שאינם הבעלים. מהפכת את החלטת ה-PRD §3.2.2 שטמנה את הסגורים מהזרים.

**Rationale.**
המודל הסוציאלי הוא "ראה איזה תרומות עזרת ולמי". הסתרת פוסטים סגורים מהפרופיל החיצוני מחלישה את ה-social proof ואת ה-North Star metric (items_given/received). הצגתם מחזקת את הנרטיב של הקהילה ומגדילה מוטיבציה לתת.

**Alternatives rejected.**

- *המשך עם ההחלטה המקורית.* מפחית שקיפות ומחליש את ה-social-proof שהוא עמוד השדרה של המוצר.
- *הצגה רק לעוקבים מאושרים (Private בלבד).* תת-אופטימלי — ב-Public profiles שום דבר לא מונע את ההצגה.

**Trade-offs accepted.**
מקבלי פריטים רואים שתרומתם גלויה לציבור ב-Public profiles. זה עקבי עם כוונת המוצר; בעלים יכולים לשנות ל-`Private` אם הם מעדיפים.

**Affected docs.** `FR-PROFILE-002 AC2`, `FR-PROFILE-004 AC4`, `02_profile_and_privacy.md` version 0.2.

---

## EXEC-8 — Distance-aware feed via cities-geo Haversine + shared filter vocabulary (P1.2)

**Date.** 2026-05-11
**Origin.** P1.2 brainstorming / design phase.

**Decision.**
Three reinforcing reworks of the feed-and-search surface:

1. **Distance ranking.** Replace `FR-FEED-006`'s string-equality-with-recency sort with great-circle distance computed via a new pure-SQL `public.haversine_km` helper over `public.cities.{lat,lon}` (seeded for the 20 canonical Israeli cities in migration 0021). The center of the ranking is either an explicit `FeedFilter.proximitySortCity` or the viewer's own `User.city`; cities lacking coordinates degrade to `NULL distance_km` and sink to the tail. Overturns the original `FR-FEED-006 AC2` ban on geocoding — the static lookup is reference data, not a runtime geocoding service.
2. **Removed search bar from the Home Feed.** The dedicated Universal Search tab (formerly the `FR-FEED-016` placeholder, now superseded) already covers free-text search; surfacing it again on the Home Feed duplicates the affordance and splits canonical responsibility across two surfaces. Home Feed keeps only the filter/sort sheet.
3. **Removed in-feed active-filters chip.** The active-count badge on the TopBar filter icon satisfies the discovery contract `FR-FEED-013` introduced; a second in-feed chip was redundant.

**Alternatives rejected.**

- *Keep `FR-FEED-006` as string-equality + recency.* The user explicitly rejected city-bucket-then-banner UX during brainstorming ("באנרים באמצע הפוסטים זה גרוע"). Continuous distance ordering replaces the city-bucket + cold-start-fallback combination entirely (so `FR-FEED-007` is deprecated rather than patched).
- *Keep the Home Feed search bar as a "quick filter".* Overlaps confusingly with the Universal Search tab and pushes users to mix two surfaces for the same task.
- *Build a generic `<PostFilterSheet>` in `@kc/ui` shared by Home Feed and Universal Search.* The UI layer's strict no-domain-imports rule made this awkward, and the two surfaces have meaningfully different state stores. Instead, the shared component lives under `apps/mobile/src/components/PostFilterSheet/` and the two surfaces consume it through their own state controllers (`FR-FEED-018`). Search-tab adoption deferred to TD-136.

**Trade-offs accepted.**

- A second round-trip on the distance path (RPC for IDs + REST `IN(...)` for full rows) is acceptable at MVP scale; TD-137 tracks the long-term collapse into a single RPC return shape.
- City-centroid accuracy (±1–2 km) is good enough for 5–100 km radius filtering; street-level geocoding is deferred to P2.x.
- Coordinates for any newly-seeded city must be supplied in the same migration; otherwise posts referencing it land at the tail of distance-sorted feeds.

**Affected docs.** `FR-FEED-003, 004, 005, 006, 007, 008, 013, 014, 015, 016` (deprecated / reworked / extended / superseded); `FR-FEED-018, 019` (new); migrations 0021, 0022; `02.6` SRS file version `0.3`.

---

## EXEC-9 — חסימה / ביטול חסימה יוצאים מהיקף ה-MVP

**Date.** 2026-05-11
**Origin.** PM scope-trim during P1 planning.

**Decision.**
הסרת היכולת "חסום / ביטול חסימה" מהיקף ה-MVP. `FR-MOD-003`, `FR-MOD-004` ו-`FR-MOD-009` מסומנים `DEPRECATED — post-MVP` עד שיוחזרו פורמלית. נגזרות מיידיות:

1. **Backlog.** P1.4 ("Block / unblock + visibility restoration") נמחק מ-`BACKLOG.md`. `FR-MOD-010` (סנקציות על דיווחי שווא) — שמופיע היה משויך ל-P1.4 — עובר ל-P1.3 ("Reports + auto-removal + false-report sanctions") שאליו הוא משתייך לוגית.
2. **Cross-references.**
   - `FR-MOD-007 AC2` כבר לא מחייב כפתור "חסום" בתפריט הפרופיל.
   - `FR-MOD-012 AC1` יורד את `block_user` / `unblock_user` מרשימת ה-`AuditEvent` הנדרשים.
   - `FR-POST-014 AC4` כבר לא דורש הצגת "חסום משתמש" בתפריט ה-⋮ של הפוסט.
   - `FR-POST-018 AC3` (אייקון "פנה למפרסם") כבר לא מתנה את הופעתו ב-block state.
   - `FR-FEED-006` predicate (sec §3): סינון bilateral block נמחק מהדרישה הפעילה (האדפטר כבר לא מקצה את ה-RPC).
   - `FR-SETTINGS-005` (Privacy → Blocked users entry) מסומן deferred post-MVP.
   - `INV-M1` ב-`03_domain_model.md` (Block ↔ Follow exclusivity) מסומן deferred.
   - `D-11` ("Unblock restores visibility of older content") superseded ע"י החלטה זו.
3. **Code surface (חתוך).** מחקנו את `packages/application/src/block/*`, `IBlockRepository`, ה-`Block` domain entity, את `SupabaseBlockRepository`, את ה-i18n strings (`he.posts.block`, `he.chat.block`, `he.settings.blockedUsers`), את ה-wiring ב-`apps/mobile/src/lib/container.ts`, ואת השלב `'blocked'` במכונת המצב של `FollowState`.
4. **DB surface (משאירים).** מיגרציות `0003_init_following_blocking.sql`, `0004_init_chat_messaging.sql` (ביטוי ה-RLS `has_blocked()` ב-chat visibility), ו-`0005_init_moderation.sql` (audit trail עבור `block_user` / `unblock_user`) נשארות כפי שהן — כבר רצו בפרודקשן ויצירת מיגרציית דרופ נושאת סיכון. הטבלאות והפונקציות יישארו לא-מאוכלסות (אין UI שכותב אליהן); `is_blocked()` ו-`has_blocked()` ימשיכו להחזיר `false` בכל קריאה. שחזור פוסט-MVP יהיה straightforward — להחזיר את ה-code surface מעל אותה סכמה.

**Rationale.**
ה-MVP צריך להתמקד ברצפת בטיחות אחת (P1.3 — דיווחים + auto-removal + סנקציות) ולא בשתי שכבות מקבילות. חסימה היא משוכפלת חלקית עם block-via-report (auto-removal ב-3 דיווחים מסיר את המשתמש מהקהילה), והעלות-תועלת לא מצדיקה אותה ב-MVP. Reporting מספק את הגנת הסף; חסימה כשירות פר-משתמש נשמרת לפוסט-MVP אם תידרש בפועל.

**Alternatives rejected.**

- *להשאיר את הסכמה והקוד אך להסתיר את ה-UI.* יוצר חוב — קוד deprecated שעוד פעם יצריך תחזוקה. נקייה יותר למחוק.
- *להסיר את הסכמה גם.* מיגרציה חדשה ל-`DROP TABLE blocks CASCADE` חושפת אותנו ל-data-loss בפרודקשן ולמיגרציה הופכית בעתיד. השארה היא ההחלטה הזולה.
- *להשהות את ההחלטה עד אחרי P1.3.* יוצר אי-ודאות בbacklog; ה-PM ביקש החלטה כעת.

**Trade-offs accepted.**

- שורות `audit_events.action ∈ {block_user, unblock_user}` ימשיכו להופיע ב-`06_audit_trail.md` כ"רשומות מותרות אך לא-מופקות ב-MVP". בעת שחזור — אין צורך בעדכון סכמה.
- `NFR-PRIV-009` (block opacity) deferred — אין surface שמייצר את ה-signal הזה ב-MVP.

**Affected docs.**
`FR-MOD-003, 004, 009` (DEPRECATED — post-MVP), `FR-MOD-007, 012` (cross-ref scrub), `FR-POST-014 AC4`, `FR-POST-018 AC3`, `FR-FEED-006`, `FR-SETTINGS-005` (deferred), `INV-M1`, `D-11` (superseded), `NFR-PRIV-009` (deferred), `06_audit_trail.md`, `01_analytics_and_events.md` (block events deferred), `B_glossary.md` (`Block` entry annotated), `A_traceability_matrix.md` (rows annotated), `BACKLOG.md` (P1.4 removed; FR-MOD-010 moves to P1.3), `TECH_DEBT.md` (TD-18 closed; TD-41 block-portion N/A).

---

## D-17 — Admin report-bubble snapshot privacy floor (2026-05-12)

For `messages.system_payload` snapshots taken by `reports_after_insert_apply_effects` (migration `0047_report_admin_payload_enrichment.sql`), the MVP privacy floor is the UI-layer admin-gate (`useIsSuperAdmin()`) in `ReportReceivedBubble` / `AutoRemovedBubble`. Trigger-level visibility filter (TD-59) and RTBF scrub (TD-60) deferred until: (a) a non-mobile client consumes payloads, or (b) an EU launch is on the roadmap. Council-reviewed; documented to prevent re-litigating the question.

---

## D-18 — Owner hard-delete when post has no recipient link (2026-05-12)

**Decision.** Extend `FR-POST-010` so the post owner may `DELETE` their row not only when `status = open`, but also when `status = deleted_no_recipient` **and** there is no row in `public.recipients` for that `post_id` (closed without marking another user). Owner delete remains **forbidden** for `closed_delivered` (recipient exists) and other terminal states unless covered elsewhere (e.g. admin remove).

**Rationale.** Users who closed “without marking” should be able to remove the tombstone before the 7-day cron, without reopening first. Marked deliveries stay tied to another user’s `items_received_count` / social proof — those require reopen or admin paths.

**Follow-up (0053).** If the recipient’s account is deleted, `recipients` can CASCADE away while the post row remains `closed_delivered`. Owner delete must still treat “no `recipients` row” as unlinked and allow hard-delete (same RLS shape as `deleted_no_recipient`).

**Alternatives rejected.** *Allow owner delete for all closed statuses* — would break recipient stats and audit semantics without extra compensation logic.

**Affected docs.** `FR-POST-010`, migrations `0052_posts_owner_delete_deleted_no_recipient.sql`, `0053_posts_owner_delete_orphan_closed.sql`.

---

## D-19 — Closed posts surface on both publisher and respondent profiles (2026-05-13)

Closed-delivered posts appear in the "פוסטים סגורים" tab of both the publisher's and the respondent's profile. Visibility to third parties is governed by the post's original `visibility` field (Public / Followers-only / Only-me) — no automatic upgrade on close. Each card shows an economic-role badge (📤 נתתי / 📥 קיבלתי) derived from `(post.type, identity-role)`.

**Reverses** the respondent-privacy carve-out previously stated in D-7 / FR-POST-017 AC1. Rationale: a public karma trail across both sides of a transaction is more important than the implicit privacy of being a respondent on a public post. Users who want privacy can publish posts as Followers-only or Only-me, and the closed visibility inherits accordingly.

**Spec:** `docs/superpowers/specs/2026-05-13-closed-posts-on-both-profiles-design.md`.
**Touches:** FR-PROFILE-001 AC4, FR-PROFILE-002 AC2, FR-POST-017 AC1 + AC5.
**Implementation:** migrations `0059_post_visibility_closed_public.sql` + `0061_profile_closed_posts_rpc.sql`; use case `GetProfileClosedPostsUseCase`; mobile components `ProfileClosedPostsGrid` + `PostCardProfile` (identityRole prop).

---

## EXEC-10 — Push notifications use outbox + database-webhook + Edge Function pattern

**Date.** 2026-05-14
**Origin.** P1.5 brainstorming + design phase (2026-05-13).

**Decision.**
Push notifications are dispatched via a three-layer pipeline:

1. **DB triggers** on each producer table (`messages`, `recipients`, `posts`, `follow_requests`, `follow_edges`) write a row to the `notifications_outbox` table inside the same transaction as the originating event, using a single `enqueue_notification(...)` helper.
2. A **Supabase Database Webhook** on `INSERT INTO notifications_outbox` invokes the `dispatch-notification` Edge Function (Deno) in ~1s.
3. The Edge Function loads recipient preferences + devices, applies coalescing (chat ≤60s, follow_started ≥3-in-60min), and calls the Expo Push HTTP API.

A 1-min pg_cron sweeps any rows that failed webhook delivery; a 24h TTL cron prunes the outbox.

Web Push parity is deferred — only the adapter changes, the pipeline is shared.

**Rationale.**
- Atomicity: the outbox row is written in the same transaction as the data change, so we never notify on rolled-back state.
- Sub-5s latency (NFR-PERF-007): webhook fires ~1s after INSERT.
- Built-in retry: dashboard webhook retries automatically; the cron is a backstop.
- Observability: every notification is a row in `notifications_outbox` with `dispatched_at`, `attempts`, `last_error` — debuggable from the SQL editor without log mining.

**Alternatives rejected.**
- *`pg_net.http_post` inside a trigger.* HTTP from inside a DB transaction is fragile (rolls back HTTP attempts; no retry; secrets in DB). Eliminated as anti-pattern.
- *Pure `pg_cron` polling every minute.* Latency floor is 60s — violates NFR-PERF-007 for chat.
- *External worker on Railway.* The repo already has a Railway service, but adding a polling worker just for fan-out doubles ops surface. Edge Function is sufficient.
- *Third-party (OneSignal).* Extra DPA, extra dependency, no clear MVP-scale benefit.

**Trade-offs accepted.**
- The Edge Function runs on Deno; the canonical `coalesce.ts` helper lives in `@kc/application` and is byte-mirrored under `supabase/functions/dispatch-notification/`. A CI lint (Task 25) prevents drift.
- The Database Webhook is configured via the Supabase dashboard, not SQL — operator step documented in migration 0058's header.
- Web Push is deferred to a follow-up TD (TD-65).

**Affected docs.** `docs/SSOT/spec/09_notifications.md`, `docs/SSOT/spec/11_settings.md`, `docs/superpowers/specs/2026-05-13-push-notifications-design.md`, `docs/superpowers/plans/2026-05-13-push-notifications.md`, migrations 0056–0058, 0060, 0062–0066, Edge Function `dispatch-notification`.

---

## D-20 — MVP email verification at the auth boundary (2026-05-14)

**Decision.** Enforce email verification at Supabase Auth, not as an in-app state. Email/password sign-up users cannot sign in until they click the verification link. Google / Apple / phone users are `active` on first INSERT (provider returns `email_confirmed_at` immediately). The `pending_verification` middle state from FR-AUTH-006 AC2 (in-app banner, throttled features) is deferred to v2 with the verified-badge product.

**Rationale.** The throttled-middle-state semantics require a verified-badge product, a non-dismissible banner, and per-feature RLS gates that are not in MVP scope. Enforcing at the door yields a strictly simpler product surface and aligns with what `users_select_public` already assumes (`account_status = 'active'`). The historical bug where Google users were stuck at `pending_verification` is fixed by the same migration (`0067`) via a trigger that syncs `auth.users.email_confirmed_at` to `public.users.account_status` plus a one-time backfill.

**Alternatives rejected.** Keep `pending_verification` as a throttled middle state — adds RLS surface, banner UX, and verified-badge work that is not in MVP scope. Skip email verification entirely — leaves a permanent spam vector and contradicts the FR-AUTH-006 source PRD.

**Affected docs.** FR-AUTH-006 AC2 (rewritten), FR-AUTH-007 AC6 (new), FR-AUTH-003 (no change), migrations `0067_mvp_email_verification_gate.sql` (supersedes `0046_auth_gate_allow_pending_verification.sql`).

**Follow-up (2026-05-15).** The original premise — "Google / Apple / phone users are `active` on first INSERT because the provider returns `email_confirmed_at` immediately" — is correct for Google but wrong for phone-only OTP, where the verification flag lives on `auth.users.phone_confirmed_at` and `email_confirmed_at` is never set. With the 0067 trigger watching only `UPDATE OF email_confirmed_at`, phone users were written as `pending_verification` at INSERT and never promoted; `auth_check_account_gate` then signed them out on every sign-in. Migration `0068_verification_status_provider_aware_and_phone.sql` closes this by making `handle_new_user` provider-aware (Google/Apple set `active` from the `provider` field alone, eliminating the transient state for OAuth), extending the verified trigger to also watch `phone_confirmed_at`, and backfilling any rows already verified at the auth layer. D-20's enforcement contract (gate denies `pending_verification`; no in-app middle state) is unchanged.

---

## D-21 — Privacy mode is a follow-approval flag only (2026-05-15)

**Decision.** `User.privacy_mode = Private` means **one thing**: new follow attempts create a `pending` follow request that the target must approve. It has no other effect on visibility — the profile header, biography, counters, post lists (subject to per-post `visibility`), and followers/following lists are visible to all signed-in viewers, exactly as for a `Public` profile. The lock indicator (`FR-PROFILE-011` / `FR-PROFILE-012`) plus the "Send Follow Request" CTA are the only user-facing differences.

**Rationale.** The original "Private profile hides everything from non-followers" semantics created two user-visible bugs that surfaced in production:
1. `Public`-visibility posts authored by a Private user appeared in feed/search with the publisher rendered as "משתמש שנמחק", because `posts` RLS doesn't check author privacy but the join to the `users` row was filtered by `users_select_public` (which requires `privacy_mode = 'Public'`).
2. Private users were absent from search-users results entirely, because the same RLS policy filtered them out for all non-followers.

These weren't bugs to patch — they were symptoms of a privacy model the product never intended. The PM-validated intent is: a user marking themselves "Private" wants *control over who follows them*, not invisibility. Public posts stay public; the user's identity stays discoverable. Hiding posts behind a follow gate is what per-post `visibility = FollowersOnly` is for — that mechanism is unchanged and remains follow-edge-driven (independent of profile privacy).

**Alternatives rejected.**
- *Tighten `posts` RLS to drop posts authored by Private users for non-followers.* Preserves the original spec but makes Public-visibility posts hidden in a way that's invisible to the author (and inconsistent with `visibility = Public` semantics). Rejected: the per-post visibility flag is the single source of truth for who-can-see-this-post.
- *Add a minimal public users projection (id, name, avatar, handle) joinable through posts.* Fixes the "deleted user" leak without touching the spec, but leaves the search-invisibility bug unresolved and creates a second, weaker visibility tier nobody asked for.

**Trade-offs accepted.**
- Followers and following lists of a Private user are now visible to everyone (subject to per-row block when block is reintroduced post-MVP, EXEC-9). This is the intended product behavior.
- The `LockedPanel` component and `showLocked` / `allowed`-by-privacy gating are removed from the three profile routes. Anyone relying on those code paths externally would need updating — none found in audit.

**Affected docs.** `spec/02_profile_and_privacy.md` (v0.4 — FR-PROFILE-003, FR-PROFILE-004, FR-PROFILE-010 rewritten). `spec/03_following.md` is unchanged — the follow-approval logic was already independent of profile visibility. `spec/06_feed_and_search.md` is unchanged at the AC level; the search-results visibility shift is a behavioral consequence, not a contract change.

**Implementation.** Migration `0069_privacy_mode_follow_approval_only.sql` drops `users_select_public` + `users_select_private_approved_follower` and replaces them with a single `users_select_active` policy: `account_status = 'active' AND NOT public.is_blocked(auth.uid(), user_id)`. Mobile routes `app/user/[handle]/{index,followers,following}.tsx` drop the `allowed` / `showLocked` privacy gating; `LockedPanel.tsx` is deleted. `mapPostRow.ts` keeps the orphan-owner fallback but its comment is updated — RLS will no longer null the owner for the privacy reason.

---

## D-22 — Auth error messages must not enumerate registered emails (2026-05-16)

**Decision.** The email/password sign-in and sign-up surfaces present the same generic outcome regardless of whether the email is registered.
- **Sign-in failure** (wrong password OR unknown email) → single `authentication_failed` code → Hebrew message: `"לא הצלחנו להתחבר עם הפרטים האלו. בדקו את הדוא"ל והסיסמה ונסו שוב."`
- **Sign-up** against an email that is already registered → the adapter swallows the underlying `email_already_in_use` error and returns a `null` session, which the use case maps to `pendingVerification: true` and the screen renders the existing "check your email" panel. The user sees the same path they would on a fresh sign-up.

**Rationale.** `SupabaseAuthService.mapAuthError` previously returned distinct `invalid_credentials` vs `email_already_in_use` codes (TD-69, audit 2026-05-10 §17.2). A scripted attacker could probe any address and learn whether it was registered — straightforward email-enumeration oracle. Cost of the fix: a legitimate user who mistypes their email on sign-in no longer sees "this email isn't registered, try sign-up" guidance. UX trade-off accepted because (a) the same outcome on sign-up still routes the user to the verification flow, (b) password reset flow is the canonical "I might not have an account" path, and (c) the alternative leaks security-relevant data on every wrong attempt.

**Implementation.** New `'authentication_failed'` value on `AuthErrorCode` (`packages/application/src/auth/errors.ts`). Adapter `SupabaseAuthService.signInWithEmail` rewrites `invalid_credentials` / `email_already_in_use` to `authentication_failed`. Adapter `signUpWithEmail` short-circuits on `email_already_in_use` and returns `null` (no throw). Hebrew copy added in `services/authMessages.ts`. Closes `TD-69`.

---

## D-23 — Display strings live in the mobile composition root, not in domain/application/infrastructure (2026-05-16)

**Decision.** All user-visible Hebrew strings live in `apps/mobile/src/i18n/locales/he/`. The `domain` layer holds enum *keys* only (`'Furniture'`, `'New'`, …) and never `*_LABELS_HE` maps. The `application` layer never produces display strings (e.g., chat-auto-message templates inline at the mobile call site via the `react-i18next` singleton, not via a use case). The `infrastructure-supabase` layer returns `null` for absent counterparts (`PostWithOwner.ownerName: string | null`, chat `displayName: string | null`); the mobile UI renders `t('common.deletedUser')` at the JSX site.

**Rationale.** The codebase had accumulated Hebrew literals across all four layers, violating CLAUDE.md §5 (Clean Architecture: domain pure, application no I/O, infra returns data not UI). The accumulation made future localization impossible without re-touching the same files and made every cross-layer test of category/condition/owner labels depend on a Hebrew string. Migrating display responsibilities to the composition root restored the invariant, eliminated `BuildAutoMessageUseCase` (which was a one-line template wrapped in a class), and unblocked a future second-language bundle without re-touching domain/application/infrastructure code.

**Rollout.** 9 PRs landed 2026-05-16 against `dev`:
- Spec + plan (`#237`, `#240`).
- PR1 — i18n key foundation (`#241`): `common`, `post.category.*`, `post.condition.*`, `chat.autoMessage.initial`.
- PR2 — domain label removal (`#247`): deleted `CATEGORY_LABELS`, `ITEM_CONDITION_LABELS_HE`; 7 mobile consumers updated.
- PR3 — `deletedUser` null contract (`#246`): widened `ownerName` / `displayName` to `string | null`; UI fallback.
- PR4 — `BuildAutoMessageUseCase` deletion (`#245`): inlined `i18n.t('chat.autoMessage.initial', { title })` in `contactPoster.ts`.
- PR5a-d — UI sweep across 28 screens + `ChatNotFoundView` (`#254`, `#250`, `#253`, `#251`). PR5a additionally split the root `locales/he/index.ts` into `modules/auth.ts` + `modules/onboarding.ts` to keep the 200-LOC cap.
- Close-out — `BACKLOG.md` flipped to ✅, this entry, two new TDs (`TD-153` reconcile templates, `TD-154` Hebrew-literal lint rule).

Spec: `docs/superpowers/specs/2026-05-16-hebrew-to-i18n-design.md` · Plan: `docs/superpowers/plans/2026-05-16-hebrew-to-i18n-migration.md`.

**Out of scope, retained.** `infrastructure-supabase/src/search/searchConstants.ts` keeps its Hebrew↔slug map (query-parser vocabulary, not display). `value-objects.ts:STREET_NUMBER_PATTERN` keeps `[A-Za-zא-ת]?` in the regex (data validation, not display). Server-emitted Hebrew in `supabase/migrations/0031_post_closure_emit_system_messages.sql` remains open (tracked as `TD-148`). iOS `Info.plist` permission strings are Hebrew literals (deferred to native `InfoPlist.strings` if/when iOS localization is rationalized — out of scope for this migration).

**Note (2026-05-16):** Scope for *where* copy may live is extended by **D-24** (bilingual MVP + migration indirection). D-23 remains the authoritative split for *layering* (composition root vs domain/application/infrastructure).

---

## D-24 — Bilingual MVP (`he` + `en`) and locale-backed copy everywhere (2026-05-16)

**Decision.** The MVP **includes English** alongside Hebrew. All user-visible strings in the **mobile app** must flow through the i18n system: **stable keys → locale bundles** (under `apps/mobile/src/i18n/locales/he/` and `apps/mobile/src/i18n/locales/en/`, or successor paths agreed in implementation). The same **contract** applies **outside the app tree**: SQL under `supabase/migrations/`, PL/pgSQL, triggers, and any server-side text that reaches users must **not** rely on raw inline natural-language literals as the long-term pattern; they must use **indirection** (e.g. message keys + parameters, with resolved text supplied from the same versioned locale artifacts used by the app and/or Edge Function bundles such as `supabase/functions/*/i18n.json`, or SQL generated from a single copy SSOT). **Implementation of migration refactors and full `en` parity is deferred**; this entry records the target architecture only.

**Rationale.** English-speaking users and English-first contributors need a first-class UI language. Inline Hebrew (or English) in application code or migrations couples copy to code history, bypasses review parity, and blocks consistent localization. Keys + locale files give one audit trail and one place to edit tone.

**Alternatives rejected.** *Hebrew-only product surface for MVP* — conflicts with contributor ergonomics and user growth. *Allow literals in migrations indefinitely* — same coupling problem; SQL may remain transitional but is not exempt from the end-state contract.

**Trade-offs accepted.** Refactoring historical migrations and trigger bodies to key-based copy is expensive; phased delivery after explicit backlog tasks. Until then, the Hebrew literal scan may keep **transitional exclusions** (see `scripts/extract-hebrew-text.mjs` header) so CI stays green while debt is burned down.

**Relationship to D-23.** D-23 fixed *layering* (no display strings in domain/application/infrastructure). D-24 adds **languages** (`en` parity as a product requirement) and **extends the copy contract to the database layer** (keys → locale-backed sources, not raw literals in SQL).

**Affected docs.** This entry; `scripts/extract-hebrew-text.mjs` (policy comment only until tooling tightens). Future updates: `spec/11_settings.md` (language selection), `TECH_DEBT.md` as concrete refactors are filed.

---

## D-25 — `users.display_name` / `city` / `city_name` are nullable; UI applies translated fallback (2026-05-16)

**Decision.** `public.users.display_name`, `public.users.city`, and `public.users.city_name` are **nullable**. `handle_new_user` writes `NULL` for these fields when no signal exists at signup time (e.g. phone-only OTP with no name in metadata). The mobile UI applies a translated fallback at render time: `value ?? t('profile.fallbackName')` and `value ?? t('profile.cityNotSet')`. Onboarding (`pending_basic_info` → `completed`) is the contract that fills these fields with user-provided values.

**Rationale.** Implementation step of `D-24`: the only way to keep SQL migrations free of user-visible Hebrew without breaking the signup contract is to admit that the columns are legitimately unknown during the `pending_basic_info` window. Migration `0084` removes the last user-visible Hebrew literals (`'משתמש'`, `'תל אביב - יפו'`) that previously sat as defaults inside `handle_new_user` and were written into every phone-OTP signup row. Representing absence as `NULL` (not as a hardcoded Hebrew string) lets the FE pick the right copy per locale at render time.

**Alternatives rejected.** *Keep the Hebrew defaults inline* — couples copy to schema and blocks `en` parity (`D-24`). *Add `display_name_en` / `city_name_en` columns* — expands schema indefinitely for a problem that belongs in the FE; the fallback is a presentation concern. *Use a sentinel string (e.g. `'__UNNAMED__'`)* — pushes parsing logic into every consumer instead of leveraging SQL `NULL`.

**Trade-offs accepted.** Every consumer of these columns must tolerate `NULL`. TypeScript catches the call sites in `domain/application/infrastructure` and the mobile app; RPC outputs (`personal_activity_timeline`, `universal_search`, `0047` reports payload) already wrap user fields in shapes that accept `NULL`. Tests that asserted non-null defaults were updated.

**Relationship to D-24.** This is the first concrete migration refactor delivered against `D-24`'s end-state contract for SQL.

**Affected.** `supabase/migrations/0084_user_basic_info_nullable.sql`; `packages/domain/src/entities.ts` (`User`); `packages/infrastructure-supabase/src/users/mapUserRow.ts`, `editableProfileSupabase.ts`, `database.types.ts`; `packages/application/src/ports/IUserRepository.ts`, `IPostRepository.ts`, `posts/SearchUsersForClosureUseCase.ts`; mobile render sites under `apps/mobile/` (edit-profile, user/[handle] screens, RecipientCallout, RecipientPickerRow, UserResultCard, follow-requests); i18n keys `profile.fallbackName` (already present) + `profile.cityNotSet` (new).

---

## D-26 — Post visibility vs per-actor identity on posts (2026-05-16, partially superseded by D-39)

> **Note (2026-05-24, `D-39`).** The "owner OnlyMe → counterparty sees anonymous on post chrome" coupling clause is **removed**. Under the dual-surface model the counterparty always sees the actor's real identity on post chrome (chat is the mutual-recognition surface). The rest of D-26 (separate identity-chrome policy, `hide_from_counterparty` semantics, profile/chat invariants) stands.

**Decision.** Keep `Post.visibility` / `is_post_visible_to` as the **community audience** control for post listings (`FR-POST-009`). Add a separate per-`(post_id, user_id)` policy (`post_actor_identity`) for **how that user's identity is rendered on post surfaces** (feed cards, post detail author/recipient rows) including the **`hide_from_counterparty` third-party mask on the counterparty's profile surface (`D-31`)**. **Profiles and chat participants** stay real-user shells; chat anchors remain **open posts only** (existing anchor lifecycle).

**Rationale.** Product requires independent axes: a post can be broadly visible while a participant limits how **third parties** see them on the partner's profile surface (`D-31`), and vice versa. Collapsing both into `visibility` would break `FR-POST-009` invariants and blur UX.

**Affected docs.** `spec/04_posts.md` (`FR-POST-021`), `docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md`, migration `0083_post_actor_identity.sql`.

---

## D-27 — About narrative: product transparency vs optional user anonymity (2026-05-16)

**Decision.** In-app About / marketing copy should **not** claim “privacy by default” as a *product value chip* when the product stance is **transparent operation by default** (what the system measures, why, and how safety works). **User-controlled anonymity** (e.g. profile/post visibility choices) is described as an **optional user preference**, not a substitute for product transparency.

**Rationale.** The prior phrasing created cognitive tension with the “open community / transparency” story. Separating *platform transparency* from *personal anonymity choices* keeps trust messaging coherent while still honoring legitimate privacy needs.

**Affected docs.** `docs/SSOT/spec/11_settings.md` (About scope ACs), Hebrew `aboutContent` bundles + FAQ alignment.

---

## D-28 — Per-participant surface visibility for closed posts (2026-05-16)

**Decision.** Closed-post **third-party access is governed per participant**, not by a single `posts.visibility` value. Each `(post_id, user_id)` row in `public.post_actor_identity` carries a `surface_visibility ∈ {Public, FollowersOnly, OnlyMe}` (default `Public`) that gates discoverability *through that participant's surface* (their profile "פוסטים סגורים" tab, and generic post fetch when the viewer is a third party). The owner's `posts.visibility` continues to govern **community discovery for open posts** (`FR-POST-009`) and is **not** the gate for closed-post third-party access. The previously-conflated `exposure` column is renamed to `identity_visibility` and is retained as the **identity-chrome** axis (how this participant's name/avatar appear on post surfaces when the viewer is permitted to see the post), and `hide_from_counterparty` stores a **third-party mask on the counterparty's closed-post profile surface** (see **`D-31`**; DB column name is historical).

**Counterparty read invariant.** `posts.owner_id` and active `recipients.recipient_user_id` rows **always** retain read access to the post regardless of either participant's `surface_visibility`. Surface visibility governs **third-party** access only.

**Coupling rule (audience → identity).** When a participant's `surface_visibility` does not admit viewer V on the participant's own surface, V must also see that participant **anonymously** if V reaches the post via the counterparty's surface. This prevents identity leakage through cross-surface entry while still letting the counterparty's surface broadcast the post.

**Effective third-party access for closed posts.** `is_post_visible_to(post, viewer)` for `closed_delivered` returns true to a non-participant V iff **either** participant's `surface_visibility` admits V. `profile_closed_posts(profile, viewer)` gates each row by the row's own role-actor `surface_visibility` (publisher rows by owner's, respondent rows by respondent's), not by `posts.visibility`.

**Supersedes (in part).** `D-19`'s "*Visibility to third parties is governed by the post's original `visibility` field*" clause for `closed_delivered`. The rest of `D-19` (closed posts shown on both publisher and respondent profiles; per-side economic-role badges; no auto-upgrade on close) stands.

**Refines.** `D-26` by promoting `post_actor_identity` from an identity-only policy to a three-axis per-participant policy (surface_visibility ⟂ identity_visibility ⟂ hide_from_counterparty). **`D-30` (2026-05-16)** collapses MVP UI to audience + counterparty mask only; `identity_visibility` is no longer user-editable in-app (see `FR-POST-021`, migration `0092`).

**Rationale.** The single-`posts.visibility` model gave the publisher unilateral control over the respondent's profile tab — a respondent could not surface a post they were proud of (or, conversely, hide their participation) if the publisher had chosen a different audience. The product rule is *"each participant controls their own surfaces"*. Backward compatibility is preserved because `surface_visibility` defaults to `Public`, which matches the prior public-by-default closed-post behavior; the publisher's `posts.visibility` no longer adds a second filter on top.

**Migration semantics (no behavior regression).** New column `surface_visibility text not null default 'Public'`. Existing `exposure` column renamed to `identity_visibility`; values (`Public` / `FollowersOnly` / `Hidden`) and runtime meaning preserved. No row backfill needed for the new column — `Public` default already matches existing behavior. The new RPC/RLS predicates internally use a `SECURITY DEFINER` SQL helper to avoid the policy-recursion deadlock with `post_actor_identity`'s own SELECT policy that previously referenced `is_post_visible_to`.

**Affected docs.** `spec/04_posts.md` (`FR-POST-021` rewrite, `FR-POST-017` AC1 amendment); `spec/02_profile_and_privacy.md` (`FR-PROFILE-001` AC4, `FR-PROFILE-002` AC2); `docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md` (addendum); migration `0085_post_actor_identity_audience_split.sql`.

---

## D-29 — Saved-posts list shows only still-visible posts

**Decision.** The My Profile saved-posts list (`FR-PROFILE-016`) returns only posts the viewer can still read under `is_post_visible_to`. Bookmark rows for posts that later become invisible remain in `saved_posts` until the user unsaves or the post is deleted.

**Rationale.** Avoids empty or misleading cards when visibility, follow state, or blocks change after save. Reuses existing RLS on `posts` instead of a separate visibility snapshot.

**Alternatives rejected.**

- *Snapshot visibility at save time.* More complex; stale snapshots could show posts the user should no longer see.
- *Auto-delete bookmarks when visibility drops.* Surprising UX if the user regains access (e.g. re-follow).

**Affected docs.** `spec/04_posts.md` (`FR-POST-022`), `spec/02_profile_and_privacy.md` (`FR-PROFILE-016`); migration `0086_saved_posts.sql`.

---

## D-30 — MVP post-detail privacy: audience + counterparty mask only (2026-05-16)

**Decision.** The post-detail privacy block is **audience-first**: for **open** posts the owner edits `posts.visibility` (`FR-POST-003` / `FR-POST-009`, `D-32`); for **closed** posts each participant edits their own `surface_visibility` (`D-28`). The **only** user-facing identity toggle in MVP besides audience is `hide_from_counterparty`, whose **product semantics** are defined in **`D-31`** (third parties on the counterparty's closed-post profile — not hiding from the counterparty; see also `D-30` supersession note). Per-participant `identity_visibility` (`FollowersOnly` / `Hidden` chrome) is **not** exposed in the mobile UI; client upserts normalize `identity_visibility` to `Public`, and migration `0092_post_actor_identity_public_chrome.sql` clears legacy non-`Public` rows.

**Rationale.** The prior three-level control duplicated the visibility affordance (🌍/👥/🔒) but changed chrome, not audience — users consistently misread it as “who sees the post”. Collapsing MVP UX to audience + one identity toggle matches the mental model while preserving `D-28` closed-post surface rules and `D-26` post-chrome rules. **`D-31`** corrects the original reading of `hide_from_counterparty` as “hide from the partner” — partners already recognize each other in chat; the risk is **other users** browsing the partner's profile.

**Supersedes (in part).** MVP UX scope of the `identity_visibility` axis described in `D-28`'s addendum table; server columns and projection hooks remain for future refinement / surface-coupling. **`D-30`'s** prior sentence that described `hide_from_counterparty` as hiding from the counterparty on post chrome is superseded by **`D-31`**.

**Affected docs.** `spec/04_posts.md` (`FR-POST-021`); `docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md` (PM revision note); migration `0092_post_actor_identity_public_chrome.sql`; mobile `PostMenuExposureBlock`, `VisibilityChooser`.

---

## D-31 — `hide_from_counterparty` targets third parties on the counterparty's profile surface (2026-05-16)

**Decision.** The boolean `hide_from_counterparty` on `public.post_actor_identity` means: when **true**, **non-participant** viewers who consume the post in the **counterparty's** closed-post **profile** context (the "פוסטים סגורים" grid hosted on the counterparty's user id) see **anonymous** post chrome for this actor. The **counterparty** always sees the actor's **full** identity on post chrome in that context (they already recognize the actor from **chat**, where identity remains real). Neutral entry points (home feed, post detail without a `fromProfile` / listing-host hint, etc.) do **not** apply this flag until a listing-host context is supplied (`D-30` MVP scope: mobile passes the host when navigating from closed-post profile cards).

**Rationale.** The prior interpretation ("hide from the partner on the post") duplicated chat reality and confused Hebrew product copy. The actual privacy need is **strangers** discovering the relationship via **the partner's profile shell**, not hiding from the partner themselves.

**Refines.** `D-28` / `D-30` wording on what `hide_from_counterparty` does; column name stays for migration compatibility.

**Affected docs.** `spec/04_posts.md` (`FR-POST-021` AC4/AC7, Description); `spec/02_profile_and_privacy.md` (cross-reference); `packages/domain/src/postActorIdentity.ts`; `applyPostActorIdentityProjectionBatch` options; mobile closed-post navigation query `fromProfile`.

---

## D-32 — Post visibility may move in any direction after publish (2026-05-17)

**Decision.** Owners (and closed-post participants for `surface_visibility`, `FR-POST-021`) may set `Public`, `FollowersOnly`, or `OnlyMe` **at any time**, including restricting a post after it was already public (e.g. `Public → OnlyMe`). The product does **not** promise retroactive removal from other users' memory, screenshots, or off-platform shares; the control governs **current** in-app discoverability (feeds, profile closed-post surfaces, eligibility rules).

**Rationale.** PM override: users need a safety valve to retract broad exposure without deleting the post. Prior upgrade-only rule (`FR-POST-009` as originally written, RLS/trigger in `0002_init_posts.sql`) is removed in favor of explicit user control.

**Supersedes (in part).** PRD §3.2.4 sub-section ו as reflected in legacy `FR-POST-009` upgrade-only ACs; database trigger `posts_visibility_upgrade_only` (dropped in `0094_posts_visibility_free_change.sql`).

**Affected docs.** `spec/04_posts.md` (`FR-POST-009`, `FR-POST-021`, `FR-POST-006` AC3, `FR-POST-008` AC1); `packages/domain/src/invariants.ts` (`canUpgradeVisibility` semantics); `UpdatePostUseCase`, `UpsertPostActorIdentityUseCase`; mobile `PostMenuExposureBlock`, `PostMenuSheet`, `edit-post/[id].tsx`; migration `0094_posts_visibility_free_change.sql`.

---

## D-33 — Web Google sign-in via same-tab redirect; bottom-sheet UX deferred to native (2026-05-17)

**Decision.** On Web, "Continue with Google" performs a **top-level same-tab navigation** to `accounts.google.com`. The browser then redirects to `/auth/callback?code=…`, which the existing callback handler exchanges for a Supabase session. No `window.open` popup, no embedded picker UI. Native (iOS/Android) continues to use `WebBrowser.openAuthSessionAsync` for now; the bottom-sheet, in-app account picker UX requested in product will be delivered on native via `@react-native-google-signin/google-signin` in a follow-up PR.

**Rationale.**
- **Popups are blocked on mobile Safari.** Both `window.open` (the previous web flow's expo-web-browser polyfill) and Google Identity Services' fallback popup hit Safari's popup-blocker because they fire after async setup, outside the user-gesture window. PM confirmed the bug: clicking "Continue with Google" shows "Popup window was blocked".
- **Google forbids iframe-embedding `accounts.google.com`** (`X-Frame-Options: DENY`). The PM-requested vision of an in-app account-picker bottom sheet on Web is technically blocked by Google's anti-phishing policy. The closest possible web approximation — GIS + FedCM — falls back to popups on non-Chrome browsers and was rejected after the previous attempt failed in Safari.
- **Same-tab redirect is the industry standard** (Notion, Linear, GitHub, Vercel, Supabase's own dashboard). It is the only web Google flow that avoids `window.open` entirely. The Google account picker still renders at the URL in the PM's reference screenshot (`accounts.google.com/v3/signin/accountchooser`) — it just renders as a full-tab navigation instead of a popup. The visual experience is preserved.
- **The bottom-sheet vision lives on native.** iOS and Android can use the official Google Sign-In SDK, which renders an OS-native account-picker bottom sheet inside the app (no browser involved). That delivers the requested UX where Google's policy permits it.

**Rejected alternatives.**
- GIS button + FedCM inside a bottom sheet — previous attempt (`D-32` first-claim, then `P2.24`). Reverted because Safari fallback is the same popup-block.
- Same-tab redirect wrapped in a bottom-sheet UI — adds an extra tap with no compensating benefit (the picker is not inside the sheet anyway).
- Custom Google account-picker UI proxied through our backend — breaks Google's Terms of Service.

**Affected.** `apps/mobile/src/services/authComposition.ts` (`redirectToGoogleSignInWeb`), `apps/mobile/app/(auth)/index.tsx` (`handleGoogle` web branch), `docs/SSOT/spec/01_auth_and_onboarding.md`. Reverts of the previous attempt: PR #311.

---

## D-34 — Closed-post Hide fans out to `posts.visibility` + `surface_visibility` (2026-05-17, superseded by D-39)

> **Superseded (2026-05-24, `D-39`).** Migration `0107_profile_closed_posts_surface_visibility.sql` moves Hidden-screen / Closed-tab routing onto effective `surface_visibility`. The `posts.visibility` fan-out is removed; the closed-post Hide control writes only `post_actor_identity` (and auto-couples `hide_from_counterparty = true`). The legacy fallback to `posts.visibility` is preserved inside the RPC's `coalesce`, so pre-D-39 rows still resolve correctly without a backfill.

**Context.** `FR-PROFILE-001 AC4` defines the Hidden overflow screen as "the owner's `Only me` posts (`open` and `closed` lanes)" and excludes those rows from the Closed Posts tab. The owner's "פוסטים סגורים" tab spec (FR-PROFILE-001 AC4) explicitly excludes rows "where the owner published at `posts.visibility = OnlyMe`". The supporting RPC `profile_closed_posts` (migration 0088) keys both lanes on `posts.visibility = 'OnlyMe'`. Meanwhile `D-28` introduced per-participant `post_actor_identity.surface_visibility` to govern third-party access via each participant's profile tab.

The mobile ⋮ exposure block (`PostMenuExposureBlock`) previously routed the "הסתר (רק אני)" action for closed posts to `surface_visibility` only. Result: the Hidden-screen / Closed-tab routing never fired, so closed-post hide was effectively dead.

**Decision.** When the post **owner** triggers Hide on a `closed_delivered` or `deleted_no_recipient` post, the client writes both `posts.visibility = 'OnlyMe'` (so own-profile routing flips: Closed-tab excludes, Hidden Closed includes) and the owner's `surface_visibility = 'OnlyMe'` (so third-party views of the owner's Closed Posts tab also drop the row). Recipients on closed posts continue to write only their own row's `surface_visibility` — they cannot mutate the publisher's `posts.visibility`.

**Implication.** `FR-POST-009` is clarified: `posts.visibility` may change on `closed_delivered` / `deleted_no_recipient` (owner only, visibility-only patch). All other fields remain locked on non-open statuses. `removed_admin` and `expired` stay fully read-only.

**Implementation.** `UpdatePostUseCase` now accepts a visibility-only patch on closed states (Phase 1 Task 1.1, commit `f3fcf1a`). `usePostActorPrivacyModel.onAudienceChange` fans out for closed-post owners (Phase 1 Task 1.2, commit `b684306`).

---

## D-36 — Canonical streets sourced from data.gov.il package 321 with zero filtering and free-text fallback (2026-05-18)

**Context.** Across the four address surfaces (onboarding, edit profile, create post, edit post) the street field was free-text, producing inconsistent spellings and offering no guidance. PM asked for a canonical picker but explicitly forbade any data filtering — "אל תעלים לי שוב רחובות או ערים".

**Decision.** Source the canonical street list from data.gov.il package `321` (resource `9ad3862c-8391-4b2f-84a4-2d4c68625f4b`, official רשימת רחובות ישראל). Seed `public.streets` once via migration `0101_seed_streets.sql`, generated by `scripts/generate-streets-seed.mjs`. **No filtering of source rows.** The code-`9000` "the village itself" rows are kept verbatim — they are the only canonical entry for 486 small settlements, and dropping them would empty the picker for 37 % of cities. Code `9477` in Jerusalem is verified to be a real street (`אל בארודי`), not a sentinel, and is kept. For the 2 cities in our cities seed that are absent from the source dataset (`גנים`, `כדים`), the generator synthesizes a `9000`-sentinel row so every city has at least one option.

**Free-text fallback.** Inside the picker, when the typed query has no exact canonical match, a "השתמשו ב־…" row appears at the top of the list and lets the user save the typed text verbatim. This covers new construction, recent renaming, and any other gap in the gov snapshot. The DB columns (`users.profile_street`, `posts.street`) stay `text` — no FK migration, no backfill.

**City-dependent UX.** The street picker is disabled with helper text "בחרו עיר תחילה" until a city is selected. Tapping the disabled field surfaces an ephemeral toast. Switching the city resets street + street-number so a Tel Aviv street can never accompany a Jerusalem submission. On onboarding only, the street + number fields are progressively disclosed — hidden until a city is selected, revealed via the existing entry animation, collapsed back to hidden if the city is cleared.

**Refresh path.** Re-run `node scripts/generate-streets-seed.mjs` to regenerate `0101_seed_streets.sql` from a newer source snapshot. The migration is idempotent (`on conflict (city_id, street_id) do nothing`).

---

## D-35 — Track `status_before_admin_removal` for the removed-posts screen split (2026-05-17)

**Context.** `/profile/removed` lists posts where `posts.status = 'removed_admin'`. PM wants the screen to mirror `/profile/hidden`'s two-section layout (open / closed lanes). Once admin removal flips the row, the original status is unknown — we don't reconstruct from audit logs because the linkage is fragile.

**Decision.** Add nullable `posts.status_before_admin_removal text`. `admin_remove_post` RPC captures the prior status atomically with the transition. The column is meaningful only when `status = 'removed_admin'`; outside that, it's stale state with no behavior. `admin_restore_target` does not clear it (cost-of-change vs. zero risk).

**Legacy rows.** Already-removed posts stay NULL. The mobile UI groups NULL under the open lane by default. We accept the inaccuracy: no admin-removed-pre-2026-05-17 user has flagged the misclassification, and a precise backfill would require audit-trail joins of uncertain quality.

**Implementation.** Migration `0097_posts_status_before_admin_removal.sql`. Domain `Post` gains `statusBeforeAdminRemoval`. Infra adapter selects + maps. Mobile `/profile/removed` partitions client-side.

---

## D-38 — Profile display fields: DB source of truth + Auth `user_metadata` sync (2026-05-24)

**Context.** My Profile briefly flashed the user's original OAuth name/avatar after refresh because `MyProfileChrome` fell back to `AuthSession` (JWT `user_metadata`) while React Query fetched `public.users`. `UpdateProfileUseCase` updated only Postgres, not Auth metadata, so the JWT stayed stale across cold starts.

**Decision.**
1. **`public.users` remains canonical** for profile UI (`findById` / `user-profile` query).
2. **`IAuthService.syncProfileMetadata`** writes `full_name`/`name` and `avatar_url`/`picture` on every profile write path (`UpdateProfileUseCase`, `SetAvatarUseCase`, `CompleteBasicInfoUseCase`).
3. **`ReconcileAuthProfileMetadataUseCase`** runs once after session restore (AuthGate) to heal legacy drift without forcing a re-save.
4. **My Profile** shows a loading state until the profile query resolves — no session fallback for name/avatar.

**Rationale.** Keeps clean architecture (auth port in application layer, Supabase adapter in infrastructure) and fixes both new edits and existing accounts. UI loading state is defense-in-depth during the reconcile/network window.

**Alternatives rejected.** *Session-only display (no DB read)* — wrong for counters/privacy/city. *UI-only fix (hide fallback)* — leaves JWT stale for other consumers. *DB trigger to sync auth* — couples Postgres to GoTrue internals; client port is sufficient for MVP.

**Affected docs.** `spec/01_auth_and_onboarding.md` FR-AUTH-003 AC5, `spec/02_profile_and_privacy.md` FR-PROFILE-007 AC6.

---

## D-37 — Prod DB migrations auto-apply on `main` after CI-gated merge (2026-05-22)

**Context.** Migrations are validated on every PR / branch push via **DB validate** (fresh local Supabase + `supabase/tests/*.sql`). Previously, production (`supabase-prod`) required a manual `workflow_dispatch` with `apply=true` after merging `dev` → `main`, which added friction without adding a second correctness gate.

**Decision.** Extend `.github/workflows/db-deploy.yml` so that a **push to `main`** touching the same migration-related paths as `dev` automatically runs `supabase db push` against the `supabase-prod` GitHub Environment. `dev` pushes continue to target `supabase-dev`. Manual `workflow_dispatch` remains for dry-runs, retries, and emergency operator control.

**Rationale.** The merge to `main` already implies green CI including DB validate on the PR; applying the same pending migrations immediately keeps the production schema aligned with the released branch. Operational risk (locks, data volume) is accepted; mitigations are backward-compatible migration discipline, optional **required reviewers** on the `supabase-prod` environment in GitHub, and the existing runbook.

**Alternatives rejected.** *Prod migrations manual-only forever* — rejected as redundant once PR gates are trusted. *Apply prod on every push regardless of paths* — rejected to avoid no-op deploy noise and accidental triggers unrelated to schema.

**Affected docs.** `docs/SSOT/ENVIRONMENTS.md`, `docs/SSOT/OPERATOR_RUNBOOK.md`, `.github/workflows/db-deploy.yml`.

---

## D-39 — Dual-surface closed-post privacy: surface_visibility is sole truth, counterparty always sees actor (2026-05-24)

**Context.** Closed posts share **one physical post** but render across **two profile surfaces** (publisher + respondent). PM definition of `FR-POST-021` requires each participant to control their own surface independently, while the counterparty stays the mutual-recognition surface (chat already exposes real identities). Two pre-existing decisions conflicted with this:

1. `D-26` masked the owner's identity to the counterparty whenever `posts.visibility = OnlyMe`. Under the dual-surface model, OnlyMe is a **per-surface audience control**, not a relationship-level signal — the partner has always-on read access and should see the actor's real chrome.
2. `D-34` fanned out the closed-post Hide control to both `posts.visibility` and `post_actor_identity.surface_visibility` so the Hidden-screen RPC (`profile_closed_posts`, keyed on `posts.visibility`) routed correctly. This made `posts.visibility` a second, parallel truth for closed-post audience — confusing and fragile.

Design spec: `docs/superpowers/specs/2026-05-24-closed-post-dual-surface-privacy-design.md`.

**Decision.**

1. **Counterparty always sees actor full on post chrome.** Remove the `D-26` owner-OnlyMe → counterparty mask in `projectActorIdentityForViewer`. The partner-only invariant (`D-31`) becomes the single rule for the counterparty seat.
2. **`surface_visibility = OnlyMe` always masks third parties on the partner's surface**, regardless of `hide_from_counterparty`. Showing an OnlyMe author with full chrome on the partner's public tab would defeat the privacy intent — the user wanted "private from third parties" and the partner-surface fallback contradicts that. The `hide_from_counterparty` toggle continues to control third-party masking when audience is Public / FollowersOnly. (Spec design table AC-DSP-3, which allowed opt-out, is updated accordingly.)
3. **`surface_visibility` is the sole truth for closed-post audience** on each participant's own profile surface. Migration `0107_profile_closed_posts_surface_visibility.sql` rewrites `profile_closed_posts` to gate Hidden mode and Standard own-profile exclusion on the **effective** per-actor surface (`post_actor_identity.surface_visibility`, falling back to `posts.visibility` for the publisher and `'Public'` for the respondent). The mobile Hide control writes only `post_actor_identity` (and auto-couples `hide_from_counterparty = true`); the `posts.visibility` fan-out from `D-34` is removed.

**Backwards-compatibility.** The `coalesce(post_actor_identity, posts.visibility)` fallback in the RPC preserves legacy rows (pre-D-39 posts that have `posts.visibility = OnlyMe` but no `post_actor_identity` row) without a backfill — they continue to land in Hidden and stay invisible to third parties. New writes flow through `post_actor_identity` only.

**Rationale.**

- The dual-surface metaphor ("one post, two billboards") requires symmetric controls per participant. `posts.visibility` could not express asymmetric audience without breaking owner-vs-respondent independence.
- Removing the `D-26` counterparty mask removes a contradiction that had been latent since the spec invariant "partner always sees real identity on chat" was extended to post chrome. The two seats were never meant to behave differently on the chat-context surface.
- Coupling `OnlyMe` to the third-party mask (regardless of `hide_from_counterparty`) preserves a single coherent meaning of "OnlyMe": the actor is private from everyone except the participants. The opt-out via `hide_from_counterparty = false` was a footgun — most users would not realize OnlyMe with identity hide off still exposed their name on the partner's tab.

**Alternatives rejected.**

- *Keep D-34 fan-out + just decouple D-26.* Leaves `posts.visibility` doing parallel work for a single user action. Brittle: any future field added to "closed post Hide" risks drifting between the two columns. Rejected for the same reason `D-28` superseded `D-19`'s closed-post visibility clause.
- *Migrate Hidden/Closed routing entirely off `posts.visibility` without the legacy fallback.* Would require a one-time backfill of `post_actor_identity` rows for every legacy `posts.visibility = OnlyMe` closed post. The coalesce fallback is cheap and removes the operational risk.
- *Allow opt-out from third-party mask on OnlyMe* (per the original design spec AC-DSP-3). Rejected by PM 2026-05-24 — the privacy semantics of OnlyMe should be unconditional.

**Supersedes (in part).**
- `D-26`: the owner-OnlyMe → counterparty mask clause is removed. The rest of `D-26` (separate identity-chrome policy, profile/chat invariants) stands.
- `D-34`: the `posts.visibility` fan-out is removed; the Hidden-screen routing now reads `surface_visibility`. The `UpdatePostUseCase` visibility-only patch on closed states remains legal (legacy / admin paths) but the privacy UX no longer relies on it.

**Affected docs / code.**
- `spec/04_posts.md` (`FR-POST-021` AC3/AC4, `FR-POST-009` AC5, changelog 0.14).
- `docs/superpowers/specs/2026-05-24-closed-post-dual-surface-privacy-design.md` (AC-DSP-3 + coupling matrix updated).
- `packages/domain/src/postActorIdentity.ts` (removed `ownerOnlyMeCounterpartyMask`, removed `ownerPostVisibilityOnlyMe` from `ProjectActorViewerContext`).
- `packages/application/src/posts/__tests__/postActorIdentity.test.ts`.
- `packages/infrastructure-supabase/src/posts/applyPostActorIdentityProjection.ts`.
- `apps/mobile/src/hooks/usePostActorPrivacyModel.ts` (no more `posts.visibility` fan-out).
- `supabase/migrations/0107_profile_closed_posts_surface_visibility.sql`.

---

## D-RESP-001 — Desktop adaptation strategy (2026-05-22)

**Context.** The app renders on web via `react-native-web` but looks like a stretched phone on desktop browsers. Three high-level strategies were considered: centered phone shell (Instagram.com style), adapted side-rail (X/Twitter style), full desktop rewrite (Facebook style).

**Decision.**
1. **Strategy: adapted side rail + wider content + secondary aside panel.** Same code, additive layout primitives gated by viewport width.
2. **Shell: wide labeled rail (≥1024) + content + 280px aside panel (≥1024).** No top bar.
3. **Chat: inbox pattern (list + thread side-by-side) at ≥768.**
4. **Forms / settings: narrow centered (600px max).**
5. **Auth / onboarding: split-screen with brand panel.**
6. **Breakpoints: <768 mobile / 768–1023 tablet / 1024–1439 desktop / ≥1440 wide.**

**Consequences.**
- Mobile path stays byte-identical (hard invariant; CI snapshot at 375px guards it).
- Five-PR delivery (`RESP-001..005`); each ships independently behind the `SHELL_V2_ENABLED` flag until PR 2 flips the default.
- New shell primitives live in `@kc/ui` (pure) and `apps/mobile/src/components/shell/` (composition).
- New SSOT spec file `14_responsive_desktop.md` created (FR-RESP-*).

---

## D-38 — Share-post OG meta is served by the Railway web server, not a Supabase Edge Function (2026-05-24)

**Decision.** The share URL is `https://karma-community-kc.com/post/<id>`, and the same URL serves both the OG meta stub (for crawler UAs) and the SPA `index.html` (for humans). The OG rendering logic lives in a Hono server that runs in the same Railway service as the existing web bundle, replacing `serve dist --single`. No Supabase Edge Function is involved in the share-link surface.

**Rationale.** The prior implementation (PRs #356–#366, reverted in `81b96d6`) routed crawlers + humans through `<ref>.supabase.co/functions/v1/share-post/<id>`. That URL appeared in user-visible share messages, in WhatsApp's preview-card "via" line, and in the redirect chain — undermining the "professional, branded" share UX the PM asked for. Layering a `kc.com/p/:id` 302-redirect on top via `serve.json` reduced the user-visible URL but did not eliminate the Supabase domain from the chain (or from the user-visible URL when `EXPO_PUBLIC_SHARE_BASE_URL` was misconfigured, which is what shipped). Moving OG rendering into the Railway server eliminates the entire class of bug at the architecture level: there is only one host, only one URL, and no redirect chain.

**Alternatives rejected.**
- *Supabase Custom Domain (Pro plan).* Requires paid plan; still ships with two URLs (share URL ≠ deep link) and a 302 redirect for humans.
- *Cloudflare Worker in front of Railway.* Adds a second deployment surface and depends on CF for the OG path. Overkill at current scale.
- *Pre-rendered static OG pages.* Would not survive post closure / deletion (stale OG card).

**Trade-offs accepted.** The Railway web service is now the critical path for `/post/<id>` crawler responses in addition to the SPA. Mitigated by the small Hono surface (one dynamic route), local + CI tests against the server, and the fact that any failure mode is the same as a general web-service outage (which is already monitored).

---

## D-40 — Legal docs delivery model: server-driven Markdown, native render (2026-05-25)

**Decision.** Legal documents (Terms of Service + Privacy Policy) are delivered as server-driven Markdown stored in `legal_document_versions.body_md` and rendered natively in the mobile app via `react-native-markdown-display`. No WebView; no remote-config URL pointing at a canonical web copy.

**Rationale.** Native rendering keeps RTL, theming, and offline behavior consistent across iOS, Android, and web. Avoids depending on a separate website CMS during an MVP that doesn't yet have one. Editing workflow is one SQL snippet (`publish_legal_document` RPC) against Supabase Studio rather than a CMS publish + cache invalidation.

**Trade-off.** Markdown is the ceiling for layout richness — no embedded video, no complex tables. Acceptable for legal copy.

---

## D-41 — Severity tiers: minor / standard / critical (2026-05-25)

**Decision.** `publish_legal_document` takes a three-valued `severity`: `minor` (no re-ack), `standard` (re-ack within 7 days, banner→modal promoted server-side), `critical` (blocking modal on next foreground; `effective_date` must be within 1 hour).

**Rationale.** Replaces the originally-proposed `is_material_change` boolean. Protects users from "wall of text on app open" for typo fixes while still meeting consent requirements for material changes. The publisher decides per release.

---

## D-42 — Append-only acceptance log (2026-05-25)

**Decision.** `user_legal_acceptances` is an append-only event log: one row per acceptance event per (user_id, doc_type, version). `UPDATE` and `DELETE` are blocked by a BEFORE trigger. RLS allows users to read only their own rows and insert only their own rows (but the insert path is the SECURITY-DEFINER RPC anyway).

**Rationale.** GDPR Art. 7(1) requires demonstrating consent per version with a timestamp. An upsert-only table would let one user's later acceptance overwrite the audit record of their earlier one. Council legal review identified this as the highest-priority blocker on the original design.

---

## D-43 — No grandfather backfill of acceptances (2026-05-25)

**Decision.** Existing users at the launch of FR-SETTINGS-010 are NOT issued fabricated `accepted_at = users.created_at` rows. The migration seeds v1 with `severity='standard'` so every existing user enters the 7-day soft-grace flow on their next foreground.

**Rationale.** A backfilled timestamp for a v1 text that the user never actually saw is a fabricated audit record — exactly what GDPR Art. 7 audit-readiness is supposed to prevent. The one-time soft-grace UX cost (a banner for ≤ 7 days) is the right trade against falsifying the consent log.

---

## D-44 — Server-computed `block_mode` (2026-05-25)

**Decision.** The 7-day `standard` → `critical` promotion (banner → blocking modal) is computed inside the `needs_legal_reacknowledgement` SQL function from `now() - current_effective_date >= '7 days'`. The mobile client does not derive `block_mode` from local time; it consumes the server-supplied `block_mode` field verbatim.

**Rationale.** Client clocks can be wrong (DST, deliberate tampering, OS bug, plane mode timezone confusion). The legally-enforceable promotion must live with the source of truth. Client uses the server-supplied `currentEffectiveDate` only to *display* a countdown.

---

## D-45 — `critical` severity must publish immediately (2026-05-25)

**Decision.** `publish_legal_document` rejects `severity='critical'` with `effective_date > now() + interval '1 hour'`.

**Rationale.** Critical = urgent. A scheduled rollout is exactly the case where `standard` (with the 7-day soft-grace) is the right tool. Allowing a "future critical" is an "alarm bomb": users would foreground the app at the appointed time and find themselves blocked with no warning. The 1-hour window is operational slack for a publish that misses `now()` by seconds.

---

## D-46 — Legal tables `authenticated`-only read (2026-05-25) — superseded by D-47

**Decision.** SELECT on `legal_documents` and `legal_document_versions` is granted to `authenticated` only, not `anon`. The RPCs follow the same posture.

**Rationale.** Sign-up happens through OAuth (or email-OTP) — by the time the user needs to read a legal document for the first time, they are always already authenticated. Removing the anon grant shrinks the public-facing read surface by two tables for no UX cost.

**Superseded.** See D-47 (same day). The "always authenticated by read time" premise broke in practice: expired sessions, pre-signup readers, and shared `/legal/*` deep links all hit `PGRST205` ("table not in schema cache") because PostgREST hides tables from anon when no GRANT exists.

---

## D-47 — Legal docs SELECT is public; acceptances stay private (2026-05-25)

**Decision.** Grant SELECT on `legal_documents` and `legal_document_versions` to both `anon` and `authenticated` (migration `0109_legal_documents_public_read.sql`). RLS policies follow the same posture (`for select to anon, authenticated using (true)`). Acceptance writes (`user_legal_acceptances`) remain `authenticated`-only — anon has no `auth.uid()` to own a row, and the insert RPC asserts `auth.uid() IS NOT NULL` directly.

**Rationale.**
1. **Bug fix.** D-46's posture broke three real flows on dev:
   - Expired session / failed token refresh → React store still says authenticated, Supabase client falls back to anon, PostgREST returns 404 (`PGRST205`).
   - Pre-signup readers tapping "Terms" / "Privacy" on the welcome screen — AuthGate punts them to `/(auth)` but the link target is still `/legal/*`, which 404'd.
   - Shared `/legal/terms` deep links — recipients without a session got 404.
2. **No security value to gate.** Legal documents are public-by-definition published content; the contents are the same for every user. Hiding the table from anon doesn't protect any secret, it just creates fragile dependence on session state.
3. **Smaller blast radius for re-publish accidents.** With public SELECT, a misfired publish surfaces immediately on any device (signed in or not), not only after a sign-in round-trip — easier to spot and roll back.

**Trade-off accepted.** Public read means scrapers can pull the documents at will. This is fine — these are the published terms of service and privacy policy, intended for public consumption.

---

### D-41 — Dedicated `ride_listings` table (not `posts` extension)

**Date:** 2026-05-26
**Decision:** Hitchhiking ships as `ride_listings` + `features/rides/` module. Item posts remain unchanged.
**Rationale:** Posts schema is item-shaped (single city address, item categories, closure/recipient). Rides need origin/dest cities, `departs_at`, seats, and a simpler status FSM. Extension ports allow join-approval and route matching later without migrating posts.
**Affected:** `spec/15_rides.md`, migration `0122_ride_listings.sql`, chat `anchor_ride_id`.

---

### D-40 — Replace in-chat moderation with a dedicated Admin Portal + RBAC

**Date:** 2026-05-25
**Status:** Accepted

**Decision.** Build a dedicated `(admin)` route group with an extensible RBAC store (`admin_role_grants`) instead of continuing to scale the single-super-admin chat-flow. Roles are gated at the DB level via `admin_assert_role`; the client gate (`AdminGate` + permission matrix in `@kc/domain`) is UX only.

**Rationale.** The chat-flow is a single point of failure (one super-admin), discovery is poor (actions scattered), audit search is RLS-blocked (TD-93), restore cascades incorrectly (TD-94), and the single-admin invariant has no DB enforcement (TD-95). The portal addresses all four and unblocks the broader role hierarchy from PRD V2 (`02_Personas_Roles.md`: Operator, Org Admin, Volunteer Manager, …).

**Decomposition.** A0 (this PR) ships the foundation. A1..A4 follow as separate sub-projects per `docs/superpowers/specs/2026-05-25-admin-portal-design.md`.

**Alternatives considered.**
1. Extend the chat-flow with multi-admin support. Rejected — does not address discoverability, scattered actions, or the deeper TDs.
2. Use Supabase Studio as the only admin surface. Rejected — not accessible to non-engineers, no in-app context.

---

### D-41 — Support issues (Settings → "Report an issue") intentionally do not populate `public.reports`

**Date:** 2026-05-26
**Status:** Accepted

**Decision.** Support tickets submitted via `rpc_submit_support_issue` continue to flow exclusively into a 1:1 support chat with the super admin (system message kind `'support_issue'`). They do NOT INSERT into `public.reports` and therefore do not appear in the Admin Portal Reports Dashboard (FR-ADMIN-012).

**Rationale.** Tickets and moderation reports have different lifecycles, different escalation paths, and different audit needs. Conflating them into a single inbox would force the moderation UI to handle a payload it isn't designed for (free-text description, no target). When A3 Internal Tasks lands, the admin team will track ticket follow-ups there.

**Implication.** The two surfaces stay separate: moderation work happens in `/admin/reports`; tickets stay in the support chat and (eventually) in `/admin/tasks`. Closes TD-94 sub-item (1) by reclassifying it as "by design" rather than a defect.

---

## D-48 — Sentry as the single observability sink for mobile + Edge Functions (2026-05-26)

`@sentry/react-native` for mobile crash + 3 explicit performance marks (`app.cold_start`, `feed.first_render`, `image.first_paint`). Edge Functions use a `withTiming` wrapper logging structured JSON to Supabase function logs (read via `mcp__supabase__get_logs`).

**Sample rates:** Performance 100% in dev, 25% in prod. Revisit at >1k DAU.
**Why not Datadog/Honeycomb:** vendor cost + integration overhead exceed value at this scale.

---

## D-49 — Server-driven surveys via Supabase Studio publish (mirrors legal-documents pattern)

**Date.** 2026-05-26

**Decision.** Survey A (in-app community feedback) is delivered as a set of server-driven question definitions stored in Supabase (`surveys`, `survey_versions`, `survey_questions`) and edited through Supabase Studio via a `publish_survey_version` RPC — exactly the same Studio-publish pattern used for legal documents (`D-40`, `D-41`). Survey answers are written per `(user_id, survey_id, version, question_id)` into `survey_answers`; free-form feedback lands in a separate `user_feedback` table. No app deploy is required to update question copy or publish a new version; a new published version resets the completion state for that survey.

**Rationale.** The product needs to iterate on community questions post-launch without shipping a new app binary. The legal-documents pattern (`legal_document_versions` + `publish_legal_document` RPC, D-40) already proves this model at the infrastructure level. Reusing the same publish pattern keeps operator training simple (one mental model for "push copy changes via Studio") and reuses existing migration and RLS patterns. PII isolation is achieved by placing contact emails in a dedicated `survey_contact_info` table with its own RLS policy, kept separate from the ratings/text answers.

**Affected docs.** `spec/11_settings.md` FR-SETTINGS-015..017; design `docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md`; migration `0130_surveys_and_feedback.sql`.

---

## D-50 — Anonymous public market research as a separate spec domain with PII-isolated contact storage (2026-05-26)

**Date.** 2026-05-26

**Decision.** Survey B (anonymous public market research for the "Karma Phrasebook") lives in its own spec file `docs/SSOT/spec/16_public_research.md` (FR-RESEARCH-001..003) rather than in `11_settings.md`, and its Postgres schema ships in a dedicated migration `0131_public_research_responses.sql` separate from Survey A's `0130`. Contact emails collected at the thank-you page opt-in are stored in a separate table `public_research_contact_requests` (FK to `public_research_responses(id) ON DELETE CASCADE`) rather than in the same row as survey answers; RLS on the contact table denies all access to `anon` and `authenticated` roles — only `service_role` (via a super-admin RPC) can read it. The two tables are therefore independently deletable (a GDPR-required property: erasing a contact request must not cascade to the research data, and vice versa).

**Rationale.** Survey B is not a Settings feature: it is served at a public web URL with no auth shell, targets anonymous users on external platforms (Facebook, WhatsApp, Agora), and has entirely different abuse-mitigation requirements (honeypot, `Origin` allowlist, IP-hash rate limit, global circuit breaker) from any in-app survey. Grouping it under `11_settings.md` would pollute that file's scope and make it harder for future agents to locate the right spec. A dedicated spec file also lets FR-RESEARCH-* IDs track implementation progress independently of FR-SETTINGS-*. The two-table PII isolation pattern mirrors the design already established for legal-documents acceptances (D-42) and is the simplest way to satisfy the independent-deletion requirement without adding nullable columns. A separate migration enforces the security-review separation principle followed throughout this codebase (cf. D-40, D-47). See design spec `docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md` §2, §4, §7.

**Alternatives rejected.** Adding Survey B FRs to `11_settings.md` — conflates two unrelated user surfaces. Storing contact email in the same `public_research_responses` row — makes it impossible to delete PII without deleting the research data. Single migration for both surveys — blurs security review scope.

**Affected docs.** `docs/SSOT/spec/16_public_research.md` (new); `docs/SSOT/BACKLOG.md` P1.7; `CLAUDE.md` §1 spec-files table; design `docs/superpowers/specs/2026-05-25-surveys-and-feedback-design.md`; migration `0131_public_research_responses.sql`.

---

## D-51 — Temporarily hide rides UI; keep backend live (2026-05-28)

**Date.** 2026-05-28

**Decision.** The rides hub screen (`/(tabs)/donations/rides`) is reverted to the standard donation-category links pattern (`DonationLinksList categorySlug="transport"`) at the UI layer only; all backend code (use cases, sheets, stores, the rides repository + adapter, the `ride_listings` schema + RPCs + cron) stays in place and continues to evolve. Backend hardening + advanced feature work continues in autonomous mode (CLAUDE.md §13) under FR-RIDE-011..012 and beyond.

**Rationale.** Operator feedback on V2.0 indicated the in-app rides mechanism wasn't ready for end users; the existing NGO links view is a safe stopgap that delivers user value while we keep iterating. Removing the feature outright would erase work already merged and force a rebuild when the UI comes back; freezing it would block backend hardening (cron-driven expiry, chat anchor cleanup, participant model, RPC validation). UI-only hide preserves both options.

**Alternatives rejected.** Revert all rides commits (loses backend that will be reused). Ship V2.0 UI as-is (operator said no). Feature-flag the screen body (extra plumbing for what's effectively a single screen render swap).

**Affected docs.** `apps/mobile/src/features/rides/screens/RidesHubScreen.tsx`; `docs/SSOT/spec/15_rides.md` header (status flipped 🟡 with hide reference); ongoing rides hardening PRs (#414, #416, #417, #419, #420, #421+).

## D-52 — Rides participant model uses RPC-only writes with seat enforcement at approve time (2026-05-28)

**Date.** 2026-05-28

**Decision.** The `ride_participants` model (FR-RIDE-011) revokes direct INSERT/UPDATE/DELETE from client roles and routes all mutations through three SECURITY DEFINER RPCs (`rpc_ride_participants_request`, `rpc_ride_participants_decide`, `rpc_ride_participants_cancel`). The seat cap is enforced inside `rpc_ride_participants_decide` under `SELECT FOR UPDATE` on both the ride row and the participant row, recounting approved rows inside the transaction.

**Rationale.** RLS alone cannot enforce a count-based invariant (last-seat race between two simultaneous approvals); a CHECK constraint can't span rows. The RPC-only pattern is already used in this codebase for chat anchor mutations (`rpc_chat_set_anchor`, `rpc_chat_set_anchor_ride`) and report mutations — extending it to participants keeps the surface area uniform. The `FOR UPDATE` locks are cheap (point lookups on PK indexes) and guarantee linearizable approve semantics.

**Alternatives rejected.** RLS + client retry on conflict — exposes the race to clients and adds latency. Trigger-side validation — same FOR UPDATE locking needed; less testable. SERIALIZABLE isolation per call — heavier than needed; the two locks are sufficient.

**Affected docs.** `docs/SSOT/spec/15_rides.md` FR-RIDE-011 AC2/AC3/AC5; migration `0139_ride_participants.sql`.

## D-53 — Automated `main` production gates without human deploy approvers (2026-05-28)

**Date.** 2026-05-28

**Decision.** Production protection on `main` is enforced entirely by CI and branch protection — no required reviewers on the `supabase-prod` GitHub Environment and no human deploy approvers. The agent acts as CTO; the PM owns product scope only. Gates: (1) PRs to `main` must use head branch `dev`; (2) `scripts/check-migration-safety.mjs` blocks destructive migration SQL unless a line carries `migration-safety: allow`; (3) `db-deploy` runs `supabase db push --dry-run` before apply for `supabase-prod`; (4) `prod-smoke` runs after app, migration, or Edge Function changes on `main`.

**Rationale.** Human approval gates conflict with the AI-driven delivery model and add latency without catching logic errors CI already covers. Dry-run + migration safety scan + dev-only release branch + existing RLS/validate jobs provide defense in depth without blocking the autonomous loop.

**Alternatives rejected.** Required reviewers on `supabase-prod` or `main` PRs — rejected for AI CTO workflow. Relying on dry-run only without migration SQL scan — misses destructive DDL merged via squash. Skipping prod smoke on DB-only merges — misses broken prod after schema change.

**Affected docs.** `.github/workflows/ci-main-guard.yml`, `db-deploy.yml`, `prod-smoke.yml`; `scripts/check-migration-safety.mjs`; `docs/SSOT/ENVIRONMENTS.md`, `RELEASE_CHECKLIST.md`; `CLAUDE.md` §6.

## D-54 — Selective dev-branch CI parity (not 1:1 main copy) (2026-05-28)

**Date.** 2026-05-28

**Decision.** Harden `dev` with gates that catch defects **before** they reach production, without copying prod-only workflows. Add: (1) `.github/workflows/ci-dev-guard.yml` — migration destructive-op scan on every non-draft PR to `dev`; (2) `db-deploy` dry-run before apply for **both** `supabase-dev` and `supabase-prod`; (3) documented required status checks for GitHub branch protection on `dev` in `ENVIRONMENTS.md`. Explicitly **do not** add to `dev`: `ci-main-guard` release-source job, `prod-smoke`, or Edge Functions deploy to prod.

**Rationale.** Most quality CI already runs on `dev`. The gap was destructive migrations reaching `supabase-dev` before the main release scan, and dev DB apply without dry-run. Full main parity would slow the autonomous loop and add meaningless checks (e.g. enforcing `dev` as PR head on `dev`).

**Alternatives rejected.** 1:1 copy of all `main` branch protection — rejected (redundant + prod-only semantics). Migration safety only on `main` — rejected (too late for shared dev DB).

**Affected docs.** `.github/workflows/ci-dev-guard.yml`, `db-deploy.yml`, `app/package.json`; `docs/SSOT/ENVIRONMENTS.md`, `RELEASE_CHECKLIST.md`, `SETUP_GIT_AGENT.md`; plan `docs/superpowers/plans/2026-05-28-dev-branch-ci-hardening.md`.

## D-56 — Rides UI restored + V3.0 scope expansion (supersedes D-51) (2026-05-29)

**Date.** 2026-05-29

**Decision.** Reverse `D-51`'s UI-only hide: `RidesHubScreen` now renders the live in-app rides experience (feed + `RideCreateSheet` FAB + `RideFilterSheet`) as the primary view, with the NGO `DonationLinksList categorySlug="transport"` collapsed into a secondary section (FR-RIDE-023). Concurrently expand the spec to V3.0 by adding FR-RIDE-019 + FR-RIDE-023..045 covering: advanced publish (cargo / food / payment / requirements / intermediate stops), driver dashboard + passenger requests, active-ride lifecycle (`open → in_transit → completed_pending_rating → closed`), emergency button (`R-Rides-8`), ratings system (1..5 stars, ≤300 char comments), late-cancel penalty path (`R-Rides-5`/`R-Rides-6`), payment cap enforcement (`R-Rides-1`/`R-Rides-2`), driver license + insurance declarations (`R-Rides-3`/`R-Rides-4`), minor consent (`R-Rides-9`), edge-case catalog (`R-Rides-10` food spoilage + international ban + breakdown + no-show), and first cross-world hook (items post ↔ ride request, FR-RIDE-044).

**Rationale.** The backend hardened cycle (#414..#447) closed every gap that motivated the hide: cron-driven expiry, RPC-only writes with seat enforcement (`D-52`), realtime publication, visibility tiers honored end-to-end, templates schema + materializer, lifecycle chat messages, and notifications. Continuing to hide the UI now leaves the donation-world headline modality with no native flow while we have a fully-tested backend underneath. The V3.0 expansion is the natural product cadence — the PRD (`PRD_V2_NOT_FOR_MVP/donation_worlds/06_Rides.md`) was always the target; we shipped V2.0 as a minimum-viable foundation, hardened it, and now ascend to V3.0 with the full carpooling-for-good feature set: safety overlay, ratings, business rules, cross-world.

**Alternatives rejected.** Keep hidden + ship V3.0 entirely backend-only (defeats the purpose; users still see only NGO links). Ship UI without spec expansion (un-scoped scope creep; FR-IDs and ACs must lead implementation). Split V3.0 into 12 separate PRs (overhead vs reviewability tradeoff lands on one focused PR per logical chunk; spec lands first as the contract).

**Affected docs.** `docs/SSOT/spec/15_rides.md` (status flipped 🟡 V3.0 + new FRs); `apps/mobile/src/features/rides/screens/RidesHubScreen.tsx` (un-hide); `docs/SSOT/BACKLOG.md` V2.X line + new V3.X umbrella; migrations `0174`..`0182` (new); PRD `PRD_V2_NOT_FOR_MVP/donation_worlds/06_Rides.md` (existing — drives ACs).

---

### D-55 — E2E release gate on dev deployment (Web Playwright)

**Decision.** Production releases (`dev` → `main`) require green **CI — E2E dev / user journeys (P0)** against repository variable `DEV_WEB_URL` (`https://mvp-2-dev.up.railway.app`). Auth in CI uses a dedicated dev test user (`E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`): REST `grant_type=password`, then **session injection** into browser `localStorage` — not the `/sign-in` UI and not Google SSO. Feature PRs to `dev` do not require E2E (advisory `workflow_dispatch` / future push hook optional).

**Rationale.** Manual dev smoke in `RELEASE_CHECKLIST.md` does not scale for an AI-only dev workflow (`D-53`). Playwright is already used for bundle smoke; live-dev E2E catches RLS, env wiring, and deploy regressions that unit tests miss. Human operators may use Google only; API injection still validates authenticated journeys. Humans remain the final prod sanity check (~5 min), not the gate on every change.

**Alternatives rejected.** Gate every PR to `dev` on E2E — too slow/flaky early. Cypress — no advantage over existing Playwright. Google SSO in CI — brittle. Dev ghost-session / auto-sign-in in E2E bundle — not a human path. Playwright UI `/sign-in` — rejected when the form is unreliable for operators; product login UX remains a separate fix (`TD-104`).

**Affected docs.** `docs/SSOT/TESTING.md`, `RELEASE_CHECKLIST.md`, `ENVIRONMENTS.md`, `.github/workflows/ci-e2e-dev.yml`; plan `docs/superpowers/plans/2026-05-28-comprehensive-quality-automation.md`.

---

## D-57 — Reports require an active account (2026-06-01)

**Date.** 2026-06-01

**Decision.** `reports_insert_self` (RLS `WITH CHECK`) now also requires `is_active_member(auth.uid())`, so a `suspended_admin` / `suspended_for_false_reports` / `banned` user can no longer create a `Report` via the direct PostgREST path. This resolves the TD-88 fork in favour of gating (rather than documenting a deliberate exception). Migration `0183`.

**Rationale.** Consistent with the `0072` INSERT-active stance already enforced on posts / chats / messages, and with the moderation model itself — `suspended_for_false_reports` exists precisely to stop report abuse, so letting such a user keep filing reports is self-contradictory. `FR-MOD-001` has no AC requiring a non-active user to report. The mobile client already routes suspended/banned users to `/account-blocked` (`useEnforceAccountGate`), so this is server-side defense-in-depth, not an in-app flow change.

**Alternatives rejected.** Document a deliberate exception that lets banned users keep reporting (the other TD-88 fork) — no product or legal requirement for it, and it leaves a retaliatory-report vector open. Gate in the application layer only — the RLS `WITH CHECK` is the authoritative boundary against direct-API abuse.

**Affected docs.** `supabase/migrations/0183_reports_insert_requires_active_member.sql`, `supabase/tests/0183_reports_insert_active_member.sql`, `docs/SSOT/TECH_DEBT.md` (TD-88 closed).

---

## D-58 — Native Sign in with Apple via Supabase id-token exchange (2026-06-04)

**Date.** 2026-06-04

**Decision.** iOS Sign in with Apple (`FR-AUTH-004`) uses the **native** `expo-apple-authentication` sheet and exchanges the returned identity token for a Supabase session via `supabase.auth.signInWithIdToken({ provider: 'apple' })` with a raw nonce (Apple receives `SHA-256(nonce)`; Supabase verifies the raw value). This mirrors the native/web split chosen for Google in `D-33` — Apple does **not** go through the OAuth web / `exchangeCodeForSession` flow. Apple's "hide my email" relay is the canonical email (AC2, handled by Supabase); the first-authorization name is captured and persisted to `user_metadata.full_name` for onboarding prefill (AC3) via the existing `syncProfileMetadata`, never depended on afterward.

**Rationale.** App Store Guideline 4.8 mandates a genuine Sign in with Apple wherever a third-party SSO (Google) is offered; the prior iOS "Apple" button was a shell that routed to email sign-in (`TD-24`) and would have been rejected. The native sheet is the Apple-required UX and keeps the exchange in-process (no browser round-trip), reusing the existing `IAuthService` port + `toSession` mapping.

**Alternatives rejected.** OAuth web flow via `signInWithOAuth({ provider: 'apple' })` — extra browser round-trip and not the Apple-preferred native iOS UX. A bespoke table for the Apple name — unnecessary; `user_metadata` already feeds `AuthSession.displayName`.

**Operational dependency.** Going live requires the Apple provider configured in Supabase Auth (Service ID + key) and a native rebuild — the capability + config plugin are native, so an OTA update cannot add them. The `TD-24` Apple portion is closed in code; Phone OTP remains deferred.

**Affected docs.** `app/packages/application/src/auth/SignInWithApple.ts`, `app/packages/application/src/ports/IAuthService.ts`, `app/packages/infrastructure-supabase/src/auth/SupabaseAuthService.ts`, `app/apps/mobile/src/services/authComposition.ts`, `app/apps/mobile/app/(auth)/index.tsx`, `app/apps/mobile/app.json`, `docs/SSOT/spec/01_auth_and_onboarding.md` (FR-AUTH-004), `docs/SSOT/TECH_DEBT.md` (TD-24).

---

## D-59 — Single operated contact mailbox; drop the un-owned `support@karma.community` channel (2026-06-09)

**Date.** 2026-06-09

**Decision.** The only contact mailbox the project actually operates is `karmacommunity2.0@gmail.com`. The `support@karma.community` address referenced an un-owned/unconfigured domain — mail sent to it would silently bounce. The duplicate "מייל — ארגון" row in About → Contact (`AboutContactLinks.tsx`) is removed, leaving a single email row (relabeled "מייל"); `ABOUT_EMAIL_ORG` and the `contactEmailOrgLabel` i18n key are deleted. `FR-SETTINGS-009` AC1 is amended to point its fallback `mailto:` at the gmail address.

**Rationale.** A contact channel that silently fails is worse than no channel — the user believes they reached support. Two rows resolving to one mailbox (once the dead one is repointed) is also confusing. Removing the dead duplicate is the simplest user-coherent outcome and aligns with the standing "no automated outbound email; use `karmacommunity2.0@gmail.com` for contact-us" project policy. Closes the `support@karma.community` portion of `TD-99` / audit SET-6.

**Alternatives rejected.** Repointing `ABOUT_EMAIL_ORG` to the gmail — produces two identical email rows. Registering/operating the `karma.community` domain mailbox — out of scope for MVP and a PM/ops action, not a code change.

**Affected docs.** `app/apps/mobile/src/features/about-landing/aboutExternalLinks.ts`, `AboutContactLinks.tsx`, `app/apps/mobile/src/i18n/locales/he/modules/aboutContentUxRefreshPartB.ts`, `docs/SSOT/spec/11_settings.md` (FR-SETTINGS-009 AC1), `docs/SSOT/TECH_DEBT.md` (TD-99).

---

## D-60 — Org hierarchy uses a per-grant direct-manager edge (2026-06-16)

**Date.** 2026-06-16

**Decision.** The direct-manager link for the admin org hierarchy (FR-ADMIN-025) is a per-**grant** edge: `admin_role_grants.manager_grant_id` references another `grant_id`, not a per-user `manager_user_id`. A person who holds grants in several orgs can therefore sit under a different manager in each org, and the tree is built from the grant adjacency (`admin_org_tree` → `buildOrgForest`). Level = depth from the root; `super_admin` (platform root) = 0. Same-org rule: a grant may report to a grant in its own org or to a platform-scoped grant (e.g. `super_admin`); cycles are rejected server-side via `is_ancestor`.

**Rationale.** Roles are already per-grant and org-scoped (`scope_org_id`, migration 0173). A per-user manager could not express "Dana manages me in Org A, but Yossi manages me in Org B," which the multi-org model (D-40) requires. Anchoring the edge on the grant keeps the hierarchy consistent with the authority model (`can_grant_role`) and lets the same recursive helpers power both the tree and Phase 3 field-level privacy (`is_ancestor`).

**Alternatives rejected.** Per-user `manager_user_id` — simpler but cannot model multi-org membership and conflicts with org-scoped authority. Inferring hierarchy from role rank alone — ambiguous (many peers at a level) and cannot represent an explicit reporting line.

**Affected docs.** `docs/SSOT/spec/12_super_admin.md` (FR-ADMIN-024/025), migration `0203_admin_org_hierarchy.sql`, `docs/SSOT/BACKLOG.md` (P3.A-Tree.2).

---

## D-61 — GloWe frontend shares KC's Supabase backend; data namespaced `glowe_` (2026-06-25)

**Date.** 2026-06-25

**Decision.** The GloWe static frontend is added as an **additional** frontend (`app/apps/glowe-web`, design 1:1, not a replacement for the KC mobile app) wired to the **same** Supabase project as KC. Phase A shares **identity only**: a single Supabase Auth user (`auth.users`) backs both frontends ("log in once, same account in both"). GloWe-owned data lives in `public` under the `glowe_` table prefix (migration `0204`), kept deliberately isolated so it can later be migrated entity-by-entity onto KC's native tables and dropped as the products converge. Long-term intent (per PM): GloWe becomes the primary frontend riding on KC's infrastructure.

**Rationale.** GloWe was already a Supabase-aware static app with a backend adapter + local fallback, so the design ports for almost no work — the real cost is data wiring. Sharing identity first delivers the headline goal immediately with minimal, reversible change and zero risk to KC's native schema. The `glowe_` prefix avoids collision with `public.posts` / `public.users` without a PostgREST exposed-schema config change on the shared project, keeping the blast radius to the GloWe app + one additive migration.

**Alternatives rejected.** (a) Dedicated `glowe` Postgres schema — cleaner namespacing but needs the project's exposed-schemas list changed (shared-config blast radius) for no Phase-A benefit. (b) Rewriting GloWe in React Native inside the KC app — discards the 1:1 design and is weeks of work for the same identity outcome. (c) Mapping GloWe onto KC's native tables now — that is Phase B (shared content); entity models don't map 1:1, so it would block the quick win.

**Phase A follow-ons (2026-06-25, PM calls).**
- **Auth is Google-only.** Email/password sign-up and sign-in are hidden from the GloWe UI — both modals show a single "Continue with Google" CTA. The static email/password markup in GloWe's original page templates is overwritten at runtime (`upgradeLoginModal()` / `renderRegistrationWizard()` in `js/app.js`) so every page is consistently Google-only. The legacy email/password handlers and multi-step profile wizard remain in code but unrendered; profile completion moves to a post-sign-in step (Phase B).
- **Hosting: `/glowe` sub-path of the main domain** (not a separate domain). `app/scripts/web-postbuild.mjs` copies `app/apps/glowe-web/**` into `dist/glowe/` during `pnpm build:web`, so the Cloudflare Pages deploy serves GloWe at `<main-domain>/glowe` alongside the KC web app. GloWe uses relative paths, so it works unchanged; Cloudflare serves the real `/glowe/*` static files before the KC SPA catch-all. Same-domain hosting means OAuth `redirectTo` reuses KC's already-allowlisted origins. A dedicated GloWe domain remains possible later.

**Affected docs.** `docs/SSOT/spec/17_glowe_frontend.md` (FR-GLOWE-001), migration `0204_glowe_schema.sql`, `docs/SSOT/BACKLOG.md` (GLOWE.A/B/C), `app/apps/glowe-web/**`, `app/scripts/web-postbuild.mjs`.

---

## D-62 — GloWe session isolation from KC via dedicated Supabase storageKey + local signOut scope (2026-06-29)

**Date.** 2026-06-29

**Decision.** GloWe's Supabase client (`app/apps/glowe-web/js/backend.js`) now initialises with `auth.storageKey: 'glowe-auth-v1'` instead of the Supabase default `sb-<project-ref>-auth-token`. Sign-out uses `scope: 'local'` (clears only GloWe's own localStorage token without revoking the server-side refresh token). `logout()` in `auth.js` immediately calls `refreshPersonalAreaIfVisible()` so the Personal Area card disappears without waiting for the async `onAuthStateChange` cycle.

**Rationale.** GloWe and KC are both served under `karma-community.pages.dev` and connect to the same Supabase project. Without a distinct storage key they share `sb-<ref>-auth-token` in localStorage, meaning (a) a KC sign-in silently signs GloWe in, (b) a GloWe sign-out revokes the server-side token and also logs KC out, and (c) GloWe's Personal Area still displayed the cached profile after logout because the `onAuthStateChange` callback only refreshed it when `gloweUser` was still set at the time it fired (it wasn't, since `logout()` removed it synchronously first). Using `scope:'local'` is correct here: KC retains a fully working session because its refresh token is untouched; GloWe gets a clean sign-out.

**Alternatives rejected.** Global `signOut()` — the current default; revokes the shared Supabase session and silently kills KC. Separate Supabase project for GloWe — overkill for Phase A; sharing identity is intentional (D-61).

**Affected docs.** `app/apps/glowe-web/js/backend.js`, `app/apps/glowe-web/js/auth.js`, `docs/SSOT/spec/17_glowe_frontend.md`.

---

## D-63 — Cross-language UGC translation: demand-driven cache + zero-retention/DPA LLM-flash provider (2026-06-29)

**Date.** 2026-06-29

**Decision.** User-generated content is translated by an **LLM-flash** provider (Gemini Flash / GPT-4o-mini tier) called only from a Supabase Edge Function that holds the API key. The provider chosen for production **must be zero-retention and operate under a DPA** (no training on, or retention of, user content). Translations are **demand-driven (lazy)**: we materialize a `(content, field, target_language)` translation only when a real reader requests that language, then cache it in Postgres and serve all subsequent readers from cache. The LLM never runs on the read path (translate-ahead-of-read; cache hits are served inline as ordinary fields). Unlimited target languages are supported, but only the few actually demanded per item are paid for and stored.

**Rationale.** Eagerly translating every item into every language would bloat the database and the budget without bound. Lazy materialization makes cost scale with real demand (~2–5 languages per popular item), not with the language catalog. Caching turns repeat reads into ordinary field reads — fast and zero marginal cost. LLM-flash is ~100× cheaper than classic NMT at comparable quality for short UGC. Zero-retention/DPA is a hard privacy precondition for sending user content to a third party.

**Alternatives rejected.** Eager translate-all (cost + storage blowup); classic NMT API (lower quality on idiomatic short UGC, higher per-char cost); on-device translation (inconsistent quality, large model download, no shared cache).

**Affected docs.** `docs/superpowers/specs/2026-06-29-ugc-translation-design.md`, `docs/SSOT/spec/18_translation.md`, `docs/SSOT/BACKLOG.md` (TRANSLATE epic).

---

## D-64 — Posts auto-translate; chat translation opt-in with a sender-consent gate (2026-06-29)

**Date.** 2026-06-29

**Decision.** Public posts are **auto-translated** into the reader's preferred language on demand. **Chat translation is opt-in and default off.** When chat translation ships (last phase), a message is sent to the translation provider **only if its sender opted in** (sender-consent gate) — the reader's preference alone never causes a non-consenting sender's private message to be transmitted to a third party.

**Rationale.** Posts are public content authored for broad audiences, so translating them carries no additional privacy expectation. Private messages are different: sending a private message to an external provider without the author's consent would breach the sender's reasonable privacy expectation. Gating on the sender (not the reader) keeps control with the person whose words are being transmitted. Default-off avoids surprising users and keeps chat costs (the only component that scales linearly) opt-in.

**Alternatives rejected.** Auto-translate chat for everyone (privacy breach + unbounded cost); gate on reader consent (sends the sender's words without their consent); no chat translation at all (fails the full-accessibility goal).

**Affected docs.** `docs/superpowers/specs/2026-06-29-ugc-translation-design.md`, `docs/SSOT/spec/18_translation.md`.

---

## D-65 — UGC translation: free Gemini Flash now, paid DPA Flash before public launch; orchestration realized server-side (2026-06-29)

**Date.** 2026-06-29

**Decision.** Phase 1b ships translation on the **free** Gemini Flash tier so dev/testing costs nothing while the architecture proves out. The provider sits behind a one-method Deno seam (`TranslationProvider` + `selectProvider()` keyed on `TRANSLATION_PROVIDER`/`GEMINI_MODEL`), so the **D-63** requirement (zero-retention / no-training tier under a signed DPA) is satisfied later by an env/key change — **no code change** — and **must** be done before exposing translation to real users (tracked in `TECH_DEBT.md`). Because the cache table is **service-role-write-only** (Phase 1a) and the provider needs a secret key, the design's `TranslateAndCache` use case and `ITranslationProvider` port are **realized inside the `translate` Edge Function** (server-side), not as client-side application code; the app depends only on the new `ITranslationService` port.

**Rationale.** Translation orchestration cannot run client-side: persisting to the cache requires the service role, and the provider key must never reach the bundle. Keeping the orchestration in the Edge Function avoids introducing a Deno↔workspace bundling pattern while preserving Clean Architecture's inward dependency rule (the app depends on a port, not on infrastructure). Starting on the free tier removes all cost during the inert (pre-read-path) phases; the pluggable seam makes the privacy upgrade trivial.

**Alternatives rejected.** Client-side `TranslateAndCache` (impossible — can't hold the service role or the API key); LibreTranslate self-hosted from day one (privacy-clean but lower quality and ops overhead before it's even wired in); committing to the paid DPA tier immediately (needless cost while the feature is inert).

**Affected docs.** `docs/superpowers/specs/2026-06-29-ugc-translation-design.md`, `docs/SSOT/spec/18_translation.md`, `docs/SSOT/TECH_DEBT.md`.

---

## D-66 — GloWe Events are opportunities-with-a-date; RSVPs are applications (additive, no new tables) (2026-06-29)

**Date.** 2026-06-29

**Decision.** The GloWe event-publishing & RSVP feature is built as an **additive extension** of `glowe_opportunities` (FR-GLOWE-007) and `glowe_applications` (FR-GLOWE-012), not as a parallel `glowe_events` / `glowe_event_registrations` schema. An **Event** is an opportunity that carries `start_at` plus event metadata (`event_type`, `event_link`/`link_visibility`/`link_reveal_hours`, `capacity`, `registration_mode`, `status`); an **RSVP** is a `glowe_applications` row with registration columns (`submitted_email`/`phone`/`comment`, `waitlist_position`, `rejection_note`, `decided_at`/`decided_by`). A `BEFORE INSERT/UPDATE` status guard (`glowe_applications_guard_status`) prevents applicants from self-deciding their status; privileged organizer decisions go through `SECURITY DEFINER` RPCs that bypass the guard (mirrors the posts guard, migration `0199`). Schema foundation lands in migration `0211`.

**Rationale.** This honors the convergence direction (D-61): events ride the existing read/write/RLS/translation paths, so home and cards render an event as an opportunity with zero new plumbing, and entity-by-entity migration onto KC-native tables stays simple. It also resolves the conflict between the richer PM brainstorm (gated/open approval, capacity/waitlist, organizer mini-portal) and the member-experience design's thin "Event = validation profile over an opportunity": the rich features are delivered **incrementally as additive columns + RPCs**, never as a separate table.

**Alternatives rejected.** Separate `glowe_events` + `glowe_event_registrations` tables (duplicates the opportunity/application read, RLS, translation, and moderation paths; fights the convergence goal); keeping events a pure client-side validation profile with no schema (cannot express gated approval, capacity, link-reveal timing, or organizer decisions safely).

**Affected docs.** `docs/superpowers/specs/2026-06-29-glowe-event-rsvp-org-portal-design.md`, `docs/superpowers/specs/2026-06-29-glowe-member-experience-and-create-system-design.md`, `docs/SSOT/spec/17_glowe_frontend.md` (FR-GLOWE-007 AC9, FR-GLOWE-012 AC7).

---

## D-155 — Karma economy: self-only visibility, server-authoritative single-anchor, status-anchored closure

**Date.** 2026-06-08

**Decision.** Karma points are self-only at MVP (`FR-KARMA-008`). The number is visible only to the signed-in user on their own profile and stats screen; no public ranking, no counterparty visibility. The economy uses server-authoritative single-anchor awards (one trigger per event, no double-counting) backed by an append-only `karma_ledger`. Closure karma is anchored to the `posts.status` transition into/out of `closed_delivered`, not recipients-row existence (mirrors `items_given_count` in `0006`). The `estimated_value` slider feeds a `karma_value_bonus` at closure for givers only. Realtime updates patch the `['user-profile', userId]` React Query cache via own-row `postgres_changes` subscription.

**Rationale.** Self-only removes the incentive to farm karma (inflating a private number is pointless), allowing MVP launch without anti-collusion guards. Closure anchor on `posts.status` is causally correct (the status flip is the authoritative delivery signal) and robust to recipient-row deletion order. Single-anchor + append-and-sum is simpler and race-safer than a global unique key (which would abort the host transaction on a duplicate).

**Alternatives rejected.** Public karma from day 1 — requires anti-collusion first (see D-156). Global unique key on `karma_ledger` — aborts the parent transaction on race; partial unique index + on-conflict-do-nothing is safe. Anchoring closure to recipients-row — wrong causal signal; the row can precede or outlive the status change.

**Affected docs.** `supabase/migrations/0097–0100`, `packages/domain/src/karma.ts`, `apps/mobile/src/components/profile/KarmaBadge.tsx`, `docs/SSOT/spec/14_karma.md`.

---

## D-156 — Anti-collusion gate as hard precondition for karma public flip

**Date.** 2026-06-08

**Decision.** The karma public-flip (`FR-KARMA-008`) requires reciprocity/velocity anti-collusion caps before it can be enabled. Specifically: (a) a mutual-delivery cap (e.g., two users cannot be each other's closure giver and receiver more than N times in a rolling window), and (b) a velocity cap (max karma from any single counterparty per period). Without these, a colluding pair can farm +35/+15 per fake delivery cycle indefinitely, and public visibility would create a direct incentive to do so.

**Rationale.** At MVP, karma is self-only so there is no external incentive to inflate a private number. But once the number becomes publicly visible it becomes a trust signal, and fake-delivery farming would corrupt it rapidly. The caps must land before — or atomically with — the public flip. An in-app heads-up banner must also appear before a user's months-old private karma is first made publicly visible.

**Alternatives rejected.** Launch public karma without caps — creates an immediately exploitable attack surface once any user discovers the ₪1000 fake-give loop (+35 giver, +15 receiver, repeat). Trust-only model — MVP community is small and trust is feasible today, but does not scale to hundreds of users.

**Affected docs.** `docs/SSOT/spec/14_karma.md` FR-KARMA-008; `docs/SSOT/TECH_DEBT.md` (TD-166 anti-collusion watch item).

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 4.5 | 2026-06-29 | Added `D-66` (GloWe Events are opportunities-with-a-date and RSVPs are applications — additive columns + status guard in migration `0211`, no `glowe_events`/`glowe_event_registrations` tables; reconciles the rich event brainstorm with the convergence model; `FR-GLOWE-007` AC9, `FR-GLOWE-012` AC7). |
| 4.4 | 2026-06-29 | Added `D-65` (UGC translation Phase 1b: free Gemini Flash now + pluggable provider seam → paid DPA Flash before public launch is env-only; `TranslateAndCache`/`ITranslationProvider` realized server-side in the `translate` Edge Function; app depends on new `ITranslationService` port). Recorded alongside `D-63`/`D-64` (translation epic). |
| 4.3 | 2026-06-29 | Added `D-62` (GloWe session isolation: `storageKey:'glowe-auth-v1'` + `scope:'local'` signOut + immediate Personal Area refresh on logout; fixes profile-still-visible-after-logout bug). |
| 4.2 | 2026-06-25 | Added `D-61` (GloWe added as an additional frontend on KC's shared Supabase backend; Phase A shares Auth identity only; GloWe data namespaced `glowe_`, migration `0204`; `FR-GLOWE-001`, `spec/17_glowe_frontend.md`). |
| 4.1 | 2026-06-08 | Added `D-155` (karma economy: self-only at MVP, single-anchor awards, status-anchored closure, own-row Realtime). Added `D-156` (anti-collusion caps as hard precondition for karma public flip; `FR-KARMA-008`). |
| 4.0 | 2026-06-04 | Added `D-58` (native Sign in with Apple via `signInWithIdToken` + raw nonce; `FR-AUTH-004` implemented; mirrors `D-33`; Apple portion of `TD-24` closed in code; live flow pends Supabase Apple provider config). |
| 3.9 | 2026-06-01 | Added `D-57` (reports require an active account — `reports_insert_self` gated on `is_active_member`; migration `0183`; closes `TD-88`). |
| 3.8 | 2026-05-29 | Added `D-56` (rides UI restored + V3.0 scope: FR-RIDE-019 + FR-RIDE-023..045 — advanced publish, dashboard, active-ride + emergency, ratings, business rules, cross-world). Supersedes `D-51`. |
| 3.7 | 2026-05-28 | Added `D-55` (Playwright P0 E2E on `DEV_WEB_URL` gates `dev` → `main`; email/password CI auth; `TESTING.md`). |
| 3.6 | 2026-05-28 | Added `D-54` (selective dev CI hardening: `ci-dev-guard`, dev+prod DB dry-run, dev branch-protection doc; not 1:1 main copy). |
| 3.5 | 2026-05-28 | Added `D-53` (automated `main` prod gates: dev→main PR enforcement, migration safety scan, prod DB dry-run before apply, expanded prod smoke; no human deploy approvers). |
| 3.4 | 2026-05-28 | Added `D-51` (rides UI temporarily hidden, backend kept live and hardening). Added `D-52` (rides participants: RPC-only writes, seat enforcement at approve time under `FOR UPDATE`; FR-RIDE-011; migration `0139`). |
| 3.3 | 2026-05-26 | Added `D-50` (anonymous public market research as separate spec domain `16_public_research.md`; PII-isolated contact storage; separate migration `0131`; FR-RESEARCH-001..003). |
| 3.2 | 2026-05-26 | Added `D-49` (server-driven surveys via Studio publish, mirrors legal-documents pattern; FR-SETTINGS-015..017; migration `0130`). |
| 3.1 | 2026-05-26 | Added `D-41` (support tickets vs moderation reports stay on separate surfaces; closes TD-94 sub-item (1) as intentional). Added `D-48` (Sentry as single observability sink for mobile + Edge Functions). |
| 3.0 | 2026-05-25 | Added `D-40` (Admin Portal foundation A0 — RBAC primitives + `(admin)` route group; closes TD-95 via partial unique index; A1..A4 follow as separate sub-projects). |
| 2.9 | 2026-05-24 | Added `D-38` (share-post OG meta served by Railway Hono server; eliminates Supabase-domain leak from share URL and redirect chain; replaces `serve dist --single`). |
| 2.9 | 2026-05-24 | Added `D-38` (profile display: `public.users` canonical; sync Auth `user_metadata` on write + cold-start reconcile; My Profile no JWT fallback). |
| 2.8 | 2026-05-22 | Added `D-RESP-001` (desktop adaptation strategy: adapted side rail + 280px aside panel, inbox chat, split-screen auth, 4-tier breakpoints, `SHELL_V2_ENABLED` flag, five-PR delivery `FR-RESP-001..005`). |
| 2.7 | 2026-05-22 | Added `D-37` (auto `db-deploy` to `supabase-prod` on `main` push when migration paths change; manual dispatch retained). |
| 2.6 | 2026-05-18 | Added `D-36` (canonical streets from data.gov.il package 321; zero filtering, free-text fallback, city-dependent picker with onboarding progressive disclosure). |
| 2.6 | 2026-06-09 | Added `D-59` (single operated contact mailbox; drop un-owned `support@karma.community`; closes TD-99 SET-6 portion). |
| 2.5 | 2026-05-17 | Added `D-35` (`posts.status_before_admin_removal` captured by `admin_remove_post`; `/profile/removed` splits by prior status). |
| 2.4 | 2026-05-17 | Added `D-34` (closed-post Hide fans out to `posts.visibility` + owner's `surface_visibility`; FR-POST-009 + FR-PROFILE-001 AC4 clarified). |
| 2.3 | 2026-05-17 | Added `D-33` (web Google sign-in via same-tab redirect; bottom-sheet UX deferred to native via Google Sign-In SDK). |
| 2.2 | 2026-05-17 | Added `D-32` (free visibility changes after publish; supersedes legacy upgrade-only `FR-POST-009` trigger); migration `0093`. |
| 2.1 | 2026-05-16 | Added `D-31` (`hide_from_counterparty` third-party-on-partner-surface semantics); refined `D-30` + `D-28` hide-flag wording. |
| 2.0 | 2026-05-16 | Added `D-30` (MVP post-detail privacy: audience + counterparty mask; `FR-POST-021`, migration `0092`). |
| 1.9 | 2026-05-16 | Added `D-29` (saved-posts list filters by current `is_post_visible_to`; `FR-POST-022`, `FR-PROFILE-016`). |
| 0.1 | 2026-05-05 | Initial decisions log; D-1..D-15. |
| 0.2 | 2026-05-09 | Added `D-16` (Reintroduce Donations and Search tabs in MVP). |
| 0.3 | 2026-05-11 | Added `EXEC-7` (closed posts visible on other-user profile — reverses PRD §3.2.2). |
| 0.4 | 2026-05-11 | Added `EXEC-8` (P1.2 — distance-aware feed via cities-geo Haversine + Home Feed loses its search bar + active-filter chip; Universal Search tab supersedes `FR-FEED-016` placeholder). |
| 0.5 | 2026-05-11 | Added `EXEC-9` (Block / unblock removed from MVP scope; supersedes `D-11`; `FR-MOD-003/004/009` deprecated; `FR-MOD-010` relocated to P1.3). |
| 0.6 | 2026-05-12 | Added `D-17` (admin report-bubble snapshot privacy floor; TD-59 + TD-60 deferred). |
| 0.7 | 2026-05-12 | Added `D-18` (owner delete `deleted_no_recipient` when no recipient row). |
| 0.8 | 2026-05-12 | `D-18` follow-up: orphan `closed_delivered` after recipient user CASCADE (`0053`). |
| 0.9 | 2026-05-13 | Added `D-19` (closed posts surface on both publisher and respondent profiles; reverses D-7 respondent-privacy carve-out). |
| 1.0 | 2026-05-14 | Added `EXEC-10` (push notifications outbox + database-webhook + Edge Function pattern; P1.5 complete). |
| 1.1 | 2026-05-14 | Added `D-20` (MVP email verification at the auth boundary; supersedes `0046`). |
| 1.2 | 2026-05-15 | `D-20` follow-up: migration `0068` closes the phone-OTP / provider-aware gap left by `0067`. Trigger now watches both `email_confirmed_at` and `phone_confirmed_at`; OAuth providers (google/apple) skip the transient `pending_verification` state. |
| 1.3 | 2026-05-16 | Added `D-22` (auth errors must not enumerate registered emails; closes `TD-69`). |
| 1.4 | 2026-05-16 | Added `D-23` (display strings live in the mobile composition root; `INFRA-I18N-PROD-CODE` ✅). |
| 1.5 | 2026-05-16 | Added `D-24` (bilingual MVP `he`+`en`; locale-backed copy contract includes migrations/SQL — implementation deferred). |
| 1.6 | 2026-05-16 | Added `D-25` (`users.display_name`/`city`/`city_name` nullable; migration `0084` removes the Hebrew defaults — first concrete delivery against `D-24`). |
| 1.7 | 2026-05-16 | Added `D-26` (Post visibility vs per-actor identity on posts; `FR-POST-021`) and `D-27` (About copy: transparency vs optional anonymity). |
| 1.8 | 2026-05-16 | Added `D-28` (per-participant `surface_visibility` for closed posts; supersedes `D-19`'s third-party visibility clause in part and refines `D-26`; rewrites `FR-POST-021`; migration `0085`). |
