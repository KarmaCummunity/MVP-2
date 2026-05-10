# Donation Categories + Community NGO Links — Design Spec

> Date: 2026-05-10 · Owner: agent (single-PR full-stack) · Status: approved by user 2026-05-10

## 1 — Problem

The Donations Hub (FR-DONATE-001) has 3 tiles: **🎁 חפצים** (→ feed), **⏰ זמן**, **💰 כסף**. Time and Money are coming-soon screens with single external partner links (`we-me.app`, `jgive.com`).

Users want a richer hub: 6 additional categories — **אוכל · דיור · תחבורה · ידע · חיות · רפואה** — and, on every category screen except חפצים, a **community-curated list of NGO / WhatsApp / Facebook links** that any signed-in user can extend.

## 2 — Decisions (recorded from brainstorming)

| Q | Decision |
|---|----------|
| **Q1 — Moderation policy** | (a) **Auto-publish** after URL reachability check passes. Bad links handled via existing report-to-admin chat flow. |
| **Q2 — Time/Money treatment** | (b) **Hybrid.** Existing screens keep their current top section (coming-soon copy + jgive/we-me CTA, plus the volunteer composer on Time). The new `<DonationLinksList>` is rendered **below** their current content. |
| **Q3 — URL validation** | (b) **Server-side.** A Supabase Edge Function performs a HEAD/GET reachability check (no CORS issues; uniform across web + native). Direct DB INSERT from clients is blocked; the Edge Function inserts on success using the service-role key. |

## 3 — Information architecture

### Donations Hub (`apps/mobile/app/(tabs)/donations/index.tsx`)

9 tiles, in two visual groups separated by a thin divider:

```
🎁 חפצים     → /(tabs)                      [unchanged]
─────────────
⏰ זמן       → /(tabs)/donations/time       [existing screen + new list section]
💰 כסף       → /(tabs)/donations/money      [existing screen + new list section]
─────────────
🍽️ אוכל      → /(tabs)/donations/category/food
🏠 דיור      → /(tabs)/donations/category/housing
🚗 תחבורה   → /(tabs)/donations/category/transport
📚 ידע       → /(tabs)/donations/category/knowledge
🐾 חיות      → /(tabs)/donations/category/animals
⚕️ רפואה     → /(tabs)/donations/category/medical
```

Existing tile order from FR-DONATE-001 AC1 is preserved as the first group.

### New route

`apps/mobile/app/(tabs)/donations/category/[slug].tsx` — single dynamic route handles all 6 new categories. Header title = category label; header right = small `+` icon button.

## 4 — Data model

### `donation_categories` (lookup, seeded only)

| Column | Type | Notes |
|--------|------|-------|
| `slug` | `text PRIMARY KEY` | one of: `time`, `money`, `food`, `housing`, `transport`, `knowledge`, `animals`, `medical` |
| `label_he` | `text NOT NULL` | display label |
| `icon_name` | `text NOT NULL` | Ionicons key |
| `sort_order` | `int NOT NULL` | hub order |
| `is_active` | `boolean NOT NULL DEFAULT true` | hide from hub if false |

`items` is **not** a row in this table — it routes to the feed and has no list.

### `donation_links` (community-curated)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid PRIMARY KEY DEFAULT gen_random_uuid()` | |
| `category_slug` | `text NOT NULL REFERENCES donation_categories(slug)` | |
| `url` | `text NOT NULL` | must start with `http://` or `https://` (CHECK constraint) |
| `display_name` | `text NOT NULL` | 2..80 chars (CHECK) |
| `description` | `text NULL` | 0..280 chars (CHECK) |
| `submitted_by` | `uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE` | |
| `validated_at` | `timestamptz NOT NULL` | when Edge Function confirmed reachability |
| `hidden_at` | `timestamptz NULL` | soft-hide |
| `hidden_by` | `uuid NULL REFERENCES auth.users(id)` | |
| `created_at` | `timestamptz NOT NULL DEFAULT now()` | |

