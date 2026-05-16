// FR-CLOSURE (UI extension) — shows who closed the loop on a closed_delivered
// post. Label depends on post.type:
//   • Give    → "delivered to X" (owner gave; marked user is the receiver)
//   • Request → "given by X"     (owner asked for help; marked user is the giver)
// Tapping the row opens the marked user's profile.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { PostType } from '@kc/domain';
import { AvatarInitials } from '../AvatarInitials';

interface Props {
  postType: PostType;
  recipient: {
    userId: string;
    /** Null while the recipient is still in `pending_basic_info` (migration 0084). */
    displayName: string | null;
    shareHandle: string;
    avatarUrl: string | null;
  };
}

export function RecipientCallout({ postType, recipient }: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const labelLeft = postType === 'Give' ? t('closure.calloutGiveLabel') : t('closure.calloutRequestLabel');
  const sublabel = postType === 'Give' ? t('closure.calloutGiveSublabel') : t('closure.calloutRequestSublabel');
  const name = recipient.displayName ?? t('profile.fallbackName');

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/user/${recipient.shareHandle}`)}
      accessibilityLabel={`${labelLeft} ${name}`}
    >
      <Ionicons name="checkmark-circle" size={22} color={colors.success} />
      <View style={styles.text}>
        <Text style={styles.sublabel}>{sublabel}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {labelLeft}{' '}
          <Text style={styles.name}>{name}</Text>
        </Text>
      </View>
      <AvatarInitials name={name} avatarUrl={recipient.avatarUrl} size={36} />
      <Ionicons name="chevron-back" size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.base,
    backgroundColor: colors.successLight,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  text: { flex: 1 },
  sublabel: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  label: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  name: { fontWeight: '700' },
});
