// FR-POST-014 AC4 + FR-POST-015 AC1 + FR-ADMIN-006 + FR-ADMIN-009.
// Bottom-sheet menu opened from PostMenuButton on PostDetail.
// Items shown depend on viewer role (see spec §3).
import { useState } from 'react';
import { Modal, Text, Pressable, StyleSheet } from 'react-native';
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
  onAfterRemoval,
  onEdit,
}: Props) {
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
              <MenuItem icon="🚩" label="דווח" onPress={() => openModal('report')} />
            )}
            {canEditPost ? (
              <MenuItem
                icon="✏️"
                label="ערוך פוסט"
                onPress={() => {
                  onClose();
                  onEdit();
                }}
              />
            ) : null}
            {isOwner ? (
              <MenuItem
                icon="🗑️"
                label="מחק את הפוסט"
                destructive
                onPress={() => openModal('delete-owner')}
              />
            ) : null}
            {isSuperAdmin ? (
              <MenuItem
                icon="🛡️"
                label="הסר כאדמין"
                destructive
                onPress={() => openModal('admin-remove')}
              />
            ) : null}
            <MenuItem icon="✕" label="ביטול" onPress={onClose} muted />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmActionModal
        visible={active === 'delete-owner'}
        title="🗑️ למחוק את הפוסט?"
        message={
          'הפוסט יימחק לצמיתות. שיחות שנפתחו סביבו יישארו ברשימת הצ\'אטים שלך, עם הערה שהפוסט המקורי לא זמין יותר.\n\n'
          + 'ניתן למחוק פוסט פתוח, או פוסט סגור בלי שורת מקבל במערכת (למשל נסגר בלי סימון, או מקבל שנמחק מהמערכת). '
          + 'אם יש מקבל רשום — לא ניתן למחיקה מכאן; אפשר לפתוח מחדש לפי הצורך.'
        }
        confirmLabel="מחק"
        destructive
        isBusy={busy}
        errorMessage={error}
        onCancel={closeModal}
        onConfirm={handleOwnerDelete}
      />

      <ConfirmActionModal
        visible={active === 'admin-remove'}
        title="🛡️ להסיר את הפוסט?"
        message={`הפוסט "${post.title}" יוסתר מהפיד ויסומן כמוסר על ידי מנהל. ניתן יהיה לשחזר אותו בעתיד דרך יומן האודיט.`}
        confirmLabel="הסר"
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
