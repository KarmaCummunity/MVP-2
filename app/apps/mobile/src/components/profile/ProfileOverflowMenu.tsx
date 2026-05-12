// FR-MOD-007 + FR-ADMIN-004 — overflow ⋮ menu in the user profile header.
// Owns the trigger, action sheet, and the report/ban modals so the
// /user/[handle] screen stays under the 200-line cap.
import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@kc/ui';
import { useIsSuperAdmin } from '../../hooks/useIsSuperAdmin';
import he from '../../i18n/he';
import { ReportUserModal } from './ReportUserModal';
import { BanUserModal } from './BanUserModal';

const t = he.moderation;

interface Props {
  targetUserId: string;
}

type OpenModal = 'report' | 'ban' | null;

export function ProfileOverflowMenu({ targetUserId }: Props) {
  const isAdmin = useIsSuperAdmin();
  const [openModal, setOpenModal] = useState<OpenModal>(null);

  const showMenu = () => {
    const buttons: Array<{
      text: string;
      onPress?: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }> = [
      {
        text: t.report.user.title,
        onPress: () => setOpenModal('report'),
      },
    ];
    if (isAdmin) {
      buttons.push({
        text: t.actions.ban,
        style: 'destructive',
        onPress: () => setOpenModal('ban'),
      });
    }
    buttons.push({ text: t.actions.cancel, style: 'cancel' });
    Alert.alert('', '', buttons, { cancelable: true });
  };

  return (
    <>
      <Pressable
        onPress={showMenu}
        accessibilityRole="button"
        accessibilityLabel={t.actions.cancel}
        hitSlop={8}
        style={styles.trigger}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
      </Pressable>
      <ReportUserModal
        targetUserId={targetUserId}
        visible={openModal === 'report'}
        onClose={() => setOpenModal(null)}
      />
      {isAdmin ? (
        <BanUserModal
          targetUserId={targetUserId}
          visible={openModal === 'ban'}
          onClose={() => setOpenModal(null)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  trigger: { paddingHorizontal: 8, paddingVertical: 4 },
});
