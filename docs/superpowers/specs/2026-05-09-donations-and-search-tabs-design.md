# Donations & Search Tabs — Design Spec

| Field | Value |
| ----- | ----- |
| **Date** | 2026-05-09 |
| **Author** | Engineering (agent) |
| **Status** | Approved — ready for implementation plan |
| **Decision** | `D-16` (see [`SRS/appendices/C_decisions_log.md`](../../SSOT/SRS/appendices/C_decisions_log.md)) |
| **Related FRs** | `FR-DONATE-001..005`, `FR-FEED-016`, `FR-CHAT-008` (extended) |
| **Affected screens** | New: `2.5 Search`, `2.6 Donations Hub`, `2.7 Donations · Money`, `2.8 Donations · Time` |

---

## 1. Context & Motivation

The MVP shipped with a 3-tab bottom bar (Profile · Plus · Home). The PRD §6.4 explicitly **excluded** dedicated `Donations` and `Search` tabs from MVP, on the grounds that:

1. There were no donation worlds beyond items.
2. Search was integrated into the home feed.

The product owner has now decided to **reintroduce both tabs**, because:

- A Donations hub is the spine of the product narrative — items are only one of three donation modalities (items / time / money), and external partner integrations (`jgive`, `Lev Echad`) need a permanent home.
- Search will eventually become a universal search across people, items, and future donation categories. For MVP it ships as a placeholder; the universal-search engine itself is deferred to end-of-MVP (P2).

This spec captures the navigation change, the four new screens, and the contract changes needed to make the **Time** sub-screen route a volunteer message into the existing `FR-CHAT-007` Super Admin support thread.

---

## 2. Scope

### In scope (this spec)

1. Bottom bar: 3 → 5 tabs.
2. Search tab: placeholder screen with a CTA back to the feed.
3. Donations Hub: 3 tiles (Items, Time, Money).
4. Money sub-screen: copy + external link to `jgive.com`.
5. Time sub-screen: copy + external link to `we-me.app` + inline volunteer-message composer that opens the FR-CHAT-007 admin thread.
6. Guest behavior: Donations tab visible to guests; external links work; the Time composer is auth-gated.
7. Doc updates: SRS (new file `13_donations.md` + amendments to `06_feed_and_search.md` and `07_chat.md`), PRD (§5.1, §5.2, §6.1, §6.4), Project Status, Decisions Log, Traceability Matrix.

### Out of scope (deferred)

- The universal-search engine (`FR-FEED-017`+ to be specced when prioritized; see §10).
- Server-side filtering or recommendations on the Donations hub.
- Analytics dashboards for partner-link click-through.
- Per-organization volunteer dispatch beyond a single admin thread.

---

## 3. Non-Goals

- No new BE schema changes for the hub itself; everything is FE wiring.
- No change to the existing in-feed search (`FR-FEED-003`/`FR-FEED-004`). It remains as is.
- No change to the existing FR-CHAT-007 support-thread semantics; the Time composer is a *new entry-point*, not a new thread type.
- No new chat-state machine or system-message variant.

---

## 4. Architecture Overview

### 4.1 Routing (expo-router)

```
app/(tabs)/
├── _layout.tsx          (tabs/no-labels, RTL: Profile · Search · Plus · Donations · Home)
├── index.tsx            (Home — unchanged)
├── create.tsx           (Plus — unchanged)
├── profile.tsx          (Profile — unchanged)
├── search.tsx           (NEW — placeholder)
├── donations/
│   ├── _layout.tsx      (NEW — Stack within tab)
│   ├── index.tsx        (NEW — Hub: 3 tiles)
│   ├── money.tsx        (NEW — Coming-soon + jgive link)
│   └── time.tsx         (NEW — Coming-soon + we-me link + volunteer composer)
```

The global `<TabBar />` component (`app/apps/mobile/src/components/TabBar.tsx`) and the `(tabs)/_layout.tsx` Tabs definition both grow from 3 → 5 entries in lockstep.

### 4.2 Layer responsibilities

