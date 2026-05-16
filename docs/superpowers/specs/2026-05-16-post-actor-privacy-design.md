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

---

## Addendum — 2026-05-16 (revision)

The two-axis model above conflated *who can see the post in a given participant's surface* with *how that participant's identity renders on post chrome*. This addendum splits them into three orthogonal axes per `(post_id, user_id)`, driven by `D-28`:

| Axis | Column | Values | Meaning |
| --- | --- | --- | --- |
| Surface audience | `surface_visibility` | `Public` / `FollowersOnly` / `OnlyMe` (default `Public`) | Who, beyond the two participants, can discover the post **through this participant's surface** (profile "פוסטים סגורים" tab and generic third-party fetch). |
| Identity chrome | `identity_visibility` *(renamed from `exposure`)* | `Public` / `FollowersOnly` / `Hidden` (default `Public`) | How this participant's name / avatar / profile deep-link render on post surfaces to viewers who are permitted to see the post. |
| Counterparty mask | `hide_from_counterparty` | boolean (default `false`) | Hide this participant's identity specifically from the counterparty, even when they can read the post. |

**Counterparty read invariant.** `posts.owner_id` and active `recipients.recipient_user_id` always retain read access to the post regardless of either participant's `surface_visibility`. Surface visibility governs **third-party** access only.

**Coupling — audience implies identity.** If a participant's `surface_visibility` does not admit viewer V on the participant's own surface, V must also see that participant **anonymously** if V reaches the post via the counterparty's broader surface. This prevents identity leakage when the two participants chose mismatched audiences.

**Coupling — `D-26` retained.** When `posts.visibility = OnlyMe`, the owner remains forcibly anonymous to the counterparty on post surfaces (independent of the new axes).

**Closed-post third-party access — corrected predicates.**
- `is_post_visible_to(post, viewer)` for `closed_delivered`: true to non-participant V iff **either** participant's `surface_visibility` admits V.
- `profile_closed_posts(profile, viewer)`: gates each row by **the row's role-actor** `surface_visibility` (publisher rows by owner's; respondent rows by respondent's) — not by `posts.visibility`.

**Migration.** Forward-only `0085_post_actor_identity_audience_split.sql`: add `surface_visibility` with default `Public` (no row backfill — default matches prior public-by-default closed-post behavior); rename `exposure` → `identity_visibility` (data and check constraint preserved); replace predicates per above; route the `post_actor_identity` SELECT policy through a `SECURITY DEFINER` helper so it no longer recurses through `is_post_visible_to`.

**Why this revision was needed.** The shipped `P2.11` model treated `PostActorIdentityExposure` as both audience and identity chrome. In practice `profile_closed_posts` therefore filtered every row by the publisher's `posts.visibility`, leaving respondents with no say over their own profile tab. `D-28` fixes the product rule "each participant controls their own surfaces" without losing the identity-anonymity affordances of the original model.

**PM revision (2026-05-16).** MVP mobile UI ships **audience** controls only (`posts.visibility` on open owner post detail; per-participant `surface_visibility` on closed) plus the **counterparty** mask toggle. User-editable `identity_visibility` tiers (`FollowersOnly` / `Hidden` chrome) are **not** in MVP UI; see `D-30` in `docs/SSOT/DECISIONS.md` and migration `0092_post_actor_identity_public_chrome.sql`.