Index: `(category_slug, created_at desc) WHERE hidden_at IS NULL` for fast listing.

### RLS

- `donation_categories`: anon + authenticated SELECT; no writes.
- `donation_links` SELECT: `authenticated`. A row is visible if `hidden_at IS NULL` OR `submitted_by = auth.uid()` OR the viewer is super-admin.
- `donation_links` INSERT: **denied to all client roles**. Insert happens via service-role from the Edge Function only.
- `donation_links` UPDATE/DELETE (soft-hide): allowed for the submitter on their own row, or super-admin on any row.

## 5 — Edge Function: `validate-donation-link`

**Path:** `supabase/functions/validate-donation-link/index.ts`
**Method:** `POST`
**Auth:** requires user JWT (`Authorization: Bearer <user_jwt>`); rejected with 401 if missing.
**Body:** `{ category_slug: string, url: string, display_name: string, description?: string | null }`

**Algorithm:**
1. Extract `auth.uid()` from the user JWT (verify with anon key client).
2. Validate inputs (URL format, lengths, slug exists in `donation_categories`).
3. Soft rate-limit: count `donation_links` rows submitted by this user in the last hour; reject `rate_limited` if ≥ 10.
4. `fetch(url, { method: 'HEAD', redirect: 'follow', signal: AbortSignal.timeout(5000) })`. Accept status `200..399`. On `405 Method Not Allowed` or 4xx, retry once with `GET` (some hosts reject HEAD).
5. On reachability success: insert a row with the service-role client, `validated_at = new Date().toISOString()`. Return `{ ok: true, link: <inserted row> }`.
6. On failure: return `{ ok: false, code: 'unreachable' | 'rate_limited' | 'invalid_url' | 'invalid_input' }` with appropriate HTTP status.

## 6 — Domain & application layers

### Domain (`@kc/domain`)

```ts
export type DonationCategorySlug =
  | 'time' | 'money' | 'food' | 'housing' | 'transport' | 'knowledge' | 'animals' | 'medical';

export interface DonationCategory {
  readonly slug: DonationCategorySlug;
  readonly labelHe: string;
  readonly iconName: string;
  readonly sortOrder: number;
  readonly isActive: boolean;
}

export interface DonationLink {
  readonly id: string;
  readonly categorySlug: DonationCategorySlug;
  readonly url: string;
  readonly displayName: string;
  readonly description: string | null;
  readonly submittedBy: string;
  readonly validatedAt: string;
  readonly hiddenAt: string | null;
  readonly createdAt: string;
}
```

### Application (`@kc/application`)

- **Port:** `IDonationLinksRepository`
  - `listByCategory(slug: DonationCategorySlug): Promise<DonationLink[]>`
  - `addViaEdgeFunction(input: AddDonationLinkInput): Promise<DonationLink>` (calls Edge Function)
  - `softHide(linkId: string): Promise<void>` (UPDATE hidden_at, hidden_by)
- **Use-cases:**
  - `ListDonationLinksUseCase`
  - `AddDonationLinkUseCase` (validates input length client-side, then calls repo)
  - `RemoveDonationLinkUseCase` (caller is submitter or super-admin)
- **Errors:** `DonationLinkError` with codes `unreachable | rate_limited | invalid_url | invalid_input | unauthorized | network`.

## 7 — Infrastructure (`@kc/infrastructure-supabase`)

`SupabaseDonationLinksRepository`:
- `listByCategory` → `from('donation_links').select('*').eq('category_slug', slug).is('hidden_at', null).order('created_at', { ascending: false })`.
- `addViaEdgeFunction` → `supabase.functions.invoke('validate-donation-link', { body: input })`. Maps Edge Function `code` → `DonationLinkError`.
- `softHide` → `update({ hidden_at: now, hidden_by: auth.uid() }).eq('id', linkId)`.

## 8 — UI (mobile)

### Components

