// ─────────────────────────────────────────────
// SearchFilterSheet — bottom sheet for advanced search filters
// Mapped to SRS: FR-FEED-017+
//
// Uses local state that mirrors the Zustand store so the user can preview
// filter changes before applying. Pressing "Apply" writes to the store;
// pressing outside or "Clear" discards or resets changes.
//
// Sections: Sort, Post Type, Post Category, Donation Category, City.
// ─────────────────────────────────────────────

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
import { colors, radius, spacing, typography } from '@kc/ui';
import { ALL_CATEGORIES, DONATION_CATEGORY_SLUGS } from '@kc/domain';
import type { Category, DonationCategorySlug, PostType, SearchSortBy } from '@kc/domain';
import { search as t } from '../i18n/donations';
import { useSearchStore } from '../store/searchStore';
import { CityPicker } from './CityPicker';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SearchFilterSheet({ visible, onClose }: Props) {
  const store = useSearchStore();

  // Local state mirrors store so we can "cancel" changes
  const [postType, setPostType] = useState<PostType | null>(store.postType);
  const [category, setCategory] = useState<Category | null>(store.category);
  const [donationCategory, setDonationCategory] = useState<DonationCategorySlug | null>(
    store.donationCategory,
  );
  const [city, setCity] = useState<{ id: string; name: string } | null>(
    store.city ? { id: store.city, name: store.cityName ?? '' } : null,
  );
  const [sortBy, setSortBy] = useState<SearchSortBy>(store.sortBy);

  const handleApply = () => {
    store.setPostType(postType);
    store.setCategory(category);
    store.setDonationCategory(donationCategory);
    store.setCity(city?.id ?? null, city?.name ?? null);
    store.setSortBy(sortBy);
    onClose();
  };

  const handleClear = () => {
    setPostType(null);
    setCategory(null);
    setDonationCategory(null);
    setCity(null);
    setSortBy('relevance');
    store.clearFilters();
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <Pressable onPress={onClose} hitSlop={12}>
              <Ionicons name="close" size={24} color={colors.textPrimary} />
            </Pressable>
            <Text style={styles.headerTitle}>{t.filters}</Text>
            <Pressable onPress={handleClear}>
              <Text style={styles.clearText}>{t.clearFilters}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* Sort by */}
            <Text style={styles.sectionTitle}>{t.sortBy}</Text>
            <View style={styles.chipRow}>
              {(['relevance', 'newest', 'followers'] as SearchSortBy[]).map((s) => {
                const sortLabels: Record<string, string> = {
                  relevance: t.sortRelevance,
                  newest: t.sortNewest,
                  followers: t.sortFollowers,
                };
                return (
                  <Chip
                    key={s}
                    label={sortLabels[s] ?? s}
                    active={sortBy === s}
                    onPress={() => setSortBy(s)}
                  />
                );
              })}
            </View>

            {/* Post type */}
            <Text style={styles.sectionTitle}>{t.filterPostType}</Text>
            <View style={styles.chipRow}>
              <Chip
                label={t.all}
                active={!postType}
                onPress={() => setPostType(null)}
              />
              <Chip
                label={t.give}
                active={postType === 'Give'}
                onPress={() => setPostType(postType === 'Give' ? null : 'Give')}
              />
              <Chip
                label={t.request}
                active={postType === 'Request'}
                onPress={() => setPostType(postType === 'Request' ? null : 'Request')}
              />
            </View>

            {/* Post category */}
            <Text style={styles.sectionTitle}>{t.filterCategory}</Text>
            <View style={styles.chipRow}>
              <Chip
                label={t.all}
                active={!category}
                onPress={() => setCategory(null)}
              />
              {ALL_CATEGORIES.map((c) => (
                <Chip
                  key={c}
                  label={(t.categories as Record<string, string>)[c] ?? c}
                  active={category === c}
                  onPress={() => setCategory(category === c ? null : c)}
                />
              ))}
            </View>

            {/* Donation link category */}
            <Text style={styles.sectionTitle}>{t.filterDonationCategory}</Text>
            <View style={styles.chipRow}>
              <Chip
                label={t.all}
                active={!donationCategory}
                onPress={() => setDonationCategory(null)}
              />
              {DONATION_CATEGORY_SLUGS.map((slug) => (
                <Chip
                  key={slug}
                  label={(t.donationCategories as Record<string, string>)[slug] ?? slug}
                  active={donationCategory === slug}
                  onPress={() =>
                    setDonationCategory(donationCategory === slug ? null : slug)
                  }
                />
              ))}
            </View>

            {/* City */}
            <Text style={styles.sectionTitle}>{t.filterCity}</Text>
            <CityPicker
              value={city}
              onChange={(selection: { id: string; name: string }) => setCity(selection)}
            />
          </ScrollView>

          {/* Apply button */}
          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [styles.applyBtn, pressed && styles.applyBtnPressed]}
              onPress={handleApply}
            >
              <Text style={styles.applyBtnText}>{t.applyFilters}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Chip component ────────────────────────────

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}


// ── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.overlay,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    ...typography.h3,
    color: colors.textPrimary,
  },
  clearText: {
    ...typography.caption,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: spacing.base,
    gap: spacing.md,
    paddingBottom: spacing.xl,
  },
  sectionTitle: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'right',
    marginTop: spacing.sm,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'flex-end',
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.caption,
    color: colors.textPrimary,
    fontWeight: '500' as const,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  footer: {
    padding: spacing.base,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  applyBtnPressed: {
    backgroundColor: colors.primaryDark,
  },
  applyBtnText: {
    ...typography.button,
    color: colors.textInverse,
  },
});
