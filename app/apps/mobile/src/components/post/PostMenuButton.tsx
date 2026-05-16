import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import type { PostWithOwner } from '@kc/application';
import { colors } from '@kc/ui';
import { useAuthStore } from '../../store/authStore';
import { useIsSuperAdmin } from '../../hooks/useIsSuperAdmin';
import { invalidatePersonalStatsCaches } from '../../lib/invalidatePersonalStatsCaches';
import { PostMenuSheet } from './PostMenuSheet';

interface Props {
  post: PostWithOwner;
}

export function PostMenuButton({ post }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const queryClient = useQueryClient();
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
        accessibilityLabel={t('post.menuA11y')}
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
        onAfterRemoval={() => {
          void queryClient.invalidateQueries({ queryKey: ['my-posts'] });
          void queryClient.invalidateQueries({ queryKey: ['profile-other-posts'] });
          void queryClient.invalidateQueries({ queryKey: ['post', post.postId] });
          void queryClient.invalidateQueries({ queryKey: ['feed'] });
          invalidatePersonalStatsCaches(queryClient, viewerId);
          invalidatePersonalStatsCaches(queryClient, post.ownerId);
          router.back();
        }}
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onEdit={() => router.push(`/edit-post/${post.postId}` as any)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4, marginEnd: 4 },
});
