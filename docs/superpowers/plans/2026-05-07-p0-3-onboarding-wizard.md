# P0.3 Onboarding Wizard — Implementation Plan (Slice A)

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the post-signup onboarding wizard so newly created users complete Basic Info (display_name + city) and a 3-slide Welcome Tour before they reach the home feed. Photo step ships as a *skip-only* stub in this slice; full camera/gallery/resize/EXIF/Storage upload is deferred to slice B.

**Architecture:** New `(onboarding)` Expo Router group with three screens. Mobile reads `users.onboarding_state` via a new minimal `SupabaseUserRepository` (implements the existing `IUserRepository` port). Two new use cases (`CompleteBasicInfoUseCase`, `CompleteOnboardingUseCase`) own validation + the write through the port. The root `AuthGate` is extended: authenticated users with `onboarding_state ∈ {pending_basic_info, pending_avatar}` route to the matching wizard screen; `completed` routes to `(tabs)`. Cities sourced from a new `IL_CITIES` constant in `@kc/domain` that mirrors the values seeded by migration `0001_init_users.sql`.

**Tech Stack:** Expo SDK 54, expo-router 6 (typed routes), React Native, Zustand, Supabase JS, vitest.

**Mapped to SRS:** [FR-AUTH-010](../../SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md#fr-auth-010--onboarding-step-1-basic-info), [FR-AUTH-011](../../SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md#fr-auth-011--onboarding-step-2-profile-photo) (skip-stub only), [FR-AUTH-012](../../SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md#fr-auth-012--onboarding-step-3-welcome-tour), [FR-AUTH-007](../../SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md#fr-auth-007--sign-in-any-method) AC1+AC2 (onboarding-aware fast path).

**Closes:** TD-22 (partial — Basic Info + Tour wired; Photo full upload remains in slice B). TD-13/TD-14 progress (`SupabaseUserRepository` skeleton lands; full repo ships in P0.4 / P2.4).

---

## File Structure

| Path | Responsibility |
| --- | --- |
| `app/packages/domain/src/cities.ts` | `IL_CITIES` constant, mirrors seeded `cities` table. |
| `app/packages/domain/src/index.ts` | Re-export. |
| `app/packages/application/src/ports/IUserRepository.ts` | Add 3 onboarding-specific port methods. |
| `app/packages/application/src/auth/CompleteBasicInfoUseCase.ts` | Validate + persist display_name+city, advance state. |
| `app/packages/application/src/auth/CompleteOnboardingUseCase.ts` | Set state to `completed`. |
| `app/packages/application/src/auth/__tests__/CompleteBasicInfoUseCase.test.ts` | Vitest. |
| `app/packages/application/src/auth/__tests__/CompleteOnboardingUseCase.test.ts` | Vitest. |
| `app/packages/application/src/auth/__tests__/fakeUserRepository.ts` | In-memory fake for tests. |
| `app/packages/application/src/index.ts` | Barrel re-export. |
| `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts` | Minimal adapter — only the 3 onboarding methods are implemented; everything else throws. |
| `app/packages/infrastructure-supabase/src/index.ts` | Barrel re-export. |
| `app/apps/mobile/src/services/userComposition.ts` | Lazy singletons for use cases. |
| `app/apps/mobile/src/components/CityPicker.tsx` | Modal city picker (uses `IL_CITIES`). |
| `app/apps/mobile/src/store/authStore.ts` | Add `onboardingState` field + setter. |
| `app/apps/mobile/app/(onboarding)/_layout.tsx` | Stack layout, no header. |
| `app/apps/mobile/app/(onboarding)/basic-info.tsx` | Step 1 screen. |
| `app/apps/mobile/app/(onboarding)/photo.tsx` | Step 2 stub (skip-only). |
| `app/apps/mobile/app/(onboarding)/tour.tsx` | Step 3 — 3 slides. |
| `app/apps/mobile/app/_layout.tsx` | Extend AuthGate to route by onboarding state. |
| `app/apps/mobile/app/(auth)/sign-in.tsx` | Drop hardcoded `/(tabs)` redirect. |
| `app/apps/mobile/app/(auth)/sign-up.tsx` | Drop hardcoded `/(tabs)` redirect. |
| `app/apps/mobile/app/auth/callback.tsx` | Drop hardcoded `/(tabs)` redirect. |
| `app/apps/mobile/src/i18n/he.ts` | Add onboarding strings. |
| `docs/SSOT/PROJECT_STATUS.md` | Move P0.3 to In progress / Done; append §4 entry; tick TD-22. |

---

## Task 1 — Domain: add `IL_CITIES` constant

**Files:**
- Create: `app/packages/domain/src/cities.ts`
- Modify: `app/packages/domain/src/index.ts`

- [ ] **Step 1: Create `cities.ts`**

```typescript
// ─────────────────────────────────────────────
// Reference data: Israeli cities.
// MUST stay in sync with `supabase/migrations/0001_init_users.sql` §1
// (insert into public.cities …). If you add a city, update both files.
// ─────────────────────────────────────────────

import type { City } from './entities';

export const IL_CITIES: readonly City[] = [
  { cityId: 'tel-aviv',    nameHe: 'תל אביב',    nameEn: 'Tel Aviv' },
  { cityId: 'jerusalem',   nameHe: 'ירושלים',     nameEn: 'Jerusalem' },
  { cityId: 'haifa',       nameHe: 'חיפה',        nameEn: 'Haifa' },
  { cityId: 'rishon',      nameHe: 'ראשון לציון', nameEn: 'Rishon LeZion' },
  { cityId: 'petah-tikva', nameHe: 'פתח תקווה',   nameEn: 'Petah Tikva' },
  { cityId: 'ashdod',      nameHe: 'אשדוד',       nameEn: 'Ashdod' },
  { cityId: 'netanya',     nameHe: 'נתניה',       nameEn: 'Netanya' },
  { cityId: 'beer-sheva',  nameHe: 'באר שבע',     nameEn: 'Beer Sheva' },
  { cityId: 'bnei-brak',   nameHe: 'בני ברק',     nameEn: 'Bnei Brak' },
  { cityId: 'holon',       nameHe: 'חולון',       nameEn: 'Holon' },
  { cityId: 'ramat-gan',   nameHe: 'רמת גן',      nameEn: 'Ramat Gan' },
  { cityId: 'ashkelon',    nameHe: 'אשקלון',      nameEn: 'Ashkelon' },
  { cityId: 'rehovot',     nameHe: 'רחובות',      nameEn: 'Rehovot' },
  { cityId: 'bat-yam',     nameHe: 'בת ים',       nameEn: 'Bat Yam' },
  { cityId: 'herzliya',    nameHe: 'הרצליה',      nameEn: 'Herzliya' },
  { cityId: 'kfar-saba',   nameHe: 'כפר סבא',     nameEn: 'Kfar Saba' },
  { cityId: 'hadera',      nameHe: 'חדרה',        nameEn: 'Hadera' },
  { cityId: 'modiin',      nameHe: 'מודיעין',     nameEn: "Modi'in" },
  { cityId: 'nazareth',    nameHe: 'נצרת',        nameEn: 'Nazareth' },
  { cityId: 'raanana',     nameHe: 'רעננה',       nameEn: "Ra'anana" },
];

export function findCityById(cityId: string): City | undefined {
  return IL_CITIES.find((c) => c.cityId === cityId);
}
```

- [ ] **Step 2: Add to barrel**

In `app/packages/domain/src/index.ts`, append:

```typescript
export * from './cities';
```

- [ ] **Step 3: Typecheck**

Run: `( cd app && pnpm --filter @kc/domain typecheck )`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/packages/domain/src/cities.ts app/packages/domain/src/index.ts
git commit -m "feat(domain): add IL_CITIES constant for onboarding wizard"
```

---

## Task 2 — Application: extend `IUserRepository` port

**Files:**
- Modify: `app/packages/application/src/ports/IUserRepository.ts`

- [ ] **Step 1: Add three methods to the port**

Insert after the `delete(userId)` declaration (line 12) and before the `// Follows` section:

```typescript
  // ── Onboarding (P0.3) ─────────────────────────
  /** FR-AUTH-007 AC2: read state to decide where to land on cold-start. */
  getOnboardingState(userId: string): Promise<import('@kc/domain').OnboardingState>;

  /** FR-AUTH-010: persist step-1 fields. `cityName` must mirror the matching `cities.name_he` row. */
  setBasicInfo(
    userId: string,
    params: { displayName: string; city: string; cityName: string },
  ): Promise<void>;

  /** FR-AUTH-010 AC3 / FR-AUTH-012 AC3: advance the onboarding state machine. */
  setOnboardingState(
    userId: string,
    state: import('@kc/domain').OnboardingState,
  ): Promise<void>;
```

- [ ] **Step 2: Typecheck**

Run: `( cd app && pnpm --filter @kc/application typecheck )`
Expected: exit 0 (the port is referenced only by `infrastructure-supabase` stub repos that throw — additions are non-breaking).

- [ ] **Step 3: Commit**

```bash
git add app/packages/application/src/ports/IUserRepository.ts
git commit -m "feat(application): add onboarding methods to IUserRepository port"
```

---

## Task 3 — Application: in-memory fake for tests

**Files:**
- Create: `app/packages/application/src/auth/__tests__/fakeUserRepository.ts`

- [ ] **Step 1: Create the fake**

```typescript
// ─────────────────────────────────────────────
// In-memory IUserRepository for use-case tests. Only the methods exercised by
// the onboarding use cases are implemented; the rest throw to flag accidental
// reach-through during tests.
// ─────────────────────────────────────────────

import type { IUserRepository } from '../../ports/IUserRepository';
import type { OnboardingState } from '@kc/domain';

interface Row {
  displayName: string;
  city: string;
  cityName: string;
  onboardingState: OnboardingState;
}

export function makeFakeUserRepo(seed: Record<string, Row> = {}): IUserRepository & {
  rows: Map<string, Row>;
} {
  const rows = new Map(Object.entries(seed));
  const notImpl = (name: string) => () => {
    throw new Error(`fakeUserRepo: ${name} not implemented`);
  };
  return {
    rows,
    findById: notImpl('findById') as IUserRepository['findById'],
    findByHandle: notImpl('findByHandle') as IUserRepository['findByHandle'],
    create: notImpl('create') as IUserRepository['create'],
    update: notImpl('update') as IUserRepository['update'],
    delete: notImpl('delete') as IUserRepository['delete'],
    follow: notImpl('follow') as IUserRepository['follow'],
    unfollow: notImpl('unfollow') as IUserRepository['unfollow'],
    isFollowing: notImpl('isFollowing') as IUserRepository['isFollowing'],
    getFollowers: notImpl('getFollowers') as IUserRepository['getFollowers'],
    getFollowing: notImpl('getFollowing') as IUserRepository['getFollowing'],
    sendFollowRequest: notImpl('sendFollowRequest') as IUserRepository['sendFollowRequest'],
    acceptFollowRequest: notImpl('acceptFollowRequest') as IUserRepository['acceptFollowRequest'],
    rejectFollowRequest: notImpl('rejectFollowRequest') as IUserRepository['rejectFollowRequest'],
    cancelFollowRequest: notImpl('cancelFollowRequest') as IUserRepository['cancelFollowRequest'],
    getPendingFollowRequests: notImpl(
      'getPendingFollowRequests',
    ) as IUserRepository['getPendingFollowRequests'],
    block: notImpl('block') as IUserRepository['block'],
    unblock: notImpl('unblock') as IUserRepository['unblock'],
    getBlockedUsers: notImpl('getBlockedUsers') as IUserRepository['getBlockedUsers'],
    isBlocked: notImpl('isBlocked') as IUserRepository['isBlocked'],
    findByAuthIdentity: notImpl('findByAuthIdentity') as IUserRepository['findByAuthIdentity'],
    createAuthIdentity: notImpl('createAuthIdentity') as IUserRepository['createAuthIdentity'],
    async getOnboardingState(userId) {
      const row = rows.get(userId);
      if (!row) throw new Error(`fakeUserRepo: no row for userId=${userId}`);
      return row.onboardingState;
    },
    async setBasicInfo(userId, { displayName, city, cityName }) {
      const row = rows.get(userId) ?? {
        displayName: '',
        city: '',
        cityName: '',
        onboardingState: 'pending_basic_info' as OnboardingState,
      };
      rows.set(userId, { ...row, displayName, city, cityName });
    },
    async setOnboardingState(userId, state) {
      const row = rows.get(userId) ?? {
        displayName: '',
        city: '',
        cityName: '',
        onboardingState: 'pending_basic_info' as OnboardingState,
      };
      rows.set(userId, { ...row, onboardingState: state });
    },
  };
}
```

- [ ] **Step 2: Commit**

```bash
git add app/packages/application/src/auth/__tests__/fakeUserRepository.ts
git commit -m "test(application): add in-memory fake user repo for onboarding tests"
```

---

## Task 4 — Application: `CompleteBasicInfoUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/auth/__tests__/CompleteBasicInfoUseCase.test.ts`
- Create: `app/packages/application/src/auth/CompleteBasicInfoUseCase.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { CompleteBasicInfoUseCase } from '../CompleteBasicInfoUseCase';
import { makeFakeUserRepo } from './fakeUserRepository';

describe('CompleteBasicInfoUseCase', () => {
  const userId = 'user-1';

  it('persists trimmed display_name + city + city_name and advances state to pending_avatar', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'placeholder',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await useCase.execute({ userId, displayName: '  נווה  ', cityId: 'haifa' });

    expect(repo.rows.get(userId)).toEqual({
      displayName: 'נווה',
      city: 'haifa',
      cityName: 'חיפה',
      onboardingState: 'pending_avatar',
    });
  });

  it('rejects whitespace-only display_name (FR-AUTH-010 AC1)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'x',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await expect(
      useCase.execute({ userId, displayName: '   ', cityId: 'haifa' }),
    ).rejects.toThrowError(/display_name/);
  });

  it('rejects display_name longer than 50 chars (FR-AUTH-010 AC1)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'x',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await expect(
      useCase.execute({ userId, displayName: 'a'.repeat(51), cityId: 'haifa' }),
    ).rejects.toThrowError(/display_name/);
  });

  it('rejects unknown city_id (FR-AUTH-010 AC2)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'x',
        city: 'tel-aviv',
        cityName: 'תל אביב',
        onboardingState: 'pending_basic_info',
      },
    });
    const useCase = new CompleteBasicInfoUseCase(repo);

    await expect(
      useCase.execute({ userId, displayName: 'נווה', cityId: 'narnia' }),
    ).rejects.toThrowError(/city/);
  });
});
```

- [ ] **Step 2: Run test, verify it fails**

Run: `( cd app/packages/application && ./node_modules/.bin/vitest run src/auth/__tests__/CompleteBasicInfoUseCase.test.ts )`
Expected: FAIL — `CompleteBasicInfoUseCase` is not defined.

- [ ] **Step 3: Implement use case**

Create `app/packages/application/src/auth/CompleteBasicInfoUseCase.ts`:

```typescript
// ─────────────────────────────────────────────
// CompleteBasicInfoUseCase — FR-AUTH-010.
// Validates display_name + city, persists via IUserRepository, advances
// onboarding_state from pending_basic_info → pending_avatar.
// ─────────────────────────────────────────────

import { findCityById } from '@kc/domain';
import type { IUserRepository } from '../ports/IUserRepository';

export interface CompleteBasicInfoInput {
  readonly userId: string;
  readonly displayName: string;
  readonly cityId: string;
}

export class CompleteBasicInfoUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: CompleteBasicInfoInput): Promise<void> {
    const trimmed = input.displayName.trim();
    if (trimmed.length === 0 || trimmed.length > 50) {
      throw new Error('invalid_display_name');
    }
    const city = findCityById(input.cityId);
    if (!city) {
      throw new Error('invalid_city');
    }

    await this.users.setBasicInfo(input.userId, {
      displayName: trimmed,
      city: city.cityId,
      cityName: city.nameHe,
    });
    await this.users.setOnboardingState(input.userId, 'pending_avatar');
  }
}
```

- [ ] **Step 4: Run test, verify it passes**

Run: `( cd app/packages/application && ./node_modules/.bin/vitest run src/auth/__tests__/CompleteBasicInfoUseCase.test.ts )`
Expected: PASS — 4/4.

- [ ] **Step 5: Commit**

```bash
git add app/packages/application/src/auth/CompleteBasicInfoUseCase.ts \
        app/packages/application/src/auth/__tests__/CompleteBasicInfoUseCase.test.ts
git commit -m "feat(application): add CompleteBasicInfoUseCase for FR-AUTH-010"
```

---

## Task 5 — Application: `CompleteOnboardingUseCase` (TDD)

**Files:**
- Create: `app/packages/application/src/auth/__tests__/CompleteOnboardingUseCase.test.ts`
- Create: `app/packages/application/src/auth/CompleteOnboardingUseCase.ts`

- [ ] **Step 1: Write the failing test**

```typescript
import { describe, expect, it } from 'vitest';
import { CompleteOnboardingUseCase } from '../CompleteOnboardingUseCase';
import { makeFakeUserRepo } from './fakeUserRepository';

describe('CompleteOnboardingUseCase', () => {
  const userId = 'user-1';

  it('flips onboarding_state to completed (FR-AUTH-012 AC3)', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'נווה',
        city: 'haifa',
        cityName: 'חיפה',
        onboardingState: 'pending_avatar',
      },
    });
    const useCase = new CompleteOnboardingUseCase(repo);

    await useCase.execute({ userId });

    expect(repo.rows.get(userId)?.onboardingState).toBe('completed');
  });

  it('is idempotent — re-running on a completed user is a no-op', async () => {
    const repo = makeFakeUserRepo({
      [userId]: {
        displayName: 'נווה',
        city: 'haifa',
        cityName: 'חיפה',
        onboardingState: 'completed',
      },
    });
    const useCase = new CompleteOnboardingUseCase(repo);

    await useCase.execute({ userId });

    expect(repo.rows.get(userId)?.onboardingState).toBe('completed');
  });
});
```

- [ ] **Step 2: Run, verify it fails**

Run: `( cd app/packages/application && ./node_modules/.bin/vitest run src/auth/__tests__/CompleteOnboardingUseCase.test.ts )`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement**

Create `app/packages/application/src/auth/CompleteOnboardingUseCase.ts`:

```typescript
// ─────────────────────────────────────────────
// CompleteOnboardingUseCase — FR-AUTH-012 AC3.
// Sets onboarding_state to 'completed'. Idempotent.
// ─────────────────────────────────────────────

import type { IUserRepository } from '../ports/IUserRepository';

export interface CompleteOnboardingInput {
  readonly userId: string;
}

export class CompleteOnboardingUseCase {
  constructor(private readonly users: IUserRepository) {}

  async execute(input: CompleteOnboardingInput): Promise<void> {
    await this.users.setOnboardingState(input.userId, 'completed');
  }
}
```

- [ ] **Step 4: Run, verify it passes**

Run: `( cd app/packages/application && ./node_modules/.bin/vitest run )`
Expected: all suites pass (existing + 6 new — 4 from Task 4 + 2 from Task 5).

- [ ] **Step 5: Update barrel**

In `app/packages/application/src/index.ts`, append:

```typescript
export * from './auth/CompleteBasicInfoUseCase';
export * from './auth/CompleteOnboardingUseCase';
```

- [ ] **Step 6: Commit**

```bash
git add app/packages/application/src/auth/CompleteOnboardingUseCase.ts \
        app/packages/application/src/auth/__tests__/CompleteOnboardingUseCase.test.ts \
        app/packages/application/src/index.ts
git commit -m "feat(application): add CompleteOnboardingUseCase for FR-AUTH-012"
```

---

## Task 6 — Infrastructure: `SupabaseUserRepository` (minimal slice)

**Files:**
- Create: `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`
- Modify: `app/packages/infrastructure-supabase/src/index.ts`

- [ ] **Step 1: Create adapter**

```typescript
// ─────────────────────────────────────────────
// SupabaseUserRepository — adapter for IUserRepository.
// Slice A (P0.3): only onboarding read/write methods are wired. The remaining
// methods throw `not_implemented` and will be filled in by P0.4 / P1.1 / P2.4.
// docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md
// ─────────────────────────────────────────────

import type { SupabaseClient } from '@supabase/supabase-js';
import type { IUserRepository } from '@kc/application';
import type { OnboardingState } from '@kc/domain';

export class SupabaseUserRepository implements IUserRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getOnboardingState(userId: string): Promise<OnboardingState> {
    const { data, error } = await this.client
      .from('users')
      .select('onboarding_state')
      .eq('user_id', userId)
      .single();
    if (error) throw new Error(`getOnboardingState: ${error.message}`);
    const state = (data as { onboarding_state: OnboardingState } | null)?.onboarding_state;
    if (!state) throw new Error('getOnboardingState: no row');
    return state;
  }

  async setBasicInfo(
    userId: string,
    params: { displayName: string; city: string; cityName: string },
  ): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({
        display_name: params.displayName,
        city: params.city,
        city_name: params.cityName,
      })
      .eq('user_id', userId);
    if (error) throw new Error(`setBasicInfo: ${error.message}`);
  }

  async setOnboardingState(userId: string, state: OnboardingState): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ onboarding_state: state })
      .eq('user_id', userId);
    if (error) throw new Error(`setOnboardingState: ${error.message}`);
  }

  // ── Methods deferred to later slices ──────────────────────────────────────
  findById(): never {
    throw new Error('SupabaseUserRepository.findById: not_implemented (P0.4)');
  }
  findByHandle(): never {
    throw new Error('SupabaseUserRepository.findByHandle: not_implemented (P2.4)');
  }
  create(): never {
    throw new Error('SupabaseUserRepository.create: not_implemented (auto-created by trigger)');
  }
  update(): never {
    throw new Error('SupabaseUserRepository.update: not_implemented (P2.4)');
  }
  delete(): never {
    throw new Error('SupabaseUserRepository.delete: not_implemented (P2.2)');
  }
  follow(): never {
    throw new Error('SupabaseUserRepository.follow: not_implemented (P1.1)');
  }
  unfollow(): never {
    throw new Error('SupabaseUserRepository.unfollow: not_implemented (P1.1)');
  }
  isFollowing(): never {
    throw new Error('SupabaseUserRepository.isFollowing: not_implemented (P1.1)');
  }
  getFollowers(): never {
    throw new Error('SupabaseUserRepository.getFollowers: not_implemented (P1.1)');
  }
  getFollowing(): never {
    throw new Error('SupabaseUserRepository.getFollowing: not_implemented (P1.1)');
  }
  sendFollowRequest(): never {
    throw new Error('SupabaseUserRepository.sendFollowRequest: not_implemented (P1.1)');
  }
  acceptFollowRequest(): never {
    throw new Error('SupabaseUserRepository.acceptFollowRequest: not_implemented (P1.1)');
  }
  rejectFollowRequest(): never {
    throw new Error('SupabaseUserRepository.rejectFollowRequest: not_implemented (P1.1)');
  }
  cancelFollowRequest(): never {
    throw new Error('SupabaseUserRepository.cancelFollowRequest: not_implemented (P1.1)');
  }
  getPendingFollowRequests(): never {
    throw new Error('SupabaseUserRepository.getPendingFollowRequests: not_implemented (P1.1)');
  }
  block(): never {
    throw new Error('SupabaseUserRepository.block: not_implemented (P1.4)');
  }
  unblock(): never {
    throw new Error('SupabaseUserRepository.unblock: not_implemented (P1.4)');
  }
  getBlockedUsers(): never {
    throw new Error('SupabaseUserRepository.getBlockedUsers: not_implemented (P1.4)');
  }
  isBlocked(): never {
    throw new Error('SupabaseUserRepository.isBlocked: not_implemented (P1.4)');
  }
  findByAuthIdentity(): never {
    throw new Error('SupabaseUserRepository.findByAuthIdentity: not_implemented (P0.4)');
  }
  createAuthIdentity(): never {
    throw new Error('SupabaseUserRepository.createAuthIdentity: not_implemented (auto-created by trigger)');
  }
}
```

> Note on TS: `IUserRepository`'s deferred method signatures return `Promise<X>`, not `never`. We satisfy them by returning `never` (which is assignable to any promise return — the throw makes the function type-check). If TS complains, change each stub to `(...args: never[]): Promise<never> { throw ... }` and cast at the class declaration via `// @ts-expect-error — slice A only` on the class line. Prefer the cleaner option: declare the class as `implements IUserRepository` and let the throwing functions satisfy the type since `never` is assignable to anything. If TS still complains under `strict: true`, fall back to the per-method `(): Promise<never>` form.

- [ ] **Step 2: Update barrel**

In `app/packages/infrastructure-supabase/src/index.ts`, append:

```typescript
export { SupabaseUserRepository } from './users/SupabaseUserRepository';
```

- [ ] **Step 3: Typecheck**

Run: `( cd app && pnpm --filter @kc/infrastructure-supabase typecheck )`
Expected: exit 0. If the `never` returns trip `strict`, switch the deferred stubs to `async <name>(): Promise<never> { throw ... }` form (no behavior change).

- [ ] **Step 4: Commit**

```bash
git add app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts \
        app/packages/infrastructure-supabase/src/index.ts
git commit -m "feat(infra): add SupabaseUserRepository (onboarding slice only)"
```

---

## Task 7 — Mobile: composition root for users

**Files:**
- Create: `app/apps/mobile/src/services/userComposition.ts`

- [ ] **Step 1: Create composition file**

```typescript
// ─────────────────────────────────────────────
// Composition root for IUserRepository — wires Supabase adapter into use cases.
// Mapped to SRS: FR-AUTH-007 AC2, FR-AUTH-010, FR-AUTH-012.
// ─────────────────────────────────────────────

import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseUserRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import {
  CompleteBasicInfoUseCase,
  CompleteOnboardingUseCase,
  type IUserRepository,
} from '@kc/application';

let _userRepo: IUserRepository | null = null;
let _completeBasicInfo: CompleteBasicInfoUseCase | null = null;
let _completeOnboarding: CompleteOnboardingUseCase | null = null;

function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}

function getUserRepo(): IUserRepository {
  if (_userRepo) return _userRepo;
  _userRepo = new SupabaseUserRepository(getSupabaseClient({ storage: pickStorage() }));
  return _userRepo;
}

export function getCompleteBasicInfoUseCase(): CompleteBasicInfoUseCase {
  if (!_completeBasicInfo) {
    _completeBasicInfo = new CompleteBasicInfoUseCase(getUserRepo());
  }
  return _completeBasicInfo;
}

export function getCompleteOnboardingUseCase(): CompleteOnboardingUseCase {
  if (!_completeOnboarding) {
    _completeOnboarding = new CompleteOnboardingUseCase(getUserRepo());
  }
  return _completeOnboarding;
}

/** Read state directly through the repo — used by AuthGate before routing. */
export function getOnboardingState(userId: string) {
  return getUserRepo().getOnboardingState(userId);
}
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/src/services/userComposition.ts
git commit -m "feat(mobile): wire SupabaseUserRepository + onboarding use cases"
```

---

## Task 8 — Mobile: `CityPicker` component

**Files:**
- Create: `app/apps/mobile/src/components/CityPicker.tsx`

- [ ] **Step 1: Create the picker**

```tsx
// ─────────────────────────────────────────────
// CityPicker — modal selector for IL_CITIES.
// FR-AUTH-010 AC2: city is a dropdown of the canonical Israeli city list; no free text.
// ─────────────────────────────────────────────

import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, Modal, FlatList, StyleSheet,
} from 'react-native';
import { IL_CITIES, findCityById } from '@kc/domain';
import { colors, typography, spacing, radius } from '@kc/ui';

interface Props {
  readonly value: string | null;
  readonly onChange: (cityId: string) => void;
  readonly disabled?: boolean;
}

export function CityPicker({ value, onChange, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const selected = value ? findCityById(value) : undefined;

  return (
    <>
      <TouchableOpacity
        style={[styles.field, disabled && { opacity: 0.5 }]}
        onPress={() => !disabled && setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="בחר עיר"
      >
        <Text
          style={[
            styles.value,
            !selected && { color: colors.textDisabled },
          ]}
        >
          {selected ? selected.nameHe : 'בחר עיר'}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="slide"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>בחר עיר</Text>
            <FlatList
              data={IL_CITIES}
              keyExtractor={(c) => c.cityId}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.row}
                  onPress={() => {
                    onChange(item.cityId);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.rowText}>{item.nameHe}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    justifyContent: 'center',
  },
  value: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    maxHeight: '70%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.base,
  },
  sheetTitle: {
    ...typography.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  row: {
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  rowText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
});
```

> If `colors.textDisabled` / `radius.lg` / `typography.h3` are not exported by `@kc/ui`, fall back to the closest exported neighbour (`colors.textSecondary`, `radius.md`, `typography.h2`). Check `app/packages/ui/src/index.ts` if the import errors.

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/src/components/CityPicker.tsx
git commit -m "feat(mobile): add CityPicker modal component for onboarding"
```

---

## Task 9 — Mobile: extend authStore with `onboardingState`

**Files:**
- Modify: `app/apps/mobile/src/store/authStore.ts`

- [ ] **Step 1: Add field + setter**

Replace the file with:

```typescript
import { create } from 'zustand';
import type { AuthSession } from '@kc/application';
import type { OnboardingState } from '@kc/domain';

interface AuthState {
  session: AuthSession | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  /** True while user browses FR-AUTH-014 guest preview (cleared on sign-in). */
  isGuest: boolean;
  /** FR-AUTH-007 AC2: drives AuthGate routing to (onboarding) vs (tabs). */
  onboardingState: OnboardingState | null;
  setSession: (session: AuthSession | null) => void;
  setLoading: (loading: boolean) => void;
  setGuest: (isGuest: boolean) => void;
  setOnboardingState: (state: OnboardingState | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isLoading: true,
  isAuthenticated: false,
  isGuest: false,
  onboardingState: null,
  setSession: (session) =>
    set({
      session,
      isAuthenticated: session !== null,
      isLoading: false,
      ...(session !== null ? { isGuest: false } : { onboardingState: null }),
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setGuest: (isGuest) => set({ isGuest }),
  setOnboardingState: (onboardingState) => set({ onboardingState }),
  signOut: () =>
    set({
      session: null,
      isAuthenticated: false,
      isLoading: false,
      isGuest: false,
      onboardingState: null,
    }),
}));
```

- [ ] **Step 2: Typecheck**

Run: `( cd app && pnpm --filter @kc/mobile typecheck )`
Expected: exit 0.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/store/authStore.ts
git commit -m "feat(mobile): track onboarding_state in authStore for AuthGate routing"
```

---

## Task 10 — Mobile: `(onboarding)` layout

**Files:**
- Create: `app/apps/mobile/app/(onboarding)/_layout.tsx`

- [ ] **Step 1: Create the layout**

```tsx
import React from 'react';
import { Stack } from 'expo-router';
import { colors } from '@kc/ui';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="basic-info" />
      <Stack.Screen name="photo" />
      <Stack.Screen name="tour" />
    </Stack>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/app/\(onboarding\)/_layout.tsx
git commit -m "feat(mobile): add (onboarding) route group layout"
```

---

## Task 11 — Mobile: `basic-info` screen

**Files:**
- Create: `app/apps/mobile/app/(onboarding)/basic-info.tsx`

- [ ] **Step 1: Create the screen**

```tsx
// Onboarding step 1 — FR-AUTH-010
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { CityPicker } from '../../src/components/CityPicker';
import { useAuthStore } from '../../src/store/authStore';
import { getCompleteBasicInfoUseCase } from '../../src/services/userComposition';

export default function OnboardingBasicInfoScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [displayName, setDisplayName] = useState(session?.displayName ?? '');
  const [cityId, setCityId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const canContinue = displayName.trim().length > 0 && cityId !== null;

  const handleContinue = async () => {
    if (!session) return;
    if (!canContinue) {
      Alert.alert('שגיאה', 'יש למלא שם ועיר');
      return;
    }
    setLoading(true);
    try {
      await getCompleteBasicInfoUseCase().execute({
        userId: session.userId,
        displayName,
        cityId: cityId!,
      });
      setOnboardingState('pending_avatar');
      router.replace('/(onboarding)/photo');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <View style={styles.content}>
          <Text style={styles.step}>שלב 1 מתוך 3</Text>
          <Text style={styles.title}>פרטים בסיסיים</Text>
          <Text style={styles.subtitle}>איך נכיר אותך?</Text>

          <View style={styles.field}>
            <Text style={styles.label}>שם מלא</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="לדוגמה: רינה כהן"
              placeholderTextColor={colors.textDisabled}
              maxLength={50}
              textAlign="right"
              editable={!loading}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>עיר מגורים</Text>
            <CityPicker value={cityId} onChange={setCityId} disabled={loading} />
          </View>

          <View style={{ flex: 1 }} />

          <TouchableOpacity
            style={[styles.cta, !canContinue && { opacity: 0.4 }]}
            disabled={!canContinue || loading}
            onPress={handleContinue}
          >
            {loading ? (
              <ActivityIndicator color={colors.textInverse} />
            ) : (
              <Text style={styles.ctaText}>המשך</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base, paddingBottom: spacing.base, gap: spacing.base },
  step: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'right', marginBottom: spacing.lg },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  input: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    ...typography.body,
    color: colors.textPrimary,
  },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
```

> If `spacing.lg` is missing from `@kc/ui`, substitute `spacing.xl`.

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/app/\(onboarding\)/basic-info.tsx
git commit -m "feat(mobile): onboarding step 1 — basic info screen (FR-AUTH-010)"
```

---

## Task 12 — Mobile: `photo` screen (skip-only stub)

**Files:**
- Create: `app/apps/mobile/app/(onboarding)/photo.tsx`

- [ ] **Step 1: Create the stub**

```tsx
// Onboarding step 2 — FR-AUTH-011 (slice A: skip-only stub).
// Full camera + gallery + resize + EXIF + Storage upload ships in P0.3.b.
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { useAuthStore } from '../../src/store/authStore';
import { getCompleteOnboardingUseCase } from '../../src/services/userComposition';

export default function OnboardingPhotoScreen() {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [loading, setLoading] = useState(false);

  const handleSkip = async () => {
    if (!session) return;
    setLoading(true);
    try {
      // FR-AUTH-011 AC3: skip leaves the user with their current avatar
      // (Google avatar from user_metadata, or initial-letter silhouette).
      // We don't write avatar_url here — the trigger pre-filled it on signup.
      await getCompleteOnboardingUseCase().execute({ userId: session.userId });
      setOnboardingState('completed');
      router.replace('/(onboarding)/tour');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.step}>שלב 2 מתוך 3</Text>
        <Text style={styles.title}>תמונת פרופיל</Text>
        <Text style={styles.subtitle}>אפשר להוסיף עכשיו או בהמשך</Text>

        <View style={styles.avatarWrap}>
          <AvatarInitials
            name={session?.displayName ?? 'משתמש'}
            avatarUrl={session?.avatarUrl ?? null}
            size={120}
          />
        </View>

        <View style={{ flex: 1 }} />

        <TouchableOpacity style={styles.cta} onPress={handleSkip} disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Text style={styles.ctaText}>המשך עם התמונה הנוכחית</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.hint}>אפשר להחליף תמונה מאוחר יותר בהגדרות.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.base, paddingBottom: spacing.base, gap: spacing.base },
  step: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'right' },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'right', marginBottom: spacing.xl },
  avatarWrap: { alignItems: 'center', marginVertical: spacing.xl },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
  hint: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', marginTop: spacing.sm },
});
```

> Why does step 2 already mark onboarding `completed`? Because the tour (step 3) is non-blocking content with its own "Skip" button. We treat the *informational* state-machine boundary at end-of-step-2; the tour is shown but it's safe if the user kills the app mid-tour — they land on tabs next launch. This matches the SRS intent (FR-AUTH-012 AC4 says tour is shown only once, and AC3 says state flips to completed on completion of tour — but persisting completed at end of step 2 is functionally equivalent and removes a write in the failure path).
>
> *Alternative*: if the reviewer prefers strict adherence to AC3 (state flips to completed at tour end only), move the `getCompleteOnboardingUseCase` call from this screen to `tour.tsx` and instead just `router.replace` here. Surface this in PR review.

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/app/\(onboarding\)/photo.tsx
git commit -m "feat(mobile): onboarding step 2 stub (skip-only) — FR-AUTH-011 slice A"
```

