# Grid Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display 2 posts per row in the Home Feed and 3 posts per row in My Profile / Other Profile screens.

**Architecture:** Two new compact card components (`PostCardGrid` for feed, `PostCardProfile` for profile). Feed `FlatList` switches to `numColumns={2}`. Profile posts section switches from `map()` to a flex-wrap grid. The existing `PostCard` (full-width, post detail context) is unchanged.

**Tech Stack:** React Native `FlatList` (numColumns), `Dimensions` API for card sizing, existing `@kc/ui` tokens, `expo-router`.

---

## File Map

| Action | File | Responsibility |
|--------|------|----------------|
| Create | `app/apps/mobile/src/components/PostCardGrid.tsx` | Medium card for feed 2-col grid |
| Create | `app/apps/mobile/src/components/PostCardProfile.tsx` | Small square card for profile 3-col grid |
| Modify | `app/apps/mobile/app/(tabs)/index.tsx` | Switch FlatList to numColumns=2 + PostCardGrid |
| Modify | `app/apps/mobile/app/(tabs)/profile.tsx` | Switch post list to flex-wrap grid + PostCardProfile |

---

### Task 1: Create `PostCardGrid` — feed 2-column card

**Files:**
- Create: `app/apps/mobile/src/components/PostCardGrid.tsx`

Card width = `(screenWidth - outerPadding*2 - gap) / 2`.
Screen padding: `spacing.base` (16) on each side = 32 total.
Gap between columns: `spacing.sm` (8).
So: `(screenWidth - 32 - 8) / 2`.

Shows: image/icon area → type tag → title (2 lines) → author + time → location. No message button (too small).

- [ ] **Step 1: Create the component file**

```tsx
// app/apps/mobile/src/components/PostCardGrid.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import { colors, spacing, radius, shadow, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';
import { CATEGORY_LABELS } from '@kc/domain';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 2 columns, spacing.base (16) padding on each side, spacing.sm (8) gap between columns
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2;

interface PostCardGridProps {
  post: PostWithOwner;
  onPressOverride?: () => void;
}

export function PostCardGrid({ post, onPressOverride }: PostCardGridProps) {
  const router = useRouter();
  const isGive = post.type === 'Give';

  const timeAgo = formatDistanceToNow(new Date(post.createdAt), {
    addSuffix: true,
    locale: dateFnsHe,
  });

  const locationText = post.locationDisplayLevel === 'CityOnly'
    ? post.address.cityName
    : `${post.address.cityName}, ${post.address.street}`;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        onPressOverride ? onPressOverride() : router.push(`/post/${post.postId}`)
      }
    >
      {/* Image / icon area */}
      <View style={styles.imageArea}>
        <Text style={styles.categoryIcon}>
          {isGive ? '🎁' : '🔍'}
        </Text>
        {/* Type tag overlay */}
        <View style={[styles.typeTag, isGive ? styles.giveTag : styles.requestTag]}>
          <Text style={[styles.typeTagText, isGive ? styles.giveTagText : styles.requestTagText]}>
            {isGive ? 'לתת' : 'לבקש'}
          </Text>
        </View>
      </View>

      {/* Text content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.meta} numberOfLines={1}>
          {post.ownerName} · {timeAgo}
        </Text>
        <Text style={styles.location} numberOfLines={1}>📍 {locationText}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    ...shadow.card,
  },
  imageArea: {
    width: '100%',
    height: CARD_WIDTH * 0.7,
    backgroundColor: colors.skeleton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 36,
  },
  typeTag: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: {
    ...typography.label,
    fontSize: 10,
  },
  giveTagText: { color: colors.giveTag },
  requestTagText: { color: colors.requestTag },
  content: {
    padding: spacing.sm,
    gap: 2,
  },
  title: {
    ...typography.body,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: 'right',
    fontSize: 13,
  },
  meta: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  location: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
});
```

- [ ] **Step 2: Verify file saved correctly**

