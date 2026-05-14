// FR-ADMIN-007 — admin-only audit lookup. Hidden from non-admins via Redirect.
import React, { useState, useCallback } from 'react';
import { View, Text, TextInput, FlatList, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, Redirect } from 'expo-router';
import { detailStackScreenOptions } from '../../src/navigation/detailStackScreenOptions';
import { colors, spacing, typography } from '@kc/ui';
import type { AuditEvent } from '@kc/domain';
import { useIsSuperAdmin } from '../../src/hooks/useIsSuperAdmin';
import { container } from '../../src/lib/container';
import { getUniversalSearchUseCase } from '../../src/services/searchComposition';
import { useAuthStore } from '../../src/store/authStore';
import he from '../../src/i18n/locales/he';

interface UserHit { userId: string; displayName: string; }

export default function AuditScreen() {
  const isAdmin = useIsSuperAdmin();
  const viewerId = useAuthStore((s) => s.session?.userId ?? null);
  if (!isAdmin) return <Redirect href="/settings" />;

  const t = he.audit;
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UserHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [pickedUserName, setPickedUserName] = useState<string | null>(null);
  const [events, setEvents] = useState<readonly AuditEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const onSearchChange = useCallback(async (q: string) => {
    setQuery(q);
    if (q.trim().length < 2) {
      setHits([]);
      return;
    }
    setSearching(true);
    try {
      const result = await getUniversalSearchUseCase().execute({
        query: q,
        filters: {},
        viewerId,
        limits: { users: 20 },
      });
      const userHits: UserHit[] = (result.users ?? []).slice(0, 20).map((u) => ({
        userId: u.userId,
        displayName: u.displayName ?? u.shareHandle ?? u.userId,
      }));
      setHits(userHits);
    } catch {
      setHits([]);
    } finally {
      setSearching(false);
    }
  }, [viewerId]);

  const onPickUser = useCallback(async (hit: UserHit) => {
    setPickedUserName(hit.displayName);
    setHits([]);
    setLoadingEvents(true);
    try {
      const e = await container.lookupAudit.execute({ userId: hit.userId, limit: 200 });
      setEvents(e);
    } catch {
      setEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  }, []);

  return (
    <SafeAreaView style={styles.root} edges={['bottom']}>
      <Stack.Screen options={{ ...detailStackScreenOptions, headerTitle: t.title }} />
      <TextInput
        value={query}
        onChangeText={onSearchChange}
        placeholder={t.searchPlaceholder}
        style={styles.search}
        placeholderTextColor={colors.textSecondary}
      />
      {searching ? <ActivityIndicator style={{ margin: spacing.sm }} /> : null}
      {hits.length > 0 ? (
        <View style={styles.hits}>
          {hits.map((h) => (
            <Pressable key={h.userId} onPress={() => onPickUser(h)} style={styles.hitRow}>
              <Text style={styles.hitText}>{h.displayName}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {pickedUserName ? <Text style={styles.subjectLabel}>{pickedUserName}</Text> : null}
      {loadingEvents ? <ActivityIndicator style={{ margin: spacing.sm }} /> : null}
      <FlatList
        data={events}
        keyExtractor={(e) => e.eventId}
        ListEmptyComponent={
          !loadingEvents && pickedUserName
            ? <Text style={styles.empty}>{t.noResults}</Text>
            : null
        }
        renderItem={({ item }) => (
          <AuditRow
            event={item}
            expanded={expandedId === item.eventId}
            onToggle={() => setExpandedId(expandedId === item.eventId ? null : item.eventId)}
          />
        )}
      />
    </SafeAreaView>
  );
}

function AuditRow({ event, expanded, onToggle }: { event: AuditEvent; expanded: boolean; onToggle: () => void }) {
  const t = he.audit;
  const actionLabel = (t.rowAction as Record<string, string>)[event.action] ?? event.action;
  const subject = event.targetType
    ? `${event.targetType}#${(event.targetId ?? '').slice(0, 8)}`
    : '-';
  const when = new Date(event.createdAt).toLocaleString('he-IL');
  return (
    <Pressable onPress={onToggle} style={styles.row}>
      <Text style={styles.rowAction}>{actionLabel}</Text>
      <Text style={styles.rowMeta}>{subject} · {when}</Text>
      {expanded ? <Text style={styles.metaJson}>{JSON.stringify(event.metadata, null, 2)}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root:    { flex: 1, padding: spacing.base, backgroundColor: colors.background },
  search:  { borderWidth: 1, borderColor: colors.border, padding: spacing.sm, borderRadius: 6, marginBottom: spacing.sm, ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  hits:    { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 6, marginBottom: spacing.sm },
  hitRow:  { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  hitText: { ...typography.body, color: colors.textPrimary, textAlign: 'right' },
  subjectLabel: { ...typography.h3, color: colors.textPrimary, marginBottom: spacing.sm, textAlign: 'right' },
  row:     { paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.border, gap: 4 },
  rowAction: { ...typography.body, color: colors.textPrimary, fontWeight: '600', textAlign: 'right' },
  rowMeta: { ...typography.caption, color: colors.textSecondary, textAlign: 'right' },
  metaJson: { fontSize: 11, color: colors.textSecondary, fontFamily: 'Courier' },
  empty:   { textAlign: 'center', color: colors.textSecondary, padding: spacing.lg },
});
