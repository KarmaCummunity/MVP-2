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

## D-26 — Post visibility vs per-actor identity on posts (2026-05-16)

**Decision.** Keep `Post.visibility` / `is_post_visible_to` as the **community audience** control for post listings (`FR-POST-009`). Add a separate per-`(post_id, user_id)` policy (`post_actor_identity`) for **how that user's identity is rendered on post surfaces** (feed cards, post detail author/recipient rows) including the **`hide_from_counterparty` third-party mask on the counterparty's profile surface (`D-31`)** and the coupling rule: when the post is `OnlyMe` for the owner, the owner is always anonymous to the counterparty on those surfaces. **Profiles and chat participants** stay real-user shells; chat anchors remain **open posts only** (existing anchor lifecycle).

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

**Decision.** The post-detail privacy block is **audience-first**: for **open** posts the owner edits `posts.visibility` (`FR-POST-003` / `FR-POST-009`); for **closed** posts each participant edits their own `surface_visibility` (`D-28`). The **only** user-facing identity toggle in MVP besides audience is `hide_from_counterparty`, whose **product semantics** are defined in **`D-31`** (third parties on the counterparty's closed-post profile — not hiding from the counterparty; see also `D-30` supersession note). Per-participant `identity_visibility` (`FollowersOnly` / `Hidden` chrome) is **not** exposed in the mobile UI; client upserts normalize `identity_visibility` to `Public`, and migration `0092_post_actor_identity_public_chrome.sql` clears legacy non-`Public` rows.

**Rationale.** The prior three-level control duplicated the visibility affordance (🌍/👥/🔒) but changed chrome, not audience — users consistently misread it as “who sees the post”. Collapsing MVP UX to audience + one identity toggle matches the mental model while preserving `D-28` closed-post surface rules and `D-26` post-chrome rules. **`D-31`** corrects the original reading of `hide_from_counterparty` as “hide from the partner” — partners already recognize each other in chat; the risk is **other users** browsing the partner's profile.

**Supersedes (in part).** MVP UX scope of the `identity_visibility` axis described in `D-28`'s addendum table; server columns and projection hooks remain for future refinement / surface-coupling. **`D-30`'s** prior sentence that described `hide_from_counterparty` as hiding from the counterparty on post chrome is superseded by **`D-31`**.

**Affected docs.** `spec/04_posts.md` (`FR-POST-021`); `docs/superpowers/specs/2026-05-16-post-actor-privacy-design.md` (PM revision note); migration `0092_post_actor_identity_public_chrome.sql`; mobile `PostActorPrivacyBar`, `VisibilityChooser`.

---

## D-31 — `hide_from_counterparty` targets third parties on the counterparty's profile surface (2026-05-16)

**Decision.** The boolean `hide_from_counterparty` on `public.post_actor_identity` means: when **true**, **non-participant** viewers who consume the post in the **counterparty's** closed-post **profile** context (the "פוסטים סגורים" grid hosted on the counterparty's user id) see **anonymous** post chrome for this actor. The **counterparty** always sees the actor's **full** identity on post chrome in that context (they already recognize the actor from **chat**, where identity remains real). Neutral entry points (home feed, post detail without a `fromProfile` / listing-host hint, etc.) do **not** apply this flag until a listing-host context is supplied (`D-30` MVP scope: mobile passes the host when navigating from closed-post profile cards).

**Rationale.** The prior interpretation ("hide from the partner on the post") duplicated chat reality and confused Hebrew product copy. The actual privacy need is **strangers** discovering the relationship via **the partner's profile shell**, not hiding from the partner themselves.

**Refines.** `D-28` / `D-30` wording on what `hide_from_counterparty` does; column name stays for migration compatibility.

**Affected docs.** `spec/04_posts.md` (`FR-POST-021` AC4/AC7, Description); `spec/02_profile_and_privacy.md` (cross-reference); `packages/domain/src/postActorIdentity.ts`; `applyPostActorIdentityProjectionBatch` options; mobile closed-post navigation query `fromProfile`.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
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
