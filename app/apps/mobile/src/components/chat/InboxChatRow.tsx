// Single inbox row — FR-CHAT-001, FR-CHAT-016.
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { ChatWithPreview } from '@kc/application';
import { colors, typography, spacing } from '@kc/ui';
import { AvatarInitials } from '../AvatarInitials';
import { formatRelativeChatTime } from '../../lib/formatRelativeChatTime';

interface Props {
  readonly item: ChatWithPreview;
  readonly onOpen: () => void;
  readonly onRequestHide: () => void;
}

export function InboxChatRow({ item, onOpen, onRequestHide }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.chatRow}>
      <TouchableOpacity style={styles.chatRowMain} onPress={onOpen}>
        <AvatarInitials
          name={item.otherParticipant.displayName}
          avatarUrl={item.otherParticipant.avatarUrl}
          size={48}
        />
        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.chatTime}>
              {formatRelativeChatTime(item.lastMessage?.createdAt ?? item.lastMessageAt)}
            </Text>
            <Text style={styles.chatName}>{item.otherParticipant.displayName}</Text>
          </View>
          <Text style={styles.chatPreview} numberOfLines={1}>
            {item.lastMessage?.body ?? ''}
          </Text>
        </View>
      </TouchableOpacity>
      {item.unreadCount > 0 ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.unreadCount > 9 ? '9+' : String(item.unreadCount)}
          </Text>
        </View>
      ) : (
        <View style={{ width: 22 }} />
      )}
      <TouchableOpacity
        onPress={onRequestHide}
        hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        accessibilityLabel={t('chat.hideChatA11y')}
      >
        <Ionicons name="ellipsis-horizontal" size={22} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

export const inboxChatRowSeparatorStyle = {
  height: 1,
  backgroundColor: colors.border,
  marginRight: spacing.base,
};

const styles = StyleSheet.create({
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.sm,
    backgroundColor: colors.surface,
  },
  chatRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  chatInfo: { flex: 1, gap: 4 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: {
    ...typography.body,
    fontWeight: '600' as const,
    color: colors.textPrimary,
    textAlign: 'right',
  },
  chatTime: { ...typography.caption, color: colors.textSecondary },
  chatPreview: { ...typography.body, color: colors.textSecondary, textAlign: 'right' },
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: { ...typography.caption, color: colors.textInverse, fontSize: 11, fontWeight: '600' as const },
});

export function InboxChatRowSeparator() {
  return <View style={sepStyles.line} />;
}

const sepStyles = StyleSheet.create({
  line: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginRight: spacing.base },
});
