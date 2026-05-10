// FR-DONATE-008 — modal for community submission of NGO links.
// Calls validate-donation-link Edge Function via AddDonationLinkUseCase.
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { DonationCategorySlug, DonationLink } from '@kc/domain';
import {
  DONATION_LINK_DESCRIPTION_MAX,
  DONATION_LINK_DISPLAY_NAME_MAX,
  DONATION_LINK_URL_PATTERN,
} from '@kc/domain';
import { DonationLinkError } from '@kc/application';
import { container } from '../lib/container';
import { colors } from '@kc/ui';
import { modalStyles as styles } from './AddDonationLinkModal.styles';

interface Props {
  visible: boolean;
  categorySlug: DonationCategorySlug;
  onClose: () => void;
  onAdded: (link: DonationLink) => void;
}

export function AddDonationLinkModal({ visible, categorySlug, onClose, onAdded }: Props) {
  const { t } = useTranslation();
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorKey, setErrorKey] = useState<string | null>(null);

  const valid = useMemo(() => {
    if (!DONATION_LINK_URL_PATTERN.test(url.trim())) return false;
    const n = name.trim();
    if (n.length < 2 || n.length > DONATION_LINK_DISPLAY_NAME_MAX) return false;
    if (desc.trim().length > DONATION_LINK_DESCRIPTION_MAX) return false;
    return true;
  }, [url, name, desc]);

  const reset = () => {
    setUrl('');
    setName('');
    setDesc('');
    setErrorKey(null);
    setSubmitting(false);
  };

  const handleClose = () => {
    if (submitting) return;
    reset();
    onClose();
  };

  const submit = async () => {
    if (!valid || submitting) return;
    setSubmitting(true);
    setErrorKey(null);
    try {
      const link = await container.addDonationLink.execute({
        categorySlug,
        url: url.trim(),
        displayName: name.trim(),
        description: desc.trim() || null,
      });
      onAdded(link);
      reset();
      onClose();
    } catch (err) {
      setErrorKey(err instanceof DonationLinkError ? err.code : 'unknown');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose} transparent>
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scroll}>
            <Text style={styles.title}>{t('donations.addLinkModal.title')}</Text>

            <Text style={styles.label}>{t('donations.addLinkModal.urlLabel')}</Text>
            <TextInput
              style={[styles.input, styles.inputUrl]}
              value={url}
              onChangeText={setUrl}
              placeholder={t('donations.addLinkModal.urlPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
              editable={!submitting}
            />

            <Text style={styles.label}>{t('donations.addLinkModal.nameLabel')}</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder={t('donations.addLinkModal.namePlaceholder')}
              placeholderTextColor={colors.textDisabled}
              maxLength={DONATION_LINK_DISPLAY_NAME_MAX}
              editable={!submitting}
            />

            <Text style={styles.label}>{t('donations.addLinkModal.descriptionLabel')}</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={desc}
              onChangeText={setDesc}
              placeholder={t('donations.addLinkModal.descriptionPlaceholder')}
              placeholderTextColor={colors.textDisabled}
              maxLength={DONATION_LINK_DESCRIPTION_MAX}
              textAlignVertical="top"
              multiline
              editable={!submitting}
            />
            <Text style={styles.helper}>{t('donations.addLinkModal.helperText')}</Text>

            {errorKey ? (
              <Text style={styles.errorText}>
                {t(`donations.addLinkModal.errors.${errorKey}`, {
                  defaultValue: t('donations.addLinkModal.errors.unknown'),
                })}
              </Text>
            ) : null}

            <View style={styles.actions}>
              <Pressable
                style={[styles.btn, styles.btnGhost]}
                onPress={handleClose}
                disabled={submitting}
                accessibilityRole="button"
              >
                <Text style={styles.btnGhostText}>{t('donations.addLinkModal.cancel')}</Text>
              </Pressable>
              <Pressable
                style={[styles.btn, styles.btnPrimary, (!valid || submitting) && styles.btnDisabled]}
                onPress={submit}
                disabled={!valid || submitting}
                accessibilityRole="button"
                accessibilityState={{ disabled: !valid || submitting }}
              >
                {submitting ? (
                  <View style={styles.submittingRow}>
                    <ActivityIndicator size="small" color={colors.textInverse} />
                    <Text style={styles.btnPrimaryText}>{t('donations.addLinkModal.submitting')}</Text>
                  </View>
                ) : (
                  <Text style={styles.btnPrimaryText}>{t('donations.addLinkModal.submit')}</Text>
                )}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
