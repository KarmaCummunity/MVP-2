# Part I — Product Vision & Stakeholders

[← back to SRS index](../SRS.md)

---

## 1.1 Vision & Value Proposition

> **A basic social network for giving and receiving items of any kind, free of charge.**

Karma Community MVP is a focused, single-purpose product designed to validate Product–Market Fit around a single, sharp value proposition. It is **not** an attempt to build the full vision in miniature; it is a complete, high-quality implementation of one slice of that vision — the Items domain — with social infrastructure that allows future expansion to additional domains (Food, Rides, Knowledge, etc.) without architectural rewrites.

The product enables three core scenarios:

1. A user has an item they no longer need → posts it → another user receives it → owner closes the post.
2. A user needs an item → posts a request → another user matches and offers it → delivery occurs.
3. All of the above happens **for free** — never money, never barter, never "expense sharing".

**Source.** [`PRD_MVP/00_Index.md`](../../../PRD_MVP/00_Index.md), [`PRD_MVP/01_Vision_Goals.md`](../../../PRD_MVP/01_Vision_Goals.md) §1.1.

---

## 1.2 Goals & KPIs

### 1.2.1 North Star Metric

> **Number of items successfully delivered (Closed-Delivered Posts) per month.**

This is the **only** metric that defines success. Every secondary KPI exists to explain or predict this number.

### 1.2.2 Supporting KPIs

The following KPIs gate the decision to expand the product after MVP. The 3-month minimum targets are the floor for the MVP to be considered successful.

| # | Goal | Metric | Min. target (3 months) |
| - | ---- | ------ | ---------------------- |
| 1 | User acquisition | Registered users | 1,000 |
| 2 | Activation | % of users who created ≥1 post within 7 days of registration | ≥ 25% |
| 3 | Conversion | % of posts closed as `closed_delivered` | ≥ 35% |
| 4 | Time-to-close | Average days from publish to closure | ≤ 7 days |
| 5 | W1 Retention | Returns within 7 days of registration | ≥ 30% |
| 6 | W4 Retention | Returns within 30 days of registration | ≥ 15% |
| 7 | Active inventory | Concurrently open posts | ≥ 200 |
| 8 | NPS | Survey of active users | ≥ +20 |
| 9 | Content health | Reports as % of all posts | < 2% |

The instrumentation contract for these KPIs is defined in [`06_cross_cutting/01_analytics_and_events.md`](./06_cross_cutting/01_analytics_and_events.md). The verification plan that proves the system measures them correctly is in [`07_acceptance.md`](./07_acceptance.md).

### 1.2.3 PMF Theses Being Tested

| # | Thesis | Lead indicator |
| - | ------ | -------------- |
| T1 | People will publish unwanted items via a dedicated app instead of Facebook groups. | Posts per active user. |
| T2 | People find items they're looking for. | Conversion: request → successful delivery. |
| T3 | The flow Feed → Chat → Delivery is frictionless. | % of posts closed `closed_delivered`. |
| T4 | The follow mechanism produces social value beyond the transaction. | Avg followers / active user; chat rate among connected users. |
| T5 | Users return repeatedly. | W1, W4, W12 retention. |

**Source.** [`PRD_MVP/01_Vision_Goals.md`](../../../PRD_MVP/01_Vision_Goals.md) §1.4–§1.5.

---

## 1.3 Personas & Roles

The MVP recognizes only **three** roles. Multi-role hierarchies (volunteer, organization admin, moderator, recursive super-admin) defined in PRD V2 are deferred and **must not** appear in the data model as anything other than an extensible enum (R-MVP-Profile-9 forces `role` to be an enum, not a boolean).

### 1.3.1 Guest

A user who has installed the app but has not signed up.

| Capability | Guest |
| ---------- | ----- |
| View Splash / Welcome | ✅ |
| View 3 latest feed posts | ✅ |
| Open a post detail | ❌ |
| Open another user's profile | ❌ |
| Send any chat message | ❌ |
| Follow / be followed | ❌ |
| Create a post | ❌ |
| Apply filters / search | ❌ |

After 3 posts visible in the guest feed, an overlay is shown that funnels to sign-up.

### 1.3.2 Community Member (User)

The standard registered user. There is **no** "verified" / "blue check" tier in the MVP.

A Community Member can:

- Create, edit, delete, close, and reopen their own posts.
- Send 1-on-1 chat messages to any other Community Member.
- Toggle profile privacy: `🌍 Public` (default) or `🔒 Private` (Instagram-style follow approval).
- Follow other users (instant in public mode, requires approval in private mode).
- Approve / reject incoming follow requests when their own profile is private.
- Remove existing followers from their own follower list.
- Choose post visibility per post: `🌍 Public` / `👥 Followers only` / `🔒 Only me`.
- View any other user's profile (subject to that user's privacy mode).
- Report posts, profiles, or chat conversations.
- Block other users.
- Edit their own profile (photo, name, city, biography).
- View personal statistics and basic community-level statistics.
- Access settings (notifications, privacy, blocked-users list, support, legal, logout, account deletion).

### 1.3.3 Super Admin (off-app, single account)

A single, privileged account identified by the email `karmacommunity2.0@gmail.com`. The Super Admin has **no dedicated UI** in the MVP — all administrative operations are surfaced through the in-chat moderation channel (see `FR-ADMIN-*` in [`02_functional_requirements/12_super_admin.md`](./02_functional_requirements/12_super_admin.md)).

