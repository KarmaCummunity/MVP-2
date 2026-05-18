# Cities truncation fix + city-dependent street picker

> Status: Draft (2026-05-18) · Owner: agent-fullstack · Mapped to: `FR-AUTH-010 AC2/AC2.b`, `FR-PROFILE-007 AC1`, post create/edit address fields.

## 1. Problem

Two related issues on every screen that asks the user for an address (onboarding step 2, edit-profile, create-post, edit-post).

### 1.1 Cities cut off at letter ע
`SupabaseCityRepository.listAll()` calls `.from('cities').select(...).order(...)` with no explicit row cap. Supabase JS client returns at most **1000 rows by default**. The `0008_seed_all_cities.sql` migration seeds **1,306** Israeli settlements. Cumulative count by Hebrew first letter:

| Letter | Count | Cumulative |
|---|---|---|
| א | 139 | 139 |
| ב | 116 | 255 |
| ג | 94 | 349 |
| ד | 24 | 373 |
| ה | 25 | 398 |
| ו | 2 | 400 |
| ז | 13 | 413 |
| ח | 54 | 467 |
| ט | 18 | 485 |
| י | 56 | 541 |
| כ | 118 | 659 |
| ל | 19 | 678 |
| מ | 147 | 825 |
| נ | 102 | 927 |
| ס | 20 | 947 |
| **ע** | **91** | **1038** ← cutoff lands mid-ע |
| פ..ת | 268 | 1306 |

≈ 306 cities silently dropped, including תל אביב (`5000`), פתח תקווה (`7900`), ראשון לציון (`8300`), קריות, רחובות, רעננה, רמת גן, רמת השרון, רהט, רכסים, רמלה, שדרות, שוהם, etc. The PM and users have explicitly reported being unable to pick these cities — root cause matches the cutoff exactly.

### 1.2 No street picker
The street field across all four address surfaces is currently a free-text `TextInput`. There is no canonical street selection and no city → street dependency, so:
- Users mistype street names (data quality)
- The UI does not guide them toward valid addresses for their city
- The onboarding step has all address fields visible at once, making the form feel heavy

## 2. Goals (in scope)

1. Restore the full canonical city list everywhere `CityPicker` is used.
2. Add canonical street selection per city, sourced from the official government dataset, with **zero filtering** — every settlement and every street in the source is selectable.
3. **Progressive disclosure on onboarding only:** the street + street-number fields are hidden until the user has selected a city. Selecting a city reveals them with the existing entry animation; clearing the city hides them again (the collapse is instant — no exit animation needed since `AnimatedEntry` is enter-only).
4. **City-dependency UX on edit-profile, create-post, edit-post:** the street picker is rendered but disabled with a visible helper text until a city is selected. Tapping it while disabled shows a transient toast: "בחרו עיר תחילה". (No progressive hide here — these screens have established layouts where field reveals would disrupt.)
5. Allow **free-text fallback** for any street the user types that does not match a canonical entry. Renders as a row at the top of the picker: "השתמש בטקסט שלי: \"<typed>\"". Never blocks the user from saving an address.
6. **Reuse the existing picker shell.** Extract `CityPicker`'s search modal into a generic `SearchablePicker<T>` and use it for both city and street pickers, so the two are visually and behaviorally identical (PM requirement).
7. Add tests for every new behavior and a regression test that asserts the full 1,306-row city list is returned.

## 3. Non-goals

- Renaming or restructuring the existing `cities` table.
- Importing the synonyms dataset (`israel-streets-synom` package) — out of scope; can be added later if PM wants fuzzy-match.
- English street names — the government file has no English column. `streets.name_he` only.
- Changing the existing free-text `users.profile_street` / `posts.street` columns to FK-only — we keep them as text so free-text fallback works and no backfill is needed.
- Adding an optional `street_id` column on `users` / `posts`. Considered, rejected for now (YAGNI): nothing in this PR queries it. If a future feature wants canonical-only street filtering or proximity by street, add the column then.
- Validating that street belongs to selected city at the database level — that's a UI concern; the server keeps trusting whatever string the client sends, to preserve the free-text fallback.

