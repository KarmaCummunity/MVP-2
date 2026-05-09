// Bubble for a single chat message — FR-CHAT-002 AC2/AC4.
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { OptimisticMessage } from '../store/chatStore';
import { colors, typography, spacing, radius } from '@kc/ui';

export function MessageBubble({
  m, mine, onRetry,
}: { m: OptimisticMessage; mine: boolean; onRetry: () => void }) {
  const [showTime, setShowTime] = useState(false);

  // System messages (FR-CHAT-007 / FR-MOD-002) — neutral pill, centered, no
  // sender bubble or read-receipt. system_payload carries structured data;
  // body carries a Hebrew summary the trigger built.
  if (m.kind === 'system') {
    return (
      <View style={styles.systemWrap}>
        <View style={styles.systemPill}>
          <Ionicons name="information-circle-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.systemText}>{m.body}</Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={() => setShowTime((s) => !s)}>
      <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleOther]}>
        <Text style={[styles.bubbleText, mine ? styles.bubbleTextMine : styles.bubbleTextOther]}>{m.body}</Text>
        <View style={styles.bubbleMeta}>
          {m.failed && (
            <TouchableOpacity onPress={onRetry}><Ionicons name="refresh" size={14} color={colors.textInverse} /></TouchableOpacity>
          )}
          {mine && !m.failed && <Text style={styles.readReceipt}>{m.status === 'read' ? '✓✓' : '✓'}</Text>}
          {showTime && (
            <Text style={[styles.timeText, mine && { color: 'rgba(255,255,255,0.7)' }]}>
              {new Date(m.createdAt).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '80%', padding: spacing.md, borderRadius: radius.lg, gap: 4 },
  bubbleMine: { alignSelf: 'flex-start', backgroundColor: colors.primary, borderBottomLeftRadius: 4 },
  bubbleOther: { alignSelf: 'flex-end', backgroundColor: colors.surface, borderBottomRightRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleText: { ...typography.body },
  bubbleTextMine: { color: colors.textInverse },
  bubbleTextOther: { color: colors.textPrimary, textAlign: 'right' },
  bubbleMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  timeText: { ...typography.caption, color: colors.textSecondary },
  readReceipt: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  systemWrap: { alignItems: 'center', paddingVertical: spacing.xs },
  systemPill: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.background,
    borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
    borderRadius: radius.full,
    maxWidth: '90%',
  },
  systemText: { ...typography.caption, color: colors.textSecondary, textAlign: 'center' },
});
