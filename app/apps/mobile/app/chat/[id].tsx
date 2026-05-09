// Chat conversation screen — FR-CHAT-002, 003, 004, 005, 010, 011, 013.
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { randomUUID } from 'expo-crypto';
import type { Chat } from '@kc/domain';
import { MESSAGE_MAX_CHARS } from '@kc/domain';
import { ChatError } from '@kc/application';
import { colors, typography, spacing, radius } from '@kc/ui';
import { useChatStore, type OptimisticMessage } from '../../src/store/chatStore';
import { useAuthStore } from '../../src/store/authStore';
import { container } from '../../src/lib/container';
import { ReportChatModal } from '../../src/components/ReportChatModal';
import { MessageBubble } from '../../src/components/MessageBubble';

export default function ChatScreen() {
  const { id, prefill } = useLocalSearchParams<{ id: string; prefill?: string }>();
  const chatId = id!;
  const navigation = useNavigation();
  const userId = useAuthStore((s) => s.session?.userId)!;

  const messages = useChatStore((s) => s.threads[chatId] ?? []);
  const [chat, setChat] = useState<Chat | null>(null);
  const [counterpart, setCounterpart] = useState<{ displayName: string; isDeleted: boolean }>({ displayName: '', isDeleted: false });
  const [input, setInput] = useState(prefill ?? '');
  const [reportOpen, setReportOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const c = await container.chatRepo.findById(chatId);
      if (cancelled || !c) return;
      const cp = await container.chatRepo.getCounterpart(c, userId);
      if (cancelled) return;
      setChat(c);
      setCounterpart({ displayName: cp.displayName, isDeleted: cp.isDeleted });
      await useChatStore.getState().startThreadSub(chatId, container.chatRepo, container.chatRealtime);
      await container.markChatRead.execute({ chatId, userId });
    })();
    return () => {
      cancelled = true;
      useChatStore.getState().stopThreadSub(chatId);
    };
  }, [chatId, userId]);

  const unreadIncoming = useMemo(
    () => messages.some((m) => m.senderId !== userId && m.status !== 'read'),
    [messages, userId],
  );
  useEffect(() => {
    if (unreadIncoming) void container.markChatRead.execute({ chatId, userId });
  }, [unreadIncoming, chatId, userId]);

  const doBlock = async () => {
    if (!chat) return;
    const otherId = chat.participantIds[0] === userId ? chat.participantIds[1] : chat.participantIds[0];
    try {
      await container.blockUser.execute({ blockerId: userId, blockedId: otherId });
      Alert.alert('המשתמש נחסם');
      navigation.goBack();
    } catch {
      Alert.alert('שגיאה', 'לא ניתן לחסום כעת.');
    }
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: counterpart.isDeleted ? 'משתמש שנמחק' : counterpart.displayName,
      headerRight: () => chat?.isSupportThread ? null : (
        <TouchableOpacity
          onPress={() =>
            Alert.alert('פעולות', undefined, [
              { text: 'חסום', style: 'destructive', onPress: doBlock },
              { text: 'דווח על השיחה', onPress: () => setReportOpen(true) },
              { text: 'ביטול', style: 'cancel' },
            ])
          }
        >
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, counterpart, chat?.isSupportThread]);

  const send = async (overrideClientId?: string, overrideBody?: string) => {
    const body = (overrideBody ?? input).trim();
    if (body.length === 0 || body.length > MESSAGE_MAX_CHARS) return;
    const clientId = overrideClientId ?? randomUUID();
    const optimistic: OptimisticMessage = {
      messageId: clientId, clientId, chatId, senderId: userId, kind: 'user',
      body, systemPayload: null, status: 'pending',
      createdAt: new Date().toISOString(), deliveredAt: null, readAt: null,
    };
    if (!overrideClientId) {
      useChatStore.getState().appendOptimistic(chatId, optimistic);
      setInput('');
    }
    try {
      const server = await container.sendMessage.execute({ chatId, senderId: userId, body });
      useChatStore.getState().reconcileSent(chatId, clientId, server);
    } catch (err) {
      useChatStore.getState().markFailed(chatId, clientId);
      if (err instanceof ChatError && err.code === 'send_to_deleted_user') {
        Alert.alert('משתמש לא זמין', 'המשתמש כבר לא קיים במערכת.');
      }
    }
  };

  const counter = input.length;
  const showCounter = counter >= 1900;
  const sendDisabled = counter === 0 || counter > MESSAGE_MAX_CHARS;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={88}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.clientId}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <MessageBubble
              m={item}
              mine={item.senderId === userId}
              onRetry={() => send(item.clientId, item.body)}
            />
          )}
        />

        <View style={styles.inputBar}>
          <TouchableOpacity style={[styles.sendBtn, sendDisabled && styles.sendBtnDisabled]} onPress={() => send()} disabled={sendDisabled}>
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <TextInput
              style={styles.input}
              value={input}
              onChangeText={setInput}
              placeholder="כתוב הודעה..."
              placeholderTextColor={colors.textDisabled}
              textAlign="right"
              multiline
              maxLength={MESSAGE_MAX_CHARS}
            />
            {showCounter && <Text style={styles.counter}>{counter}/{MESSAGE_MAX_CHARS}</Text>}
          </View>
        </View>
      </KeyboardAvoidingView>

      <ReportChatModal chatId={chatId} visible={reportOpen} onClose={() => setReportOpen(false)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messageList: { padding: spacing.base, gap: spacing.sm },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm,
  },
  input: {
    minHeight: 40, maxHeight: 100, backgroundColor: colors.background, borderRadius: radius.lg,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, ...typography.body, color: colors.textPrimary,
    borderWidth: 1.5, borderColor: colors.border,
  },
  counter: { ...typography.caption, color: colors.textSecondary, alignSelf: 'flex-start', paddingHorizontal: spacing.sm },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
