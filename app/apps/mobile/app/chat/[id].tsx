// Chat conversation screen
// Mapped to: SRS §3.4.3
import React, { useState } from 'react';
import {
  View, Text, FlatList, TextInput,
  TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing, radius } from '@kc/ui';

interface Message {
  id: string;
  body: string;
  isMine: boolean;
  time: string;
  read: boolean;
}

const MOCK_MESSAGES: Message[] = [
  { id: 'm1', body: 'היי! ראיתי את הפוסט שלך על ספה תלת מושבית. מעוניינת לדעת עוד.', isMine: false, time: '10:32', read: true },
  { id: 'm2', body: 'שלום! כן, הספה עדיין זמינה. מתי תוכלי לאסוף?', isMine: true, time: '10:35', read: true },
  { id: 'm3', body: 'אני מעוניינת בספה, מתי נוח לאסוף?', isMine: false, time: '10:38', read: false },
];

export default function ChatScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState('');

  useLayoutEffect(() => {
    navigation.setOptions({ title: 'ענת לוי' });
  }, [navigation]);

  const sendMessage = () => {
    if (!inputText.trim()) return;
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        body: inputText.trim(),
        isMine: true,
        time: new Date().toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' }),
        read: false,
      },
    ]);
    setInputText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={88}
      >
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => (
            <View style={[styles.bubble, item.isMine ? styles.bubbleMine : styles.bubbleOther]}>
              <Text style={[styles.bubbleText, item.isMine ? styles.bubbleTextMine : styles.bubbleTextOther]}>
                {item.body}
              </Text>
              <View style={styles.bubbleMeta}>
                {item.isMine && (
                  <Text style={styles.readReceipt}>{item.read ? '✓✓' : '✓'}</Text>
                )}
                <Text style={[styles.timeText, item.isMine && { color: 'rgba(255,255,255,0.7)' }]}>
                  {item.time}
                </Text>
              </View>
            </View>
          )}
          showsVerticalScrollIndicator={false}
        />

        {/* Input bar */}
        <View style={styles.inputBar}>
          <TouchableOpacity
            style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]}
            onPress={sendMessage}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="כתוב הודעה..."
            placeholderTextColor={colors.textDisabled}
            textAlign="right"
            multiline
            maxLength={2000}
            onSubmitEditing={sendMessage}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  messageList: { padding: spacing.base, gap: spacing.sm },
  bubble: {
    maxWidth: '80%',
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: 4,
  },
  bubbleMine: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderBottomLeftRadius: 4,
  },
  bubbleOther: {
    alignSelf: 'flex-end',
    backgroundColor: colors.surface,
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bubbleText: { ...typography.body },
  bubbleTextMine: { color: colors.textInverse },
  bubbleTextOther: { color: colors.textPrimary, textAlign: 'right' },
  bubbleMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  timeText: { ...typography.caption, color: colors.textSecondary },
  readReceipt: { fontSize: 11, color: 'rgba(255,255,255,0.7)' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: colors.background,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    ...typography.body,
    color: colors.textPrimary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
});
