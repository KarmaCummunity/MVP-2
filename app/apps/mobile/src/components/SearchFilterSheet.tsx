// Bottom sheet for advanced search filters (FR-FEED-017+).
// Local state mirrors store so the user can preview before applying.
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@kc/ui';
import { ALL_CATEGORIES, DONATION_CATEGORY_SLUGS } from '@kc/domain';
import type { Category, DonationCategorySlug, PostType, SearchSortBy } from '@kc/domain';
import { search as t } from '../i18n/locales/he/donations';
import { useSearchStore } from '../store/searchStore';
import { CityPicker } from './CityPicker';
import { SearchChip } from './search/SearchChip';
import { styles } from './search/searchFilterSheet.styles';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function SearchFilterSheet({ visible, onClose }: Props) {
  const store = useSearchStore();
  const [postType, setPostType] = useState<PostType | null>(store.postType);
  const [category, setCategory] = useState<Category | null>(store.category);
  const [donationCategory, setDonationCategory] = useState<DonationCategorySlug | null>(store.donationCategory);
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

  const sortLabels: Record<string, string> = {
    relevance: t.sortRelevance,
    newest: t.sortNewest,
    followers: t.sortFollowers,
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
            <Text style={styles.headerTitle}>{t.filters}</Text>
            <Pressable onPress={handleClear}>
              <Text style={styles.clearText}>{t.clearFilters}</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            <Text style={styles.sectionTitle}>{t.sortBy}</Text>
            <View style={styles.chipRow}>
              {(['relevance', 'newest', 'followers'] as SearchSortBy[]).map((s) => (
                <SearchChip key={s} label={sortLabels[s] ?? s} active={sortBy === s} onPress={() => setSortBy(s)} />
              ))}
            </View>

            <Text style={styles.sectionTitle}>{t.filterPostType}</Text>
            <View style={styles.chipRow}>
              <SearchChip label={t.all} active={!postType} onPress={() => setPostType(null)} />
              <SearchChip label={t.give} active={postType === 'Give'} onPress={() => setPostType(postType === 'Give' ? null : 'Give')} />
              <SearchChip label={t.request} active={postType === 'Request'} onPress={() => setPostType(postType === 'Request' ? null : 'Request')} />
            </View>

            <Text style={styles.sectionTitle}>{t.filterCategory}</Text>
            <View style={styles.chipRow}>
              <SearchChip label={t.all} active={!category} onPress={() => setCategory(null)} />
              {ALL_CATEGORIES.map((c) => (
                <SearchChip
                  key={c}
                  label={(t.categories as Record<string, string>)[c] ?? c}
                  active={category === c}
                  onPress={() => setCategory(category === c ? null : c)}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>{t.filterDonationCategory}</Text>
            <View style={styles.chipRow}>
              <SearchChip label={t.all} active={!donationCategory} onPress={() => setDonationCategory(null)} />
              {DONATION_CATEGORY_SLUGS.map((slug) => (
                <SearchChip
                  key={slug}
                  label={(t.donationCategories as Record<string, string>)[slug] ?? slug}
                  active={donationCategory === slug}
                  onPress={() => setDonationCategory(donationCategory === slug ? null : slug)}
                />
              ))}
            </View>

            <Text style={styles.sectionTitle}>{t.filterCity}</Text>
            <CityPicker value={city} onChange={(sel: { id: string; name: string }) => setCity(sel)} />
          </ScrollView>

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
