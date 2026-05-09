# Create-Post End-to-End Fix & Quality Sweep — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restore end-to-end Create-Post (currently 400 on every publish for both Give and Request) and bring the form to spec quality — canonical `CityPicker`, valid `street_number`, location-display-level chooser, optional images for Request, disabled-until-valid Publish button, and meaningful Hebrew error mapping. Closes TD-101, TD-103, TD-104, TD-105.

**Architecture:** Multi-layer fix that respects Clean Architecture invariants:

- **Domain** — add a `STREET_NUMBER_PATTERN` constant mirroring the DB CHECK regex (single source of truth in code).
- **Application** — extend `PostError` with constraint codes; tighten `CreatePostUseCase` validation; map Postgres error codes (`23503` FK, `23514` CHECK, `42501` RLS) inside `SupabasePostRepository` to typed `PostError`s instead of bare `Error("create.post: …")`.
- **UI (`apps/mobile`)** — replace the free-text city input with the existing `CityPicker` (already used in `basic-info.tsx` + `edit-profile.tsx`); drop the `isGive` guard around `PhotoPicker`; introduce a small `LocationDisplayLevelChooser` component; compute `isFormValid` to disable Publish until the form is sound.

The 400 root cause is that the create form posts free-typed Hebrew text into `posts.city`, which is `text not null references public.cities(city_id)` (a 1,306-row seeded slug table). The FK check fails before RLS even runs. Secondary risk: `street_number` has a strict regex CHECK (`^[0-9]+[A-Za-z]?$`) that fires on Hebrew letters or punctuation, also returning 400.

**Tech Stack:** TypeScript, React Native + Expo SDK 54, expo-router 6 (typed routes), Supabase JS SDK 2.x, `@tanstack/react-query` 5, vitest for unit tests. Monorepo (pnpm + turbo). RTL Hebrew enforced.

**SRS map:** FR-POST-001, FR-POST-002 (canonical address + AC4 disabled-until-valid), FR-POST-003 (locationDisplayLevel chooser), FR-POST-004 (Request may attach optional images), FR-POST-019 AC1 (city-id canonical).

