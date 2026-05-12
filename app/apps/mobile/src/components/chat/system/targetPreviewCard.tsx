// Shared rich-preview card for moderation system bubbles
// (ReportReceivedBubble + AutoRemovedBubble). Reads link_target +
// target_preview from a system-message payload, renders a tap-to-open
// card, and navigates via typed expo-router routes. Caller decides
// whether to render at all (admin gate happens upstream).
import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import he from '../../../i18n/he';

export type LinkTarget = { type: 'post' | 'user'; id: string; handle: string };
export type PostPreview = {
  kind: 'post';
  author_handle: string;
  author_display_name: string;
  body_snippet: string | null;
  has_image: boolean;
};
export type UserPreview = {
  kind: 'user';
  handle: string;
  display_name: string;
  bio_snippet: string | null;
};
export type TargetPreview = PostPreview | UserPreview;

export function readLinkTarget(p: Record<string, unknown> | null): LinkTarget | null {
  const lt = p?.link_target as Record<string, unknown> | null | undefined;
  if (!lt || typeof lt !== 'object') return null;
  const type = lt.type;
  const id = lt.id;
  const handle = lt.handle;
  if ((type !== 'post' && type !== 'user') || typeof id !== 'string' || typeof handle !== 'string') return null;
  return { type, id, handle };
}

export function readPreview(p: Record<string, unknown> | null): TargetPreview | null {
  const tp = p?.target_preview as Record<string, unknown> | null | undefined;
  if (!tp || typeof tp !== 'object') return null;
  if (tp.kind === 'post') {
    return {
      kind: 'post',
      author_handle: String(tp.author_handle ?? ''),
      author_display_name: String(tp.author_display_name ?? ''),
      body_snippet: typeof tp.body_snippet === 'string' ? tp.body_snippet : null,
      has_image: Boolean(tp.has_image),
    };
  }
  if (tp.kind === 'user') {
    return {
      kind: 'user',
      handle: String(tp.handle ?? ''),
      display_name: String(tp.display_name ?? ''),
      bio_snippet: typeof tp.bio_snippet === 'string' ? tp.bio_snippet : null,
    };
  }
  return null;
}

export function TargetPreviewCard({
  linkTarget,
  preview,
  borderColor,
}: {
  linkTarget: LinkTarget;
  preview: TargetPreview;
  borderColor: string;
}) {
  const router = useRouter();
  const t = he.moderation.bubble.targetPreview;

  const navigate = () => {
    if (linkTarget.type === 'post') {
      router.push({ pathname: '/post/[id]', params: { id: linkTarget.id } });
    } else {
      router.push({ pathname: '/user/[handle]', params: { handle: linkTarget.handle } });
    }
  };

  const a11yLabel =
    preview.kind === 'post'
      ? t.a11yOpenPost.replace('{handle}', preview.author_handle)
      : t.a11yOpenProfile.replace('{handle}', preview.handle);

  return (
    <Pressable
      onPress={navigate}
      accessibilityRole="button"
      accessibilityLabel={a11yLabel}
      style={[styles.card, { borderColor }]}
    >
      {preview.kind === 'post' ? (
        <>
          <Text style={styles.handle}>{`‎@${preview.author_handle} · ${t.postLabel}`}</Text>
          {preview.body_snippet ? (
            <Text style={styles.snippet} numberOfLines={3}>
              {preview.body_snippet}
            </Text>
          ) : null}
          {preview.has_image ? <Text style={styles.snippet}>{t.hasImage}</Text> : null}
        </>
      ) : (
        <>
          <Text style={styles.handle}>{`‎@${preview.handle} · ${t.profileLabel}`}</Text>
          {preview.display_name ? <Text style={styles.snippet}>{preview.display_name}</Text> : null}
          {preview.bio_snippet ? (
            <Text style={styles.snippet} numberOfLines={3}>
              {preview.bio_snippet}
            </Text>
          ) : null}
        </>
      )}
      <View style={styles.openRow}>
        <Ionicons name="chevron-back" size={16} color="#1a3d8f" />
        <Text style={styles.openText}>{t.open}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 6,
    padding: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 44,
  },
  handle: { fontWeight: '600' },
  snippet: { fontSize: 13, marginTop: 2 },
  openRow: { flexDirection: 'row', alignItems: 'center', marginTop: 6, gap: 4 },
  openText: { color: '#1a3d8f', fontWeight: '600', fontSize: 13 },
});
