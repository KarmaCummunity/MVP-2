// Chat list (Inbox) — FR-CHAT-001.
import React, { useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useChatStore } from '../../src/store/chatStore';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { EmptyState } from '../../src/components/EmptyState';

const PAGE = 30;

export default function ChatListScreen() {
  const router = useRouter();
  const inbox = useChatStore((s) => s.inbox);
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE);

  const filtered = useMemo(() => {
    if (!inbox) return [];
    const needle = q.trim().toLowerCase();
    const list = needle
      ? inbox.filter((c) => c.otherParticipant.displayName.toLowerCase().startsWith(needle))
      : inbox;
    return list.slice(0, visible);
  }, [inbox, q, visible]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>שיחות</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          value={q}
          onChangeText={setQ}
          placeholder="חפש לפי שם..."
          placeholderTextColor={colors.textDisabled}
          textAlign="right"
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(c) => c.chatId}
        onEndReached={() => setVisible((v) => v + PAGE)}
        onEndReachedThreshold={0.6}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatRow}
            onPress={() => router.push(`/chat/${item.chatId}`)}
          >
            <AvatarInitials
              name={item.otherParticipant.displayName}
              avatarUrl={item.otherParticipant.avatarUrl}
              size={48}
            />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTime}>
                  {relativeTime(item.lastMessage?.createdAt ?? item.lastMessageAt)}
                </Text>
                <Text style={styles.chatName}>{item.otherParticipant.displayName}</Text>
              </View>
              <Text style={styles.chatPreview} numberOfLines={1}>
                {item.lastMessage?.body ?? ''}
              </Text>
            </View>
            {item.unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {item.unreadCount > 9 ? '9+' : String(item.unreadCount)}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="אין שיחות עדיין"
            subtitle="פנה למפרסמים ישירות מתוך הפוסטים."
          />
        }
      />
    </SafeAreaView>
  );
}

function relativeTime(iso: string | null | undefined): string {
  if (!iso) return '';
  const diffMin = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (diffMin < 1) return 'עכשיו';
  if (diffMin < 60) return `לפני ${diffMin} דק'`;
  const hours = Math.round(diffMin / 60);
  if (hours < 24) return `לפני ${hours} שעות`;
  const days = Math.round(hours / 24);
  return `לפני ${days} ימים`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { ...typography.h3, color: colors.textPrimary },
  searchWrap: { padding: spacing.sm, backgroundColor: colors.surface },
  search: {
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: colors.surface,
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
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' as const },
  separator: { height: 1, backgroundColor: colors.border, marginRight: spacing.base },
});
