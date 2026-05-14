export type NotificationCategory = 'critical' | 'social';

export type NotificationKind =
  | 'chat_message'
  | 'support_message'
  | 'system_message'
  | 'post_expiring'
  | 'mark_recipient'
  | 'unmark_recipient'
  | 'auto_removed'
  | 'follow_request'
  | 'follow_started'
  | 'follow_approved';

/** Payload attached to every Expo push under `data`. The client reads this on tap. */
export interface PushData {
  category: NotificationCategory;
  kind: NotificationKind;
  notification_id: string;
  /** expo-router pathname, e.g. '/chat/[id]'. */
  route?: string;
  /** route params, e.g. { id: '<chat_id>' }. */
  params?: Record<string, string>;
  /** Convenience field used by the foreground handler to detect chat-active state. */
  chat_id?: string;
}

export interface DeviceRegistration {
  readonly userId: string;
  readonly pushToken: string;
  readonly platform: 'ios' | 'android' | 'web';
}
