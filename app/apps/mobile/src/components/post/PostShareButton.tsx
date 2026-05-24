// FR-POST-023 (P2.33) — header share button on the post-detail screen.
// Visible to any viewer (owner or third party) on a Public + open post.
// Image presence is not required: Request posts without images still share
// (the OG server falls back to the generic community card).

import { useCallback, useState } from 'react';
import { ActivityIndicator, Platform, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { he as dateFnsHe } from 'date-fns/locale';
import type { PostWithOwner } from '@kc/application';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { makeUseStyles, useTheme } from '@kc/ui';
import { resolveWebBaseUrl } from '../../lib/buildPostShareUrl';
import { sharePost } from '../../lib/sharePost';
import { buildPostShareMessage } from '../../lib/buildPostShareMessage';
import { useFeedSessionStore } from '../../store/feedSessionStore';

const POST_IMAGES_BUCKET = 'post-images';

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
      // Metro inlines `process.env.EXPO_PUBLIC_*` ONLY at literal call
      // sites — passing process.env through a parameter loses the inline
      // (the bundle ships an empty object instead of the keys). Read the
      // env at the call site so Metro can resolve it statically.
      const webBaseUrl = resolveWebBaseUrl({
        EXPO_PUBLIC_WEB_BASE_URL: process.env.EXPO_PUBLIC_WEB_BASE_URL,
      });
      const postedAt = formatDistanceToNow(new Date(post.createdAt), {
        addSuffix: true,
        locale: dateFnsHe,
      });
      // buildPostShareMessage uses 'Full' while the domain value-object uses
      // 'FullAddress'. Map at the call site to avoid touching either module.
      const locationDisplayLevel =
        post.locationDisplayLevel === 'FullAddress' ? 'Full' : post.locationDisplayLevel;
      const message = buildPostShareMessage(
        {
          type: post.type,
          title: post.title,
          description: post.description,
          category: post.category,
          address: post.address,
          locationDisplayLevel,
          postedAt,
        },
        t,
      );
      const firstAsset = post.mediaAssets[0];
      const remoteImageUrl = firstAsset
        ? getSupabaseClient().storage
            .from(POST_IMAGES_BUCKET)
            .getPublicUrl(firstAsset.path).data.publicUrl
        : undefined;
      const outcome = await sharePost({
        postId: post.postId,
        title: post.title,
        message,
        webBaseUrl,
        remoteImageUrl,
      });
      if (outcome.kind === 'copied') {
        showToast(t('post.detail.shareCopiedToast'), 'success', 1800);
      } else if (outcome.kind === 'failed') {
        showToast(t('post.detail.shareFailedToast'), 'error', 2200);
      }
    } catch (err) {
      console.warn('[PostShareButton] share failed', err);
      showToast(t('post.detail.shareFailedToast'), 'error', 2200);
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
    post.address,
    post.locationDisplayLevel,
    post.createdAt,
    post.mediaAssets,
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
  return post.status === 'open' && post.visibility === 'Public';
}

const usePostShareButtonStyles = makeUseStyles(() => ({
  btn: { padding: 4, marginEnd: 4 },
}));