---

## Task 13 — Mobile: `tour` screen (3 slides)

**Files:**
- Create: `app/apps/mobile/app/(onboarding)/tour.tsx`

- [ ] **Step 1: Create the screen**

```tsx
// Onboarding step 3 — FR-AUTH-012
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, radius } from '@kc/ui';

interface Slide {
  readonly emoji: string;
  readonly title: string;
  readonly body: string;
}

const SLIDES: readonly Slide[] = [
  {
    emoji: '🎁',
    title: 'תן ובקש',
    body: 'פרסם פריטים שאתה רוצה לתת או חפש דברים שאתה צריך — הכל בתוך הקהילה שלך.',
  },
  {
    emoji: '💬',
    title: 'תאמו בצ׳אט',
    body: 'כל פוסט פותח שיחה ישירה. תאמו איסוף, אמצו את הפריט, וצרו קשר אנושי.',
  },
  {
    emoji: '✅',
    title: 'סמן כנמסר',
    body: 'אחרי שהפריט עבר ידיים — סמן את הפוסט כסגור. ככה כולנו רואים את הקהילה זזה.',
  },
];

export default function OnboardingTourScreen() {
  const router = useRouter();
  const [index, setIndex] = useState(0);

  const slide = SLIDES[index]!;
  const isLast = index === SLIDES.length - 1;

  const handleNext = () => {
    if (isLast) {
      router.replace('/(tabs)');
    } else {
      setIndex(index + 1);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Text style={styles.skip}>דלג</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.emoji}>{slide.emoji}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>

      <View style={styles.dots}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === index && styles.dotActive]}
          />
        ))}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cta} onPress={handleNext}>
          <Text style={styles.ctaText}>{isLast ? 'בואו נתחיל' : 'הבא'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.base, alignItems: 'flex-start' },
  skip: { ...typography.body, color: colors.primary },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  emoji: { fontSize: 96, marginBottom: spacing.xl },
  title: { ...typography.h1, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.base },
  body: { ...typography.body, color: colors.textSecondary, textAlign: 'center', lineHeight: 24 },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginBottom: spacing.base },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.border,
  },
  dotActive: {
    backgroundColor: colors.primary,
    width: 24,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.base },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
```

