import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
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
  const segments = useSegments();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const styles = useStyles();
  const active = isTabActive(tab, segments as string[]);
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

function isTabActive(tab: TabDefinition, segments: string[]): boolean {
  // tab.route patterns: '/(tabs)' (home), '/(tabs)/profile', '/(tabs)/search', etc.
  // Strip the (tabs) prefix to get the named segment (if any).
  const parts = tab.route.split('/').filter(Boolean); // ['(tabs)'] or ['(tabs)', 'profile']
  const named = parts[1]; // undefined for home, 'profile' / 'search' / 'donations' / 'create' for others
  if (!named) {
    // Home tab — active when we're inside (tabs) but not in any named subroute.
    if (!segments.includes('(tabs)')) return false;
    const namedSubroutes = ['profile', 'search', 'donations', 'create'];
    return !namedSubroutes.some((s) => segments.includes(s));
  }
  return segments.includes(named);
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