**TD closed by this plan:** TD-101 (city free text), TD-103 (Request can't attach images), TD-104 (no locationDisplayLevel chooser), TD-105 (Publish enabled with empty required fields). New TDs may open if a sub-issue is discovered mid-execution; log them in the FE lane (`TD-111+`).

---

## File Structure

### Files to create

| Path | Responsibility |
| --- | --- |
| `app/apps/mobile/src/components/CreatePostForm/LocationDisplayLevelChooser.tsx` | Three-option pill selector for `'CityOnly' \| 'CityAndStreet' \| 'FullAddress'`. Pure presentation, ~70 lines. |

### Files to modify

| Path | Why |
| --- | --- |
| `app/packages/domain/src/value-objects.ts` | Export `STREET_NUMBER_PATTERN` regex constant. |
| `app/packages/domain/src/index.ts` | Re-export `STREET_NUMBER_PATTERN`. |
| `app/packages/application/src/posts/errors.ts` | Add `street_number_invalid`, `city_not_found`, `address_invalid`, `forbidden` to `PostErrorCode`. |
| `app/packages/application/src/posts/CreatePostUseCase.ts` | Validate `streetNumber` against `STREET_NUMBER_PATTERN`. |
| `app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts` | Cover new validation branches. |
| `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts` | Map Postgres error codes to typed `PostError` in `create()`. |
| `app/apps/mobile/app/(tabs)/create.tsx` | Replace city `<TextInput>` with `<CityPicker>`; switch `city` state to `{ id, name } \| null`; drop `isGive` guard around `<PhotoPicker>`; add `LocationDisplayLevelChooser`; add `isFormValid` for disabled-until-valid Publish. |
| `app/apps/mobile/src/services/postMessages.ts` | Add Hebrew translations for the new error codes. |
| `docs/SSOT/PROJECT_STATUS.md` | Bump Last-Updated, add to "What works", note TD closures. |
| `docs/SSOT/TECH_DEBT.md` | Move TD-101, TD-103, TD-104, TD-105 to Resolved section. |
| `docs/SSOT/HISTORY.md` | Append a feature entry. |

> **Architecture invariants** (`.cursor/rules/srs-architecture.mdc`): keep each file ≤200 LOC. `create.tsx` is currently 322 LOC — pre-existing over-cap; this plan does not regress it (net change is roughly neutral since `LocationDisplayLevelChooser` extracts logic). If the file ends up larger, also extract the address block into `<AddressFields>` in a follow-up TD; do not block this fix on that extraction.

---

## Task 1 — Add `STREET_NUMBER_PATTERN` to domain layer

**Files:**
- Modify: `app/packages/domain/src/value-objects.ts`
- Modify: `app/packages/domain/src/index.ts`

- [ ] **Step 1: Open `value-objects.ts` and find the address-related exports**

The file currently defines the `Address` interface. We add the regex constant in the same area so address invariants live together.

- [ ] **Step 2: Append the constant after the `Address` interface**

```ts
/**
 * Street number must be digits, optionally followed by a single Latin letter.
 * Mirrors the DB CHECK on `posts.street_number` (`0002_init_posts.sql:31`).
 * Keep these two definitions in sync.
 */
export const STREET_NUMBER_PATTERN = /^[0-9]+[A-Za-z]?$/;
```

- [ ] **Step 3: Re-export from `app/packages/domain/src/index.ts`**

Add `STREET_NUMBER_PATTERN` to the existing barrel export. Find the line that re-exports value-object members and include the new symbol.

- [ ] **Step 4: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS (no broken imports).

- [ ] **Step 5: Commit**

```bash
git add app/packages/domain/src/value-objects.ts app/packages/domain/src/index.ts
git commit -m "feat(domain): export STREET_NUMBER_PATTERN matching DB CHECK"
```

---

## Task 2 — Extend `PostErrorCode` with constraint-failure codes

**Files:**
- Modify: `app/packages/application/src/posts/errors.ts`

- [ ] **Step 1: Add four new codes to `PostErrorCode`**

```ts
export type PostErrorCode =
  | 'title_required'
  | 'title_too_long'
  | 'description_too_long'
  | 'address_required'
  | 'address_invalid'           // NEW — covers street_number regex / city not found
  | 'street_number_invalid'     // NEW
  | 'city_not_found'            // NEW — FK violation on posts.city
  | 'image_required_for_give'
  | 'too_many_media_assets'
  | 'condition_required_for_give'
  | 'urgency_only_for_request'
  | 'condition_only_for_give'
  | 'visibility_downgrade_forbidden'
  | 'invalid_post_type'
  | 'invalid_visibility'
  | 'invalid_category'
  | 'invalid_location_display_level'
  | 'forbidden'                  // NEW — RLS rejected (auth/owner mismatch)
  | 'unknown';
```

Leave the `PostError` class itself unchanged.

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS — `postMessages.ts` will fail later because the `MESSAGES: Record<PostErrorCode, string>` is no longer exhaustive. We fix that in Task 5; for now this typecheck pass confirms `errors.ts` compiles. **If the FE typecheck breaks, ignore it for this commit — Task 5 closes it.**

If you prefer a green typecheck at every commit, defer this Step 2 to after Task 5.

- [ ] **Step 3: Commit**

```bash
git add app/packages/application/src/posts/errors.ts
git commit -m "feat(application): add post error codes for address/RLS failures"
```

---

## Task 3 — Add `streetNumber` regex validation in `CreatePostUseCase` (TDD)

**Files:**
- Test: `app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts`
- Modify: `app/packages/application/src/posts/CreatePostUseCase.ts`

- [ ] **Step 1: Open the existing test file and inspect its style**

```bash
cat app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts | head -60
```

Note the test fixture builder (probably `makeInput()` or inline `const input = { … }`). Reuse it.

- [ ] **Step 2: Add three failing test cases**

Append after the last `describe`/`it` block. Use the same builder pattern already in the file. Replace `makeInput` below with whatever the file uses.

```ts
import { STREET_NUMBER_PATTERN } from '@kc/domain';

describe('CreatePostUseCase — street_number validation', () => {
  it('rejects street_number with Hebrew letter', async () => {
    const repo = { create: vi.fn() } as unknown as IPostRepository;
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(makeInput({ streetNumber: '12א' })))
      .rejects.toMatchObject({ code: 'street_number_invalid' });
    expect(repo.create).not.toHaveBeenCalled();
  });

  it('rejects street_number with punctuation', async () => {
    const repo = { create: vi.fn() } as unknown as IPostRepository;
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(makeInput({ streetNumber: '12/3' })))
      .rejects.toMatchObject({ code: 'street_number_invalid' });
  });

  it('accepts plain digits and digit+latin-letter', async () => {
    const repo = { create: vi.fn().mockResolvedValue(makePost()) } as unknown as IPostRepository;
    const uc = new CreatePostUseCase(repo);
    await expect(uc.execute(makeInput({ streetNumber: '12' }))).resolves.toBeDefined();
    await expect(uc.execute(makeInput({ streetNumber: '12B' }))).resolves.toBeDefined();
  });
});
```

If `makeInput` doesn't exist, define it locally at the top of the new `describe`:

```ts
const makeInput = (overrides: Partial<CreatePostInput> = {}): CreatePostInput => ({
  ownerId: 'u1',
  type: 'Request',
  visibility: 'Public',
  title: 'בקשה',
  description: null,
  category: 'Other',
  address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'ביאליק', streetNumber: '12' },
  locationDisplayLevel: 'CityAndStreet',
  itemCondition: null,
  urgency: null,
  mediaAssets: [],
  ...overrides,
  address: { city: 'tel-aviv', cityName: 'תל אביב', street: 'ביאליק', streetNumber: '12', ...(overrides.address ?? {}) },
});
```

- [ ] **Step 3: Run tests to confirm they fail**

```bash
pnpm --filter @kc/application test -- CreatePostUseCase
```

Expected: 3 new tests FAIL with "expected to reject … did not reject" or similar.

- [ ] **Step 4: Implement validation in `CreatePostUseCase`**

In `validate()`, after the existing `if (!input.address.city || !input.address.street || !input.address.streetNumber)` block, add:

```ts
if (!STREET_NUMBER_PATTERN.test(input.address.streetNumber.trim()))
  throw new PostError('street_number_invalid', 'street_number_invalid');
```

Add the import at the top:

```ts
import { TITLE_MAX_CHARS, DESCRIPTION_MAX_CHARS, MAX_MEDIA_ASSETS, STREET_NUMBER_PATTERN } from '@kc/domain';
```

- [ ] **Step 5: Run tests to confirm they pass**

```bash
pnpm --filter @kc/application test -- CreatePostUseCase
```

Expected: all tests PASS, no regressions in the existing suite.

- [ ] **Step 6: Commit**

```bash
git add app/packages/application/src/posts/CreatePostUseCase.ts \
        app/packages/application/src/posts/__tests__/CreatePostUseCase.test.ts
git commit -m "feat(application): validate street_number pattern in CreatePostUseCase"
```

---

## Task 4 — Map Postgres error codes to typed `PostError` in adapter

**Files:**
- Modify: `app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts`

The current `create()` does `if (insertErr) throw new Error(\`create.post: ${insertErr.message}\`)` which loses the structured error info. We replace it so the FE can show a precise Hebrew message.

- [ ] **Step 1: Add a small helper at the top of the file (below the imports)**

```ts
import { PostError, type PostErrorCode } from '@kc/application';

interface PostgresErrorShape {
  readonly code?: string;
  readonly message?: string;
  readonly details?: string;
}

function mapInsertError(err: PostgresErrorShape): PostError {
  // Postgres error codes:
  //   23503 = foreign_key_violation       → city_id not in cities (city_not_found)
  //   23514 = check_violation             → street_number regex / type-fields coupling
  //   23502 = not_null_violation          → missing required column
  //   42501 = insufficient_privilege      → RLS policy denied
  const pgCode = err.code ?? '';
  const detail = `${err.message ?? ''} ${err.details ?? ''}`;
  let code: PostErrorCode = 'unknown';
  if (pgCode === '23503') {
    code = detail.includes('city') ? 'city_not_found' : 'address_invalid';
  } else if (pgCode === '23514') {
    if (detail.includes('street_number')) code = 'street_number_invalid';
    else if (detail.includes('type_fields')) code = 'invalid_post_type';
    else code = 'address_invalid';
  } else if (pgCode === '23502') {
    code = 'address_required';
  } else if (pgCode === '42501') {
    code = 'forbidden';
  }
  return new PostError(code, `create.post: ${err.message ?? pgCode}`, err);
}
```

- [ ] **Step 2: Replace the existing error throw in `create()`**

Find this block (around line 117):

```ts
if (insertErr) throw new Error(`create.post: ${insertErr.message}`);
```

Replace with:

```ts
if (insertErr) throw mapInsertError(insertErr as unknown as PostgresErrorShape);
```

Leave the rest of `create()` untouched — `media_assets` insert and the orphan-cleanup logic are correct.

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS. (`PostError` is already exported from `@kc/application`.)

- [ ] **Step 4: Run application + infrastructure tests**

```bash
pnpm --filter @kc/application test
pnpm --filter @kc/infrastructure-supabase test 2>&1 || true
```

Expected: existing tests still pass. `infrastructure-supabase` may have no tests yet (TD-31) — that's acceptable.

- [ ] **Step 5: Commit**

```bash
git add app/packages/infrastructure-supabase/src/posts/SupabasePostRepository.ts
git commit -m "feat(infra): map Postgres error codes to typed PostError on post insert"
```

---

## Task 5 — Add Hebrew translations for new error codes

**Files:**
- Modify: `app/apps/mobile/src/services/postMessages.ts`

- [ ] **Step 1: Add four entries to the `MESSAGES` map**

Insert before the `unknown` line:

```ts
  street_number_invalid: 'מספר הבית לא תקין. השתמש בספרות בלבד (אפשר אות לועזית בסוף, למשל 12 או 12B).',
  city_not_found: 'העיר שנבחרה לא נמצאה ברשימה. אנא בחר עיר מהרשימה.',
  address_invalid: 'הכתובת שהוזנה אינה תקינה.',
  forbidden: 'אין לך הרשאה לפרסם פוסט זה. נסה להתחבר מחדש.',
```

- [ ] **Step 2: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS — `MESSAGES: Record<PostErrorCode, string>` is now exhaustive again.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/services/postMessages.ts
git commit -m "feat(mobile): hebrew translations for create-post constraint errors"
```

---

## Task 6 — Replace city `<TextInput>` with `<CityPicker>` in create form

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/create.tsx`

This is the primary user-visible fix. Closes **TD-101**.

- [ ] **Step 1: Update state declarations**

Find:

```ts
const [city, setCity] = useState('');
const [street, setStreet] = useState('');
const [streetNumber, setStreetNumber] = useState('');
```

Replace `city` line with:

```ts
const [city, setCity] = useState<{ id: string; name: string } | null>(null);
```

Keep `street` and `streetNumber` as plain strings.

- [ ] **Step 2: Add the import**

At the top of the file, alongside other component imports:

```ts
import { CityPicker } from '../../src/components/CityPicker';
```

- [ ] **Step 3: Update the publish payload**

Find:

```ts
address: { city, cityName: city, street, streetNumber },
```

Replace with:

```ts
address: { city: city!.id, cityName: city!.name, street, streetNumber },
```

The non-null assertion is safe because Step 5 below adds `isFormValid` that blocks Publish when `city === null`.

- [ ] **Step 4: Replace the city `<TextInput>` JSX**

Find this block (around line 193-202):

```tsx
<View style={styles.section}>
  <Text style={styles.sectionLabel}>כתובת <Text style={styles.required}>*</Text></Text>
  <TextInput
    style={styles.input}
    value={city}
    onChangeText={setCity}
    placeholder="עיר"
    placeholderTextColor={colors.textDisabled}
    textAlign="right"
  />
  <View style={styles.streetRow}>
```

Replace the city `<TextInput>` (only the city input — keep the street row unchanged) with:

```tsx
<View style={styles.section}>
  <Text style={styles.sectionLabel}>כתובת <Text style={styles.required}>*</Text></Text>
  <CityPicker value={city} onChange={setCity} disabled={isPublishing} />
  <View style={styles.streetRow}>
```

- [ ] **Step 5: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/create.tsx
git commit -m "fix(mobile): use CityPicker in create-post form (close TD-101)"
```

---

## Task 7 — Allow Request to attach optional images (close TD-103)

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/create.tsx`

- [ ] **Step 1: Find the conditional `<PhotoPicker>` block**

Around line 153:

```tsx
{isGive && (
  <PhotoPicker
    uploads={uploads}
    isUploading={uploadingCount > 0}
    uploadingCount={uploadingCount}
    required={true}
    onAdd={handlePick}
    onRemove={handleRemove}
  />
)}
```

- [ ] **Step 2: Drop the `isGive` guard and make `required` dynamic**

Replace with:

```tsx
<PhotoPicker
  uploads={uploads}
  isUploading={uploadingCount > 0}
  uploadingCount={uploadingCount}
  required={isGive}
  onAdd={handlePick}
  onRemove={handleRemove}
/>
```

Spec: FR-POST-004 AC2 — Request may attach 0–5 optional images. The use-case already enforces `mediaAssets.length === 0` is an error **only for Give**.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/create.tsx
git commit -m "fix(mobile): request posts may attach optional images (close TD-103)"
```

---

## Task 8 — Add `LocationDisplayLevelChooser` and wire it (close TD-104)

**Files:**
- Create: `app/apps/mobile/src/components/CreatePostForm/LocationDisplayLevelChooser.tsx`
- Modify: `app/apps/mobile/app/(tabs)/create.tsx`

- [ ] **Step 1: Write the component**

```tsx
// LocationDisplayLevelChooser — FR-POST-003 AC3.
// Three-option pill selector for how much of the address shows publicly.
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { LocationDisplayLevel } from '@kc/domain';

interface Props {
  readonly value: LocationDisplayLevel;
  readonly onChange: (next: LocationDisplayLevel) => void;
  readonly disabled?: boolean;
}

const OPTIONS: { value: LocationDisplayLevel; label: string; hint: string }[] = [
  { value: 'CityOnly',       label: 'עיר בלבד',       hint: 'אנונימיות מרבית' },
  { value: 'CityAndStreet',  label: 'עיר ורחוב',      hint: 'מומלץ' },
  { value: 'FullAddress',    label: 'כתובת מלאה',     hint: 'כולל מספר בית' },
];

export function LocationDisplayLevelChooser({ value, onChange, disabled }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.label}>תצוגת מיקום בפוסט</Text>
      <View style={styles.row}>
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <TouchableOpacity
              key={opt.value}
              style={[styles.btn, active && styles.btnActive, disabled && { opacity: 0.5 }]}
              onPress={() => !disabled && onChange(opt.value)}
              accessibilityRole="button"
              accessibilityState={{ selected: active, disabled: !!disabled }}
            >
              <Text style={[styles.btnLabel, active && styles.btnLabelActive]}>{opt.label}</Text>
              <Text style={[styles.btnHint, active && styles.btnHintActive]}>{opt.hint}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  row: { flexDirection: 'row', gap: spacing.sm },
  btn: {
    flex: 1, paddingVertical: spacing.sm, paddingHorizontal: spacing.xs,
    borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border,
    alignItems: 'center', backgroundColor: colors.surface, gap: 2,
  },
  btnActive: { backgroundColor: colors.primarySurface, borderColor: colors.primary },
  btnLabel: { ...typography.label, color: colors.textSecondary },
  btnLabelActive: { color: colors.primary },
  btnHint: { ...typography.caption, color: colors.textDisabled },
  btnHintActive: { color: colors.primary },
});
```

- [ ] **Step 2: Wire it into `create.tsx`**

Add import:

```ts
import { LocationDisplayLevelChooser } from '../../src/components/CreatePostForm/LocationDisplayLevelChooser';
```

Replace the hardcoded `'CityAndStreet'` in `useState` declarations area. After `const [streetNumber, setStreetNumber] = useState('');` add:

```ts
const [locationDisplayLevel, setLocationDisplayLevel] = useState<LocationDisplayLevel>('CityAndStreet');
```

Add the `LocationDisplayLevel` type import:

```ts
import type { Category, ItemCondition, LocationDisplayLevel, PostType } from '@kc/domain';
```

In the publish payload, replace:

```ts
locationDisplayLevel: 'CityAndStreet',
```

with:

```ts
locationDisplayLevel,
```

Place the chooser in the JSX immediately after the address `<View style={styles.section}>` block and before the category section:

```tsx
<LocationDisplayLevelChooser
  value={locationDisplayLevel}
  onChange={setLocationDisplayLevel}
  disabled={isPublishing}
