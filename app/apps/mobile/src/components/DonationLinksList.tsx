// FR-DONATE-007/008/009 — community-curated NGO link list for a donation category.
// Used both on the new dynamic category screen and below Time/Money screens.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import type { DonationCategorySlug, DonationLink } from '@kc/domain';
import { container } from '../lib/container';
import { useAuthStore } from '../store/authStore';
import { colors } from '@kc/ui';
import { AddDonationLinkModal } from './AddDonationLinkModal';
import { donationLinksListStyles as styles } from './DonationLinksList.styles';
import { DonationLinkRow } from './DonationLinkRow';
import { DonationLinkRowMenu } from './DonationLinkRowMenu';
import { useDonationLinkActions } from './useDonationLinkActions';
import { useIsSuperAdmin } from '../hooks/useIsSuperAdmin';
import { dedupeDonationLinksById } from './donationLinksListMerge';

interface Props {
  readonly categorySlug: DonationCategorySlug;
}

export function DonationLinksList({ categorySlug }: Readonly<Props>) {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.session?.userId ?? null);
  const isSuperAdmin = useIsSuperAdmin();

  const [links, setLinks] = useState<DonationLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [errored, setErrored] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<DonationLink | null>(null);
  const [webMenuLink, setWebMenuLink] = useState<DonationLink | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErrored(false);
    try {
      const rows = await container.listDonationLinks.execute(categorySlug);
      setLinks(dedupeDonationLinksById(rows));
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
  const onEditLink = useCallback((link: DonationLink) => {
    setEditingLink(link);
    setModalOpen(true);
  }, []);
  const openAddModal = useCallback(() => {
    setEditingLink(null);
    setModalOpen(true);
  }, []);
  const runNativeMenu = useDonationLinkActions({ me, isSuperAdmin, onRemoved, onEdit: onEditLink });
  const onMenuPress = useCallback(
    (link: DonationLink) => {
      if (Platform.OS === 'web') setWebMenuLink(link);
      else runNativeMenu(link);
    },
    [runNativeMenu],
  );
  const onAdded = (link: DonationLink) =>
    setLinks((prev) => dedupeDonationLinksById([link, ...prev.filter((l) => l.id !== link.id)]));

  const Header = useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('donations.links.sectionTitle')}</Text>
        <Pressable
          onPress={openAddModal}
          accessibilityRole="button"
          accessibilityLabel={t('donations.links.addButtonA11y')}
          hitSlop={6}
          style={({ pressed }) => [styles.plusBtn, pressed && styles.plusBtnPressed]}
        >
          <Ionicons name="add" size={20} color={colors.textInverse} />
        </Pressable>
      </View>
    ),
    [t, openAddModal],
  );

  const renderRow = useCallback(
    (link: DonationLink) => {
      const canRemove = link.submittedBy === me;
      return <DonationLinkRow link={link} canRemove={canRemove} onMenuPress={onMenuPress} />;
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
            onPress={openAddModal}
            style={({ pressed }) => [styles.emptyCta, pressed && styles.emptyCtaPressed]}
            accessibilityRole="button"
          >
            <Text style={styles.emptyCtaText}>{t('donations.links.empty.cta')}</Text>
          </Pressable>
        </View>
      );
    }
    return (
      <View style={styles.list}>
        {links.map((link) => (
          <View key={link.id}>{renderRow(link)}</View>
        ))}
      </View>
    );
  };

  const webMenu = Platform.OS === 'web' && (
    <DonationLinkRowMenu
      visible={webMenuLink !== null}
      link={webMenuLink}
      me={me}
      isSuperAdmin={isSuperAdmin}
      onClose={() => setWebMenuLink(null)}
      onRemoved={(id) => {
        onRemoved(id);
        setWebMenuLink(null);
      }}
      onEdit={(lnk) => {
        setWebMenuLink(null);
        onEditLink(lnk);
      }}
    />
  );

  return (
    <View style={styles.container}>
      {Header}
      {renderBody()}
      <AddDonationLinkModal
        visible={modalOpen}
        categorySlug={categorySlug}
        editingLink={editingLink}
        onClose={() => {
          setModalOpen(false);
          setEditingLink(null);
        }}
        onAdded={onAdded}
        onUpdated={(link) =>
          setLinks((prev) =>
            dedupeDonationLinksById(prev.map((l) => (l.id === link.id ? link : l))),
          )
        }
      />
      {webMenu}
    </View>
  );
}