## 4. Data source

| Field | Value |
|---|---|
| Provider | data.gov.il, רשות האוכלוסין וההגירה |
| Package | `321` — "רשימת רחובות ישראל" |
| Resource ID | `9ad3862c-8391-4b2f-84a4-2d4c68625f4b` (CSV, monthly refresh; snapshot used = 2026-05-10) |
| Access | CKAN datastore_search API with pagination (`limit=32000`). Direct CSV download is blocked by the host's auth challenge. |
| Total rows | 63,563 |
| Distinct cities in source | 1,304 |
| Cities in our seed not in source | 2 (`3729` כדים, `3758` גנים) — synthesized at seed time |
| Schema | `סמל_ישוב` (city_id, numeric → text), `שם_ישוב` (drop, we have it), `סמל_רחוב` (street_id, integer), `שם_רחוב` (name_he, text) |

### 4.1 The `9000` code is real data, not noise
Every city in the source gets one row with `סמל_רחוב = 9000` whose street name equals the city name. This is the government's representation of "the village/town itself" and is the ONLY canonical row for 486 small settlements (kibbutzim, moshavim, Bedouin villages) that have no named streets. Treating these rows as noise would empty the picker for 37 % of all settlements. **They are kept verbatim.** Code `9477` is also kept — verified to be a legitimate Jerusalem street ("אל בארודי"), not a sentinel.

### 4.2 Synthesized rows
The 2 settlements present in our cities seed but absent from the source dataset (`גנים`, `כדים`) get a synthetic row at seed time, mirroring the government's sentinel convention: `(city_id, 9000, <city_name_from_cities_table>)`. Total seeded = **63,565 rows**. The migration comment documents the synthesis explicitly so a future re-sync from data.gov.il doesn't accidentally drop them.

## 5. Architecture

### 5.1 Domain
New entity in `@kc/domain`:
```ts
export interface Street {
  readonly cityId: string;
  readonly streetId: number;
  readonly nameHe: string;
}
```

### 5.2 Application port
New port in `@kc/application`:
```ts
export interface IStreetRepository {
  /** Canonical street list for a city, sorted by Hebrew name. Empty array if none. */
  listByCity(cityId: string): Promise<Street[]>;
}
```

### 5.3 Infrastructure adapter
`@kc/infrastructure-supabase/streets/SupabaseStreetRepository`:
- Queries `public.streets` with `eq('city_id', cityId).order('name_he').limit(5000)`.
- Limit 5,000 covers the largest city (Jerusalem, 4,384 rows) with margin.
- Same `listAll cities`-style error mapping for consistency.

### 5.4 Composition root
Add `getStreetRepo()` and `listStreets(cityId)` to `apps/mobile/src/services/userComposition.ts`, mirroring `listCities`. Same React Query keys pattern.

### 5.5 Shared picker shell (PM requirement #6)
Extract the existing `CityPicker` modal + search + FlatList into a reusable component:
```
apps/mobile/src/components/SearchablePicker/SearchablePicker.tsx
```
Generic over the item type:
```ts
interface SearchablePickerProps<T> {
  readonly title: string;
  readonly placeholder: string;
  readonly value: { id: string; name: string } | null;
  readonly items: readonly T[] | null;
  readonly isLoading: boolean;
  readonly error: unknown;
  readonly disabled?: boolean;
  readonly disabledHelperText?: string;
  readonly onSelect: (selection: { id: string; name: string }) => void;
  readonly matchItem: (item: T, query: string) => boolean;
  readonly renderRow: (item: T) => { id: string; name: string };
  readonly allowFreeText?: boolean; // shows "use my text" row when query has no exact match
}
```
`id` is `string` in the picker contract so the shell can stay generic. The street wrapper stringifies `streetId` at the boundary (`String(s.streetId)`); use-cases that today consume the picker's `name` value continue to do so. `CityPicker` and `StreetPicker` become ≈30-line wrappers that supply data + the `matchItem` / `renderRow` functions. Visual styling, RTL handling, keyboard behavior, animation, and a11y are owned by `SearchablePicker` so both pickers are guaranteed identical.

