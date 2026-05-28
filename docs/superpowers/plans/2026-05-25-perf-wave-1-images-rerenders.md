# Performance Wave 1 — Imaging + Re-renders Implementation Plan

> **For agentic workers:** Use superpowers:subagent-driven-development or superpowers:executing-plans.

**Goal:** Make scrolling and image loading feel instant. The wave the user feels most strongly. Closes TD-126; narrows TD-11 to CDN-only.

**Architecture:** Two parallel attack vectors — (1) cut image bandwidth/repaints via `expo-image` + Supabase Storage transform URLs + memoized URL composition; (2) cut re-render storms via Zustand selectors, `React.memo` on list items, `useCallback` on `renderItem`, `useMemo` on inline computations (date formatting, public-URL builders). All changes behind small wrapper helpers (`<KCImage>`, `getSupabasePublicImageUrl`) so future swaps are cheap.

**Spec mapping:** `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 1.

**Depends on:** Wave 0 merged.

**SSOT updates:** Add PERF-2 to BACKLOG.md, ✅. Close TD-126; narrow TD-11.

---

## File Structure

| File | Status | Responsibility |
| --- | --- | --- |
| `app/apps/mobile/src/lib/imageUrl.ts` | Create | `getSupabasePublicImageUrl(opts)` — appends transform params |
| `app/apps/mobile/src/lib/__tests__/imageUrl.test.ts` | Create | Unit test |
| `app/apps/mobile/src/components/ui/KCImage.tsx` | Create | Tiny `expo-image` wrapper. All image sites use it. |
| `app/apps/mobile/src/components/PostCardGrid.tsx` | Modify | `<KCImage>` + memoized URL + memoized date + `React.memo` |
| `app/apps/mobile/src/components/PostCard.tsx` | Modify | Same |
| `app/apps/mobile/src/components/PostFeedList.tsx` | Modify | useCallback `renderItem` + `keyExtractor` |
| `app/apps/mobile/src/components/AvatarInitials.tsx` | Modify | `<KCImage>` + `width: 96, quality: 75` |
| `app/apps/mobile/app/(tabs)/index.tsx` | Modify | `useFilterStore(useShallow(…))` |
| `app/apps/mobile/app/(tabs)/search.tsx` | Modify | `useSearchStore(useShallow(…))` |
| `app/apps/mobile/src/components/AuthGate.tsx` | Modify | Per-field `useAuthStore` selectors |
| `app/apps/mobile/src/components/OnboardingSoftGate.tsx:48` | Modify | `useMemo` on context value |
| (sweep) various | Modify | Other bare-store sites + other Provider value-objects |

---

## Pre-flight

- [ ] Wave 0 merged; Sentry dashboards collecting baseline.
- [ ] `git switch dev && git pull --ff-only && git switch -c feat/PERF-2-images-rerenders-fe`.

---

## Section A — Image URL helper

### Task A1: `getSupabasePublicImageUrl` + test (TDD)

Test:

```typescript
import { describe, expect, it } from 'vitest';
import { getSupabasePublicImageUrl } from '../imageUrl';

describe('getSupabasePublicImageUrl', () => {
  it('appends width + quality params via /render/image/', () => {
    const url = getSupabasePublicImageUrl({ bucket: 'post-images', path: 'a/b.jpg', width: 400, quality: 80 });
    expect(url).toContain('/storage/v1/render/image/public/post-images/a/b.jpg');
    expect(url).toContain('width=400');
    expect(url).toContain('quality=80');
  });
  it('omits transform params via /object/public/ when none given', () => {
    const url = getSupabasePublicImageUrl({ bucket: 'avatars', path: 'x/y.jpg' });
    expect(url).toContain('/storage/v1/object/public/avatars/x/y.jpg');
    expect(url).not.toContain('?width');
  });
  it('returns empty string for empty path', () => {
    expect(getSupabasePublicImageUrl({ bucket: 'post-images', path: '' })).toBe('');
  });
});
```

Implementation:

```typescript
type Args = { bucket: string; path: string; width?: number; quality?: number; };

