// FR-CHAT-014 — first post image (Storage) or type placeholder for anchored chat banner.
// PERF-4: serves the 96px-scope thumb via KCImage with fallback to full so the
// chat inbox / anchored banner stops pulling 2048px JPEGs for a 52px square.
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { makeUseStyles, radius, useTheme } from '@kc/ui';
import type { PostType } from '@kc/domain';
import { KCImage } from '../ui/KCImage';
import { getSupabasePublicImageUrl, getSupabaseImageThumbUrl } from '../../lib/imageUrl';

const STORAGE_BUCKET = 'post-images';

interface Props {
  type: PostType;
  mediaPaths: readonly { path: string }[];
  /** Square edge length; default fits the padded banner row. */
  size?: number;
}

export function AnchoredPostCardPreview({ type, mediaPaths, size = 52 }: Props) {
  const styles = useAnchoredPostCardPreviewStyles();
  const { colors } = useTheme();
  const path0 = mediaPaths[0]?.path;
  const thumbUri = path0 ? getSupabaseImageThumbUrl({ bucket: STORAGE_BUCKET, path: path0 }) : null;
  const fullUri = path0 ? getSupabasePublicImageUrl({ bucket: STORAGE_BUCKET, path: path0 }) : null;
  const isGive = type === 'Give';

  return (
    <View style={[styles.frame, { width: size, height: size, borderRadius: radius.md }]}>
      {thumbUri ? (
        <KCImage uri={thumbUri} fallbackUri={fullUri} style={styles.image} contentFit="cover" />
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

const useAnchoredPostCardPreviewStyles = makeUseStyles(({ colors }) => ({
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
}));
