import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AnimatedEntry } from '../../components/animations/AnimatedEntry';
import { AboutNavDrawer } from './AboutNavDrawer';
import { AboutSectionBlocksTop } from './AboutSectionBlocksTop';
import { AboutSectionBlocksBottom } from './AboutSectionBlocksBottom';
import { ABOUT_NAV_LABEL_KEYS, type AboutSectionId } from './aboutSectionModel';
import { parseTruthyQueryParam } from '../../lib/query/parseTruthyQueryParam';
import { isAboutMarketingPath } from '../../navigation/aboutMarketingPaths';
import { useShellTabBarVisibility, shellTabBarHeightPx } from '../../navigation/useShellTabBarVisibility';

export function AboutLandingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ hideTopBar?: string | string[]; hideBottomBar?: string | string[] }>();
  const pathname = usePathname() ?? '';
  const onAboutSurface = isAboutMarketingPath(pathname);
  const hideTop = onAboutSurface && parseTruthyQueryParam(params.hideTopBar);
  const hideBottom = onAboutSurface && parseTruthyQueryParam(params.hideBottomBar);
  const showShellTabBar = useShellTabBarVisibility();
  const tabPad = hideBottom ? 0 : shellTabBarHeightPx(showShellTabBar);

  const scrollRef = useRef<ScrollView>(null);
  const yMap = useRef<Partial<Record<AboutSectionId, number>>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  const onSectionY = useCallback((id: AboutSectionId, y: number) => {
    yMap.current[id] = y;
  }, []);

  const scrollTo = useCallback((id: AboutSectionId) => {
    const y = yMap.current[id];
    if (y == null) return;
    scrollRef.current?.scrollTo({ y: Math.max(0, y - 10), animated: true });
  }, []);

  const labelFor = useCallback(
    (id: AboutSectionId) => t(`aboutContent.${ABOUT_NAV_LABEL_KEYS[id]}` as 'aboutContent.navNumbers'),
    [t],
  );

  const bottomFab = 20 + tabPad + insets.bottom;

  return (
    <SafeAreaView style={styles.safe} edges={hideTop ? [] : ['top']}>
      {!hideTop ? (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button">
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>{t('aboutContent.title')}</Text>
          <View style={{ width: 40 }} />
        </View>
      ) : null}

      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: spacing['4xl'] + tabPad, paddingHorizontal: spacing.base, gap: spacing.lg },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntry delay={0}>
          <View style={styles.hero}>
            <Text style={styles.heroEyebrow}>{t('aboutContent.heroEyebrow')}</Text>
            <Text style={styles.heroTitle}>{t('aboutContent.heroTitle')}</Text>
            <Text style={styles.heroSubtitle}>{t('aboutContent.heroSubtitle')}</Text>
          </View>
        </AnimatedEntry>
        <AboutSectionBlocksTop onSectionY={onSectionY} />
        <AboutSectionBlocksBottom onSectionY={onSectionY} delayStart={360} />
        <View style={styles.footer}>
          <Text style={styles.footerV}>{t('aboutContent.footerVersion')}</Text>
          <Text style={styles.footerR}>{t('aboutContent.footerRights')}</Text>
        </View>
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { bottom: bottomFab }]}
        onPress={() => setMenuOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={t('aboutContent.menuFab')}
      >
        <Ionicons name="menu" size={26} color={colors.textInverse} />
      </TouchableOpacity>

      <AboutNavDrawer
        visible={menuOpen}
        menuTitle={t('aboutContent.menuTitle')}
        hint={t('aboutContent.sectionNavHint')}
        onClose={() => setMenuOpen(false)}
        onSelect={scrollTo}
        labelFor={labelFor}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  back: { padding: spacing.xs },
  title: { ...typography.h3, color: colors.textPrimary },
  scroll: { flexGrow: 1 },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: radius.xl,
    paddingVertical: spacing['2xl'],
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
  },
  heroEyebrow: { ...typography.caption, color: 'rgba(255,255,255,0.85)', marginBottom: spacing.xs },
  heroTitle: { ...typography.h1, color: colors.textInverse, marginBottom: spacing.sm },
  heroSubtitle: {
    ...typography.body,
    color: 'rgba(255,255,255,0.92)',
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: { alignItems: 'center', marginTop: spacing.xl },
  footerV: { ...typography.label, color: colors.textSecondary, marginBottom: spacing.xs },
  footerR: { ...typography.caption, color: colors.textDisabled },
  fab: {
    position: 'absolute',
    left: spacing.base,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    ...{
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 4 },
      elevation: 6,
    },
  },
});
