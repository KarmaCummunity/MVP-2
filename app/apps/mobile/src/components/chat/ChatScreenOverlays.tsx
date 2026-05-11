// Chat conversation modals/menus — FR-CHAT-002, FR-CHAT-016 (keeps `chat/[id].tsx` under LOC cap).
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ReportChatModal } from '../ReportChatModal';
import { ChatActionMenu } from '../ChatActionMenu';
import { HideChatConfirmModal } from '../HideChatConfirmModal';

interface Props {
  readonly chatId: string;
  readonly isSupportThread?: boolean;
  readonly reportOpen: boolean;
  readonly onReportClose: () => void;
  readonly menuOpen: boolean;
  readonly onMenuClose: () => void;
  readonly onReportFromMenu: () => void;
  readonly hideConfirmOpen: boolean;
  readonly hideBusy: boolean;
  readonly onHideCancel: () => void;
  readonly onOpenHideConfirm: () => void;
  readonly onHideConfirm: () => Promise<void>;
}

export function ChatScreenOverlays({
  chatId,
  isSupportThread,
  reportOpen,
  onReportClose,
  menuOpen,
  onMenuClose,
  onReportFromMenu,
  hideConfirmOpen,
  hideBusy,
  onHideCancel,
  onOpenHideConfirm,
  onHideConfirm,
}: Props) {
  const { t } = useTranslation();
  return (
    <>
      <ReportChatModal chatId={chatId} visible={reportOpen} onClose={onReportClose} />
      <ChatActionMenu
        visible={menuOpen}
        onClose={onMenuClose}
        onReport={onReportFromMenu}
        deleteLabel={isSupportThread ? undefined : t('chat.menuDeleteFromInbox')}
        onDeleteFromInbox={
          isSupportThread
            ? undefined
            : () => {
                onMenuClose();
                onOpenHideConfirm();
              }
        }
      />
      <HideChatConfirmModal
        visible={hideConfirmOpen}
        loading={hideBusy}
        onCancel={onHideCancel}
        onConfirm={onHideConfirm}
      />
    </>
  );
}
