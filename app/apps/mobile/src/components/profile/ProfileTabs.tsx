// app/apps/mobile/src/components/profile/ProfileTabs.tsx
// Open / closed tabs row. Used by My Profile open + closed routes.
// Mapped to: FR-PROFILE-001 AC4. Saved / hidden / removed lists use the profile stack header.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, spacing, typography } from '@kc/ui';

/** Tabs shown in the strip (two lanes per FR-PROFILE-001 AC4). */
/** Open / closed lane highlighted in the tab strip under the profile card. */
export type ProfilePostsTab = 'open' | 'closed';

export function ProfileTabs({
  active, onChange,
}: { active: ProfilePostsTab; onChange: (t: ProfilePostsTab) => void }) {
  const { t } = useTranslation();
  return (
    <View style={styles.row}>
      <Tab label={t('profile.tabOpen')} active={active === 'open'} onPress={() => onChange('open')} />
      <Tab label={t('profile.tabClosed')} active={active === 'closed'} onPress={() => onChange('closed')} />
    </View>
  );
}

function Tab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.tab, active && styles.tabActive]} onPress={onPress}>
      <Text style={[styles.text, active && styles.textActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: spacing.sm,
  },
  tab: {
    flex: 1, paddingVertical: spacing.md, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: colors.primary },
  text: { ...typography.button, color: colors.textSecondary },
  textActive: { color: colors.primary },
});
