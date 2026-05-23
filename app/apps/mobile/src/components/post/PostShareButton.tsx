// FR-POST-023 (P2.33) — header share button on the post-detail screen.
// Visible to **any** viewer (owner or third party) on a `Public` + `open`
// post, per spec AC1. Private (`OnlyMe`, `FollowersOnly`) and non-`open`
// (closed / expired / removed) posts hide the affordance — sharing a
// private post leaks no preview surface and dodges follower-gating
// questions. Image presence is not required: Request posts without images
// still share, and the Edge Function falls back to the generic OG card.

import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { PostWithOwner } from '@kc/application';
import { makeUseStyles, useTheme } from '@kc/ui';
import { resolveShareBaseUrl, sharePost } from '../../lib/sharePost';
import { buildPostShareMessage } from '../../lib/buildPostShareMessage';
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
      // Per-post tailored message: title + city + (optional) category +
      // (optional) truncated description + type-aware CTA. Composition rules
      // live in `buildPostShareMessage` so they're unit-testable in isolation.
      const message = buildPostShareMessage(
        {
          type: post.type,
          title: post.title,
          description: post.description,
          category: post.category,
          cityName: post.address.cityName,
        },
        t,
      );
      const outcome = await sharePost({
        postId: post.postId,
        title: post.title,
        message,
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
  }, [
    busy,
    post.postId,
    post.title,
    post.type,
    post.description,
    post.category,
    post.address.cityName,
    showToast,
    t,
  ]);

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
  // Share works for any viewer on any Public + open post — owner or
  // third party. Image presence is intentionally NOT required so Request
  // posts (where images are optional per FR-POST-004 AC2) remain shareable;
  // the Edge Function renders a generic OG card when the post has no media.
  return post.status === 'open' && post.visibility === 'Public';
}

const usePostShareButtonStyles = makeUseStyles(() => ({
  btn: { padding: 4, marginEnd: 4 },
}));
