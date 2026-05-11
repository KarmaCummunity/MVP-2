// PostImageCarousel — horizontal paged carousel for post detail images.
// FR-POST-014 AC1: posts with up to 5 images expose every image; viewer pages
// between them. Uses FlatList with pagingEnabled (no extra deps).
import React, { useState } from 'react';
import {
  Dimensions, FlatList, Image, NativeScrollEvent, NativeSyntheticEvent,
  Pressable, StyleSheet, Text, View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { MediaAsset } from '@kc/domain';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { PostImageViewerModal } from './PostImageViewerModal';

const STORAGE_BUCKET = 'post-images';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEIGHT = 240;

interface Props {
  readonly mediaAssets: readonly MediaAsset[];
  readonly fallbackIcon: 'gift-outline' | 'search-outline';
}

export function PostImageCarousel({ mediaAssets, fallbackIcon }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewerOpen, setViewerOpen] = useState(false);

  if (mediaAssets.length === 0) {
    return (
      <View style={[styles.frame, styles.empty]}>
        <Ionicons name={fallbackIcon} size={72} color={colors.textSecondary} />
      </View>
    );
  }

  const urls = mediaAssets.map((m) =>
    getSupabaseClient().storage.from(STORAGE_BUCKET).getPublicUrl(m.path).data.publicUrl,
  );

  if (urls.length === 1) {
    return (
      <>
        <Pressable
          style={styles.frame}
          onPress={() => setViewerOpen(true)}
          accessibilityRole="image"
          accessibilityLabel="הגדל תמונה"
        >
          <Image source={{ uri: urls[0] }} style={styles.image} resizeMode="cover" />
        </Pressable>
        <PostImageViewerModal
          visible={viewerOpen}
          urls={urls}
          initialIndex={0}
          onClose={() => setViewerOpen(false)}
        />
      </>
    );
  }

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (i !== activeIndex) setActiveIndex(i);
  };

  return (
    <>
      <View style={styles.frame}>
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={urls}
          keyExtractor={(url, i) => `${i}-${url}`}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => setViewerOpen(true)}
              accessibilityRole="image"
              accessibilityLabel={`הגדל תמונה ${index + 1} מתוך ${urls.length}`}
            >
              <Image source={{ uri: item }} style={styles.pageImage} resizeMode="cover" />
            </Pressable>
          )}
          onScroll={onScroll}
          scrollEventThrottle={16}
        />
        <View style={styles.counter} pointerEvents="none">
          <Text style={styles.counterText}>{activeIndex + 1} / {urls.length}</Text>
        </View>
        <View style={styles.dots} pointerEvents="none">
          {urls.map((_, i) => (
            <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
          ))}
        </View>
      </View>
      <PostImageViewerModal
        visible={viewerOpen}
        urls={urls}
        initialIndex={activeIndex}
        onClose={() => setViewerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  frame: { height: HEIGHT, backgroundColor: colors.primarySurface, overflow: 'hidden' },
  empty: { justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: '100%' },
  pageImage: { width: SCREEN_WIDTH, height: HEIGHT },
  counter: {
    position: 'absolute', top: spacing.sm, left: spacing.sm,
    paddingHorizontal: spacing.sm, paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.55)', borderRadius: radius.full,
  },
  counterText: { ...typography.caption, color: colors.textInverse, fontWeight: '600' },
  dots: {
    position: 'absolute', bottom: spacing.sm, alignSelf: 'center',
    flexDirection: 'row', gap: 6,
  },
  dot: {
    width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: { backgroundColor: colors.textInverse, width: 8, height: 8, borderRadius: 4 },
});