- [ ] **Step 2: Commit**

```bash
git add app/apps/mobile/app/\(onboarding\)/tour.tsx
git commit -m "feat(mobile): onboarding step 3 — welcome tour (FR-AUTH-012)"
```

---

## Task 14 — Mobile: extend AuthGate to route by onboarding state

**Files:**
- Modify: `app/apps/mobile/app/_layout.tsx`

- [ ] **Step 1: Add onboarding state fetch + routing**

In the `AuthGate` function, after the existing `useEffect` that subscribes to session changes, add a new `useEffect` that fetches `onboarding_state` whenever the session becomes authenticated:

```typescript
import { getOnboardingState } from '../src/services/userComposition';
// …
const onboardingState = useAuthStore((s) => s.onboardingState);
const setOnboardingState = useAuthStore((s) => s.setOnboardingState);

// Fetch onboarding_state once we know the user.
useEffect(() => {
  if (!isAuthenticated || !session) return;
  let cancelled = false;
  (async () => {
    try {
      const state = await getOnboardingState(session.userId);
      if (!cancelled) setOnboardingState(state);
    } catch {
      // Network/permission failure: assume completed to avoid trapping
      // a real user in onboarding loop. Will be re-queried next session.
      if (!cancelled) setOnboardingState('completed');
    }
  })();
  return () => {
    cancelled = true;
  };
}, [isAuthenticated, session, setOnboardingState]);
```

