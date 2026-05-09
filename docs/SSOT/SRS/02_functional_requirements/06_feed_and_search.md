# 2.6 Feed, Search & Filters

[← back to Part II index](./README.md)

Prefix: `FR-FEED-*`

---

## Scope

The Home Feed and its discovery affordances:

- Composition rules (which posts appear, in what order).
- Free-text search.
- Filter modal and persisted state across sessions.
- Sort options.
- Cold-start fallback (empty city → all-Israel).
- Guest preview behavior.

Non-goals (out of scope):

- Algorithmic personalization (explicitly excluded by `R-MVP-Profile-7`).
- "Friends-only" toggle (excluded by `R-MVP-Profile-8`).
- Post likes / comments / sharing (excluded — see `PRD_MVP/08_Out_of_Scope_and_Future.md`).

---

## FR-FEED-001 — Default feed composition

**Description.**
The Home Feed shows public posts that the viewer is allowed to see, sorted in reverse-chronological order.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.1, `05_Screen_UI_Mapping.md` §2.1.
- Constraints: `R-MVP-Profile-7`.

**Acceptance Criteria.**
- AC1. The query selects posts where:
   - `Post.status = open`, **and**
   - the viewer's visibility predicate from `FR-FOLLOW-012` permits read access, **and**
   - the post's owner is **not** blocked by the viewer and **does not** block the viewer (`FR-MOD-009`).
- AC2. Default ordering: `created_at DESC`.
- AC3. There is **no** algorithmic boost based on follow relationships, popularity, or category in MVP.
- AC4. Pagination: 20 posts per page; infinite scroll on mobile, "Load more" button on Web.

**Related.** Screens: 2.1 · Domain: `Post`, `FollowEdge`, `Block`.

---

## FR-FEED-002 — Feed card composition

**Description.**
What each feed card displays.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.2, `05_Screen_UI_Mapping.md` §2.1.

**Acceptance Criteria.**
- AC1. Always shown: image OR category icon (for image-less Request posts), type badge `🎁`/`🔍`, title, 2-line truncated description with "Read more" affordance, owner row (avatar + name), location string per `Post.location_display_level`, relative timestamp.
- AC2. Conditional: `👥 Followers only` badge (when applicable to the viewer-owner pair), `🔒 Closed — delivered` badge (only when the user enabled "Include closed posts" filter).
- AC3. **Never shown in the feed**: posts at visibility `OnlyMe` (regardless of whether the viewer is the owner). Owner sees them in their profile only (`FR-PROFILE-001`).
- AC4. Quick "💬 Send Message" icon visible on cards owned by other users (`FR-POST-018`).

**Related.** Screens: 2.1.

---

## FR-FEED-003 — Free-text search

**Description.**
A search bar at the top of the feed performs a multi-field text match.

**Source.**
- PRD: `03_Core_Features.md` §3.3.2.

**Acceptance Criteria.**
- AC1. Search fields: `title`, `description`, `category` label, owner `display_name`.
- AC2. Matching is case-insensitive and uses Postgres' built-in Hebrew-aware full-text indexing (config `simple` plus a normalized lowercase index for substring fallbacks).
- AC3. The query debounces on the client at 250 ms.
- AC4. Empty search restores the unfiltered (but still otherwise filtered) feed.
- AC5. Results retain the same pagination contract as the default feed (20 per page).

**Edge Cases.**
- Hebrew niqqud and unusual characters are normalized server-side before matching.
- Search alone does not override the visibility predicate; protected posts remain hidden.

**Related.** Domain: `Post`.

---

## FR-FEED-004 — Filter modal

**Description.**
A bottom-sheet modal with combinable filters.

**Source.**
- PRD: `03_Core_Features.md` §3.3.2, `05_Screen_UI_Mapping.md` §2.2.

