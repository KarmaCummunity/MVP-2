// FR-POST-014 AC4 + FR-POST-015 AC1 + FR-ADMIN-006 + FR-ADMIN-009.
// Bottom-sheet menu opened from PostMenuButton on PostDetail.
// Items shown depend on viewer role (see spec §3).
import { useState } from 'react';
import { Modal, Text, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { PostWithOwner } from '@kc/application';
import { makeUseStyles } from '@kc/ui';
import { rtlTextAlignStart } from '../../lib/rtlTextAlignStart';
import { webTextRtl, webViewRtl } from '../../lib/webRtlStyle';
import { ConfirmActionModal } from './ConfirmActionModal';
import { ReportPostModal } from './ReportPostModal';
import { usePostMenuActions } from '../../hooks/usePostMenuActions';
import { shouldShowPostExposureControls } from '../../hooks/usePostActorPrivacyModel';
import { PostMenuExposureBlock } from './PostMenuExposureBlock';

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
  const styles = usePostMenuSheetStyles();
  const [active, setActive] = useState<ActiveModal>(null);
  const { busy, error, clearError, handleOwnerDelete, handleAdminRemove } =
    usePostMenuActions({
      post,
      onAfterRemoval,
      onSettle: () => setActive(null),
    });

  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const canEditPost = (isOwner || isSuperAdmin) && post.status === 'open';
  const showExposureBlock = viewerId !== null && shouldShowPostExposureControls(viewerId, post);

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
            <ScrollView keyboardShouldPersistTaps="handled" bounces={false}>
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
              {showExposureBlock && viewerId ? (
                <PostMenuExposureBlock post={post} viewerId={viewerId} />
              ) : null}
              <MenuItem icon="✕" label={t('general.cancel')} onPress={onClose} muted />
            </ScrollView>
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
  const styles = usePostMenuSheetStyles();
  return (
    <Pressable style={styles.item} onPress={onPress} accessibilityRole="button">
      <Text
        style={[
          styles.itemLabel,
          destructive && styles.itemLabelDestructive,
          muted && styles.itemLabelMuted,
        ]}
      >
        {label}
      </Text>
      <Text style={styles.itemIcon}>{icon}</Text>
    </Pressable>
  );
}

const usePostMenuSheetStyles = makeUseStyles(({ colors }) => ({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    paddingVertical: 8,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    ...webViewRtl,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  itemIcon: { fontSize: 20 },
  itemLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    flex: 1,
    ...webTextRtl,
  },
  itemLabelDestructive: { color: colors.error },
  itemLabelMuted: { color: colors.textSecondary },
}));
