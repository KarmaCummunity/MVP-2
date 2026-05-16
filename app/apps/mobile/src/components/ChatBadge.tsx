// FR-CHAT-012 — unread badge in top-bar.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '../store/chatStore';
import { colors, typography } from '@kc/ui';

export function ChatBadge() {
  const router = useRouter();
  const { t } = useTranslation();
  const total = useChatStore((s) => s.unreadTotal);
  const display = total > 9 ? '9+' : String(total);
  return (
    <TouchableOpacity onPress={() => router.push('/chat')} style={styles.wrap} accessibilityLabel={t('chat.title')}>
      <Ionicons name="chatbubbles-outline" size={22} color={colors.textPrimary} />
      {total > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{display}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: 6, position: 'relative' },
  badge: {
    position: 'absolute', top: 0, right: 0,
    backgroundColor: colors.primary, borderRadius: 10,
    minWidth: 18, height: 18, paddingHorizontal: 4,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { ...typography.caption, color: colors.textInverse, fontWeight: '700' as const, fontSize: 10 },
});
