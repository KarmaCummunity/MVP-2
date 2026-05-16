// Settings screen stub — SRS §3.5, FR-AUTH-017 (logout)
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '@kc/ui';
import { useIsSuperAdmin } from '../src/hooks/useIsSuperAdmin';
import { useSettingsAccountActions } from '../src/hooks/useSettingsAccountActions';
import { container } from '../src/lib/container';
import he from '../src/i18n/locales/he';
import { useAuthStore } from '../src/store/authStore';
import { useChatStore } from '../src/store/chatStore';
import { DeleteAccountConfirmModal } from '../src/components/DeleteAccountConfirmModal';
import { DeleteAccountSuccessOverlay } from '../src/components/DeleteAccountSuccessOverlay';
import { SettingsScreenRow } from '../src/components/SettingsScreenRow';
import { settingsScreenStyles as styles } from './settings.styles';
import { getUserRepo } from '../src/services/userComposition';

/** Metro `__DEV__` is false in release; set `EXPO_PUBLIC_DEV_SETTINGS_TOOLS=1` for internal builds only. */
const SHOW_SETTINGS_DEBUG_TOOLS =
  __DEV__ || process.env.EXPO_PUBLIC_DEV_SETTINGS_TOOLS === '1';

export default function SettingsScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const session = useAuthStore((s) => s.session);
  const userId = session?.userId;
  const userQuery = useQuery({
    queryKey: ['user-profile', userId],
    queryFn: () => getUserRepo().findById(userId!),
    enabled: Boolean(userId),
  });
  const showFollowRequests = userQuery.data?.privacyMode === 'Private';
  const isSuperAdmin = useIsSuperAdmin();
  const queryClient = useQueryClient();
  const [hardRefreshing, setHardRefreshing] = React.useState(false);
  const {
    signingOut,
    resettingOnboarding,
    deleteModalVisible,
    setDeleteModalVisible,
    deleteSuccessVisible,
    handleDeleteConfirm,
    handleResetOnboarding,
    handleSignOut,
  } = useSettingsAccountActions();

  // Dev-only "simulate hard refresh" (FR-CHAT-012 verification aid).
  const handleSimulateHardRefresh = async () => {
    if (!session?.userId || hardRefreshing) return;
    setHardRefreshing(true);
    try {
      useChatStore.getState().resetOnSignOut();
      queryClient.clear();
      await useChatStore.getState().startInboxSub(
        session.userId,
        container.chatRepo,
        container.chatRealtime,
      );
    } finally {
      setHardRefreshing(false);
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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>{t('settings.account')}</Text>
        <View style={styles.section}>
          <SettingsScreenRow
            label={t('settings.accountDetails')}
            icon="person-outline"
            onPress={() => router.push('/edit-profile')}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('settings.notifications')}</Text>
        <View style={styles.section}>
          <SettingsScreenRow
            label={t('settings.notifications')}
            icon="notifications-outline"
            onPress={() => router.push('/settings/notifications' as never)}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('settings.privacy')}</Text>
        <View style={styles.section}>
          <SettingsScreenRow
            label={t('settings.privateProfileToggle')}
            icon="lock-closed-outline"
            onPress={() => router.push('/settings/privacy' as never)}
          />
          {showFollowRequests ? (
            <SettingsScreenRow
              label={t('settings.followRequests')}
              icon="people-outline"
              onPress={() => router.push('/settings/follow-requests' as never)}
            />
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>{t('settings.statsSection')}</Text>
        <View style={styles.section}>
          <SettingsScreenRow
            label={t('settings.stats')}
            icon="stats-chart-outline"
            onPress={() => router.push('/stats')}
          />
        </View>

        <Text style={styles.sectionTitle}>{t('settings.support')}</Text>
        <View style={styles.section}>
          <SettingsScreenRow
            label={t('settings.reportIssue')}
            icon="alert-circle-outline"
            onPress={() => router.push('/settings/report-issue')}
          />
          {isSuperAdmin ? (
            <SettingsScreenRow
              label={he.audit.title}
              icon="document-text-outline"
              onPress={() => router.push('/settings/audit' as never)}
            />
          ) : null}
          <SettingsScreenRow
            label={t('settings.termsAndPrivacy')}
            icon="document-text-outline"
            onPress={() => router.push('/legal')}
          />
          <SettingsScreenRow
            label={t('settings.about')}
            icon="information-circle-outline"
            onPress={() => router.push('/about')}
          />
        </View>

        {SHOW_SETTINGS_DEBUG_TOOLS && (
          <>
            <Text style={styles.sectionTitle}>{t('settings.devTools')}</Text>
            <View style={styles.section}>
              <SettingsScreenRow
                label={resettingOnboarding ? t('settings.resetting') : t('settings.resetOnboarding')}
                icon="refresh-outline"
                onPress={handleResetOnboarding}
                disabled={resettingOnboarding}
              />
              <SettingsScreenRow
                label={hardRefreshing ? t('settings.simulatingHardRefresh') : t('settings.simulateHardRefresh')}
                icon="reload-outline"
                onPress={handleSimulateHardRefresh}
                disabled={hardRefreshing}
              />
            </View>
          </>
        )}

        <View style={[styles.section, { marginTop: spacing.sm }]}>
          <SettingsScreenRow
            label={signingOut ? t('settings.loggingOut') : t('settings.logout')}
            icon="log-out-outline"
            onPress={handleSignOut}
            disabled={signingOut}
          />
          <SettingsScreenRow
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
