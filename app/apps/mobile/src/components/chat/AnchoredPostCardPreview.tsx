// FR-CHAT-014 — first post image (Storage) or type placeholder for anchored chat banner.
import { Image, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getSupabaseClient } from '@kc/infrastructure-supabase';
import { colors, radius } from '@kc/ui';
import type { PostType } from '@kc/domain';

const STORAGE_BUCKET = 'post-images';

function publicUrl(path: string): string {
  return getSupabaseClient().storage.from(STORAGE_BUCKET).getPublicUrl(path).data.publicUrl;
}

interface Props {
  type: PostType;
  mediaPaths: readonly { path: string }[];
  /** Square edge length; default fits the padded banner row. */
  size?: number;
}

export function AnchoredPostCardPreview({ type, mediaPaths, size = 52 }: Props) {
  const path0 = mediaPaths[0]?.path;
  const uri = path0 ? publicUrl(path0) : null;
  const isGive = type === 'Give';

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: radius.md }]}>
      {uri ? (
        <Image source={{ uri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={styles.placeholder}>
          <Ionicons
            name={isGive ? 'gift-outline' : 'search-outline'}
            size={22}
            color={isGive ? colors.giveTag : colors.requestTag}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: 'hidden',
    backgroundColor: colors.skeleton,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.borderStrong,
  },
  image: { ...StyleSheet.absoluteFillObject },
  placeholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
