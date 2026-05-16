// iOS native stack draws a shared "glass" chip behind custom header views.
// Use unstable_* bar items with hidesSharedBackground so only the icon shows.
// See: UIBarButtonItem.hidesSharedBackground (react-native-screens / native-stack).
import { Ionicons } from '@expo/vector-icons';
import { Platform, Pressable } from 'react-native';
import type { ReactElement } from 'react';
import { colors } from '@kc/ui';
import { BackButton } from '../components/BackButton';

type CustomBarItem = {
  type: 'custom';
  element: ReactElement;
  hidesSharedBackground?: boolean;
};

/** Native UIBarButtonItem (plain) — avoids the glass pill around custom React views on iOS < 26. */
type IosNativeOverflowButtonItem = {
  type: 'button';
  label: string;
  icon: { type: 'sfSymbol'; name: 'ellipsis.circle' };
  onPress: () => void;
  variant: 'plain';
  hidesSharedBackground?: boolean;
};

type IosHeaderRightItem = CustomBarItem | IosNativeOverflowButtonItem;

/** Compatible with expo-router Stack (native-stack) screen options. */
export type NativeHeaderLeftFragment = {
  headerLeft: typeof BackButton;
  unstable_headerLeftItems?: () => CustomBarItem[];
};

export const nativeStackHeaderLeftIconOnly: NativeHeaderLeftFragment = {
  headerLeft: BackButton,
  ...(Platform.OS === 'ios'
    ? {
        unstable_headerLeftItems: () => [
          {
            type: 'custom' as const,
            element: <BackButton />,
            hidesSharedBackground: true,
          },
        ],
      }
    : {}),
};

export type NativeHeaderRightFragment = {
  headerRight?: (props: { tintColor?: string }) => ReactElement | null;
  unstable_headerRightItems?: () => IosHeaderRightItem[];
};

export function nativeStackHeaderRightIconOnly(
  render: () => ReactElement
): NativeHeaderRightFragment {
  if (Platform.OS === 'ios') {
    return {
      headerRight: undefined,
      unstable_headerRightItems: () => [
        {
          type: 'custom' as const,
          element: render(),
          hidesSharedBackground: true,
        },
      ],
    };
  }
  return { headerRight: () => render() };
}

/** Chat / overflow "more" — iOS uses a plain SF Symbol bar button (no JS view bubble); Android disables ripple. */
export function nativeStackHeaderOverflowMenu(options: {
  a11yLabel: string;
  onPress: () => void;
  iconColor?: string;
}): NativeHeaderRightFragment {
  const iconColor = options.iconColor ?? colors.textPrimary;
  if (Platform.OS === 'ios') {
    return {
      headerRight: undefined,
      unstable_headerRightItems: () => [
        {
          type: 'button',
          label: options.a11yLabel,
          icon: { type: 'sfSymbol', name: 'ellipsis.circle' },
          onPress: options.onPress,
          variant: 'plain',
          hidesSharedBackground: true,
        },
      ],
    };
  }
  return {
    headerRight: () => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={options.a11yLabel}
        onPress={options.onPress}
        hitSlop={8}
        android_ripple={null}
        style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1, padding: 4 }]}
      >
        <Ionicons name="ellipsis-vertical" size={22} color={iconColor} />
      </Pressable>
    ),
  };
}