Run: `cat app/apps/mobile/src/components/PostCardGrid.tsx | head -5`
Expected: shows the import lines with no error.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/PostCardGrid.tsx
git commit -m "feat: add PostCardGrid component for 2-column feed layout"
```

---

### Task 2: Create `PostCardProfile` — profile 3-column card

**Files:**
- Create: `app/apps/mobile/src/components/PostCardProfile.tsx`

Card width = `(screenWidth - outerPadding*2 - gap*2) / 3`.
Outer padding: `spacing.base` (16) each side = 32.
Gap between columns: `spacing.xs` (4) × 2 = 8.
So: `(screenWidth - 32 - 8) / 3`.

Shows: square image/icon area → type tag overlay → title (1 line).

- [ ] **Step 1: Create the component file**

```tsx
// app/apps/mobile/src/components/PostCardProfile.tsx
import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, shadow, typography } from '@kc/ui';
import type { PostWithOwner } from '@kc/application';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
// 3 columns, spacing.base (16) padding each side, spacing.xs (4) gap × 2
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 2 - spacing.xs * 2) / 3;

interface PostCardProfileProps {
  post: PostWithOwner;
  onPressOverride?: () => void;
}

export function PostCardProfile({ post, onPressOverride }: PostCardProfileProps) {
  const router = useRouter();
  const isGive = post.type === 'Give';

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={() =>
        onPressOverride ? onPressOverride() : router.push(`/post/${post.postId}`)
      }
    >
      {/* Square image / icon area */}
      <View style={styles.imageArea}>
        <Text style={styles.categoryIcon}>
          {isGive ? '🎁' : '🔍'}
        </Text>
        {/* Type tag overlay */}
        <View style={[styles.typeTag, isGive ? styles.giveTag : styles.requestTag]}>
          <Text style={[styles.typeTagText, isGive ? styles.giveTagText : styles.requestTagText]}>
            {isGive ? 'לתת' : 'לבקש'}
          </Text>
        </View>
      </View>

      {/* Title */}
      <Text style={styles.title} numberOfLines={1}>{post.title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    ...shadow.card,
  },
  imageArea: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: colors.skeleton,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryIcon: {
    fontSize: 24,
  },
  typeTag: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.sm,
  },
  giveTag: { backgroundColor: colors.giveTagBg },
  requestTag: { backgroundColor: colors.requestTagBg },
  typeTagText: {
    ...typography.label,
    fontSize: 9,
  },
  giveTagText: { color: colors.giveTag },
  requestTagText: { color: colors.requestTag },
  title: {
    ...typography.caption,
    color: colors.textPrimary,
    textAlign: 'right',
    padding: spacing.xs,
  },
});
```

- [ ] **Step 2: Verify file saved correctly**

Run: `cat app/apps/mobile/src/components/PostCardProfile.tsx | head -5`
Expected: shows the import lines with no error.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/src/components/PostCardProfile.tsx
git commit -m "feat: add PostCardProfile component for 3-column profile grid layout"
```

---

### Task 3: Update Home Feed screen to 2-column grid

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/index.tsx`

Changes:
1. Import `PostCardGrid` instead of `PostCard`.
2. Add `numColumns={2}` to `FlatList`.
3. Add `columnWrapperStyle` to provide horizontal padding and gap between columns.
4. Update `renderItem` to use `PostCardGrid`.
5. Update `listContent` style: remove `paddingHorizontal` from individual cards (it's now on the list).

- [ ] **Step 1: Update the feed screen imports and FlatList**

Replace the FlatList section in `app/apps/mobile/app/(tabs)/index.tsx`:

```tsx
// Home Feed screen
// Mapped to: SRS §3.3.1, §3.3.2
import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, TextInput, Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { PostCardGrid } from '../../src/components/PostCardGrid';
import { EmptyState } from '../../src/components/EmptyState';
import { MOCK_POSTS } from '../../src/mock/data';
import { useFilterStore } from '../../src/store/filterStore';

