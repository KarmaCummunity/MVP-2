// FR-MOD-010 / FR-ADMIN-002..005 — dispatcher for system-message bubbles in chat.
// Routes by payload.kind to a per-kind subcomponent. Returns null for unknown
// kinds so MessageBubble's existing legacy pill handles them.
import React from 'react';
import { ReportReceivedBubble } from './ReportReceivedBubble';
import { AutoRemovedBubble } from './AutoRemovedBubble';
import { ModActionTakenBubble } from './ModActionTakenBubble';
import { OwnerAutoRemovedBubble } from './OwnerAutoRemovedBubble';

export interface SystemMessageBubbleProps {
  messageId: string;
  payload: Record<string, unknown> | null;
  body: string;
  createdAt: string;
  handledByLaterAction: boolean;
}

export function SystemMessageBubble(props: SystemMessageBubbleProps): React.ReactElement | null {
  const kind = (props.payload?.kind as string | undefined) ?? '';
  switch (kind) {
    case 'report_received':
      return <ReportReceivedBubble {...props} />;
    case 'auto_removed':
      return <AutoRemovedBubble {...props} />;
    case 'mod_action_taken':
      return <ModActionTakenBubble {...props} />;
    case 'owner_auto_removed':
      return <OwnerAutoRemovedBubble {...props} />;
    default:
      return null;
  }
}
