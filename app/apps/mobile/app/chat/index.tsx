// Chat list (Inbox)
// Mapped to: SRS §3.4.2
import React from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { EmptyState } from '../../src/components/EmptyState';

const MOCK_CHATS = [
  {
    chatId: 'c1',
    otherName: 'ענת לוי',
    lastMessage: 'אני מעוניינת בספה, מתי נוח לאסוף?',
    time: 'לפני 5 דקות',
    unread: 2,
  },
  {
    chatId: 'c2',
    otherName: 'יוסי כהן',
    lastMessage: 'תודה רבה! ניצור קשר עוד היום.',
    time: 'לפני שעה',
    unread: 0,
  },
];

export default function ChatListScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>שיחות</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={MOCK_CHATS}
        keyExtractor={(c) => c.chatId}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.chatRow}
            onPress={() => router.push(`/chat/${item.chatId}`)}
          >
            <AvatarInitials name={item.otherName} avatarUrl={null} size={48} />
            <View style={styles.chatInfo}>
              <View style={styles.chatHeader}>
                <Text style={styles.chatTime}>{item.time}</Text>
                <Text style={styles.chatName}>{item.otherName}</Text>
              </View>
              <Text style={styles.chatPreview} numberOfLines={1}>{item.lastMessage}</Text>
            </View>
            {item.unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.unread}</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            emoji="💬"
            title="אין שיחות עדיין"
            subtitle="פנה למפרסמים ישירות מתוך הפוסטים."
          />
        }
      />
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
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.base,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  chatInfo: { flex: 1, gap: 4 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chatName: { ...typography.body, fontWeight: '600', color: colors.textPrimary, textAlign: 'right' },
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
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' },
  separator: { height: 1, backgroundColor: colors.border, marginRight: spacing.base },
});
