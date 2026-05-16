// Chat list (Inbox) — FR-CHAT-001, FR-CHAT-016.
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, RefreshControl, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ChatError } from '@kc/application';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useChatStore } from '../../src/store/chatStore';
import { useAuthStore } from '../../src/store/authStore';
import { container } from '../../src/lib/container';
import { markNeedFreshThreadWith } from '../../src/lib/chatNavigationPrefs';
import { EmptyState } from '../../src/components/EmptyState';
import { HideChatConfirmModal } from '../../src/components/HideChatConfirmModal';
import { InboxChatRow, InboxChatRowSeparator } from '../../src/components/chat/InboxChatRow';
import { NotifyModal } from '../../src/components/NotifyModal';

const PAGE = 30;

export default function ChatListScreen() {
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.userId);
  const inbox = useChatStore((s) => s.inbox);
  const [q, setQ] = useState('');
  const [visible, setVisible] = useState(PAGE);
  const [hideTarget, setHideTarget] = useState<{ chatId: string; otherUserId: string | null } | null>(
    null,
  );
  const [hideBusy, setHideBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // TD-138: Alert.alert is a no-op on react-native-web — surface via NotifyModal.
  const [hideErrorMsg, setHideErrorMsg] = useState<string | null>(null);

  const onRefresh = useCallback(async () => {
    if (!userId) return;
    setRefreshing(true);
    try {
      await useChatStore.getState().refreshInbox(userId, container.chatRepo);
    } finally {
      setRefreshing(false);
    }
  }, [userId]);

  const filtered = useMemo(() => {
    if (!inbox) return [];
    const needle = q.trim().toLowerCase();
    const list = needle
      ? inbox.filter((c) => (c.otherParticipant.displayName ?? '').toLowerCase().startsWith(needle))
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        renderItem={({ item }) => (
          <InboxChatRow
            item={item}
            onOpen={() => router.push(`/chat/${item.chatId}`)}
            onRequestHide={() =>
              setHideTarget({ chatId: item.chatId, otherUserId: item.otherParticipant.userId })
            }
          />
        )}
        ItemSeparatorComponent={InboxChatRowSeparator}
        ListEmptyComponent={
          <EmptyState
            icon="chatbubbles-outline"
            title="אין שיחות עדיין"
            subtitle="פנה למפרסמים ישירות מתוך הפוסטים."
          />
        }
      />

      <HideChatConfirmModal
        visible={hideTarget != null}
        loading={hideBusy}
        onCancel={() => setHideTarget(null)}
        onConfirm={async () => {
          const target = hideTarget;
          if (!target || !userId) return;
          setHideBusy(true);
          try {
            await container.hideChatFromInbox.execute({ chatId: target.chatId });
            if (target.otherUserId) markNeedFreshThreadWith(target.otherUserId);
            await useChatStore.getState().refreshInbox(userId, container.chatRepo);
            setHideTarget(null);
          } catch (err) {
            const msg =
              err instanceof ChatError && err.code === 'support_thread_not_hideable'
                ? 'לא ניתן להסיר את שיחת התמיכה.'
                : 'לא הצלחנו להסיר את השיחה. נסה שוב.';
            setHideErrorMsg(msg);
          } finally {
            setHideBusy(false);
          }
        }}
      />
      <NotifyModal visible={hideErrorMsg !== null} title="שגיאה" message={hideErrorMsg ?? ''} onDismiss={() => setHideErrorMsg(null)} />
    </SafeAreaView>
  );
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
});