The Super Admin can:

- Receive system messages summarizing every report (content reports and from-Settings issue reports).
- Restore items auto-removed after 3 reports via inline action buttons inside the system message.
- Manually ban a user via the user-profile screen (only when authenticated as the Super Admin account).
- Manually delete a post or chat message via direct access from the chat thread.
- Pull global statistics from the database for product analysis (out of band).

**Source.** [`PRD_MVP/02_Personas_Roles.md`](../../../PRD_MVP/02_Personas_Roles.md).

---

## 1.4 Permission Matrix

| Action | Guest | Community Member | Super Admin |
| ------ | :---: | :--------------: | :---------: |
| View Splash | ✅ | ✅ | ✅ |
| View Feed (full) | ❌ | ✅ | ✅ |
| Create post (3 visibility levels) | ❌ | ✅ (Followers-only requires Private profile) | ✅ |
| Send chat message | ❌ | ✅ | ✅ (also handles support threads) |
| Follow another user | ❌ | ✅ (instant Public / approval Private) | ✅ |
| Approve/reject follow request | ❌ | ✅ (when own profile Private) | ✅ |
| Remove existing follower | ❌ | ✅ | ✅ |
| Toggle own profile privacy | ❌ | ✅ | ✅ |
| Report content | ❌ | ✅ | n/a (handles reports) |
| Report issue from Settings | ❌ | ✅ | n/a |
| Block user | ❌ | ✅ | ✅ |
| Edit own profile | ❌ | ✅ | ✅ |
| View personal stats | ❌ | ✅ | ✅ |
| Restore auto-removed item | ❌ | ❌ | ✅ |
| Ban user manually | ❌ | ❌ | ✅ |
| Delete post / message manually | ❌ | (own posts/messages) | ✅ (any) |

---

## 1.5 Out-of-Scope Summary

The following are **explicitly excluded** from MVP. The full rationale and roadmap for each item lives in [`PRD_MVP/08_Out_of_Scope_and_Future.md`](../../../PRD_MVP/08_Out_of_Scope_and_Future.md). They are listed here so they can never be smuggled in by accident.

| Category | Excluded items |
| -------- | -------------- |
| Donation worlds | Money, Food, Medicine, Housing, Rides, Knowledge, Time/Volunteering, Animals, Environment, Creation, Romantic matchmaking, App design |
| Operational tiers | Operator-mediated anonymous flows, 3-tier anonymity, ID verification + blue check, NGOs, organization admins, volunteer accounts, dedicated Admin UI |
| Engagement | Personal & group challenges, habit tracker, bookmarks, dedicated notifications screen, voice search, AI assistant, custom UI theming, dedicated discovery screen, extended activity history |
| Chat | Image / voice / video / location / file attachments, message reactions, post sharing, group chats, full support-desk system |
| Feed | Interest-based algorithmic feed, "friends only" toggle, persistent hidden-posts filter, post likes, post comments, post sharing, advanced search with heatmap |
| Statistics | Interactive charts, geographic heat maps, category breakdowns, period comparisons, rich community dashboard, PDF/Excel export |

Anything in this list that is added to the codebase requires an explicit `D-*` decision and a corresponding new SRS file or section.

---

## 1.6 Geographical & Linguistic Scope

- **Geography**: Israel only. The city dropdown enumerates Israeli cities exclusively.
- **Language**: Hebrew (RTL) only at MVP launch. Architecture must support `i18n` from day one (see `NFR-I18N-*`) so that adding English later does not require a rewrite.
- **Time zone**: Asia/Jerusalem for all server-side scheduling and display formatting.

**Source.** `R-MVP-Core-4`, `R-MVP-Core-5`.

---

## 1.7 Glossary (entry-level)

A more complete glossary lives in [`appendices/B_glossary.md`](./appendices/B_glossary.md). Key terms used throughout this SRS:

| Term | Meaning |
| ---- | ------- |
| **Item** | A physical object being given or requested. The MVP supports the Items "donation world" only. |
| **Post** | A unit of content in the feed. Either type `give` (offer) or type `request`. |
| **Closure** | The act of marking a post as `closed_delivered` (with optional recipient tag) or `deleted_no_recipient`. |
| **Reopen** | Returning a closed post to `open` status. |
| **Profile Privacy Mode** | A user-level setting: `Public` (instant follow) or `Private` (follow requires approval). |
| **Post Visibility** | A per-post setting: `Public` / `Followers only` / `Only me`. |
| **Follow Edge** | A directed relationship from `follower` → `followed`. |
| **Follow Request** | A pending edge awaiting approval from a `Private` profile owner. |
| **Block** | A directed relationship that hides one user's content from another and prevents messaging. |
| **Report** | A user-initiated flag of bad content; 3 reports trigger automatic removal. |
| **Super Admin Inbox** | The chat thread of the `karmacommunity2.0@gmail.com` account, used for all moderation system messages. |

---

## Change Log

| Version | Date | Summary |
| ------- | ---- | ------- |
| 0.1 | 2026-05-05 | Initial creation. Mirrors `PRD_MVP/01_Vision_Goals.md` and `PRD_MVP/02_Personas_Roles.md`. |

*Next: [Part II — Functional Requirements](./02_functional_requirements/README.md)*