| Layer | Responsibility |
| ----- | -------------- |
| **`packages/ui`** | New presentational components: `DonationTile`, `ExternalLinkButton`, `VolunteerMessageComposer`. Reuse existing `colors`, `shadow`, `Button`. |
| **`apps/mobile/app/(tabs)/...`** | Route components — composition only, no business logic. |
| **`packages/application/chat`** | `sendVolunteerMessageToAdmin(text)` use-case — wraps `FR-CHAT-007`'s admin-resolve + send-first-message semantics. Reuses `IChatRepository` / `IUserRepository` ports already required for chat domain. |
| **`packages/infrastructure-supabase`** | No new adapters needed; the volunteer composer reuses the same ports/repos that `FR-CHAT-007` consumes. |

### 4.3 External link strategy

- Use `Linking.openURL(url)` from React Native (works on iOS / Android / Web).
- No in-app `WebView`. Simpler, fewer side-effects with partner cookies/analytics.
- URLs are constants in `apps/mobile/src/config/external-links.ts` (so they can be updated without hunting through screens).

### 4.4 Guest-mode handling

The current guest architecture is route-isolated: guests live in `(guest)/feed` and the global TabBar is **not** rendered for them (per `_layout.tsx` `showTabBar` condition). This MVP-core spec keeps that invariant — **Donations is auth-required**:

- The 5-tab bottom bar (including Donations + Search) is only shown post-auth.
- A guest who tries to deep-link to `/donations`, `/donations/money`, `/donations/time`, or `/search` is redirected to `1.2 Auth`, consistent with PRD §6.8.1 ("כל ניסיון לגישה למסך אחר (Deep Link, רענון URL) → הפניה ל-1.2 Auth").
- The earlier brainstorm discussed allowing guests to view Donations sub-screens with the external links working — that requires a guest-scope mirror (`(guest)/donations/...`) which is **out of scope for this PR**. Captured as `TD-112` (FE) for future evaluation.

This is a small deliberate scope reduction relative to the brainstorm. Signaling now so the user can override before implementation.

---

## 5. Screen Specifications

### 5.1 Screen 2.5 — Search (Placeholder)

**Route.** `/(tabs)/search`

**Purpose.** Reserve the search tab in the bottom bar and tell the user where to search today. The universal-search engine will land later (see §10).

**Layout (top → bottom).**

1. Top bar: title "🔍 חיפוש" (no icons; inherits from screen layout).
2. Centered illustration / large `🔍` icon.
3. Header: *"חיפוש אוניברסלי בקרוב"*.
4. Body: *"בנתיים, חיפוש פוסטים זמין ישירות בפיד הראשי."*
5. Secondary button: *"עבור לפיד הראשי"* → `router.push('/(tabs)')`.

**Acceptance.**

- AC1. The screen mounts when the user taps the 🔍 tab; back-navigation returns to the previous tab (default expo-router tab behavior).
- AC2. The CTA button is keyboard-focusable and announces its label per `NFR-A11Y-002`.
- AC3. **No active search input** — the design must not imply that a search will execute, since the engine is not yet wired.

---

### 5.2 Screen 2.6 — Donations Hub

**Route.** `/(tabs)/donations`

**Purpose.** Surface the three donation modalities and route the user to the right place per choice.

**Layout (top → bottom).**

1. Top bar: title "💝 תרומות".
2. Three vertically stacked tiles (`DonationTile` component), 16px gap, container max-width 480px:
   - **🎁 חפצים** — subtitle: *"תרומה ובקשת חפצים"* — onPress → `router.push('/(tabs)')`.
   - **⏰ זמן** — subtitle: *"התנדבות וזמן פנוי"* — onPress → `router.push('/(tabs)/donations/time')`.
   - **💰 כסף** — subtitle: *"תרומה כספית"* — onPress → `router.push('/(tabs)/donations/money')`.

**`DonationTile` component contract.**

```ts
type DonationTileProps = {
  icon: string;       // emoji
  title: string;
  subtitle: string;
  onPress: () => void;
  testID?: string;
};
```

- Min height 96px (≥44×44 touch target with comfortable spacing).
- Card style: surface bg, border, rounded 16, shadow `shadow.card`.
- RTL: icon on the right, text block on the left.

**Acceptance.**