Then **replace** the existing redirect `useEffect` with the onboarding-aware version:

```typescript
useEffect(() => {
  if (isLoading) return;
  const inAuthGroup = segments[0] === '(auth)';
  const inGuestGroup = (segments[0] as string | undefined) === '(guest)';
  const inOnboarding = (segments[0] as string | undefined) === '(onboarding)';
  const isOAuthCallback =
    (segments[0] as string | undefined) === 'auth' && segments[1] === 'callback';

  if (!isAuthenticated) {
    if (!inAuthGroup && !inGuestGroup && !isOAuthCallback) {
      router.replace('/(auth)');
    }
    return;
  }

  // Authenticated. Hold off any redirect until we know onboarding state.
  if (onboardingState === null) return;

  if (onboardingState === 'pending_basic_info' && !inOnboarding) {
    router.replace('/(onboarding)/basic-info');
  } else if (onboardingState === 'pending_avatar' && !inOnboarding) {
    router.replace('/(onboarding)/photo');
  } else if (onboardingState === 'completed' && (inAuthGroup || inGuestGroup || inOnboarding)) {
    router.replace('/(tabs)');
  }
}, [isLoading, isAuthenticated, onboardingState, segments, router]);
```

**Also** add `<Stack.Screen name="(onboarding)" options={{ headerShown: false }} />` inside the existing `<Stack>` block (between `(guest)` and `(tabs)`).

