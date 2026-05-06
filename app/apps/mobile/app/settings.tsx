// Settings screen stub
// Mapped to: SRS §3.5, FR-AUTH-017 (logout)
import React from 'react';
import { Alert, View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@kc/ui';
import { getSignOutUseCase } from '../src/services/authComposition';
import { useAuthStore } from '../src/store/authStore';

interface SettingsRowProps {
  label: string;
  icon: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}

function SettingsRow({ label, icon, onPress, rightElement, destructive }: Readonly<SettingsRowProps>) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons
        name={icon as never}
        size={20}
        color={destructive ? colors.error : colors.textSecondary}
        style={styles.rowIcon}
      />
      <Text style={[styles.rowLabel, destructive && { color: colors.error }]}>{label}</Text>
      {rightElement ?? <Ionicons name="chevron-back" size={18} color={colors.textDisabled} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const signOutLocal = useAuthStore((s) => s.signOut);
  const [notificationsOn, setNotificationsOn] = React.useState(true);
  const [privateProfile, setPrivateProfile] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await getSignOutUseCase().execute();
      signOutLocal();
      router.replace('/(auth)');
    } catch {
      Alert.alert('שגיאה', 'ההתנתקות נכשלה. נסה שוב.');
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>הגדרות</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Account */}
        <Text style={styles.sectionTitle}>חשבון</Text>
        <View style={styles.section}>
          <SettingsRow label="שם משתמש ופרטים" icon="person-outline" onPress={() => {}} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>התראות</Text>
        <View style={styles.section}>
          <SettingsRow
            label="התראות מופעלות"
            icon="notifications-outline"
            rightElement={
              <Switch
                value={notificationsOn}
                onValueChange={setNotificationsOn}
                trackColor={{ true: colors.primary }}
              />
            }
          />
        </View>

        {/* Privacy */}
        <Text style={styles.sectionTitle}>פרטיות</Text>
        <View style={styles.section}>
          <SettingsRow
            label="🔒 פרופיל פרטי"
            icon="lock-closed-outline"
            rightElement={
              <Switch
                value={privateProfile}
                onValueChange={setPrivateProfile}
                trackColor={{ true: colors.primary }}
              />
            }
          />
          <SettingsRow label="בקשות עקיבה" icon="people-outline" onPress={() => {}} />
          <SettingsRow label="משתמשים חסומים" icon="ban-outline" onPress={() => {}} />
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>סטטיסטיקות</Text>
        <View style={styles.section}>
          <SettingsRow label="הסטטיסטיקות שלי" icon="stats-chart-outline" onPress={() => {}} />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>תמיכה</Text>
        <View style={styles.section}>
          <SettingsRow label="דווח על בעיה" icon="alert-circle-outline" onPress={() => {}} />
          <SettingsRow label="תנאי שימוש" icon="document-text-outline" onPress={() => {}} />
          <SettingsRow label="מדיניות פרטיות" icon="shield-outline" onPress={() => {}} />
        </View>

        {/* Account actions */}
        <View style={[styles.section, { marginTop: spacing.sm }]}>
          <SettingsRow
            label={signingOut ? 'מתנתק...' : 'התנתקות'}
            icon="log-out-outline"
            onPress={handleSignOut}
          />
          <SettingsRow
            label="מחק חשבון"
            icon="trash-outline"
            destructive
            onPress={() => {}}
          />
        </View>

        <Text style={styles.version}>קארמה קהילה v0.1.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  title: { ...typography.h3, color: colors.textPrimary },
  sectionTitle: {
    ...typography.label,
    color: colors.textSecondary,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.md,
  },
  rowIcon: { width: 24 },
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  version: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'center',
    padding: spacing.xl,
  },
});
