// PostFilterSheet — bottom-sheet for the Home Feed's sort + filter affordances.
// Mapped to SRS: FR-FEED-004 (filter modal), FR-FEED-005 (persisted state),
// FR-FEED-006 (distance sort), FR-FEED-018 (shared component),
// FR-FEED-020 (followers-only scope).
//
// State pattern: the sheet keeps a local snapshot of the store so the user
// can preview changes; "החל" commits, "נקה" resets. This mirrors the
// existing SearchFilterSheet UX and avoids feed flicker while picking.

import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type {
  Category,
  FeedSortOrder,
  FeedStatusFilter,
  ItemCondition,
  LocationFilter,
  PostType,
} from '@kc/domain';
import { colors, radius, spacing, typography } from '@kc/ui';
import { SortSection } from './SortSection';
import { FiltersSection } from './FiltersSection';
import { LocationFilterSection } from './LocationFilterSection';

export interface PostFilterValue {
  type: PostType | null;
  categories: Category[];
  itemConditions: ItemCondition[];
  /** Includes its own display name (`centerCityName`) so the picker re-hydrates correctly across reopens. */
  locationFilter: LocationFilter | null;
  statusFilter: FeedStatusFilter;
  sortOrder: FeedSortOrder;
  proximitySortCity: string | null;
  proximitySortCityName: string | null;
  followersOnly: boolean;
}

interface PostFilterSheetProps {
  visible: boolean;
  initial: PostFilterValue;
  onApply: (next: PostFilterValue) => void;
  onClear: () => void;
  onClose: () => void;
}

export function PostFilterSheet({
  visible,
  initial,
  onApply,
  onClear,
  onClose,
}: PostFilterSheetProps) {
  // Local snapshot — Modal stays mounted, so re-seed each time it opens.
  const [draft, setDraft] = useState<PostFilterValue>(initial);

  React.useEffect(() => {
    if (visible) setDraft(initial);
  }, [visible, initial]);

  const patch = <K extends keyof PostFilterValue>(k: K, v: PostFilterValue[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const handleApply = () => {
    onApply(draft);
    onClose();
  };
  const handleClear = () => {
    onClear();
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>סינון ומיון</Text>
            <Pressable onPress={handleClear} hitSlop={8}>
              <Text style={styles.clearText}>נקה הכל</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <SortSection
              sortOrder={draft.sortOrder}
              proximitySortCity={
                draft.proximitySortCity && draft.proximitySortCityName
                  ? { id: draft.proximitySortCity, name: draft.proximitySortCityName }
                  : null
              }
              onSortOrderChange={(s) => patch('sortOrder', s)}
              onProximitySortCityChange={(c) => {
                setDraft((d) => ({
                  ...d,
                  proximitySortCity: c?.id ?? null,
                  proximitySortCityName: c?.name ?? null,
                }));
              }}
            />
            <FiltersSection
              type={draft.type}
              categories={draft.categories}
              itemConditions={draft.itemConditions}
              statusFilter={draft.statusFilter}
              followersOnly={draft.followersOnly}
              onTypeChange={(t) => patch('type', t)}
              onCategoriesChange={(c) => patch('categories', c)}
              onItemConditionsChange={(i) => patch('itemConditions', i)}
              onStatusFilterChange={(s) => patch('statusFilter', s)}
              onFollowersOnlyChange={(v) => patch('followersOnly', v)}
            />
            <LocationFilterSection
              value={draft.locationFilter}
              onChange={(next) => patch('locationFilter', next)}
            />
          </ScrollView>

          <Pressable style={styles.applyBtn} onPress={handleApply}>
            <Text style={styles.applyText}>החל</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '85%',
    paddingBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary },
  clearText: { ...typography.caption, color: colors.error, fontWeight: '600' as const },
  body: { flexGrow: 0 },
  bodyContent: { padding: spacing.base, paddingBottom: spacing.lg },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.base,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  applyText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
});