- AC1. Items tile navigates to `/(tabs)` (no pre-applied filter; the Filter Modal state is untouched).
- AC2. Time / Money tiles each push their child route; back button returns to Hub.
- AC3. Tiles are accessible: each is `accessibilityRole="button"` with `accessibilityLabel` = title + subtitle.
- AC4. Order is fixed: Items → Time → Money (visual top-to-bottom in RTL).

---

### 5.3 Screen 2.7 — Donations · Money

**Route.** `/(tabs)/donations/money`

**Purpose.** Communicate that the Money modality will open later, and route interested users to the partner platform `jgive` in the meantime.

**Layout (top → bottom).**

1. Top bar: back button (←) + title "💰 תרומה כספית".
2. Body copy (verbatim, Hebrew):
   *"קטגוריית הכסף תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולתרום / לחפש תורמים דרך עמותת jgive."*
3. Primary button: *"פתח את jgive.com ↗"* → `Linking.openURL('https://jgive.com')`.

**Acceptance.**

- AC1. The button uses the platform's external-browser intent (no in-app WebView).
- AC2. The screen renders identically for guests and authenticated users.
- AC3. If `Linking.canOpenURL` returns false (extreme edge case), show an inline error: *"לא הצלחנו לפתוח את הקישור. נסו דפדפן אחר."*

---

### 5.4 Screen 2.8 — Donations · Time

**Route.** `/(tabs)/donations/time`

**Purpose.** Communicate that the Time modality will open later, route interested users to `Lev Echad / we-me`, **and** offer a direct path to volunteer in our own org via the Super Admin chat.

**Layout (top → bottom).**

1. Top bar: back button (←) + title "⏰ תרומת זמן".
2. Body copy (verbatim, Hebrew):
   *"קטגוריית הזמן תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולמצוא הזדמנויות התנדבות בפלטפורמה של ׳לב אחד׳."*
3. Primary button: *"פתח את לב אחד ↗"* → `Linking.openURL('https://www.we-me.app/')`.
4. Section divider.
5. Secondary copy:
   *"ניתן גם להתנדב ישירות בארגון שלנו, במקצוע שלך. השאירו הודעה ונחזור אליכם."*
6. **Volunteer Message Composer** (`VolunteerMessageComposer` component):
   - `<TextInput multiline numberOfLines={4} maxLength={2000} />`
   - Placeholder: *"הקלידו את ההודעה שלכם — מקצוע, תחום עניין, וזמינות..."*
   - Send button: *"שלח הודעה"*. Disabled when text is empty (after `.trim()`).

**Send-button behavior (MVP-core — pragmatic).**

The chat infra is currently mock-backed (`P0.5` not yet shipped — no `SupabaseChatRepository`, `chat/[id].tsx` uses `MOCK_MESSAGES`). Until P0.5 lands, the Send button:

1. Validates non-empty text (after `.trim()`).
2. Stores the message body in a local intent log (best-effort — `AsyncStorage` keyed `volunteer_intent_log`, FIFO 50-entry cap, so it can be retrieved later).
3. Shows a success alert: *"תודה! ההודעה התקבלה. ניצור איתך קשר בקרוב דרך הצ'אט."*
4. Clears the textbox.

We deliberately **defer** the `sendVolunteerMessageToAdmin` use-case + ports plumbing to when P0.5 ships (`TD-114`). The intent log lets us migrate any pending volunteer messages into the real chat thread once available.

**Acceptance (MVP-core).**

- AC1. Send is disabled when the trimmed text is empty.
- AC2. Send is auth-required (the screen is auth-required per `FR-DONATE-005`).
- AC3. On Send, the message is appended to a local `volunteer_intent_log` in `AsyncStorage` (capped to 50 entries, oldest evicted) so it can be migrated later. Failure to write to storage is silent — alert still shown.
- AC4. On Send, an alert is shown with text *"תודה! ההודעה התקבלה. ניצור איתך קשר בקרוב דרך הצ'אט."* and the textbox is cleared.
- AC5. Maximum input length 2,000 chars (consistent with `FR-CHAT-002 AC5`).
- AC6. **TD-114 (FE):** when P0.5 chat ships, replace this local-only behavior with a real `sendVolunteerMessageToAdmin` use-case that resolves the Super Admin (canonical email `karmacommunity2.0@gmail.com`), opens-or-creates the support thread (`is_support_thread=true`), sends the message body **prefixed** with *"התנדבות בארגון: "*, and navigates to `/chat/[adminChatId]`. The pending entries in `volunteer_intent_log` are flushed to the thread on first migration.

