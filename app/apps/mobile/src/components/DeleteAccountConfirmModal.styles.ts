import { Platform } from 'react-native';
import { makeUseStyles } from '@kc/ui';
import { rowDirectionStart } from '../lib/rtlLayout';
import { rtlTextAlignStart } from '../lib/rtlTextAlignStart';

export const useDeleteAccountConfirmModalStyles = makeUseStyles(({ colors }) => ({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: 16,
    padding: 20,
    maxWidth: 480,
    width: '100%',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.error,
    textAlign: rtlTextAlignStart,
    marginBottom: 14,
  },
  bulletList: {
    marginBottom: 12,
  },
  bullet: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginBottom: 4,
  },
  chatsRetention: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginBottom: 10,
    backgroundColor: colors.warningLight,
    padding: 10,
    borderRadius: 8,
  },
  warning: {
    fontSize: 13,
    lineHeight: 20,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: rtlTextAlignStart,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'web' ? 10 : 8,
    fontSize: 16,
    textAlign: rtlTextAlignStart,
    marginBottom: 16,
    color: colors.textPrimary,
    backgroundColor: colors.background,
  },
  buttonsRow: {
    flexDirection: rowDirectionStart,
    justifyContent: 'space-between',
    gap: 12,
  },
  buttonDelete: {
    flex: 1,
    backgroundColor: colors.error,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDeleteDisabled: {
    opacity: 0.55,
  },
  buttonDeleteText: {
    color: colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  buttonCancel: {
    flex: 1,
    backgroundColor: colors.skeleton,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonCancelText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: colors.errorLight,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorBannerText: {
    color: colors.error,
    fontSize: 14,
    textAlign: rtlTextAlignStart,
  },
  errorBannerCritical: {
    backgroundColor: colors.error,
  },
  errorBannerCriticalText: {
    color: colors.textInverse,
    fontWeight: '600',
  },
  blockedTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.error,
    textAlign: rtlTextAlignStart,
    marginBottom: 8,
  },
  blockedBody: {
    fontSize: 15,
    color: colors.textPrimary,
    textAlign: rtlTextAlignStart,
    marginBottom: 16,
  },
}));
