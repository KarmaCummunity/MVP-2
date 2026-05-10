// FR-CLOSURE (UI extension) — shows who closed the loop on a closed_delivered
// post. Label depends on post.type:
//   • Give    → "נמסר ל-X" (owner gave; marked user is the receiver)
//   • Request → "ניתן על-ידי X" (owner asked for help; marked user is the giver)
// Tapping the row opens the marked user's profile.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing, typography } from '@kc/ui';
import type { PostType } from '@kc/domain';
import { AvatarInitials } from '../AvatarInitials';

interface Props {
  postType: PostType;
  recipient: {
    userId: string;
    displayName: string;
    shareHandle: string;
    avatarUrl: string | null;
  };
}

export function RecipientCallout({ postType, recipient }: Props) {
  const router = useRouter();
  const labelLeft = postType === 'Give' ? 'נמסר ל' : 'ניתן על-ידי';
  const sublabel = postType === 'Give' ? 'הפריט נמסר' : 'הבקשה נענתה';

  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/user/${recipient.shareHandle}`)}
      accessibilityLabel={`${labelLeft} ${recipient.displayName}`}
    >
      <Ionicons name="checkmark-circle" size={22} color={colors.success} />
      <View style={styles.text}>
        <Text style={styles.sublabel}>{sublabel}</Text>
        <Text style={styles.label} numberOfLines={1}>
          {labelLeft}{' '}
          <Text style={styles.name}>{recipient.displayName}</Text>
        </Text>
      </View>
      <AvatarInitials name={recipient.displayName} avatarUrl={recipient.avatarUrl} size={36} />
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