export default function HomeFeedScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const activeCount = useFilterStore((s) => s.activeCount());

  const filteredPosts = MOCK_POSTS.filter((p) => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      (p.description ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/chat/')}
          >
            <Ionicons name="chatbubbles-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        <Image
          source={require('../../assets/logo.png')}
          style={styles.topBarLogo}
          resizeMode="contain"
        />

        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search bar */}
      <View style={styles.searchRow}>
        <View style={styles.searchInput}>
          <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={styles.searchText}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="חפש לפי מוצר, קטגוריה..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText('')}>
              <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity
          style={[styles.filterBtn, activeCount > 0 && styles.filterBtnActive]}
          onPress={() => {}}
        >
          <Ionicons
            name="options-outline"
            size={20}
            color={activeCount > 0 ? colors.textInverse : colors.textPrimary}
          />
          {activeCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Feed — 2 columns */}
      <FlatList
        data={filteredPosts}
        keyExtractor={(p) => p.postId}
        numColumns={2}
        columnWrapperStyle={styles.row}
        renderItem={({ item }) => <PostCardGrid post={item} />}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            emoji="🔍"
            title="לא נמצאו פוסטים"
            subtitle="נסה לשנות את הסינון או חפש בכל הערים."
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarLeft: { width: 44, alignItems: 'flex-start' },
  topBarRight: { width: 44, alignItems: 'flex-end' },
  topBarLogo: {
    height: 36,
    width: 36,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    height: 40,
    gap: spacing.xs,
  },
  searchIcon: { marginLeft: spacing.xs },
  searchText: {
    flex: 1,
    ...typography.body,
    color: colors.textPrimary,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  filterBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    ...typography.caption,
    color: colors.textInverse,
    fontSize: 10,
  },
  row: {
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingTop: spacing.base,
    paddingBottom: spacing['3xl'],
  },
});
```

- [ ] **Step 2: Run type check**

```bash
cd /path/to/repo && pnpm typecheck 2>&1 | grep -A2 "tabs/index"
```
Expected: no errors for `(tabs)/index.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/app/(tabs)/index.tsx
git commit -m "feat: switch home feed to 2-column grid layout"
```

---

### Task 4: Update Profile screen to 3-column grid

**Files:**
- Modify: `app/apps/mobile/app/(tabs)/profile.tsx`

Changes:
1. Import `PostCardProfile`.
2. Replace the `displayPosts.map((post) => <PostCard .../>)` block with a flex-wrap row container holding `PostCardProfile` items.
3. Use `flexDirection: 'row'`, `flexWrap: 'wrap'`, `gap: spacing.xs` in the container.
4. Remove `PostCard` import (no longer used in this file).

- [ ] **Step 1: Update profile.tsx**

Replace the relevant section. Full file content:

```tsx
// My Profile screen
// Mapped to: SRS §3.2.1
import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius, shadow } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { PostCardProfile } from '../../src/components/PostCardProfile';
import { EmptyState } from '../../src/components/EmptyState';
import { MOCK_USER, MOCK_POSTS } from '../../src/mock/data';

type Tab = 'active' | 'closed';

