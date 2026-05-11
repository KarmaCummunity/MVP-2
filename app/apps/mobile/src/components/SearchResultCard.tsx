// ─────────────────────────────────────────────
// SearchResultCard — unified result cards for universal search
// Three specialized components for the three searchable domains:
//   • UserResultCard  — avatar, name, handle, bio, followers, city
//   • PostResultCard  — thumbnail from Storage, type tag, title, owner
//   • LinkResultCard  — link icon, display name, category, URL
//
// All cards use global color tokens and RTL layout.
// Mapped to SRS: FR-FEED-017+
// ─────────────────────────────────────────────

import React from 'react';
import {
  Image,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import type { PostWithOwner } from '@kc/application';
import type { DonationLinkSearchResult, UserSearchResult } from '@kc/domain';
import { AvatarInitials } from './AvatarInitials';

// ── Constants ─────────────────────────────────
/** Supabase Storage bucket where post images are stored (see imageUpload.ts). */
const STORAGE_BUCKET = 'post-images';

/**
 * Resolves a relative Storage path (e.g. "userId/batchId/0.jpg") to a full
 * public URL via the Supabase Storage SDK. This is the same pattern used in
 * PostCardGrid.tsx.
 */
function getPostImageUrl(path: string): string {
  return getSupabaseClient()
    .storage.from(STORAGE_BUCKET)
    .getPublicUrl(path).data.publicUrl;
}

// ── User Card ─────────────────────────────────

export function UserResultCard({ user }: { user: UserSearchResult }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/user/${user.shareHandle}`)}
      accessibilityRole="button"
      accessibilityLabel={`${user.displayName} — @${user.shareHandle}`}
    >
      {/* Avatar (image or initials fallback) */}
      <View style={styles.avatarWrap}>
        <AvatarInitials
          name={user.displayName}
          avatarUrl={user.avatarUrl}
          size={48}
        />
      </View>

      {/* Text content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {user.displayName}
        </Text>
        <Text style={styles.cardHandle} numberOfLines={1}>
          @{user.shareHandle}
        </Text>
        {user.biography ? (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {user.biography}
          </Text>
        ) : null}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="people-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{user.followersCount} עוקבים</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{user.cityName}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-back" size={20} color={colors.textDisabled} />
    </Pressable>
  );
}

// ── Post Card ─────────────────────────────────

export function PostResultCard({ post }: { post: PostWithOwner }) {
  const router = useRouter();
  const isGive = post.type === 'Give';

  // Resolve the first image's Storage path to a full public URL.
  // If no images, show a placeholder icon.
  const firstImageUrl =
    post.mediaAssets.length > 0
      ? getPostImageUrl(post.mediaAssets[0].path)
      : null;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={() => router.push(`/post/${post.postId}`)}
      accessibilityRole="button"
      accessibilityLabel={post.title}
    >
      {/* Post thumbnail — real image from Storage or placeholder icon */}
      {firstImageUrl ? (
        <Image
          source={{ uri: firstImageUrl }}
          style={styles.postThumb}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.postThumb, styles.postThumbPlaceholder]}>
          <Ionicons
            name={isGive ? 'gift-outline' : 'search-outline'}
            size={24}
            color={isGive ? colors.giveTag : colors.requestTag}
          />
        </View>
      )}

      {/* Text content */}
      <View style={styles.cardContent}>
        {/* Type tag (Give / Request) */}
        <View style={styles.postTitleRow}>
          <View
            style={[
              styles.typeTag,
              { backgroundColor: isGive ? colors.giveTagBg : colors.requestTagBg },
            ]}
          >
            <Text
              style={[
                styles.typeTagText,
                { color: isGive ? colors.giveTag : colors.requestTag },
              ]}
            >
              {isGive ? '🎁 נתינה' : '🔍 בקשה'}
            </Text>
          </View>
        </View>

        <Text style={styles.cardTitle} numberOfLines={1}>
          {post.title}
        </Text>
        {post.description ? (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {post.description}
          </Text>
        ) : null}

        {/* Post metadata: owner name + city */}
        <View style={styles.metaRow}>
          <View style={styles.metaChip}>
            <Ionicons name="person-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{post.ownerName}</Text>
          </View>
          <View style={styles.metaChip}>
            <Ionicons name="location-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metaText}>{post.address.cityName}</Text>
          </View>
        </View>
      </View>

      <Ionicons name="chevron-back" size={20} color={colors.textDisabled} />
    </Pressable>
  );
}

// ── Link Card ─────────────────────────────────

export function LinkResultCard({ link }: { link: DonationLinkSearchResult }) {
  /**
   * Opens the link in the device's default browser.
   * Silently catches errors (e.g. malformed URL) — no crash.
   */
  const handlePress = async () => {
    try {
      await Linking.openURL(link.url);
    } catch {
      // Fail silently — link may be unreachable or malformed
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={handlePress}
      accessibilityRole="link"
      accessibilityLabel={`${link.displayName} — ${link.categoryLabelHe}`}
    >
      {/* Link icon */}
      <View style={styles.linkIconWrap}>
        <Ionicons name="link-outline" size={24} color={colors.secondary} />
      </View>

      {/* Text content */}
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {link.displayName}
        </Text>

        {/* Donation category tag */}
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{link.categoryLabelHe}</Text>
        </View>

        {link.description ? (
          <Text style={styles.cardSubtitle} numberOfLines={2}>
            {link.description}
          </Text>
        ) : null}

        {/* Truncated URL for context */}
        <Text style={styles.linkUrl} numberOfLines={1}>
          {link.url}
        </Text>
      </View>

      <Ionicons name="open-outline" size={18} color={colors.textDisabled} />
    </Pressable>
  );
}

// ── Styles ────────────────────────────────────

const styles = StyleSheet.create({
  // Card container — shared by all card types
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  cardPressed: {
    backgroundColor: colors.background,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardTitle: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  cardHandle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
  },
  cardSubtitle: {
    ...typography.caption,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 2,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
    justifyContent: 'flex-end',
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...typography.caption,
    color: colors.textSecondary,
    fontSize: 11,
  },

  avatarWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    flexShrink: 0,
  },

  // Post thumbnail — resolved from Supabase Storage
  postThumb: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  postThumbPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postTitleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 2,
  },
  typeTag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },

  // Link icon circle
  linkIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.secondaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTag: {
    alignSelf: 'flex-end',
    backgroundColor: colors.primarySurface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
    marginTop: 2,
  },
  categoryTagText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '600' as const,
  },
  linkUrl: {
    ...typography.caption,
    color: colors.textDisabled,
    textAlign: 'right',
    fontSize: 10,
    marginTop: 2,
  },
});