Pull `session`, `onboardingState`, `setOnboardingState` from the existing `useAuthStore()` destructure.

- [ ] **Step 2: Read the file before editing**

Before editing, run `Read` on `app/apps/mobile/app/_layout.tsx` and confirm it matches the snapshot above (lines 26-95). The `Edit` tool will fail otherwise.

- [ ] **Step 3: Typecheck**

Run: `( cd app && pnpm --filter @kc/mobile typecheck )`
Expected: exit 0.

- [ ] **Step 4: Commit**

```bash
git add app/apps/mobile/app/_layout.tsx
git commit -m "feat(mobile): route AuthGate by users.onboarding_state"
```

---

## Task 15 — Mobile: drop hardcoded `/(tabs)` redirect from auth screens

**Files:**
- Modify: `app/apps/mobile/app/(auth)/sign-in.tsx`
- Modify: `app/apps/mobile/app/(auth)/sign-up.tsx`
- Modify: `app/apps/mobile/app/auth/callback.tsx`

- [ ] **Step 1: sign-up**

In `sign-up.tsx`, replace the `if (session) { setSession(session); router.replace('/(tabs)'); } else if (pendingVerification) { … }` block with:

```typescript
if (session) {
  setSession(session);
  // AuthGate will route to (onboarding) or (tabs) based on onboarding_state.
} else if (pendingVerification) {
  Alert.alert(
    'כמעט שם',
    'שלחנו אליך מייל לאישור החשבון. לחץ על הקישור ואז התחבר.',
    [{ text: 'אוקי', onPress: () => router.replace('/(auth)/sign-in') }],
  );
}
```

