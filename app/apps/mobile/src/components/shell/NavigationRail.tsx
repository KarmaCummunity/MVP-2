import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { makeUseStyles, useBreakpoint, useTheme, spacing, shellDimensions } from '@kc/ui';
import { TABS, type TabDefinition } from './tabs.config';

type NavigationRailProps = {
  /** When true, render icon + label rows. When false, icon-only column. */
  expanded?: boolean;
};

export function NavigationRail({ expanded }: NavigationRailProps) {
  const bp = useBreakpoint();
  const { colors } = useTheme();
  const styles = useStyles();
  const isExpanded = expanded ?? (bp === 'desktop' || bp === 'wide');

  return (
    <View
      style={[
        styles.container,
        isExpanded ? styles.expanded : styles.collapsed,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <ScrollView>
        {TABS.map((tab) => (
          <NavigationRailItem key={tab.key} tab={tab} expanded={isExpanded} />
        ))}
      </ScrollView>
    </View>
  );
}

function NavigationRailItem({ tab, expanded }: { tab: TabDefinition; expanded: boolean }) {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
  const active = isTabActive(tab, pathname);
  const iconName = active ? tab.iconActive : tab.iconInactive;
  const activeBg = (colors as { surfaceVariant?: string }).surfaceVariant ?? colors.surface;

  return (
    <Pressable
      onPress={() => router.push(tab.route as never)}
      style={[
        styles.item,
        expanded ? styles.itemExpanded : styles.itemCollapsed,
        active && { backgroundColor: activeBg },
      ]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t(tab.labelI18nKey)}
    >
      <Ionicons name={iconName} size={24} color={active ? colors.primary : colors.textSecondary} />
      {expanded && (
        <Text style={[styles.label, { color: active ? colors.primary : colors.textPrimary }]}>
          {t(tab.labelI18nKey)}
        </Text>
      )}
    </Pressable>
  );
}

function isTabActive(tab: TabDefinition, pathname: string | null): boolean {
  if (!pathname) return false;
  // Home tab — root or any (tabs) path that's not a named subroute.
  if (tab.route === '/(tabs)') {
    if (pathname === '/' || pathname === '/(tabs)') return true;
    const namedSubroutes = ['profile', 'search', 'donations', 'create'];
    const inNamed = namedSubroutes.some((seg) => pathname.includes(`/${seg}`));
    return pathname.startsWith('/(tabs)') && !inNamed;
  }
  // Other tabs — match by the last path segment.
  const segment = tab.route.split('/').pop();
  return segment !== undefined && segment !== '' && pathname.includes(`/${segment}`);
}

const useStyles = makeUseStyles(() => ({
  container: {
    borderStartWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.sm,
  },
  expanded: { width: shellDimensions.railExpanded },
  collapsed: { width: shellDimensions.railCollapsed },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    marginVertical: 2,
    marginHorizontal: spacing.xs,
    borderRadius: 8,
    gap: spacing.sm,
  },
  itemExpanded: { justifyContent: 'flex-start' },
  itemCollapsed: { justifyContent: 'center' },
  label: { fontSize: 14, fontWeight: '500' },
}));