function getSupabaseBaseUrl(): string {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error('EXPO_PUBLIC_SUPABASE_URL not set');
  return url.replace(/\/$/, '');
}

export function getSupabasePublicImageUrl({ bucket, path, width, quality }: Args): string {
  if (!path) return '';
  const base = getSupabaseBaseUrl();
  const wantsTransform = typeof width === 'number' || typeof quality === 'number';
  if (!wantsTransform) return `${base}/storage/v1/object/public/${bucket}/${path}`;
  const params = new URLSearchParams();
  if (typeof width === 'number') params.set('width', String(width));
  if (typeof quality === 'number') params.set('quality', String(quality));
  return `${base}/storage/v1/render/image/public/${bucket}/${path}?${params.toString()}`;
}
```

Test PASS; commit `feat(images): add getSupabasePublicImageUrl with transform params (PERF-2)`.

---

## Section B — `<KCImage>` wrapper

```bash
cd app && pnpm --filter @kc/mobile add expo-image
```

Create `app/apps/mobile/src/components/ui/KCImage.tsx`:

```typescript
import React from 'react';
import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { StyleProp } from 'react-native';

type Props = {
  uri: string | null | undefined;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageProps['contentFit'];
  blurhash?: string;
  onLoad?: () => void;
};

const DEFAULT_PLACEHOLDER = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function KCImage({ uri, width, height, style, contentFit = 'cover', blurhash = DEFAULT_PLACEHOLDER, onLoad }: Props) {
  if (!uri) return null;
  return (
    <Image
      source={uri}
      style={[{ width, height }, style]}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={150}
      placeholder={{ blurhash }}
      onLoad={onLoad}
    />
  );
}
```

Typecheck; commit `feat(images): add KCImage expo-image wrapper (PERF-2)`.

---

## Section C — Migrate consumers

### Task C1: PostCardGrid

In `PostCardGrid.tsx`:

```typescript
import { KCImage } from './ui/KCImage';
import { getSupabasePublicImageUrl } from '../lib/imageUrl';
import { formatDistanceToNow } from 'date-fns';
import { he } from 'date-fns/locale';

// Inside the component:
const firstAsset = post.mediaAssets?.[0];
const imageUrl = React.useMemo(
  () => getSupabasePublicImageUrl({ bucket: 'post-images', path: firstAsset?.path ?? '', width: 400, quality: 80 }),
  [firstAsset?.path],
);
const timeLabel = React.useMemo(
  () => formatDistanceToNow(new Date(post.createdAt), { locale: he, addSuffix: true }),
  [post.createdAt],
);

// Replace existing <Image>:
<KCImage uri={imageUrl || null} style={styles.image} contentFit="cover" onLoad={onImageLoadOnce /* from Wave 0 */} />

// Wrap in React.memo at the bottom:
function PostCardGridInner(props: Props) { /* existing body */ }
export const PostCardGrid = React.memo(PostCardGridInner);
```

Update import sites if default → named. Typecheck; commit `perf(post): memo + KCImage + memoized date for PostCardGrid (PERF-2)`.

### Task C2: PostCard

Same three transforms — URL memo, date memo, `React.memo` wrap. Commit `perf(post): memo + KCImage + memoized date for PostCard (PERF-2)`.

### Task C3: AvatarInitials

In `AvatarInitials.tsx`:

```typescript
import { KCImage } from './ui/KCImage';
import { getSupabasePublicImageUrl } from '../lib/imageUrl';

const transformedUrl = React.useMemo(() => {
  if (!avatarUrl) return null;
  if (avatarUrl.startsWith('http')) return avatarUrl; // upstream pre-built URL
  return getSupabasePublicImageUrl({ bucket: 'avatars', path: avatarUrl, width: 96, quality: 75 });
}, [avatarUrl]);

