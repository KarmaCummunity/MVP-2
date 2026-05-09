# 2.13 Donations Hub

[← back to Part II index](./README.md)

Prefix: `FR-DONATE-*`

---

## Scope

A bottom-bar tab that surfaces the three donation modalities of the platform — items, time, money — and routes the user to the right place per choice. In MVP, only **items** is fully native; **money** and **time** are coming-soon screens that route to external partners (`jgive`, `Lev Echad`), and **time** additionally offers a direct path to volunteer in our own org via the existing Super Admin chat (`FR-CHAT-007`).

Non-goals (out of scope):

- Server-side filtering, ranking, or recommendations on the Hub.
- Per-organization volunteer dispatch beyond a single admin thread.
- Native fundraising / donation flow (deferred — Money sub-screen is link-out only).
- Universal search across donation categories — that lives in `FR-FEED-016` (placeholder) and a future `FR-FEED-017+` (engine).

---

## FR-DONATE-001 — Donations Hub: 3 tiles

**Description.**
The Donations tab opens to a Hub screen showing three vertically stacked tiles for the three donation modalities.

**Source.**
- Design spec: [`docs/superpowers/specs/2026-05-09-donations-and-search-tabs-design.md`](../../../superpowers/specs/2026-05-09-donations-and-search-tabs-design.md).
- Decisions: `D-16`.

**Acceptance Criteria.**
- AC1. Tile order (visual top-to-bottom in RTL): **🎁 חפצים** → **⏰ זמן** → **💰 כסף**.
- AC2. Each tile shows an icon, a title, and a one-line subtitle. Tap target ≥ 44×44.
- AC3. Each tile is `accessibilityRole="button"` with `accessibilityLabel` = title + subtitle.
- AC4. The Hub screen is reachable from the bottom-tab `💝 תרומות` icon and from any screen that has a global TabBar.
- AC5. Hub layout is responsive: tiles stack vertically on all breakpoints; on Tablet/Desktop the container max-width is 480px and remains centered.

**Related.** Screens: 2.6 · `FR-DONATE-002`, `FR-DONATE-003`, `FR-DONATE-004`.

---

## FR-DONATE-002 — Items tile navigation

**Description.**
Tapping the Items tile navigates the user to the Home Feed unchanged.

**Source.**
- Design spec: §5.2.

**Acceptance Criteria.**
- AC1. Tap on the **🎁 חפצים** tile pushes `/(tabs)` (Home Feed).
- AC2. **No filter is pre-applied** to the feed; the user sees the feed in whatever filter state they last left it (per `FR-FEED-005`).
- AC3. Back navigation from the feed returns to the previous screen per OS / expo-router defaults.

**Related.** Screens: 2.1 · `FR-FEED-001`, `FR-FEED-005`.

---

## FR-DONATE-003 — Money sub-screen

**Description.**
A coming-soon screen for the Money modality that links out to the partner platform `jgive`.

**Source.**
- Design spec: §5.3.
- Decisions: `D-16`.

**Acceptance Criteria.**
- AC1. Body copy (Hebrew, verbatim): *"קטגוריית הכסף תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולתרום / לחפש תורמים דרך עמותת jgive."*
- AC2. A primary button labeled *"פתח את jgive.com ↗"* invokes `Linking.openURL('https://jgive.com')`.
- AC3. The link opens in the platform's external browser (no in-app WebView).
- AC4. If `Linking.canOpenURL` returns false, an inline error is shown: *"לא הצלחנו לפתוח את הקישור. נסו דפדפן אחר."*
- AC5. The screen is auth-required in MVP-core (`FR-DONATE-005`); see TD-112 for future guest-scope mirror.

**Related.** Screens: 2.7 · External link target: `jgive.com`.

---

## FR-DONATE-004 — Time sub-screen

**Description.**
A coming-soon screen for the Time modality that links out to `Lev Echad / we-me` and offers a direct volunteer-message path to our Super Admin via inline composer.

**Source.**
- Design spec: §5.4.
- Decisions: `D-16`.

