// FR-CLOSURE-003 AC2 — recipient picker row: avatar + name + optional city,
// selectable radio. Used inside ClosureSheet's Step 2.
import { Pressable, Text, View, Image, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors } from '@kc/ui';
import type { ClosureCandidate } from '@kc/application';

interface Props {
  candidate: ClosureCandidate;
  selected: boolean;
  onPress: () => void;
}

export function RecipientPickerRow({ candidate, selected, onPress }: Props) {
  const { t } = useTranslation();
  const name = candidate.fullName ?? t('profile.fallbackName');
  return (
    <Pressable onPress={onPress} style={[styles.row, selected && styles.rowSelected]}>
      <View style={[styles.radio, selected && styles.radioSelected]}>
        {selected ? <View style={styles.radioDot} /> : null}
      </View>
      {candidate.avatarUrl ? (
        <Image source={{ uri: candidate.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarPlaceholder]}>
          <Text style={styles.avatarInitial}>{name[0] ?? '?'}</Text>
        </View>
      )}
      <View style={styles.text}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {candidate.cityName ? (
          <Text style={styles.city} numberOfLines={1}>
            {candidate.cityName}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  rowSelected: { backgroundColor: colors.primarySurface },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.primary },
  avatar: { width: 40, height: 40, borderRadius: 20 },
  avatarPlaceholder: {
    backgroundColor: colors.skeleton,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontSize: 16, fontWeight: '600', color: colors.textPrimary },
  text: { flex: 1 },
  name: { fontSize: 16, color: colors.textPrimary, textAlign: 'right', fontWeight: '500' },
  city: { fontSize: 13, color: colors.textSecondary, textAlign: 'right', marginTop: 2 },
});