**Acceptance Criteria.**
- AC1. Filter set:
   - **Type**: `All` / `Givers only` / `Requesters only`.
   - **Category**: multi-select from the canonical 10 categories.
   - **Item condition**: applies only when "Givers only" is selected (`New` / `LikeNew` / `Good` / `Fair`).
   - **City**: dropdown with `All cities` option.
   - **Include closed posts**: toggle (default off).
   - **Sort**: `Newest first` (default) / `Closest geographically` (by city match relative to the viewer's registered city).
- AC2. Filters compose with AND semantics.
- AC3. "Apply" button updates the feed; "Clear all" resets to defaults but does not change persistence (next visit starts fresh only after explicit clear).

**Related.** Screens: 2.2.

---

## FR-FEED-005 — Persisted filter & search state

**Description.**
The user's current filters and search are persisted across sessions.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.3.
- Constraints: `R-MVP-Privacy-8`.

**Acceptance Criteria.**
- AC1. Filter state and search text are persisted to local storage on change, scoped per signed-in user.
- AC2. On launch, the feed restores the persisted state and shows a chip near the top: *"X filters active · Clear all"*.
- AC3. Tapping "Clear all" resets state and persists the cleared state.
- AC4. The persistence does **not** include the cold-start fallback flag (`FR-FEED-007`); that flag is computed each session.

**Related.** Domain: `FeedFilterState` (local).

---

## FR-FEED-006 — Sort: closest geographically

**Description.**
The "Closest geographically" sort option ranks posts by string equality with the viewer's city, with secondary recency.

**Source.**
- PRD: `03_Core_Features.md` §3.3.2 (note about geocoding).

**Acceptance Criteria.**
- AC1. Posts whose city equals the viewer's city are ranked higher than others; within each tier, sort by `created_at DESC`.
- AC2. **No** geocoding to lat/lon is performed in MVP.
- AC3. If the viewer has not set a city (skipped onboarding), the sort behaves as `Newest first`.

**Related.** Domain: `User.city`, `Post.city`.

---

## FR-FEED-007 — Cold-start fallback (empty-city → all-Israel)

**Description.**
When the viewer's city has fewer than 3 currently-open visible posts, the feed expands to nationwide and announces the change.

**Source.**
- Decisions: `D-8`.
- PRD: (gap, decision in this SRS).

**Acceptance Criteria.**
- AC1. The fallback engages on every feed query (not session-once); it re-evaluates as the user changes cities or as more posts arrive.
- AC2. When the fallback is active, a banner is shown above the first card: *"Not many posts in [user city] yet — showing posts across Israel."*
- AC3. A clear chip in the banner ("Show only [user city]") forces back to the city-restricted view, even if it is empty; the chip is sticky for that session.
- AC4. Fallback is **not** applied if the user has explicitly applied a city filter through the Filter modal — the user's explicit choice wins.
- AC5. The fallback emits an analytics event `feed_fallback_applied` for KPI investigation.

**Related.** Domain: `Feed`, `User.city`.

---

## FR-FEED-008 — Empty feed (warm)

**Description.**
When the feed query returns zero posts after applying all filters and the cold-start fallback, a warm empty state is shown.

**Source.**
- Decisions: `D-15`.

**Acceptance Criteria.**
- AC1. Copy: *"No posts match your filters yet. Try clearing the filters or be the first to share something."*
- AC2. Two CTAs: "Clear filters" → equivalent to `FR-FEED-005`'s clear-all; "Share something" → `FR-POST-001`.
- AC3. The empty state is fully accessible (label, focusable buttons) per `NFR-A11Y-002`.

**Related.** Domain: `FeedFilterState`.

---

## FR-FEED-009 — Realtime feed freshness

**Description.**
A new public post created elsewhere appears in the feed without manual refresh, within the freshness budget.

**Source.**
- PRD: (implied; UX expectation for an active community).

**Acceptance Criteria.**
- AC1. New posts visible to the viewer surface within `NFR-PERF-005` (≤2s end-to-end at p95).
- AC2. The newly arrived post(s) are not silently injected into the user's scroll position; instead, a "↑ N new posts" banner appears at the top until the user taps it or scrolls to the top.
- AC3. The realtime channel disconnects when the screen is backgrounded for >60 seconds and reconnects on foreground; on reconnect, a single REST query reconciles missed posts.

**Related.** Domain: `Feed`, `RealtimeChannel`.

---

## FR-FEED-010 — Pull-to-refresh (mobile) and refresh button (Web)

**Description.**
Manual refresh affordances coexist with realtime updates.

**Source.**
- PRD: (UX baseline for mobile).

**Acceptance Criteria.**
- AC1. Mobile: standard pull-to-refresh gesture re-queries the feed.
- AC2. Web: a refresh button is provided next to the search bar; keyboard shortcut `R` (configurable in `06_cross_cutting/03_i18n_rtl.md`) triggers it.
- AC3. Refresh resets the pagination cursor to the top.

**Related.** Domain: `Feed`.

---

## FR-FEED-011 — Search & filters within other contexts

**Description.**
The Followers / Following lists (`FR-PROFILE-009`) and the Inbox (`FR-CHAT-001`) carry their own search bars; they are scoped and do **not** share state with the feed.

**Source.**
- PRD: `05_Screen_UI_Mapping.md` §3.4, §4.1.

**Acceptance Criteria.**
- AC1. Each list's search is isolated.
- AC2. There is no global search in MVP.

---

## FR-FEED-012 — Guest feed preview

**Description.**
The guest feed (1.7) is a constrained sub-set of the public feed.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.4.
- Constraints: `R-MVP-Core-2`.

**Acceptance Criteria.**
- AC1. Returns the 3 most recent **`Public`-visibility** posts across all of Israel.
- AC2. Quick-message, profile navigation, post detail, and filters are all blocked; tap targets surface the sign-up overlay (`FR-AUTH-014`).
- AC3. Realtime updates are disabled for guests; a guest sees a static snapshot until they sign up.

**Related.** Screens: 1.7.

---

## FR-FEED-013 — Active-filters chip

**Description.**
A chip near the top of the feed reflects whether any filters or search are active.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.3.

**Acceptance Criteria.**
- AC1. The chip is visible if and only if at least one filter is active or the search box is non-empty.
- AC2. Tapping the chip opens the Filter modal.
- AC3. The chip displays the count of active filters and includes a "Clear all" button.

**Related.** Screens: 2.1.

---

## FR-FEED-014 — Active-community counter

**Description.**
The guest overlay and the feed empty state may include an "X active posts in the community" counter.

**Source.**
- PRD: `03_Core_Features.md` §3.3.1.4.

**Acceptance Criteria.**
- AC1. Counter is computed as the number of `open` `Public`-visibility posts system-wide, refreshed every 60 seconds.
- AC2. The number is displayed only as an integer; never a fraction or percentage.
- AC3. The counter is exposed via a single read endpoint and cached at the edge.

**Related.** Domain: `CommunityStats`.

---

## FR-FEED-016 — Search hub placeholder

**Description.**
The dedicated Search tab in the bottom bar opens a placeholder screen that explicitly tells the user where search is available today (the Home Feed). The universal-search engine itself — across people, items, and future donation categories — is deferred to a later milestone (`FR-FEED-017+`, to be specced when prioritized).

**Source.**
- Design spec: [`docs/superpowers/specs/2026-05-09-donations-and-search-tabs-design.md`](../../../superpowers/specs/2026-05-09-donations-and-search-tabs-design.md) §5.1.
- Decisions: `D-16`.

**Acceptance Criteria.**
- AC1. The Search tab (`🔍`) in the bottom bar mounts a screen at `/(tabs)/search`.
- AC2. The screen shows a header *"חיפוש אוניברסלי בקרוב"* and body *"בנתיים, חיפוש פוסטים זמין ישירות בפיד הראשי."*
- AC3. A secondary CTA labeled *"עבור לפיד הראשי"* navigates to `/(tabs)` (Home Feed).
- AC4. **No active search input** is rendered. The screen must not imply that a search will execute, since the engine is not yet wired.
- AC5. The screen is fully accessible per `NFR-A11Y-002`.
- AC6. The in-feed search (`FR-FEED-003`) and Filter Modal (`FR-FEED-004`) are unchanged and remain the canonical search surface for posts in MVP.

**Related.** Screens: 2.5 · `FR-FEED-003`, `FR-FEED-004`.

---

## FR-FEED-015 — First-post nudge card

**Description.**
A dismissible card on the feed prompts users who have never created a post.

**Source.**
- Decisions: `D-9`.

**Acceptance Criteria.**
- AC1. The card appears at the top of the feed when `User.posts_created_total = 0` and `User.first_post_nudge_dismissed = false`.
- AC2. Copy: *"Got an item to give away? Or looking for something? Share your first post."* Two CTAs: "Share an item" and "I'll do it later".
- AC3. "I'll do it later" sets `User.first_post_nudge_dismissed = true` and the card disappears for the remainder of the user's lifetime.
- AC4. Creating a first post implicitly hides the card (no further dismissal flag needed).

**Related.** Domain: `User.first_post_nudge_dismissed`.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial draft from PRD §3.3.1–§3.3.2 and Decisions D-8, D-9, D-15. |
| 0.2 | 2026-05-09 | Added `FR-FEED-016` (Search hub placeholder) per `D-16`. |
