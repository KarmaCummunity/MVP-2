// FR-POST-014 AC4 + FR-POST-015 AC1 + FR-ADMIN-006 + FR-ADMIN-009.
// Bottom-sheet menu opened from PostMenuButton on PostDetail.
// Items shown depend on viewer role (see spec §3).
import { useState } from 'react';
import { Modal, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PostWithOwner } from '@kc/application';
import { colors } from '@kc/ui';
import { ConfirmActionModal } from './ConfirmActionModal';
import { ReportPostModal } from './ReportPostModal';
import { usePostMenuActions } from '../../hooks/usePostMenuActions';

interface Props {
  visible: boolean;
  onClose: () => void;
  post: PostWithOwner;
  viewerId: string | null;
  isSuperAdmin: boolean;
  isSaved: boolean;
  saveBusy: boolean;
  onToggleSave: () => void;
  /** Called after a successful destructive action so parent can route away. */
  onAfterRemoval: () => void;
  /** Called when the owner taps "Edit" — caller handles navigation. */
  onEdit: () => void;
}

type ActiveModal = null | 'delete-owner' | 'admin-remove' | 'report';

export function PostMenuSheet({
  visible,
  onClose,
  post,
  viewerId,
  isSuperAdmin,
  isSaved,
  saveBusy,
  onToggleSave,
  onAfterRemoval,
  onEdit,
}: Props) {
  const { t } = useTranslation();
  const [active, setActive] = useState<ActiveModal>(null);
  const { busy, error, clearError, handleOwnerDelete, handleAdminRemove } =
    usePostMenuActions({
      post,
      onAfterRemoval,
      onSettle: () => setActive(null),
    });

  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const canEditPost = (isOwner || isSuperAdmin) && post.status === 'open';

  function openModal(name: Exclude<ActiveModal, null>) {
    clearError();
    onClose();
    setActive(name);
  }

  function closeModal() {
    if (busy) return;
    setActive(null);
    clearError();
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {isOwner ? null : (
              <MenuItem icon="🚩" label={t('post.report')} onPress={() => openModal('report')} />
            )}
            <MenuItem
              icon={isSaved ? '🔖' : '📌'}
              label={isSaved ? t('post.menuUnsave') : t('post.menuSave')}
              onPress={() => {
                if (saveBusy) return;
                onToggleSave();
                onClose();
              }}
            />
            {canEditPost ? (
              <MenuItem
                icon="✏️"
                label={t('post.menuEdit')}
                onPress={() => {
                  onClose();
                  onEdit();
                }}
              />
            ) : null}
            {isOwner ? (
              <MenuItem
                icon="🗑️"
                label={t('post.menuDelete')}
                destructive
                onPress={() => openModal('delete-owner')}
              />
            ) : null}
            {isSuperAdmin ? (
              <MenuItem
                icon="🛡️"
                label={t('post.menuAdminRemove')}
                destructive
                onPress={() => openModal('admin-remove')}
              />
            ) : null}
            <MenuItem icon="✕" label={t('general.cancel')} onPress={onClose} muted />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmActionModal
        visible={active === 'delete-owner'}
        title={t('post.deleteConfirmTitle')}
        message={t('post.deleteConfirmBody')}
        confirmLabel={t('post.delete')}
        destructive
        isBusy={busy}
        errorMessage={error}
        onCancel={closeModal}
        onConfirm={handleOwnerDelete}
      />

      <ConfirmActionModal
        visible={active === 'admin-remove'}
        title={t('post.adminRemoveTitle')}
        message={t('post.adminRemoveBody', { title: post.title })}
        confirmLabel={t('post.adminRemoveCta')}
        destructive
        isBusy={busy}
        errorMessage={error}
        onCancel={closeModal}
        onConfirm={handleAdminRemove}
      />

<ReportPostModal
        postId={post.postId}
        visible={active === 'report'}
        onClose={closeModal}
      />
    </>
  );
}

interface MenuItemProps {
  icon: string;
  label: string;
  destructive?: boolean;
  muted?: boolean;
  onPress: () => void;
}

function MenuItem({ icon, label, destructive, muted, onPress }: MenuItemProps) {
  return (
    <Pressable style={styles.item} onPress={onPress} accessibilityRole="button">
      <Text style={styles.itemIcon}>{icon}</Text>
      <Text
        style={[
          styles.itemLabel,
          destructive && styles.itemLabelDestructive,
          muted && styles.itemLabelMuted,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  item: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  itemIcon: { fontSize: 22 },
  itemLabel: { fontSize: 16, color: colors.textPrimary, textAlign: 'right' },
  itemLabelDestructive: { color: colors.error },
  itemLabelMuted: { color: colors.textSecondary },
});
