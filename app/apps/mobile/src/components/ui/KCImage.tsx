// Mapped to docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md § Wave 1.
// Standardised image renderer. Anywhere a remote image is shown, use <KCImage>
// — never react-native's <Image>. This lets us swap implementations (RN Image,
// FastImage, future) in one place.
//
// Web platform note: the blurhash placeholder and crossfade transition each
// add CPU + paint work that the browser doesn't need (it already manages
// progressive image loading via the network layer). Both are kept on native
// where the disk cache makes them feel snappy.
import React from 'react';
import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { Platform, StyleProp } from 'react-native';

type Props = {
  uri: string | null | undefined;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageProps['contentFit'];
  blurhash?: string;
  onLoad?: () => void;
  onError?: () => void;
};

const DEFAULT_PLACEHOLDER = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';
const IS_WEB = Platform.OS === 'web';

export function KCImage({
  uri,
  width,
  height,
  style,
  contentFit = 'cover',
  blurhash,
  onLoad,
  onError,
}: Props) {
  if (!uri) return null;
  // Native: blurhash + 150ms crossfade make the disk-cache hit feel instant.
  // Web: the browser already streams pixels progressively; the blurhash decode
  // would just delay first paint. Skip both.
  const placeholder = IS_WEB ? undefined : { blurhash: blurhash ?? DEFAULT_PLACEHOLDER };
  const transition = IS_WEB ? 0 : 150;
  return (
    <Image
      source={uri}
      style={[{ width, height }, style]}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={transition}
      placeholder={placeholder}
      onLoad={onLoad}
      onError={onError}
    />
  );
}