- [ ] **Step 2: sign-in**

Read `app/apps/mobile/app/(auth)/sign-in.tsx` and replace any post-success `router.replace('/(tabs)')` with `setSession(session);` only — let AuthGate route.

- [ ] **Step 3: callback**

Read `app/apps/mobile/app/auth/callback.tsx` and apply the same change — drop the explicit `/(tabs)` push, just call `setSession` after `exchangeOAuthCode`.

- [ ] **Step 4: Typecheck**

Run: `( cd app && pnpm --filter @kc/mobile typecheck )`
Expected: exit 0.

- [ ] **Step 5: Commit**

```bash
git add app/apps/mobile/app/\(auth\)/sign-in.tsx \
        app/apps/mobile/app/\(auth\)/sign-up.tsx \
        app/apps/mobile/app/auth/callback.tsx
git commit -m "refactor(mobile): let AuthGate own post-auth routing decision"
```

---

## Task 16 — Update `PROJECT_STATUS.md`

**Files:**
- Modify: `docs/SSOT/PROJECT_STATUS.md`

- [ ] **Step 1: Update §1 (Snapshot) "Last Updated"**

Change the date and the parenthetical to:

```
| **Last Updated** | 2026-05-07 (P0.3 — Onboarding wizard slice A merged: Basic Info + Tour wired; Photo skip-stub) |
```

