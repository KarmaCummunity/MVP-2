// Mapped to docs/superpowers/specs/2026-05-25-app-performance-overhaul-design.md § Wave 1.
// Standardised image renderer. Anywhere a remote image is shown, use <KCImage>
// — never react-native's <Image>. This lets us swap implementations (RN Image,
// FastImage, future) in one place.
import React from 'react';
import { Image, type ImageProps, type ImageStyle } from 'expo-image';
import { StyleProp } from 'react-native';

type Props = {
  uri: string | null | undefined;
  width?: number;
  height?: number;
  style?: StyleProp<ImageStyle>;
  contentFit?: ImageProps['contentFit'];
  blurhash?: string;
  onLoad?: () => void;
};

const DEFAULT_PLACEHOLDER = 'L6PZfSi_.AyE_3t7t7R**0o#DgR4';

export function KCImage({
  uri,
  width,
  height,
  style,
  contentFit = 'cover',
  blurhash = DEFAULT_PLACEHOLDER,
  onLoad,
}: Props) {
  if (!uri) return null;
  return (
    <Image
      source={uri}
      style={[{ width, height }, style]}
      contentFit={contentFit}
      cachePolicy="memory-disk"
      transition={150}
      placeholder={{ blurhash }}
      onLoad={onLoad}
    />
  );
}