The disabled-state UX (helper text + tap-to-toast) lives in the wrappers so it doesn't pollute the generic shell.

### 5.6 Free-text fallback (PM requirement #5)
Implemented inside `SearchablePicker` when `allowFreeText === true`:
- The `FlatList` `ListHeaderComponent` shows a single row "השתמש ב־<query>" when (a) `query.trim().length > 0` and (b) no canonical item has `nameHe === query.trim()`.
- Tapping it calls `onSelect({ id: '', name: query.trim() })`. Empty `id` simply means "no canonical match"; the caller writes the string verbatim into `profileStreet` / `street`.
- The canonical list is rendered underneath unchanged. The free-text row never hides any canonical street.

### 5.7 Reset-on-city-change
The address state hook (onboarding's `useOnboardingBasicInfoFlow` and equivalents) clears `street` + `streetNumber` whenever `city.id` changes. Without this, a user who picked "אלנבי 3" in Tel Aviv, then switched the city to Jerusalem, would silently submit an out-of-city street.

## 6. UX per surface

### 6.1 Onboarding `/(onboarding)/basic-info` — progressive disclosure (PM idea)
Layout (top to bottom):
1. Display name input
2. City picker  *(always visible)*
3. **If `city !== null`:** `<AnimatedEntry>` reveals: street picker + street-number input
4. Contact phone input
5. Continue CTA

Clearing the city collapses (3) back. The reveal uses the existing staggered `AnimatedEntry` so it feels native to the screen.

### 6.2 Edit profile, create post, edit post — always visible, gated
Street picker is rendered alongside the city picker. When `cityId === null`:
- Picker field has 50 % opacity.
- Below the field: helper text "בחרו עיר תחילה" in `colors.textSecondary`.
- Tap on the disabled field → ephemeral toast (via `useFeedSessionStore.showEphemeralToast`) "בחרו עיר תחילה". Toast already exists and is used by the basic-info flow today.

Same toast text everywhere for consistency. Lives in `he.profile.streetPickerNeedCity`.

### 6.3 Inside the picker (both city + street, identical)
- Modal slide-up sheet, 70 % screen height
- Search input at top, RTL, auto-focus
- Scrolling list of canonical entries
- Free-text row at top when applicable (streets only)
- Empty state when query matches nothing (cities only, since streets have free-text fallback)
- Tap any row → close modal + emit selection

## 7. Database

### 7.1 New table (`0100_create_streets.sql`)
```sql
create table public.streets (
  city_id   text     not null references public.cities(city_id) on delete cascade,
  street_id integer  not null,
  name_he   text     not null,
  primary key (city_id, street_id)
);
create index streets_city_name_idx on public.streets (city_id, name_he);

alter table public.streets enable row level security;
-- Mirror cities RLS: public read for anon + authenticated, no writes from API.
create policy "streets_public_read" on public.streets
  for select to anon, authenticated using (true);
comment on table public.streets is
  'Canonical Israeli street list sourced from data.gov.il package 321 (resource 9ad3862c...). Refreshed manually via migration when a new snapshot is needed. Code 9000 = "the village itself" sentinel (kept).';
```

### 7.2 Seed (`0101_seed_streets.sql`)
- 63,565 `INSERT` rows generated offline by a one-shot Node script that downloads the source via CKAN API, normalizes, synthesizes the 2 missing-city sentinels, and emits SQL.
- The script lives at `scripts/generate-streets-seed.mjs` and is committed alongside the migration so the next refresh is reproducible.
- Idempotent via `on conflict (city_id, street_id) do nothing`.
- Estimated file size: ~5 MB. Single migration file (proven workable by `0008_seed_all_cities.sql` at 1.4 MB with 1,306 rows).

## 8. Use cases & write path

No changes. `CompleteBasicInfoUseCase`, `UpdateProfileUseCase`, `CreatePostUseCase`, `UpdatePostUseCase` continue to receive `profileStreet` / `street` as a single string. The picker resolves to a string either way (canonical pick or free text) — call sites are untouched.

## 9. Error handling

| Scenario | Behavior |
|---|---|
| Streets query fails (network/DB) | Modal shows error text + retry button. User can still close and free-text. |
| City not in `streets` table | Empty list. If free-text is on (streets surface): the "use my text" row still works. |
| User clears city after picking a street | `street` + `streetNumber` reset to empty. |
| User picks free-text but server rejects format | Existing server error mapping (`mapEditProfileSaveError`) handles this; no new error class. |
| Source dataset refresh introduces breaking column changes | `generate-streets-seed.mjs` fails loud; spec lives alongside script so future agents can debug. |

## 10. Testing

### 10.1 Cities bug-fix PR (PR 1)
- `SupabaseCityRepository.test.ts`: new test asserts `.limit()` is invoked with a value ≥ 1306.
- `SupabaseCityRepository.test.ts`: new mapper test feeds 1,306 mock rows in, expects 1,306 entities out (regression guard).

### 10.2 Streets feature PR (PR 2)
- `SupabaseStreetRepository.test.ts` (new): query contract (`from('streets').select(...).eq.order.limit`), mapper, error path. Mirrors cities test.
- `SearchablePicker.test.tsx` (new): renders items, filters by query, disabled state shows helper text + does not open on tap, free-text row appears only when no exact match, free-text emits `{ id: '', name: trimmed }`.
- `OnboardingBasicInfo` integration test (new): asserts street + number fields are absent in DOM when city is null, present after city is set, absent again after city is cleared.
- `EditProfileAddressBlock.test.tsx` (extend): asserts reset-on-city-change.
- Cross-cutting manual check: load each of the four surfaces in the web preview at LAN dev URL, exercise the disabled→enabled transition, verify Jerusalem/Tel Aviv/Petah Tikva all appear in the city picker, and verify a real street picks correctly + a free-text street saves.

## 11. SSOT impact

- `docs/SSOT/spec/01_auth_and_onboarding.md`:
  - `FR-AUTH-010 AC2.b` — append: "Street is a city-dependent picker over `public.streets` with free-text fallback. On this screen, street + number fields are revealed only after a city is selected (progressive disclosure)."
- `docs/SSOT/spec/02_profile_and_privacy.md`:
  - `FR-PROFILE-007 AC1` — append: "Street selection uses a city-dependent picker with free-text fallback. Picker is disabled with helper text until a city is selected."
- `docs/SSOT/spec/04_posts.md`:
  - `FR-POST-002` (or wherever address fields are spec'd) — same picker note, no progressive disclosure on post screens.
- `docs/SSOT/DECISIONS.md`:
  - New `D-34` — "Streets data sourced from data.gov.il package 321; full file imported with zero filtering (sentinel rows kept). Picker allows free-text fallback for new construction / source gaps."
- `docs/SSOT/BACKLOG.md`:
  - New row: "P2.27 Cities truncation fix + city-dependent street picker" with this spec as the design link.

## 12. Rollout

- **PR 1 (small, low risk):** city cap fix + 2 new unit tests. Targets `dev`, auto-squash-merge.
- **PR 2 (larger):** schema migration + seed + repository + `SearchablePicker` + 4 surfaces + tests + spec updates. Targets `dev` after PR 1 is in, auto-squash-merge once CI is green.
- No feature flag — UI changes are forward-compatible (text column unchanged).
- No DB rollback complications: dropping the `streets` table and the two new ID columns is reversible without data loss because the text columns remain authoritative.

## 13. Out of scope (deferred)

- Street synonyms / fuzzy match (data exists in `israel-streets-synom` package).
- Server-side validation that street belongs to selected city.
- Search-by-street in the feed / universal search.
- Automated periodic re-sync of the streets table (today: manual via re-running the generator + new migration).
- A Postgres trigger/check that flags out-of-source street IDs.
