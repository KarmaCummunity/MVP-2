// Chat conversation screen — FR-CHAT-002, 003, 004, 005, 010, 011, 013, 016.
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  View, Text, FlatList, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { MESSAGE_MAX_CHARS } from '@kc/domain';
import { ChatError } from '@kc/application';
import { colors } from '@kc/ui';
import { useChatStore, type OptimisticMessage } from '../../src/store/chatStore';
import { useAuthStore } from '../../src/store/authStore';
import { container } from '../../src/lib/container';
import { markNeedFreshThreadWith } from '../../src/lib/chatNavigationPrefs';
import { MessageBubble } from '../../src/components/MessageBubble';
import { computeHandledIds } from '../../src/components/chat/system/handledIds';
import { AnchoredPostCard } from '../../src/components/chat/AnchoredPostCard';
import { ChatScreenOverlays } from '../../src/components/chat/ChatScreenOverlays';
import { useChatInit } from '../../src/components/useChatInit';
import { useChatSend } from '../../src/hooks/useChatSend';
import { chatConversationStyles as styles } from './chatScreenStyles';
import { usePushPermissionGate, registerCurrentDeviceIfPermitted } from '../../src/lib/notifications';
import { EnablePushModal } from '../../src/components/EnablePushModal';
import { NotifyModal } from '../../src/components/NotifyModal';

const EMPTY_MESSAGES: OptimisticMessage[] = [];

export default function ChatScreen() {
  const { id, prefill } = useLocalSearchParams<{ id: string; prefill?: string }>();
  const chatId = id!;
  const navigation = useNavigation();
  const router = useRouter();
  const userId = useAuthStore((s) => s.session?.userId)!;

  const messages = useChatStore((s) => s.threads[chatId] ?? EMPTY_MESSAGES);
  const { chat, counterpart } = useChatInit(chatId, userId);
  const [input, setInput] = useState(prefill ?? '');
  const [reportOpen, setReportOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [hideConfirmOpen, setHideConfirmOpen] = useState(false);
  // TD-138: Alert.alert is a no-op on react-native-web — surface via NotifyModal.
  const [notify, setNotify] = useState<{ title: string; message: string } | null>(null);
  const [hideBusy, setHideBusy] = useState(false);
  const { modalState, presentPrePrompt, handleAccept, handleDecline } = usePushPermissionGate();
  const send = useChatSend({ chatId, userId, input, setInput, presentPrePrompt, setNotify });

  const unreadIncoming = useMemo(
    () => messages.some((m) => m.senderId !== userId && m.status !== 'read'),
    [messages, userId],
  );
  useEffect(() => {
    if (!unreadIncoming) return;
    void (async () => {
      await container.markChatRead.execute({ chatId, userId });
      useChatStore.getState().markChatLocallyRead(chatId);
    })();
  }, [unreadIncoming, chatId, userId]);

  useLayoutEffect(() => {
    const title = counterpart.isDeleted ? 'משתמש שנמחק' : counterpart.displayName;
    const canOpenProfile = !counterpart.isDeleted && !!counterpart.shareHandle && !chat?.isSupportThread;
    navigation.setOptions({
      title,
      headerTitle: () => (
        <TouchableOpacity
          disabled={!canOpenProfile}
          onPress={() => router.push(`/user/${counterpart.shareHandle}`)}
          accessibilityRole={canOpenProfile ? 'button' : undefined}
        >
          <Text style={styles.headerTitle}>{title}</Text>
        </TouchableOpacity>
      ),
      headerRight: () => (
        <TouchableOpacity onPress={() => setMenuOpen(true)} accessibilityRole="button" accessibilityLabel="פעולות">
          <Ionicons name="ellipsis-vertical" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, router, counterpart, chat?.isSupportThread]);

  const counter = input.length;
  const showCounter = counter >= 1900;
  const sendDisabled = counter === 0 || counter > MESSAGE_MAX_CHARS;
  const reversedMessages = useMemo(() => [...messages].reverse(), [messages]);

  // Precompute O(1) lookup of message ids handled by a later mod_action_taken
  // bubble (FR-MOD-010). Built once per messages render; O(1) per row.
  const handledIds = useMemo(() => computeHandledIds(reversedMessages), [reversedMessages]);

  const confirmHideFromInbox = async () => {
    setHideBusy(true);
    try {
      await container.hideChatFromInbox.execute({ chatId });
      if (counterpart.userId) markNeedFreshThreadWith(counterpart.userId);
      useChatStore.getState().stopThreadSub(chatId);
      await useChatStore.getState().refreshInbox(userId, container.chatRepo);
      setHideConfirmOpen(false);
      setHideBusy(false);
      router.back();
    } catch (err) {
      setHideBusy(false);
      const msg =
        err instanceof ChatError && err.code === 'support_thread_not_hideable'
          ? 'לא ניתן להסיר את שיחת התמיכה.'
          : 'לא הצלחנו להסיר את השיחה. נסה שוב.';
      setNotify({ title: 'שגיאה', message: msg });
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={88}
      >
        {chat ? (
          <AnchoredPostCard
            chatId={chatId}
            anchorPostId={chat.anchorPostId}
            viewerId={userId}
            counterpartId={chat.participantIds[0] === userId ? chat.participantIds[1] : chat.participantIds[0]}
          />
        ) : null}
        <FlatList
          data={reversedMessages}
          inverted
          keyExtractor={(m) => m.clientId}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <MessageBubble
              m={item}
              mine={item.senderId === userId}
              onRetry={() => send(item.clientId, item.body)}
              handledByLaterAction={handledIds.has(item.messageId)}
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

      <ChatScreenOverlays
        chatId={chatId}
        isSupportThread={chat?.isSupportThread}
        reportOpen={reportOpen}
        onReportClose={() => setReportOpen(false)}
        menuOpen={menuOpen}
        onMenuClose={() => setMenuOpen(false)}
        onReportFromMenu={() => { setMenuOpen(false); setReportOpen(true); }}
        hideConfirmOpen={hideConfirmOpen}
        hideBusy={hideBusy}
        onHideCancel={() => setHideConfirmOpen(false)}
        onOpenHideConfirm={() => setHideConfirmOpen(true)}
        onHideConfirm={confirmHideFromInbox}
      />
      <EnablePushModal
        visible={modalState.visible}
        trigger={modalState.trigger}
        onAccept={async () => {
          const status = await handleAccept();
          if (status === 'granted' && userId) {
            await registerCurrentDeviceIfPermitted(userId, { deviceRepo: container.deviceRepo });
          }
        }}
        onDecline={handleDecline}
      />
      <NotifyModal visible={notify !== null} title={notify?.title ?? ''} message={notify?.message ?? ''} onDismiss={() => setNotify(null)} />
    </SafeAreaView>
  );
}
