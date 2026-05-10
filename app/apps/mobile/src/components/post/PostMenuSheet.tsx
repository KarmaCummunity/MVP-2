// FR-POST-014 AC4 + FR-POST-015 AC1 + FR-ADMIN-009.
// Bottom-sheet menu opened from PostMenuButton on PostDetail.
// Items shown depend on viewer role (see spec §3).
import { useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import type { PostWithOwner } from '@kc/application';
import { colors } from '@kc/ui';
import { container } from '../../lib/container';
import { ConfirmActionModal } from './ConfirmActionModal';
import { ReportPostModal } from './ReportPostModal';

interface Props {
  visible: boolean;
  onClose: () => void;
  post: PostWithOwner;
  viewerId: string | null;
  isSuperAdmin: boolean;
  /** Called after a successful destructive action so parent can route away. */
  onAfterRemoval: () => void;
}

type ActiveModal = null | 'delete-owner' | 'admin-remove' | 'block' | 'report';

export function PostMenuSheet({
  visible,
  onClose,
  post,
  viewerId,
  isSuperAdmin,
  onAfterRemoval,
}: Props) {
  const [active, setActive] = useState<ActiveModal>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwner = viewerId !== null && post.ownerId === viewerId;
  const isAdminViewingOther = isSuperAdmin && !isOwner;

  function openModal(name: Exclude<ActiveModal, null>) {
    setError(null);
    onClose();
    setActive(name);
  }

  function closeModal() {
    if (busy) return;
    setActive(null);
    setError(null);
  }

  async function handleOwnerDelete() {
    setBusy(true);
    setError(null);
    try {
      await container.deletePost.execute({ postId: post.postId });
      setActive(null);
      onAfterRemoval();
    } catch (e) {
      setError('המחיקה נכשלה, נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  async function handleAdminRemove() {
    setBusy(true);
    setError(null);
    try {
      await container.adminRemovePost.execute({ postId: post.postId });
      setActive(null);
      onAfterRemoval();
    } catch (e) {
      setError('ההסרה נכשלה, נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  async function handleBlock() {
    if (!viewerId) return;
    setBusy(true);
    setError(null);
    try {
      await container.blockUser.execute({ blockerId: viewerId, blockedId: post.ownerId });
      setActive(null);
      onAfterRemoval();
    } catch (e) {
      setError('החסימה נכשלה, נסה שוב.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
            {isOwner ? (
              <MenuItem
                icon="🗑️"
                label="מחק את הפוסט"
                destructive
                onPress={() => openModal('delete-owner')}
              />
            ) : (
              <>
                <MenuItem icon="🚩" label="דווח" onPress={() => openModal('report')} />
                <MenuItem icon="🚫" label="חסום משתמש" onPress={() => openModal('block')} />
                {isAdminViewingOther ? (
                  <MenuItem
                    icon="🛡️"
                    label="הסר כאדמין"
                    destructive
                    onPress={() => openModal('admin-remove')}
                  />
                ) : null}
              </>
            )}
            <MenuItem icon="✕" label="ביטול" onPress={onClose} muted />
          </Pressable>
        </Pressable>
      </Modal>

      <ConfirmActionModal
        visible={active === 'delete-owner'}
        title="🗑️ למחוק את הפוסט?"
        message="הפוסט יימחק לצמיתות. שיחות שנפתחו סביבו יישארו ברשימת הצ'אטים שלך, עם הערה שהפוסט המקורי לא זמין יותר."
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

      <ConfirmActionModal
        visible={active === 'block'}
        title={`🚫 לחסום את ${post.ownerName}?`}
        message="לא תראה יותר פוסטים שלו, והוא לא יוכל ליצור איתך קשר. ניתן לבטל בהגדרות → משתמשים חסומים."
        confirmLabel="חסום"
        destructive
        isBusy={busy}
        errorMessage={error}
        onCancel={closeModal}
        onConfirm={handleBlock}
      />

      <ReportPostModal
        postId={post.postId}
        visible={active === 'report'}
        onClose={() => setActive(null)}
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
  itemLabel: { fontSize: 16, color: colors.textPrimary, textAlign: 'right', flex: 1 },
  itemLabelDestructive: { color: colors.error },
  itemLabelMuted: { color: colors.textSecondary },
});
