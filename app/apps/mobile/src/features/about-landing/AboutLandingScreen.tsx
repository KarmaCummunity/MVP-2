import React, { useCallback, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@kc/ui';
import { AnimatedEntry } from '../../components/animations/AnimatedEntry';
import { AboutNavDrawer } from './AboutNavDrawer';
import { AboutSectionBlocksTop } from './AboutSectionBlocksTop';
import { AboutSectionBlocksBottom } from './AboutSectionBlocksBottom';
import { AboutContentScopeProvider } from './AboutContentScopeContext';
import { AboutHero } from './AboutHero';
import { ABOUT_NAV_LABEL_KEYS, type AboutSectionId } from './aboutSectionModel';
import { parseTruthyQueryParam } from '../../lib/query/parseTruthyQueryParam';
import { isAboutMarketingPath } from '../../navigation/aboutMarketingPaths';
import { useShellTabBarVisibility, shellTabBarHeightPx } from '../../navigation/useShellTabBarVisibility';
import { aboutWebTextRtl, aboutWebViewRtl } from './aboutWebRtlStyle';

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
          {
            paddingBottom: spacing['4xl'] + tabPad,
            paddingHorizontal: spacing.base,
            gap: spacing.lg,
            ...aboutWebViewRtl,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <AboutContentScopeProvider>
          <AnimatedEntry delay={0}>
            <AboutHero />
          </AnimatedEntry>
          <AboutSectionBlocksTop onSectionY={onSectionY} />
          <AboutSectionBlocksBottom onSectionY={onSectionY} delayStart={360} />
        </AboutContentScopeProvider>
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
  title: {
    ...typography.h3,
    color: colors.textPrimary,
    flex: 1,
    ...aboutWebTextRtl,
    ...(Platform.OS === 'web' ? { textAlign: 'right' as const } : {}),
  },
  scroll: { flexGrow: 1 },
  footer: { alignItems: 'stretch', marginTop: spacing.xl, ...aboutWebViewRtl },
  footerV: {
    ...typography.label,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    textAlign: 'right',
    ...aboutWebTextRtl,
  },
  footerR: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'right',
    ...aboutWebTextRtl,
  },
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