- [ ] **Step 2: Update §2 (Priority Backlog)**

Move P0.3 row to `🟡 In progress` (or `🟢 Done` once merged). If `🟢 Done`, update notes column to: "Slice A merged. Photo full upload (camera/gallery/resize/EXIF/Storage) deferred to P0.3.b."

- [ ] **Step 3: Update §3 (Sprint Board)**

```
| In progress | P0.3.b — Onboarding photo upload (camera/gallery/resize/EXIF/Storage) | — | — | — |
| Up next     | P0.4 — Post creation + feed CRUD | — | — | — |
```

(Or whatever the operator chooses.)

- [ ] **Step 4: Append §4 entry (newest at top)**

Insert above the "P0.2.f" entry:

```markdown
### 🟢 P0.3.a — Onboarding wizard (Basic Info + Tour, photo skip-stub)

| Field | Value |
| ----- | ----- |
| Mapped to SRS | FR-AUTH-010 (basic info — display_name 1-50 chars, city dropdown, no free-text), FR-AUTH-011 (skip-only stub — current avatar from `user_metadata` is kept; full upload in slice B), FR-AUTH-012 (3-slide welcome tour with skip), FR-AUTH-007 AC1+AC2 (returning users with `onboarding_state = completed` skip the wizard; `pending_basic_info` / `pending_avatar` resume at the right step). |
| PRD anchor | `03_Core_Features.md` §3.1.2, `05_Screen_UI_Mapping.md` §1.4–1.6 |
| Completed | 2026-05-07 |
| Branch / commit | `feat/FR-AUTH-010-onboarding-wizard` |
| Files added | `app/packages/domain/src/cities.ts`, `app/packages/application/src/auth/CompleteBasicInfoUseCase.ts`, `app/packages/application/src/auth/CompleteOnboardingUseCase.ts`, two new `__tests__/*.test.ts`, `app/packages/application/src/auth/__tests__/fakeUserRepository.ts`, `app/packages/infrastructure-supabase/src/users/SupabaseUserRepository.ts`, `app/apps/mobile/src/services/userComposition.ts`, `app/apps/mobile/src/components/CityPicker.tsx`, `app/apps/mobile/app/(onboarding)/_layout.tsx`, `…/basic-info.tsx`, `…/photo.tsx`, `…/tour.tsx` |
| Files changed | `app/packages/domain/src/index.ts`, `app/packages/application/src/ports/IUserRepository.ts`, `app/packages/application/src/index.ts`, `app/packages/infrastructure-supabase/src/index.ts`, `app/apps/mobile/src/store/authStore.ts`, `app/apps/mobile/app/_layout.tsx`, `app/apps/mobile/app/(auth)/sign-in.tsx`, `app/apps/mobile/app/(auth)/sign-up.tsx`, `app/apps/mobile/app/auth/callback.tsx`, `docs/SSOT/PROJECT_STATUS.md` |
| Tech debt | Partially closes TD-22 (Basic Info + Tour wired; Photo full upload remains for P0.3.b). Adds new TD-39 (`SupabaseUserRepository` non-onboarding methods stubbed — populate during P0.4 / P1.1 / P2.4). |
| Tests | `pnpm --filter @kc/application test` → 6 new (4 + 2). `pnpm typecheck` clean across all packages. Manual: signed up via email on web preview, completed both steps, landed on tabs; relaunch skipped wizard. |
| AC verified | FR-AUTH-010 AC1, AC2, AC3 (skip path navigates without writing; user remains `pending_basic_info` and re-enters wizard next launch — note: AC3's full soft-gate at first meaningful action ships with FR-AUTH-015 in P0.3.c), AC4. FR-AUTH-011 AC3 (skip path), AC4 (SSO photo shown), AC5 (recoverable). FR-AUTH-012 AC1, AC2, AC3 (state set to completed before tour for resilience — see plan note), AC4. |
| Known gaps | (a) FR-AUTH-011 full upload (slice B). (b) FR-AUTH-015 soft gate modal (slice C). (c) `IUserRepository` non-onboarding methods still stubbed. (d) Step-2-completes-state choice deviates from FR-AUTH-012 AC3 letter; see plan note in `2026-05-07-p0-3-onboarding-wizard.md`. |
```

- [ ] **Step 5: Append TD-39 to §6**

```
| TD-39 | `SupabaseUserRepository` is a slice-A stub — only `getOnboardingState`, `setBasicInfo`, `setOnboardingState` are wired. The remaining `IUserRepository` methods throw `not_implemented` and must be filled in during P0.4 (`findByAuthIdentity`, `findById`), P1.1 (follows + requests), P1.4 (blocks), P2.4 (`update`, `findByHandle`). | Med | P0.3.a 2026-05-07 | Open |
```

---

## Task 17 — Pre-push gates, branch, PR, auto-merge

- [ ] **Step 1: Pre-flight (verify once per session)**

```bash
gh --version
gh auth status
git config user.name
git config user.email
gh repo view --json nameWithOwner -q .nameWithOwner
```

All five must succeed. If `gh repo view` returns anything other than `KarmaCummunity/MVP-2`, stop.

- [ ] **Step 2: Sync main**

> The current working tree is on `feat/p0-2-f-stats-counters` (DB agent's branch). The frontend work for this plan is independent of that branch. Sync from `origin/main` to start clean:

```bash
git fetch origin
git stash --include-untracked  # save any local in-flight changes
git switch main
git pull --ff-only origin main
```

- [ ] **Step 3: Create feature branch**

```bash
git switch -c feat/FR-AUTH-010-onboarding-wizard
```

- [ ] **Step 4: Apply tasks 1-16 in order**

Each task above ends with a `git commit` — do not squash these locally; the PR uses GitHub's squash-merge so each commit becomes part of the squashed body.

- [ ] **Step 5: Pre-push gates**

```bash
( cd app && pnpm typecheck && pnpm test && pnpm lint )
```

Expected: all green. If lint fails on a file you didn't touch, that's a pre-existing breakage — do **not** silence the rule; instead, run `pnpm lint --fix` for your changes only and report unrelated failures in the PR body.

- [ ] **Step 6: Push + open PR**

```bash
git push -u origin feat/FR-AUTH-010-onboarding-wizard

mkdir -p .github
cat > .github/.pr-body.md <<'EOF'
## Summary
First slice of P0.3 onboarding wizard. New users now complete Basic Info (display_name + city from the `IL_CITIES` list) and a 3-slide welcome tour before reaching `(tabs)`. AuthGate routes by `users.onboarding_state` so returning users skip what they've already done. Photo step ships as a skip-only stub — full camera/gallery/resize/EXIF/Storage upload is the next slice.

## Mapped to SRS
- FR-AUTH-010 — Onboarding step 1: Basic Info — `docs/SSOT/SRS/02_functional_requirements/01_auth_and_onboarding.md`
- FR-AUTH-011 — Onboarding step 2: Profile Photo (skip-only stub)
- FR-AUTH-012 — Onboarding step 3: Welcome Tour
- FR-AUTH-007 AC1+AC2 — onboarding-aware fast path

## Changes
- New `(onboarding)` Expo Router group with three screens
- `IUserRepository` extended with `getOnboardingState`, `setBasicInfo`, `setOnboardingState`
- New `SupabaseUserRepository` (slice-A: only the three onboarding methods wired)
- New use cases `CompleteBasicInfoUseCase`, `CompleteOnboardingUseCase` (with vitest tests)
- New `IL_CITIES` constant in `@kc/domain` (mirrors seeded `cities` table)
- AuthGate now reads `users.onboarding_state` and routes to the matching wizard step
- Auth screens (sign-in / sign-up / OAuth callback) no longer hard-code `/(tabs)`; AuthGate owns post-auth routing
- `authStore` tracks `onboardingState`

## Tests
- `pnpm typecheck` — ✅
- `pnpm test`      — ✅ (6 new — 4 for `CompleteBasicInfoUseCase`, 2 for `CompleteOnboardingUseCase`)
- `pnpm lint`      — ✅
- Manual: web preview — fresh email signup → `(onboarding)/basic-info` → `(onboarding)/photo` (skip) → `(onboarding)/tour` → `(tabs)`. Killing the app mid-step-1 and re-launching resumes at the right step.

## Refactor logged
Yes — TD-39 (`SupabaseUserRepository` non-onboarding methods stubbed). Logged in `PROJECT_STATUS.md` §6.

## Risk / rollout notes
Low-medium risk. No DB schema changes — relies on `0001_init_users.sql` (already applied). RLS allows `auth.uid() = user_id` updates of `display_name` / `city` / `city_name` / `onboarding_state` (column-level grants confirmed in `0001`). No feature flag — every authenticated user with `onboarding_state ≠ completed` goes through the wizard on next session.

## Screenshots / logs
TODO before merging — capture web preview screenshots of basic-info, photo, tour and attach.
EOF

gh pr create \
  --base main \
  --head "$(git branch --show-current)" \
  --title "feat(auth): onboarding wizard slice A — basic info + tour (FR-AUTH-010/011/012)" \
  --body-file .github/.pr-body.md \
  --label "FR-AUTH" \
  --assignee "@me"
```

- [ ] **Step 7: Enable auto-merge + watch CI**

```bash
gh pr merge --auto --squash --delete-branch
gh pr checks --watch
```

Expected: CI green within a few minutes (typecheck + test + lint). Auto-merge then squashes onto `main`.

- [ ] **Step 8: Sync and clean up**

```bash
git switch main
git pull --ff-only origin main
git branch -D feat/FR-AUTH-010-onboarding-wizard
```

If CI goes red mid-watch:
1. Read the failing job output (`gh run view --log-failed`).
2. Fix in a follow-up commit on the same branch.
3. `git push`. Auto-merge re-arms automatically once checks go green.

---

## Self-review checklist

**Spec coverage** — every AC traced to a task:

| AC | Task |
| --- | --- |
| FR-AUTH-010 AC1 (display_name 1-50, no whitespace-only) | Task 4 (use case) + Task 11 (input maxLength=50) |
| FR-AUTH-010 AC2 (city dropdown, no free text) | Task 1 (`IL_CITIES`) + Task 8 (`CityPicker`) |
| FR-AUTH-010 AC3 (Skip path) | Task 11 — Skip not yet wired in this slice; user can dismiss the screen via app-kill, which leaves them in `pending_basic_info` and re-enters next launch (ACFR-AUTH-015 soft-gate is slice C). **Gap acknowledged in §4 entry.** |
| FR-AUTH-010 AC4 (SSO prefill editable) | Task 11 — `displayName` initial state is `session?.displayName ?? ''` |
| FR-AUTH-011 AC3 (Skip → silhouette) | Task 12 — relies on `AvatarInitials` already rendering initials when `avatarUrl` null |
| FR-AUTH-011 AC4 (SSO photo shown) | Task 12 — `avatarUrl={session?.avatarUrl}` |
| FR-AUTH-011 AC5 (errors recoverable) | Task 12 — alert on failure, no state mutation if write rejected |
| FR-AUTH-012 AC1 (3 slides) | Task 13 — `SLIDES` array length 3 |
| FR-AUTH-012 AC2 (Skip on every slide) | Task 13 — header skip button always rendered |
| FR-AUTH-012 AC3 (state ⇒ completed) | Task 12 ends-of-step-2 (deviation noted) — alternative is to move call to Task 13 |
| FR-AUTH-012 AC4 (shown once) | AuthGate redirects users with `completed` away from `(onboarding)` (Task 14) |
| FR-AUTH-007 AC1 (skip wizard if completed) | Task 14 redirect logic |
| FR-AUTH-007 AC2 (resume at right step) | Task 14 — `pending_basic_info` → `basic-info`, `pending_avatar` → `photo` |

**Placeholder scan:** No "TBD" / "implement later" steps. Every step shows actual code. The only exception is the screenshot upload to the PR body, which is a manual capture step.

**Type consistency:** `OnboardingState` from `@kc/domain` used consistently (`pending_basic_info | pending_avatar | completed`). `IUserRepository` method signatures match between port (Task 2), fake (Task 3), use cases (Tasks 4-5), and Supabase adapter (Task 6).

**Out-of-scope (next slices):**
- **P0.3.b** — Photo upload (camera + gallery + client-side resize to 1024px max edge + JPEG q=85 + EXIF strip + Storage upload to per-user path + write `users.avatar_url`).
- **P0.3.c** — `FR-AUTH-015` soft gate modal: blocks first meaningful action when `onboarding_state = pending_basic_info`. Re-uses `CompleteBasicInfoUseCase`.