**Acceptance Criteria.**
- AC1. Body copy (Hebrew, verbatim): *"קטגוריית הזמן תפתח בקרוב. ועד אז מזמינים אתכם להיכנס ולמצוא הזדמנויות התנדבות בפלטפורמה של ׳לב אחד׳."*
- AC2. A primary button labeled *"פתח את לב אחד ↗"* invokes `Linking.openURL('https://www.we-me.app/')`.
- AC3. Below a section divider, secondary copy: *"ניתן גם להתנדב ישירות בארגון שלנו, במקצוע שלך. השאירו הודעה ונחזור אליכם."*
- AC4. A multiline `<TextInput>` placeholder: *"הקלידו את ההודעה שלכם — מקצוע, תחום עניין, וזמינות..."*; max length 2,000 characters (consistent with `FR-CHAT-002 AC5`).
- AC5. A primary button labeled *"שלח הודעה"*:
   - Disabled when the trimmed text is empty.
   - On press (authed user, non-empty text): the message is appended to a local `volunteer_intent_log` in `AsyncStorage` (FIFO, capped to 50 entries). An alert is shown: *"תודה! ההודעה התקבלה. ניצור איתך קשר בקרוב דרך הצ'אט."* The textbox is cleared.
   - The screen is auth-required in MVP-core (`FR-DONATE-005`); guest interaction is N/A.
- AC6. **TD-114 (FE) — post P0.5 wiring.** When P0.5 chat ships, replace the local-only behavior with a `sendVolunteerMessageToAdmin` use-case that resolves the Super Admin (canonical email `karmacommunity2.0@gmail.com`), opens-or-creates the support thread (`is_support_thread=true`), sends the message body **prefixed** with *"התנדבות בארגון: "*, and navigates to `/chat/[adminChatId]`. Pending entries from `volunteer_intent_log` are flushed to the thread on first migration (oldest first).
- AC7. AsyncStorage write failure is silent; the alert is still shown so the user gets feedback.
- AC6. The use-case **resolves** the Super Admin user record by canonical email `karmacommunity2.0@gmail.com` (identical to `FR-CHAT-007 AC1`) and **finds-or-creates** the support `Chat` (`is_support_thread = true`). It **does not** create a second support thread when one already exists.
- AC7. The first message body is the user's text **prefixed** with the literal string *"התנדבות בארגון: "*. The prefix is contractual and is not localized in MVP.
- AC8. Network failure: the textbox content is preserved and an inline retry control is shown: *"לא נשלח. נסו שוב."*

**Related.** Screens: 2.8 · `FR-CHAT-007` · External link target: `we-me.app`.

---

## FR-DONATE-005 — Guest behavior on Donations

**Description.**
In MVP-core, the Donations tab and its sub-screens are **auth-required**. Guests live in the route-isolated `(guest)/feed` and do not see the bottom bar. A guest who deep-links to any `/donations/*` or `/search` route is redirected to `1.2 Auth`, consistent with PRD §6.8.1.

A future enhancement (`TD-112`) may mirror the Money and Time sub-screens into a `(guest)/donations/...` group so guests can engage with the external partner links (`jgive`, `we-me`) without authenticating; that is out of scope here.

**Source.**
- Design spec: §4.4.
- Constraints: `R-MVP-Core-2`, PRD §6.8.1.

**Acceptance Criteria.**
- AC1. The 5-tab bottom bar (with Donations + Search) is rendered only post-auth (consistent with the existing `_layout.tsx` `showTabBar` condition).
- AC2. A guest who attempts deep-link navigation to `/donations`, `/donations/money`, `/donations/time`, or `/search` is redirected to `1.2 Auth` per PRD §6.8.1.
- AC3. After authentication, the user lands on the home feed (`/(tabs)`) per existing post-auth flow; the originally requested route is **not** preserved in MVP-core (TD-111).

**Related.** Screens: 1.7, 2.5, 2.6, 2.7, 2.8 · `FR-AUTH-014`, `FR-FEED-012`, PRD §6.8.1.

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-09 | Initial draft. Reintroduces Donations tab into MVP per `D-16`. Defines `FR-DONATE-001..005`. |
