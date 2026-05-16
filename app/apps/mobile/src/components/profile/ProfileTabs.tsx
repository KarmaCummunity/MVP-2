// app/apps/mobile/src/components/profile/ProfileTabs.tsx
// Open / closed tabs row. Used by both profile screens.
// Mapped to: FR-PROFILE-001 AC4.

import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { colors, spacing, typography } from '@kc/ui';

export type ProfileTab = 'open' | 'closed' | 'removed';

export function ProfileTabs({
  active, onChange,
}: { active: ProfileTab; onChange: (t: ProfileTab) => void }) {
  return (
    <View style={styles.row}>
      <Tab label="פוסטים פתוחים" active={active === 'open'} onPress={() => onChange('open')} />
      <Tab label="פוסטים סגורים" active={active === 'closed'} onPress={() => onChange('closed')} />
      <Tab label="הוסרו" active={active === 'removed'} onPress={() => onChange('removed')} />
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
