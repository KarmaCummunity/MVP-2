// 1.5s fullscreen overlay shown after successful self-deletion, before
// the parent navigates to the sign-in screen.

import React from 'react';
import { Modal, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';

export interface DeleteAccountSuccessOverlayProps {
  visible: boolean;
}

export function DeleteAccountSuccessOverlay({ visible }: DeleteAccountSuccessOverlayProps) {
  const { t } = useTranslation();
  if (!visible) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={overlayStyles.root}>
        <Text style={overlayStyles.title}>{t('settings.deleteAccountModal.success.title')}</Text>
        <Text style={overlayStyles.subtitle}>{t('settings.deleteAccountModal.success.subtitle')}</Text>
      </View>
    </Modal>
  );
}

const overlayStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: '#dddddd',
    fontSize: 16,
    textAlign: 'center',
  },
});
