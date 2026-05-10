import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { PostWithOwner } from '@kc/application';
import { colors } from '@kc/ui';
import { useAuthStore } from '../../store/authStore';
import { useIsSuperAdmin } from '../../hooks/useIsSuperAdmin';
import { PostMenuSheet } from './PostMenuSheet';

interface Props {
  post: PostWithOwner;
}

export function PostMenuButton({ post }: Props) {
  const router = useRouter();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);
  const isSuperAdmin = useIsSuperAdmin();
  const [open, setOpen] = useState(false);

  if (viewerId === null) {
    // Guests don't get a menu (no actions available to them).
    return null;
  }

  return (
    <>
      <Pressable
        style={styles.btn}
        onPress={() => setOpen(true)}
        accessibilityLabel="תפריט פעולות"
        accessibilityRole="button"
        hitSlop={8}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
      </Pressable>

      <PostMenuSheet
        visible={open}
        onClose={() => setOpen(false)}
        post={post}
        viewerId={viewerId}
        isSuperAdmin={isSuperAdmin}
        onAfterRemoval={() => router.back()}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4, marginEnd: 4 },
});
