// Settings screen stub — SRS §3.5, FR-AUTH-017 (logout)
import React from 'react';
import { Alert, Platform, View, Text, TouchableOpacity, StyleSheet, ScrollView, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '@kc/ui';
import { getSignOutUseCase } from '../src/services/authComposition';
import { getDeleteAccountUseCase, setOnboardingStateDirect } from '../src/services/userComposition';
import { useAuthStore } from '../src/store/authStore';
import { useIsSuperAdmin } from '../src/hooks/useIsSuperAdmin';
import he from '../src/i18n/he';
import { DeleteAccountConfirmModal } from '../src/components/DeleteAccountConfirmModal';
import { DeleteAccountSuccessOverlay } from '../src/components/DeleteAccountSuccessOverlay';

interface SettingsRowProps {
  label: string; icon: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  destructive?: boolean;
}
function SettingsRow({ label, icon, onPress, rightElement, destructive }: Readonly<SettingsRowProps>) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <Ionicons name={icon as never} size={20} style={styles.rowIcon}
        color={destructive ? colors.error : colors.textSecondary} />
      <Text style={[styles.rowLabel, destructive && { color: colors.error }]}>{label}</Text>
      {rightElement ?? <Ionicons name="chevron-back" size={18} color={colors.textDisabled} />}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const isSuperAdmin = useIsSuperAdmin();
  const setOnboardingStateLocal = useAuthStore((s) => s.setOnboardingState);
  const signOutLocal = useAuthStore((s) => s.signOut);
  const [notificationsOn, setNotificationsOn] = React.useState(true);
  const [signingOut, setSigningOut] = React.useState(false);
  const [resettingOnboarding, setResettingOnboarding] = React.useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = React.useState(false);
  const [deleteSuccessVisible, setDeleteSuccessVisible] = React.useState(false);

  const handleDeleteConfirm = async () => {
    // Throws DeleteAccountError on failure — the modal catches and transitions
    // its internal state. On success we hide the modal, show the overlay 1.5s,
    // then signOut + replace to (auth).
    await getDeleteAccountUseCase().execute();
    setDeleteModalVisible(false);
    setDeleteSuccessVisible(true);
    setTimeout(async () => {
      try {
        await getSignOutUseCase().execute();
      } finally {
        signOutLocal();
        setDeleteSuccessVisible(false);
        router.replace('/(auth)');
      }
    }, 1500);
  };

  const performReset = async () => {
    if (!session) return;
    setResettingOnboarding(true);
    try {
      await setOnboardingStateDirect(session.userId, 'pending_basic_info');
      setOnboardingStateLocal('pending_basic_info');
      useAuthStore.getState().setBasicInfoSkipped(false);
      router.replace('/(onboarding)/basic-info');
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      if (Platform.OS === 'web') window.alert(`האיפוס נכשל: ${msg}`);
      else Alert.alert('האיפוס נכשל', msg);
    } finally {
      setResettingOnboarding(false);
    }
  };

  // RN-Web's Alert.alert collapses 3-button alerts to window.confirm and never
  // invokes the destructive callback — branch by platform.
  const handleResetOnboarding = () => {
    if (!session) return;
    const msg = 'הפעולה תחזיר את מצב האונבורדינג להתחלה ותפתח את אשף ההרשמה מחדש. הפרופיל לא יימחק.\n\nלהמשיך?';
    if (Platform.OS === 'web') {
      if (window.confirm(msg)) void performReset();
      return;
    }
    Alert.alert('איפוס אונבורדינג', msg, [
      { text: 'ביטול', style: 'cancel' },
      { text: 'איפוס', style: 'destructive', onPress: performReset },
    ]);
  };

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
        <Text style={styles.title}>{t('settings.title')}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        {/* Account */}
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.section}>
          <SettingsRow label={t('settings.accountDetails')} icon="person-outline" onPress={() => router.push('/edit-profile')} />
        </View>

        {/* Notifications */}
        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.section}>
          <SettingsRow
            label={t('settings.notificationsOn')}
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
        <Text style={styles.sectionTitle}>{t('settings.privacy')}</Text>
        <View style={styles.section}>
          <SettingsRow
            label={t('settings.privateProfileToggle')}
            icon="lock-closed-outline"
            onPress={() => router.push('/settings/privacy' as never)}
          />
          <SettingsRow label={t('settings.followRequests')} icon="people-outline" onPress={() => router.push('/settings/follow-requests' as never)} />
        </View>

        {/* Stats */}
        <Text style={styles.sectionTitle}>{t('settings.statsSection')}</Text>
        <View style={styles.section}>
          <SettingsRow label={t('settings.stats')} icon="stats-chart-outline" onPress={() => router.push('/stats')} />
        </View>

        {/* Support */}
        <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
        <View style={styles.section}>
          <SettingsRow
            label={t('settings.reportIssue')}
            icon="alert-circle-outline"
            onPress={() => router.push('/settings/report-issue')}
          />
          {isSuperAdmin ? (
            <SettingsRow
              label={he.audit.title}
              icon="document-text-outline"
              onPress={() => router.push('/settings/audit' as never)}
            />
          ) : null}
          <SettingsRow label={t('settings.termsAndPrivacy')} icon="document-text-outline" onPress={() => router.push('/legal')} />
          <SettingsRow label={t('settings.about')} icon="information-circle-outline" onPress={() => router.push('/about')} />
        </View>

        {/* Dev tools — testing onboarding without account deletion */}
        {__DEV__ && (
          <>
            <Text style={styles.sectionTitle}>{t('settings.devTools')}</Text>
            <View style={styles.section}>
              <SettingsRow
                label={resettingOnboarding ? t('settings.resetting') : t('settings.resetOnboarding')}
                icon="refresh-outline"
                onPress={handleResetOnboarding}
              />
            </View>
          </>
        )}

        {/* Account actions */}
        <View style={[styles.section, { marginTop: spacing.sm }]}>
          <SettingsRow
            label={signingOut ? t('settings.loggingOut') : t('settings.logout')}
            icon="log-out-outline"
            onPress={handleSignOut}
          />
          <SettingsRow
            label={t('settings.deleteAccount')}
            icon="trash-outline"
            destructive
            onPress={() => setDeleteModalVisible(true)}
          />
        </View>

        <Text style={styles.version}>{t('settings.version')} v0.1.0</Text>
      </ScrollView>

      <DeleteAccountConfirmModal
        visible={deleteModalVisible}
        accountStatus={null}
        onCancel={() => setDeleteModalVisible(false)}
        onConfirm={handleDeleteConfirm}
      />
      <DeleteAccountSuccessOverlay visible={deleteSuccessVisible} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.base, paddingVertical: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { ...typography.h3, color: colors.textPrimary },
  sectionTitle: { ...typography.label, color: colors.textSecondary, paddingHorizontal: spacing.base, paddingTop: spacing.base, paddingBottom: spacing.xs },
  section: { backgroundColor: colors.surface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.border },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.base, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border, gap: spacing.md },
  rowIcon: { width: 24 },
  rowLabel: { ...typography.body, color: colors.textPrimary, flex: 1, textAlign: 'right' },
  version: { ...typography.caption, color: colors.textDisabled, textAlign: 'center', padding: spacing.xl },
});
