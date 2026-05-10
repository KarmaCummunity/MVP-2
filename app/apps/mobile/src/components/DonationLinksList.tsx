// FR-DONATE-007/008/009 — community-curated NGO link list for a donation category.
// Used both on the new dynamic category screen and below Time/Money screens.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { DonationCategorySlug, DonationLink } from '@kc/domain';
import { container } from '../lib/container';
import { useAuthStore } from '../store/authStore';
import { colors, radius, spacing, typography } from '@kc/ui';
import { AddDonationLinkModal } from './AddDonationLinkModal';
import { DonationLinkRow } from './DonationLinkRow';
import { useDonationLinkActions } from './useDonationLinkActions';

interface Props {
  categorySlug: DonationCategorySlug;
  /** When true, uses ScrollView-friendly layout (no internal scroll). Pass true
   *  when nested inside another ScrollView (e.g. Time/Money screens). */
  embedded?: boolean;
}

export function DonationLinksList({ categorySlug, embedded = false }: Props) {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.session?.userId ?? null);

  const [links, setLinks] = useState<DonationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setErrored(false);
    try {
      const rows = await container.listDonationLinks.execute(categorySlug);
      setLinks(rows);
    } catch {
      setErrored(true);
    } finally {
      setLoading(false);
    }
  }, [categorySlug]);

  useEffect(() => {
    load();
  }, [load]);

  const onRemoved = useCallback(
    (id: string) => setLinks((prev) => prev.filter((l) => l.id !== id)),
    [],
  );
  const onMenuPress = useDonationLinkActions({ me, onRemoved });
  const onAdded = (link: DonationLink) => setLinks((prev) => [link, ...prev]);

  const Header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('donations.links.sectionTitle')}</Text>
        <Pressable
          onPress={() => setModalOpen(true)}
          accessibilityRole="button"
          accessibilityLabel={t('donations.links.addButtonA11y')}
          hitSlop={6}
          style={({ pressed }) => [styles.plusBtn, pressed && styles.plusBtnPressed]}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
    ),
    [t],
  );

  const renderItem = useCallback(
    ({ item }: { item: DonationLink }) => {
      const canRemove = item.submittedBy === me;
      return <DonationLinkRow link={item} canRemove={canRemove} onMenuPress={onMenuPress} />;
    },
    [me, onMenuPress],
  );

  const renderBody = () => {
    if (loading) {
      return (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.primary} />
        </View>
      );
    }
    if (errored) {
      return (
        <View style={styles.empty}>
          <Text style={styles.emptyBody}>{t('donations.links.loadError')}</Text>
          <Pressable onPress={load} style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}>
            <Text style={styles.emptyCtaText}>{t('donations.links.retry')}</Text>
          </Pressable>
        </View>
      );
    }
    if (links.length === 0) {
      return (
        <View style={styles.empty}>
          <Ionicons name="link-outline" size={36} color={colors.textDisabled} />
          <Text style={styles.emptyTitle}>{t('donations.links.empty.title')}</Text>
          <Text style={styles.emptyBody}>{t('donations.links.empty.body')}</Text>
          <Pressable
            onPress={() => setModalOpen(true)}
            style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.emptyCtaText}>{t('donations.links.empty.cta')}</Text>
          </Pressable>
        </View>
      );
    }
    if (embedded) {
      return (
        <View style={styles.list}>
          {links.map((link) => (
            <View key={link.id}>{renderItem({ item: link })}</View>
          ))}
        </View>
      );
    }
    return (
      <FlatList
        data={links}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    );
  };

  return (
    <View style={styles.container}>
      {Header}
      {renderBody()}
      <AddDonationLinkModal
        visible={modalOpen}
        categorySlug={categorySlug}
        onClose={() => setModalOpen(false)}
        onAdded={onAdded}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  plusBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusBtnPressed: { opacity: 0.85 },
  list: { gap: spacing.md, paddingBottom: spacing.lg },
  loading: { paddingVertical: spacing.xl, alignItems: 'center' },
  empty: {
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  emptyTitle: { ...typography.h3, color: colors.textPrimary, textAlign: 'center' },
  emptyBody: { ...typography.body, color: colors.textSecondary, textAlign: 'center' },
  emptyCta: {
    marginTop: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
  },
  emptyCtaPressed: { opacity: 0.85 },
  emptyCtaText: { ...typography.button, color: colors.textInverse },
});