/>
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/src/components/CreatePostForm/LocationDisplayLevelChooser.tsx \
        app/apps/mobile/app/\(tabs\)/create.tsx
git commit -m "feat(mobile): location-display-level chooser in create form (close TD-104)"
```

---

## Task 9 — Disable Publish until form is valid (close TD-105)

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/create.tsx`

- [ ] **Step 1: Add `isFormValid` derivation**

Just above the `handlePublish` definition, insert:

```ts
const isFormValid =
  title.trim().length > 0 &&
  city !== null &&
  street.trim().length > 0 &&
  streetNumber.trim().length > 0 &&
  (!isGive || uploads.length > 0);
```

(`STREET_NUMBER_PATTERN` is intentionally NOT checked here — bad regex bubbles up as a Hebrew error from the use-case so we don't need to duplicate the rule client-side at the disable level. Validation in Task 3 catches it.)

- [ ] **Step 2: Wire it into the Publish button**

Find:

```tsx
<TouchableOpacity
  style={[styles.publishBtn, isPublishing && { opacity: 0.7 }]}
  onPress={handlePublish}
  disabled={isPublishing}
>
```

Replace with:

```tsx
<TouchableOpacity
  style={[styles.publishBtn, (isPublishing || !isFormValid) && { opacity: 0.5 }]}
  onPress={handlePublish}
  disabled={isPublishing || !isFormValid}
  accessibilityState={{ disabled: isPublishing || !isFormValid }}
>
```

- [ ] **Step 3: Run typecheck**

```bash
pnpm typecheck
```

Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/\(tabs\)/create.tsx
git commit -m "fix(mobile): disable Publish until form valid (close TD-105)"
```

---

## Task 10 — Manual verification (browser dev preview)

> **Per `feedback_verify_ui_before_claiming_done`:** typecheck/test/lint do not catch RN-Web layout or interaction bugs. Load the actual route and prove publishing works for both Give and Request before claiming done.

**Files:** none modified — verification only.

- [ ] **Step 1: Start the web dev server**

```bash
pnpm --filter @kc/mobile web
```

Wait until Metro reports the LAN URL (typically `http://192.168.x.x:8081`).

- [ ] **Step 2: Open the running preview**

Use the `mcp__Claude_Preview__preview_start` tool (or attach to the existing session) at the LAN URL. Sign in with the test account (memory: `supabase_project.md`).

- [ ] **Step 3: Test the Give path**

In the preview:
1. Tap the `+` tab → toggle to `🎁 לתת חפץ`.
2. Title: `מבחן — סופה`. Description: any.
3. Tap city → search `תל אביב` → select.
4. Street: `דיזנגוף`. Number: `12`.
5. Pick at least one image from the gallery.
6. Pick a condition (e.g., `טוב`).
7. Pick a `LocationDisplayLevel` (e.g., `עיר ורחוב`).
8. Tap **פרסם**.

Expected: success Alert (`✅ הפוסט שלך פורסם!`). The post appears at the top of the feed.

Use `mcp__Claude_Preview__preview_console_logs` to confirm zero 4xx/5xx network errors on the `posts` request, and `mcp__Claude_Preview__preview_network` to inspect the actual `POST /rest/v1/posts` payload (it should send `city: "tel-aviv"`, NOT `city: "תל אביב"`).

- [ ] **Step 4: Test the Request path**

Same flow but toggle to `🔍 לבקש חפץ`. Skip image (or attach one — verify TD-103 closure). Skip urgency. Publish. Expected: success Alert; post appears in feed with the request tag.

- [ ] **Step 5: Test the disabled-Publish guard**

Empty form → Publish button visibly dimmed and unresponsive. Fill fields one at a time → button becomes active only after all required fields populated. Take a screenshot for the PR description.

- [ ] **Step 6: Test the error mapping**

To verify error mapping (without breaking the user's data), temporarily simulate a city-not-found by:

```bash
# In a separate terminal, against a Supabase-CLI local DB only (NEVER prod):
psql "$LOCAL_DB_URL" -c "delete from public.cities where city_id = 'tel-aviv';"
```

Try to publish with Tel Aviv selected → expect Hebrew alert: "העיר שנבחרה לא נמצאה ברשימה. אנא בחר עיר מהרשימה." Then re-seed or restart the local DB.

If you're testing against the shared remote Supabase, **skip this sub-step** — it would corrupt shared data. Note in the PR description that error-mapping was unit-tested only, with browser verification deferred to a future local-Supabase setup.

- [ ] **Step 7: Capture proof**

Take a screenshot via `mcp__Claude_Preview__preview_screenshot` of:
1. The successful Give post in the feed.
2. The successful Request post in the feed.
3. The disabled Publish button on an empty form.

Save the file paths for the PR description.

- [ ] **Step 8: Stop the preview**

```
mcp__Claude_Preview__preview_stop
```

(or leave running if you'll iterate further).

- [ ] **Step 9: Commit verification artifacts (optional)**

If you want screenshots in the repo, save them under `docs/superpowers/plans/2026-05-09-fix-create-post-400-screenshots/` and commit. Otherwise attach them to the PR description only.

---

## Task 11 — Update SSOT documents

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`
- Modify: `docs/SSOT/TECH_DEBT.md`
- Modify: `docs/SSOT/HISTORY.md`

Per `.cursor/rules/project-status-tracking.mdc` this is mandatory — every feature/fix updates these.

- [ ] **Step 1: `PROJECT_STATUS.md`**

- Bump the `Last Updated` cell to today with a one-line summary, e.g.:
  > `2026-05-09 (Create-post end-to-end fix — CityPicker, street_number validation, location-display-level chooser, optional Request images, disabled-until-valid Publish, typed Postgres-error mapping. TD-101/103/104/105 closed.)`
- In §1 "What works end-to-end today" replace the existing Posts CRUD bullet with one that adds: "create form uses canonical CityPicker, validates street_number, lets user choose locationDisplayLevel".
- Active tech-debt count: subtract 4 (101/103/104/105 closed). Adjust the `Open tech-debt items` cell accordingly.
- §3 Sprint Board: no row change required (this is opportunistic-debt cleanup, not a new feature).

- [ ] **Step 2: `TECH_DEBT.md`**

- Move TD-101, TD-103, TD-104, TD-105 from the active table to the Resolved section. Use the existing format (one-line summary + close date `2026-05-09`).
- Example resolved entries:
  > `| TD-101 | Create form used <TextInput> for address.city; replaced with <CityPicker> (`apps/mobile/app/(tabs)/create.tsx`). Eliminates FK violations and aligns with FR-POST-019 AC1 / FR-POST-002 AC3 | 2026-05-09 |`

- [ ] **Step 3: `HISTORY.md`**

Append a new top entry (newest first):

```md
- 2026-05-09 — **Create-post end-to-end fix** — FR-POST-001…004, FR-POST-019 · branch `fix/FR-POST-001-fe-create-post-e2e` · vitest +3 (`CreatePostUseCase.test.ts` street_number cases) · TD closed: 101/103/104/105 · gaps: none in scope; future work tracked under TD-31 (adapter test coverage).
```

(Adjust the branch name to whatever you actually used.)

- [ ] **Step 4: Run `pnpm typecheck` + `pnpm lint:arch` once more**

```bash
pnpm typecheck && pnpm lint:arch
```

Expected: both PASS. `lint:arch` enforces the ≤200-LOC + domain-error rules.

- [ ] **Step 5: Commit and open PR**

```bash
git add docs/SSOT/PROJECT_STATUS.md docs/SSOT/TECH_DEBT.md docs/SSOT/HISTORY.md
git commit -m "docs(ssot): close TD-101/103/104/105 — create-post e2e fix"
gh pr create --title "fix(mobile): create-post e2e — city picker + validation + location-level (close TD-101/103/104/105)" --body "$(cat <<'EOF'
## Summary
- Replaces free-text city input with canonical `CityPicker` — fixes 400 from `posts.city` FK violation. Closes **TD-101**.
- Adds `STREET_NUMBER_PATTERN` validation in `CreatePostUseCase` mirroring the DB CHECK; new `street_number_invalid` Hebrew error.
- `SupabasePostRepository.create()` now maps Postgres error codes (23503/23514/23502/42501) to typed `PostError` instead of bare `Error`.
- Allows Request posts to attach optional images. Closes **TD-103**.
- Adds `LocationDisplayLevelChooser` (CityOnly / CityAndStreet / FullAddress). Closes **TD-104**.
- Disables Publish until required fields are populated. Closes **TD-105**.

## Test plan
- [ ] `pnpm typecheck && pnpm lint:arch` green.
- [ ] `pnpm --filter @kc/application test` — new `CreatePostUseCase` tests pass; existing 57 tests unchanged.
- [ ] Manual web preview: published a Give post and a Request post end-to-end (screenshots in description).
- [ ] Verified disabled-until-valid behaviour on the Publish button.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 6: Confirm CI is green and auto-merge takes the PR**

Per `.cursor/rules/git-workflow.mdc` PRs auto-merge on green CI (squash). Watch `gh pr view --web` until merged.

---

## Self-review

**1. Spec coverage** — every cited SRS ID is addressed:
- FR-POST-001 (create) — Tasks 3, 4, 6 (data flow restored).
- FR-POST-002 (canonical address + AC4 disabled) — Tasks 6, 9.
- FR-POST-003 (locationDisplayLevel) — Task 8.
- FR-POST-004 (optional images for Request) — Task 7.
- FR-POST-019 AC1 (city is canonical) — Task 6.

**2. Placeholder scan** — every step has actual code or a concrete command. `makeInput` shape inside Task 3 is fully spelled out. Postgres error-code mapping in Task 4 lists each code and its target `PostErrorCode` explicitly. The `LocationDisplayLevelChooser` component in Task 8 is fully implemented.

**3. Type consistency** — `CreatePostInput`, `PostError`, `PostErrorCode`, `LocationDisplayLevel`, `STREET_NUMBER_PATTERN` are referenced consistently. The `city` state shape `{ id: string; name: string } | null` matches what `CityPicker` already accepts (verified in `app/apps/mobile/src/components/CityPicker.tsx:18-22`). The publish payload mapping `city: city!.id, cityName: city!.name` matches what `edit-profile.tsx:94` and `basic-info.tsx:34-37` already do — the fix aligns this screen with the rest of the app.

**4. Risk surface** — Task 2 commits a temporarily non-exhaustive `Record<PostErrorCode, string>` type if Task 5 isn't run before typechecking. Documented in Task 2 Step 2 with explicit guidance.