<KCImage uri={transformedUrl} width={size} height={size} style={styles.avatar} />
```

Wrap in `React.memo`. If upstream passes pre-built URLs, also fix upstream to pass raw paths (grep producer). Commit `perf(avatars): KCImage + transform URL for AvatarInitials (PERF-2)`.

---

## Section D — Stable `renderItem`

In `PostFeedList.tsx:75-113`:

```typescript
const renderItem = React.useCallback(
  ({ item }: { item: PostWithOwner }) => (
    <PostCardGrid
      post={item}
      onPressOverride={onCardPress ? () => onCardPress(item) : undefined}
    />
  ),
  [onCardPress],
);
const keyExtractor = React.useCallback((p: PostWithOwner) => p.postId, []);
```

If `onCardPress` is per-item (creating new function refs), lift to take a stable id:

```typescript
const onCardPress = React.useCallback((postId: string) => { router.push({ pathname: '/post/[id]', params: { id: postId } }); }, [router]);
```

Pass `postId` to PostCardGrid; let it call `onCardPress(post.postId)`. Commit.

---

## Section E — Store selectors

### E1: Grep bare calls

```bash
grep -rn --include='*.ts' --include='*.tsx' \
  'useFilterStore()\|useAuthStore()\|useChatStore()\|useFeedStore()\|useSearchStore()\|useThemeStore()' \
  app/apps/mobile/
```

Each result is a fix site. Build a checklist.

### E2: `(tabs)/index.tsx:34`

```typescript
import { useShallow } from 'zustand/react/shallow';

const filter = useFilterStore(
  useShallow((s) => ({
    type: s.type,
    categories: s.categories,
    sortOrder: s.sortOrder,
    locationFilter: s.locationFilter,
    itemConditions: s.itemConditions,
    statusFilter: s.statusFilter,
  })),
);
```

Audit `filter.X` accesses in the file — every field used must appear in the selector. Commit per file.

### E3: `(tabs)/search.tsx:66`

Same `useShallow` treatment, listing every field accessed. Commit.

### E4: `AuthGate.tsx:44`

Split destructure into per-field selectors:

```typescript
const session = useAuthStore((s) => s.session);
const isLoading = useAuthStore((s) => s.isLoading);
const onboardingState = useAuthStore((s) => s.onboardingState);
// etc.
```

Commit.

### E5: Sweep remaining sites — one commit per fix.

---

## Section F — Memo Provider values

In `OnboardingSoftGate.tsx:48`:

```typescript
const value = React.useMemo(() => ({ requestSoftGate }), [requestSoftGate]);
return <SoftGateContext.Provider value={value}>{children}</SoftGateContext.Provider>;
```

Grep more sites: `grep -rn "Provider value={{" app/apps/mobile/src/`. Wrap each in `useMemo`. Single commit `perf(context): memoize Provider values to stop subtree thrash (PERF-2)`.

---

## Section G — SSOT + PR

Close TD-126 in `TECH_DEBT.md`. If `useFeedRealtime` stale-closure sub-bullet still open (Wave 2 territory), narrow the row to that. Leave TD-11 open with note "CDN added in Wave 4; client-side transforms now exist".

Add PERF-2 under P2 of `BACKLOG.md`:

```
| PERF-2 | Performance Wave 1 — KCImage + transform URLs + React.memo + Zustand selectors + memoized date/URL composition | agent-fe | ✅ Done | `docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md` § Wave 1; `docs/superpowers/plans/2026-05-25-perf-wave-1-images-rerenders.md` |
```

### Verification

```bash
cd app && pnpm typecheck && pnpm test && pnpm lint
```

Web smoke: DevTools Network → image requests use `/render/image/public/...?width=400&quality=80`. Reload → cached returns `200 (disk cache)` or `304`, not full bytes. React DevTools profiler → PostCardGrid stable render count during scroll.

Sentry: compare `feed.first_render` and `image.first_paint` p50 vs Wave 0 baseline. Targets: ≥30% drop feed.first_render, ≥50% drop image.first_paint.

### Push + PR

```bash
git push -u origin feat/PERF-2-images-rerenders-fe
gh pr create --base dev --head feat/PERF-2-images-rerenders-fe \
  --title "perf: Wave 1 — KCImage + transform URLs + memo sweep (PERF-2)" \
  --body "..." --label "PERF" --assignee "@me"
gh pr merge --auto --squash --delete-branch
```

PR body cites spec, lists changes, includes measured impact (replace `{X}%` placeholders with real numbers from Sentry).