`apps/mobile/src/components/DonationLinksList.tsx`
- Props: `categorySlug: DonationCategorySlug`.
- Loads list on mount; renders header row (title + small `+` icon button) + items + empty state.
- `+` button opens `<AddDonationLinkModal>`; on success, prepends new row to local state.

`apps/mobile/src/components/DonationLinkRow.tsx`
- Card visual (matches `DonationTile` styling — surface bg, border, `radius.lg`, card shadow).
- Right (RTL leading): site favicon (`https://www.google.com/s2/favicons?domain=<host>&sz=64`) inside a circular avatar; on image load failure, falls back to a generic `link-outline` Ionicon.
- Center: `display_name` (h3) + `description` (body, 2-line clamp) + tiny domain chip (host extracted from URL).
- Left: chevron, on row press → `Linking.openURL(url)`.
- Top-left small overflow icon `…` opens an action sheet: "פתח", "דווח על קישור" (any user), "מחק" (own row or super-admin).

`apps/mobile/src/components/AddDonationLinkModal.tsx`
- Modal sheet with three text inputs (URL, display name, description-optional with 280-char counter).
- Primary action **"הוסף"** — disabled until `url` and `display_name` are non-empty and `url` matches `https?://...`.
- On press: shows inline spinner + label "מאמת קישור...", calls `AddDonationLinkUseCase`. On success: closes modal, list updates. On failure: inline error message keyed off the error code.

### Screens

- `apps/mobile/app/(tabs)/donations/category/[slug].tsx` — full-screen `<DonationLinksList>`.
- `apps/mobile/app/(tabs)/donations/_layout.tsx` — register the new dynamic route in the Stack.
- `apps/mobile/app/(tabs)/donations/index.tsx` — render the 6 new tiles after the existing 3, with a thin divider between groups.
- `apps/mobile/app/(tabs)/donations/money.tsx` — append `<DonationLinksList categorySlug="money" />` below existing content.
- `apps/mobile/app/(tabs)/donations/time.tsx` — append `<DonationLinksList categorySlug="time" />` below existing content (composer remains).

### Composition (`postsComposition.ts` pattern)

New file: `apps/mobile/src/services/donationsComposition.ts` — singletons for the repo + use-cases.

## 9 — Functional Requirements (new and updated)

To be added to `docs/SSOT/SRS/02_functional_requirements/13_donations.md`:

- **FR-DONATE-006** — Donations Hub: 6 new category tiles (אוכל, דיור, תחבורה, ידע, חיות, רפואה) below existing tiles, separated by a divider. Hub-level routing.
- **FR-DONATE-007** — Generic category screen renders `DonationLinksList` for the slug. Empty state shown when no rows. Pull-to-refresh.
- **FR-DONATE-008** — Add-link modal + Edge Function flow. Reachability validated server-side. Auto-publish on success.
- **FR-DONATE-009** — Hide/delete actions: submitter or super-admin can soft-hide. Reporting routes through existing report-to-admin chat flow with payload `donation_link:<id>`.
- **Updates to FR-DONATE-003 / FR-DONATE-004** — note the appended `<DonationLinksList>` section.

## 10 — Out of scope (deferred)

- Pre-moderation queue (auto-publish chosen).
- Periodic crawler to flag link rot (relies on user reports for now).
- Guest mirror of category screens (existing `TD-112`, unchanged).
- Multi-language localization (Hebrew only).
- Per-user upvote / sort by helpful (future).

## 11 — Out-of-band acceptance checks

- Adding a known-good URL (`https://google.com`) succeeds; row appears in list.
- Adding a malformed URL returns `invalid_url` inline error.
- Adding 11 links inside one hour returns `rate_limited` on the 11th.
- Adding `https://this-host-does-not-exist-example-xyz.invalid` returns `unreachable`.
- A super-admin can hide any row; a regular user can hide only their own row.
- Direct INSERT to `donation_links` from the JS client is rejected by RLS.
- Tapping a row opens the URL in the system browser.