---

## 6. Bottom Bar Update

### 6.1 Visual order (RTL, right → left)

`👤 פרופיל` · `🔍 חיפוש` · `➕ פלוס` · `💝 תרומות` · `🏠 בית`

### 6.2 Component changes

- `app/apps/mobile/app/(tabs)/_layout.tsx`: declare `Tabs.Screen` for `search` and `donations` between the existing entries; preserve `flexDirection: 'row-reverse'` for RTL.
- `app/apps/mobile/src/components/TabBar.tsx`: add 2 new `<Pressable>` entries; update `activeTab(segments)` to include `search` and `donations`.
- Tile spacing: with 5 tabs, each gets ~20% width on a 375px screen → ~75px per tab. The Plus button stays as a 52×52 emphasized circle; the four side tabs become slightly tighter but remain ≥44×44 touch targets.
- Web responsive: at <360px width the bar may need to drop subtle padding. No new break.

### 6.3 Icon set

Per **TD-109** (landed 2026-05-09), the bottom bar uses **Ionicons** (`@expo/vector-icons`), not emoji literals. New tabs follow the same pattern.

| Tab | Active icon | Inactive icon | a11y label |
| --- | ----------- | ------------- | ---------- |
| Profile | `person` | `person-outline` | "פרופיל" |
| Search | `search` | `search-outline` | "חיפוש" |
| Plus | (custom plus circle, unchanged) | — | "פוסט חדש" |
| Donations | `heart` | `heart-outline` | "תרומות" |
| Home | `home` | `home-outline` | "בית" |

The PRD/SRS tables above use emoji glyphs (👤 🔍 ➕ 💝 🏠) as **visual indicators in docs only**. Implementation uses the Ionicons names in this table.

---

## 7. Document Updates Required

| File | Change |
| ---- | ------ |
| `docs/SSOT/SRS/02_functional_requirements/13_donations.md` | **NEW** — `FR-DONATE-001..005`. |
| `docs/SSOT/SRS/02_functional_requirements/06_feed_and_search.md` | Add `FR-FEED-016` (Search hub placeholder). |
| `docs/SSOT/SRS/02_functional_requirements/07_chat.md` | Extend `FR-CHAT-008 AC1` with the 4th entry-point (Donations · Time → admin). |
| `docs/SSOT/SRS/02_functional_requirements/README.md` | Add a row for §2.13 Donations. |
| `docs/SSOT/SRS.md` | Add `FR-DONATE-*` to Part II TOC. |
| `docs/SSOT/SRS/appendices/C_decisions_log.md` | Append `D-16 — Reintroduce Donations and Search tabs in MVP`. |
| `docs/SSOT/SRS/appendices/A_traceability_matrix.md` | Add rows for new FRs (link to PRD screens 2.5/2.6/2.7/2.8). |
| `docs/SSOT/PRD_MVP_CORE_SSOT/06_Navigation_Structure.md` | Update §6.1 (3 → 5 tabs); rewrite §6.4 (donations + search are now in MVP, with note about partial scope of search). |
| `docs/SSOT/PRD_MVP_CORE_SSOT/05_Screen_UI_Mapping.md` | Add screens 2.5/2.6/2.7/2.8; update total count from 27 → 31. Update §5.3 traceability matrix. |
| `docs/SSOT/PROJECT_STATUS.md` | Add `P1.x — Donations & Search tabs` (this work) and `P2.x — Universal search engine` (deferred). Update Last Updated, Snapshot. |

---

## 8. Testing Plan

### 8.1 Unit tests (vitest)

- `sendVolunteerMessageToAdmin.test.ts` (in `packages/application/chat/__tests__/`):
  - admin resolution succeeds → message sent → returns chat ID.
  - admin not found → throws `admin_not_found`.
  - empty text after trim → throws `invalid_input`.
  - reuses existing chat when one exists (does not create a duplicate support thread).
  - body is prefixed with `"התנדבות בארגון: "`.