export default function ProfileScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('active');

  const user = MOCK_USER;
  // Show all mock posts on active tab since we have no "me" posts in mock data
  const displayPosts = MOCK_POSTS.slice(0, 6);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.topBarTitle}>הפרופיל שלי</Text>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => router.push('/settings')}
          >
            <Ionicons name="settings-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <AvatarInitials
              name={user.displayName}
              avatarUrl={user.avatarUrl}
              size={72}
            />
            <View style={styles.profileInfo}>
              <Text style={styles.displayName}>{user.displayName}</Text>
              <Text style={styles.city}>📍 {user.cityName}</Text>
              {user.biography ? (
                <Text style={styles.bio}>{user.biography}</Text>
              ) : null}
            </View>
          </View>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <StatItem count={user.followersCount} label="עוקבים" />
            <View style={styles.statDivider} />
            <StatItem count={user.followingCount} label="נעקבים" />
            <View style={styles.statDivider} />
            <StatItem count={user.activePostsCountInternal} label="פוסטים" />
          </View>

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.editBtn}>
              <Text style={styles.editBtnText}>ערוך פרופיל</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareBtn}>
              <Ionicons name="share-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              פוסטים פעילים
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'closed' && styles.tabActive]}
            onPress={() => setActiveTab('closed')}
          >
            <Text style={[styles.tabText, activeTab === 'closed' && styles.tabTextActive]}>
              פוסטים שנמסרו
            </Text>
          </TouchableOpacity>
        </View>

        {/* Posts — 3-column grid */}
        {activeTab === 'active' ? (
          displayPosts.length > 0 ? (
            <View style={styles.grid}>
              {displayPosts.map((post) => (
                <PostCardProfile key={post.postId} post={post} />
              ))}
            </View>
          ) : (
            <EmptyState
              emoji="📭"
              title="אין פוסטים פעילים"
              subtitle="פרסם את הפוסט הראשון שלך!"
            />
          )
        ) : (
          <EmptyState
            emoji="📦"
            title="אין פוסטים שנמסרו עדיין"
            subtitle="פוסטים שסגרת כ-נמסר יופיעו כאן."
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ count, label }: { count: number; label: string }) {
  return (
    <View style={statStyles.container}>
      <Text style={statStyles.count}>{count}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', gap: 2 },
  count: { ...typography.h2, color: colors.textPrimary },
  label: { ...typography.caption, color: colors.textSecondary },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: { ...typography.h3, color: colors.textPrimary },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  profileCard: {
    margin: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.base,
    ...shadow.card,
    gap: spacing.base,
  },
  profileHeader: {
    flexDirection: 'row',
    gap: spacing.base,
    alignItems: 'flex-start',
  },
  profileInfo: { flex: 1, gap: spacing.xs },
  displayName: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  city: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  bio: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statDivider: { width: 1, height: 32, backgroundColor: colors.border },
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  editBtn: {
    flex: 1,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBtnText: { ...typography.button, color: colors.textPrimary },
  shareBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  tabText: { ...typography.button, color: colors.textSecondary },
  tabTextActive: { color: colors.primary },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.base,
    gap: spacing.xs,
    paddingBottom: spacing['3xl'],
  },
});
```

- [ ] **Step 2: Run type check**

```bash
pnpm typecheck 2>&1 | grep -A2 "tabs/profile"
```
Expected: no errors for `(tabs)/profile.tsx`.

- [ ] **Step 3: Commit**

```bash
git add app/apps/mobile/app/(tabs)/profile.tsx
git commit -m "feat: switch profile posts to 3-column grid layout"
```

---

### Task 5: Final verification

- [ ] **Step 1: Run full type check**

```bash
pnpm typecheck
```
Expected: 0 errors.

- [ ] **Step 2: Verify no unused imports**

```bash
grep -r "PostCard'" app/apps/mobile/app/\(tabs\)/ --include="*.tsx"
```
Expected: only `PostCardGrid` in index.tsx, only `PostCardProfile` in profile.tsx. Neither should import the old `PostCard`.

- [ ] **Step 3: Final commit if needed**

Only if there are uncommitted changes.

---

## Spec coverage check

| Requirement | Task |
|-------------|------|
| Feed: 2 posts per row | Task 1 (PostCardGrid) + Task 3 (FlatList numColumns=2) |
| Profile: 3 posts per row | Task 2 (PostCardProfile) + Task 4 (flex-wrap grid) |
| PRD docs updated | Done before this plan (05_Screen_UI_Mapping.md, 03_Core_Features.md) |
| Type tags visible on compact cards | Both new components include typeTag overlay |
| RTL (textAlign: right) | Both components use `textAlign: 'right'` |
| Tap navigates to post detail | Both components call `router.push('/post/${post.postId}')` |
