// Settings hub — minimal entry point launched from the gear icon on the profile tab.
// Hosts the FR-CHAT-007 "דווח על תקלה" entry alongside profile editing.
import React from 'react';
import {
  StyleSheet, Text, TouchableOpacity, View, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';

interface RowProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

function Row({ icon, label, onPress }: RowProps) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={22} color={colors.textPrimary} />
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={{ flex: 1 }} />
      <Ionicons name="chevron-back" size={20} color={colors.textSecondary} />
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>הגדרות</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Row
          icon="person-circle-outline"
          label="ערוך פרופיל"
          onPress={() => router.push('/edit-profile')}
        />
        <Row
          icon="alert-circle-outline"
          label="דווח על תקלה"
          onPress={() => router.push('/settings/report-issue')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { padding: spacing.base, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.base,
  },
  rowLabel: { ...typography.body, color: colors.textPrimary, fontWeight: '600' as const },
});
