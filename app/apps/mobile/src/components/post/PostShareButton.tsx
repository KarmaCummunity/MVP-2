// FR-POST-023 (P2.33) — header share button on the post-detail screen.
// Visible only for `Public` + `open` posts that have at least one image,
// per spec AC1 — sharing non-public posts leaks no preview surface.

import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { PostWithOwner } from '@kc/application';
import { makeUseStyles, useTheme } from '@kc/ui';
import { resolveShareBaseUrl, sharePost } from '../../lib/sharePost';
import { useFeedSessionStore } from '../../store/feedSessionStore';

interface Props {
  post: PostWithOwner;
}

export function PostShareButton({ post }: Props) {
  const { t } = useTranslation();
  const styles = usePostShareButtonStyles();
  const { colors } = useTheme();
  const showToast = useFeedSessionStore((s) => s.showEphemeralToast);
  const [busy, setBusy] = useState(false);

  const onPress = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    try {
      const shareBaseUrl = resolveShareBaseUrl(
        typeof process !== 'undefined' ? process.env : {},
      );
      const outcome = await sharePost({
        postId: post.postId,
        title: post.title,
        message: t('post.detail.shareMessage', { title: post.title }),
        shareBaseUrl,
      });
      if (outcome.kind === 'copied') {
        showToast(t('post.detail.shareCopiedToast'), 'success', 1800);
      } else if (outcome.kind === 'failed') {
        showToast(t('post.detail.shareFailedToast'), 'error', 2200);
      }
    } finally {
      setBusy(false);
    }
  }, [busy, post.postId, post.title, showToast, t]);

  if (!canSharePost(post)) return null;

  return (
    <Pressable
      style={styles.btn}
      onPress={() => void onPress()}
      disabled={busy}
      accessibilityLabel={t('post.detail.shareA11y')}
      accessibilityRole="button"
      accessibilityState={{ busy }}
      hitSlop={8}
    >
      {busy ? (
        <ActivityIndicator size="small" color={colors.textPrimary} />
      ) : (
        <Ionicons
          name={Platform.OS === 'ios' ? 'share-outline' : 'share-social-outline'}
          size={22}
          color={colors.textPrimary}
        />
      )}
    </Pressable>
  );
}

export function canSharePost(post: PostWithOwner): boolean {
  return (
    post.status === 'open' &&
    post.visibility === 'Public' &&
    Array.isArray(post.mediaAssets) &&
    post.mediaAssets.length > 0
  );
}

const usePostShareButtonStyles = makeUseStyles(() => ({
  btn: { padding: 4, marginEnd: 4 },
}));
