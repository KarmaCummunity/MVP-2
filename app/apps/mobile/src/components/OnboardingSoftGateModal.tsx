// FR-AUTH-015 modal — display_name + city + optional address, "Save and continue".
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { colors, typography, spacing, radius, shadow } from '@kc/ui';
import { EditProfileAddressBlock } from './EditProfileAddressBlock';
import { useAuthStore } from '../store/authStore';
import { getCompleteBasicInfoUseCase } from '../services/userComposition';
import { mapEditProfileSaveError } from '../lib/editProfileSaveErrors';

interface Props {
  readonly visible: boolean;
  readonly onClose: () => void;
  readonly onSaved: () => void;
}

export function OnboardingSoftGateModal({ visible, onClose, onSaved }: Props) {
  const session = useAuthStore((s) => s.session);
  const setOnboardingState = useAuthStore((s) => s.setOnboardingState);
  const [displayName, setDisplayName] = useState(session?.displayName ?? '');
  const [city, setCity] = useState<{ id: string; name: string } | null>(null);
  const [street, setStreet] = useState('');
  const [streetNumber, setStreetNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const canSave = displayName.trim().length > 0 && city !== null && !saving;

  const handleSave = async () => {
    if (!session || !canSave || !city) return;
    setSaving(true);
    try {
      await getCompleteBasicInfoUseCase().execute({
        userId: session.userId,
        displayName,
        cityId: city.id,
        cityName: city.name,
        profileStreet: street,
        profileStreetNumber: streetNumber,
      });
      setOnboardingState('pending_avatar');
      onSaved();
    } catch (err) {
      const raw = err instanceof Error ? err.message : 'שגיאה לא ידועה';
      Alert.alert('שמירה נכשלה', mapEditProfileSaveError(raw));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.kav}
        >
          <View style={styles.card}>
            <ScrollView contentContainerStyle={styles.cardContent} keyboardShouldPersistTaps="handled">
              <View style={styles.headerRow}>
                <Text style={styles.title}>נשלים פרטים בסיסיים</Text>
                <TouchableOpacity
                  onPress={onClose}
                  disabled={saving}
                  accessibilityRole="button"
                  accessibilityLabel="ביטול"
                >
                  <Text style={styles.cancel}>ביטול</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.subtitle}>
                כדי להמשיך יש להזין שם ועיר. אפשר להוסיף רחוב ומספר בית (אופציונלי).
              </Text>

              <View style={styles.field}>
                <Text style={styles.label}>שם מלא</Text>
                <TextInput
                  style={styles.input}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="לדוגמה: רינה כהן"
                  placeholderTextColor={colors.textDisabled}
                  maxLength={50}
                  textAlign="right"
                  editable={!saving}
                />
              </View>

              <EditProfileAddressBlock
                city={city}
                onCityChange={setCity}
                street={street}
                streetNumber={streetNumber}
                onStreetChange={setStreet}
                onStreetNumberChange={setStreetNumber}
                disabled={saving}
              />

              <TouchableOpacity
                style={[styles.cta, !canSave && { opacity: 0.4 }]}
                disabled={!canSave}
                onPress={handleSave}
              >
                {saving ? (
                  <ActivityIndicator color={colors.textInverse} />
                ) : (
                  <Text style={styles.ctaText}>שמור והמשך</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    paddingHorizontal: spacing.base,
  },
  kav: { width: '100%' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    maxHeight: '85%',
    ...shadow.card,
  },
  cardContent: { padding: spacing.lg, gap: spacing.base },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { ...typography.h2, color: colors.textPrimary, textAlign: 'right' },
  cancel: { ...typography.body, color: colors.textSecondary },
  subtitle: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  field: { gap: spacing.xs },
  label: { ...typography.label, color: colors.textSecondary, textAlign: 'right' },
  input: {
    height: 50,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    paddingHorizontal: spacing.base,
    ...typography.body,
    color: colors.textPrimary,
  },
  cta: {
    height: 52,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  ctaText: { ...typography.button, color: colors.textInverse },
});
