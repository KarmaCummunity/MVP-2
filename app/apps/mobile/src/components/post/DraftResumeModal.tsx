// FR-POST-007 AC2 — banner shown when re-entering Create Post with an
// unpublished draft. "Continue editing" hydrates the form; "Start fresh"
// clears the persisted draft.
import { useTranslation } from 'react-i18next';
import { ConfirmActionModal } from './ConfirmActionModal';

interface Props {
  readonly visible: boolean;
  readonly onContinue: () => void;
  readonly onStartFresh: () => void;
}

export function DraftResumeModal({ visible, onContinue, onStartFresh }: Props) {
  const { t } = useTranslation();
  return (
    <ConfirmActionModal
      visible={visible}
      title={t('post.draftRestored')}
      message={t('post.draftRestoredBody')}
      confirmLabel={t('post.continueDraft')}
      cancelLabel={t('post.discardDraft')}
      onConfirm={onContinue}
      onCancel={onStartFresh}
    />
  );
}
