# Post actor privacy & closed-post UX (design)

> **Date:** 2026-05-16  
> **Status:** Approved by PM (conversation)  
> **Touches:** `FR-POST-009`, `FR-POST-014`, `FR-POST-017`, `FR-CLOSURE-005`, `FR-CLOSURE-007`, `FR-PROFILE-*`, `FR-CHAT-014`, new FRs TBD in SSOT

---

## Problem

Closed posts need clearer UX (copy, CTAs) and a **durable privacy model** where:

1. Each party can control **how their identity appears on post surfaces** relative to viewers and the counterparty.
2. **Post audience** (who can see the post listing / content in community surfaces) stays a separate axis from **per-actor identity exposure** on that post.
3. **Profiles** remain visible as Instagram-style shells: private profiles still show the profile screen; **posts** are filtered by visibility rules.
4. **Chat** never “hides users”: participant identity stays real in chat. Anchors link **only open posts**; on close, the anchored post disappears (already enforced server-side via `0026_chat_anchor_lifecycle.sql` clearing `chats.anchor_post_id`).

---

## Principles (locked)

| Topic | Decision |
| --- | --- |
| Third-party viewer `V` on post detail | Each of **owner** and **respondent** identity fields is evaluated **independently** against `V` using that actor’s exposure rules (PM choice **A**). |
| Counterparty-specific masking | A user may be **anonymous on the counterparty’s framing** of the same `post_id` while their own listing remains **Public** to the community. |
| Coupling | If the owner sets post audience to **Only me** for their listing, that **automatically** forces **hidden / anonymous toward the counterparty** on the partner-facing surfaces (cannot leak identity while the post is “only me” to the owner). |
| Chat vs post | Chat UI always shows **real users**. Post-level masking applies to **post chrome** (author row, recipient callout, cards). **No profile-route requirement** from masked rows toward the counterparty (avoid one-tap deanonymization); profiles remain reachable elsewhere (search, chat header, direct profile navigation). |
| Architecture | **Approach 2**: keep `posts.visibility` for community discovery (`FR-POST-009`); add **`post_actor_identity`** (working name) for per-`(post_id, user_id)` exposure + counterparty flag; apply a **single projection pipeline** in infrastructure after fetch (or via SQL helper) consumed by feed, `findById`, profile closed-posts hydration. |

---

## Domain concepts

1. **`PostVisibility` (existing)** — who may see the **post** in feed / profile grids / detail eligibility (subject to RLS + `is_post_visible_to`).
2. **`PostActorIdentityExposure` (new enum)** — `Public` \| `FollowersOnly` \| `Hidden` — how actor **A**’s name/avatar/handle are shown to viewer **V** when **V** is allowed to see the post at all.
3. **`hideFromCounterparty` (boolean or implied by Hidden)** — when viewer is the **counterparty**, force anonymous presentation on post surfaces regardless of community exposure, unless rules forbid (see coupling).

**Invariant:** Projection runs **after** visibility: if `V` cannot see the post, no identity leaks via that route.

---

## Data model (new)

Table `public.post_actor_identity` (name finalised in migration + SSOT):

- `post_id uuid not null references posts(post_id) on delete cascade`
- `user_id uuid not null references users(user_id) on delete cascade` — only `posts.owner_id` or active `recipients.recipient_user_id` for that post
- `exposure text not null check (...)` — maps to domain enum
- `hide_from_counterparty boolean not null default false` — redundant with `Hidden` in some states; implementation may collapse to a single column if invariant table keeps coupling in SQL only
- `updated_at timestamptz not null default now()`
- **Unique** `(post_id, user_id)`
- **RLS:** insert/update/select only where `auth.uid()` is that row’s `user_id` **and** that user is owner or active recipient for `post_id`

**Coupling rule in DB or domain:** when `posts.visibility = 'OnlyMe'` for the owner’s post row, effective exposure of owner toward counterparty is **Hidden** (even if a stale row said otherwise). Prefer enforcing in projection function to avoid drift.

---

## Projection pipeline

1. Repository loads `PostWithOwner` raw join (as today).
2. Load `post_actor_identity` rows for `post_id` (0–2 rows).
3. Load viewer context: `V` id, whether `V` follows owner / recipient, whether `V` is counterparty to each actor.
4. Call **pure** domain helper `projectPostIdentities(post, policies, ctx) → PostWithOwner` (new fields or replace `ownerName`, `recipientUser`, and flags like `ownerProfileNavigableFromPost`).

**Files (planned):** see implementation plan.

---

## UX notes

- **P0:** Hide “contact poster” CTA unless `status === 'open'` (`post/[id].tsx`); align feed `PostCard` parent if it passes `onMessagePress` for non-open.
- **P1:** Shared Hebrew copy for reopen / recipient unmark (“החפץ לא נמסר בסוף”) — i18n + modals only.
- **P2+:** Toggle UI for exposure + counterparty hide; invalidate React Query keys `['post', …]`, `['profile-closed-posts']`, feed.

---

## Out of scope (this design cycle)

- Changing global “private profile hides the profile page” (explicitly **not** desired).
- Hiding users in chat headers.
- New chat anchors for closed posts.

---

## SSOT follow-up

Before coding P2+: add FR-IDs + ACs to `docs/SSOT/spec/04_posts.md`, `05_closure_and_reopen.md`, `02_profile_and_privacy.md`, and append `D-*` to `DECISIONS.md` for the two-axis model (visibility vs actor identity).