### 8.2 Component tests

- `DonationTile`: renders icon + title + subtitle; onPress fires; a11y role is button.
- `VolunteerMessageComposer`: send disabled on empty text; send enabled on text; respects 2000-char cap.

### 8.3 Manual verification (per `feedback_verify_ui_before_claiming_done` memory)

Before claiming done, load the running app in browser via Claude Preview and verify:

- All 5 tabs render in correct RTL order on `/`, `/profile`, `/donations`, `/donations/time`, `/donations/money`, `/search`.
- Tapping each tab navigates correctly.
- Items tile lands on `/`. Money/Time tiles land on their child routes; back navigation returns to Hub.
- External link buttons open the partner URL in a new browser tab (Web) / external Safari/Chrome (mobile).
- Volunteer composer disabled state, max-length cap, send → chat detail.

---

## 9. Tech Debt & Risks

### 9.1 Logged TDs (new)

- **TD-111 (FE)** — Bottom bar layout assumes 5 tabs fit; on <320px-wide devices the icons may crowd. Acceptable for MVP; revisit if telemetry shows tap errors.
- **TD-112 (FE)** — Volunteer composer state is not persisted across the auth round-trip when a guest who deep-linked is bounced to Auth. Acceptable for MVP.
- **TD-113 (FE)** — Add guest-scope mirror for Donations sub-screens (`(guest)/donations/money`, `(guest)/donations/time`) so unauthenticated curiosity converts via partner pages. Out of scope for this PR per §4.4.
- **TD-114 (FE)** — When P0.5 chat ships, replace the local intent-log + alert in the Time composer with a real `sendVolunteerMessageToAdmin` use-case that opens the existing `FR-CHAT-007` Super Admin support thread and navigates to `/chat/[adminChatId]`. Pending entries in `volunteer_intent_log` should be flushed (oldest first) on the first authed entry to that thread.

### 9.2 Risks

- **R1.** P0.5 (chat) is still in mock state. The Time volunteer composer therefore stores intent locally and shows a success alert; it does not deliver to chat. We accept the lag and will flush pending intents to the real support thread once P0.5 ships (TD-114).
- **R2.** Reintroducing Donations + Search tabs is a navigation regression risk for users who learned the 3-tab layout. Mitigation: ship behind no flag (small user base today), monitor support reports.

---

## 10. Open Question Tracker

| ID | Question | Resolution |
| -- | -------- | ---------- |
| Q1 | Does the guest layout (`(guest)/feed`) need its own bottom-bar shape, or do guests see the same 5-tab bar? | **Resolved.** The bottom bar is post-auth-only today; we keep that invariant. Donations is auth-required in MVP-core. Guest-scope mirror tracked as TD-112. See §4.4. |
| Q2 | Universal search engine spec | Deferred to a separate brainstorm/spec when P2 begins. This spec only reserves the tab. |

---

## 11. Decision Log

- **D-16 (this spec).** Reintroduce dedicated **Donations** and **Search** tabs in the MVP, replacing the prior PRD §6.4 "excluded from MVP" note. The Search tab ships as a placeholder; the universal-search engine itself is deferred to P2 (end of MVP). The Donations Hub ships fully for items/time/money modalities, with time and money sub-screens routing via external partners (`jgive`, `we-me`) and inline volunteer-message composer wired to `FR-CHAT-007`.

---

## 12. Implementation Order Suggested

1. **UI components**: `DonationTile`, `VolunteerMessageComposer` in `packages/ui`.
2. **Routes**: `search.tsx`, `donations/_layout.tsx`, `donations/index.tsx`, `donations/money.tsx`, `donations/time.tsx`.
3. **Bottom bar**: update `(tabs)/_layout.tsx` + `TabBar.tsx` to 5 tabs (with Ionicons per TD-109).
4. **Doc updates**: all SSOT files in §7 in the same PR (already done in this PR).
5. **Verification**: typecheck, lint:arch, vitest, manual UI per §8.3.

The use-case + chat ports are deferred to TD-114 (post-P0.5 chat). This PR ships the screens and the local intent-log behavior described in §5.4.
