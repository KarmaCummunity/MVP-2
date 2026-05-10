// Other-user profile (minimal) — FR-CHAT-006 entry point. Closes part of TD-40.
// Avatar, display name, handle, bio + Send-message / Block CTAs.
// Header is owned by the Stack (`_layout.tsx` → `detailHeader`); we override the
// title per-user via `<Stack.Screen options={{ headerTitle }} />` so we don't
// render a second in-screen header (the cause of the doubled-header bug).
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator, Alert, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSupabaseClient,
  SupabaseUserRepository,
  type SupabaseAuthStorage,
} from '@kc/infrastructure-supabase';
import type { User } from '@kc/domain';
import { colors, typography, spacing, radius } from '@kc/ui';
import { AvatarInitials } from '../../src/components/AvatarInitials';
import { container } from '../../src/lib/container';
import { useAuthStore } from '../../src/store/authStore';

// Local user repo — IUserRepository isn't on the container yet (TD-40).
// Mirrors the lazy-singleton pattern used by services/postsComposition.ts.
function pickStorage(): SupabaseAuthStorage | undefined {
  if (Platform.OS === 'web') {
    if (typeof window === 'undefined' || !window.localStorage) return undefined;
    return window.localStorage;
  }
  return AsyncStorage;
}
const userRepo = new SupabaseUserRepository(getSupabaseClient({ storage: pickStorage() }));

export default function UserProfileScreen() {
  const { handle } = useLocalSearchParams<{ handle: string }>();
  const router = useRouter();
  const me = useAuthStore((s) => s.session?.userId);
  const [u, setU] = useState<User | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!handle) {
        if (!cancelled) setU(null);
        return;
      }
      try {
        const found = await userRepo.findByHandle(handle);
        if (!cancelled) setU(found);
      } catch {
        if (!cancelled) setU(null);
      }
    })();
    return () => { cancelled = true; };
  }, [handle]);

  if (u === undefined) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 80 }} color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (u === null) {
    return (
      <SafeAreaView style={styles.container}>
        <Stack.Screen options={{ headerTitle: 'פרופיל' }} />
        <View style={styles.body}>
          <Text style={styles.title}>משתמש לא נמצא</Text>
        </View>
      </SafeAreaView>
    );
  }

  const startChat = async () => {
    if (!me) return;
    const chat = await container.openOrCreateChat.execute({
      viewerId: me,
      otherUserId: u.userId,
    });
    router.push({ pathname: '/chat/[id]', params: { id: chat.chatId } });
  };

  const block = async () => {
    if (!me) return;
    try {
      await container.blockUser.execute({ blockerId: me, blockedId: u.userId });
      Alert.alert('המשתמש נחסם');
      router.back();
    } catch {
      Alert.alert('שגיאה');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerTitle: u.displayName }} />
      <View style={styles.body}>
        <AvatarInitials name={u.displayName} avatarUrl={u.avatarUrl} size={96} />
        <Text style={styles.displayName}>{u.displayName}</Text>
        <Text style={styles.handle}>@{u.shareHandle}</Text>
        {u.biography ? <Text style={styles.bio}>{u.biography}</Text> : null}

        <TouchableOpacity style={styles.btnPrimary} onPress={startChat}>
          <Text style={styles.btnPrimaryText}>שלח הודעה</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnGhost} onPress={block}>
          <Text style={styles.btnGhostText}>חסום משתמש</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface },
  title: { ...typography.h3, color: colors.textPrimary },
  body: { padding: spacing.base, alignItems: 'center', gap: spacing.md },
  displayName: { ...typography.h2, color: colors.textPrimary, marginTop: spacing.sm },
  handle: { ...typography.body, color: colors.textSecondary },
  bio: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  btnPrimary: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  btnPrimaryText: { ...typography.body, color: colors.textInverse, fontWeight: '700' as const },
  btnGhost: { paddingVertical: spacing.md, alignItems: 'center' },
  btnGhostText: { ...typography.body, color: colors.error },
});
