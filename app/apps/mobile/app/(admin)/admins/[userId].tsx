// app/apps/mobile/app/(admin)/admins/[userId].tsx
// FR-ADMIN-022 — admin-detail screen: one consolidated view of a team member
// with all their role grants, per-role revoke, a link to their public profile,
// and placeholders for the direct-manager / subordinates tree (Phase 2).
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import {
  type AdminPermission, type AdminRole, hasPermission, isAdminRoleError,
} from '@kc/domain';
import { makeUseStyles, radius, useTheme } from '@kc/ui';
import { useAdminRoles } from '../../../src/hooks/useAdminRoles';
import { useAdminPerson } from '../../../src/hooks/useAdminPerson';
import { useOrgTree } from '../../../src/hooks/useOrgTree';
import { useRevokeAdminRole } from '../../../src/hooks/useAdminRoleMutations';
import { AvatarInitials } from '../../../src/components/AvatarInitials';
import { AdminRow } from '../../../src/components/admin/admins/AdminRow';
import { GrantManagerSection } from '../../../src/components/admin/admins/GrantManagerSection';
import { rowDirectionStart, textAlignStart } from '../../../src/lib/rtlLayout';
import he from '../../../src/i18n/locales/he';

export default function AdminDetailScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const router = useRouter();
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { roles, isLoading: rolesLoading } = useAdminRoles();
  const { person, isLoading } = useAdminPerson(userId);
  const tree = useOrgTree(null);
  const revoke = useRevokeAdminRole();
  const [revokeErr, setRevokeErr] = useState<string | null>(null);

  const can = (perm: AdminPermission) => hasPermission(roles as readonly AdminRole[], perm);
  const canRevoke = can('admins.revoke_role');
  const canManage = can('admins.set_manager');
  const myMemberships = tree.members.filter((m) => m.userId === userId);

  async function onRevoke(grantId: string) {
    setRevokeErr(null);
    try { await revoke.mutateAsync(grantId); }
    catch (e) { setRevokeErr(isAdminRoleError(e) ? e.code : 'unknown'); }
  }

  if (rolesLoading || isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }
  if (!can('admins.view')) {
    return <View style={styles.center}><Text style={styles.title}>{he.admin.admins.forbiddenTitle}</Text></View>;
  }
  if (!person) {
    return (
      <View style={styles.center}>
        <Stack.Screen options={{ headerTitle: he.admin.admins.detail.title }} />
        <Text style={styles.title}>{he.admin.admins.detail.notFound}</Text>
      </View>
    );
  }

  const name = person.displayName ?? he.admin.admins.row.unnamed;
  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <Stack.Screen options={{ headerTitle: he.admin.admins.detail.title }} />

      <View style={styles.hero}>
        <AvatarInitials name={name} avatarUrl={person.avatarUrl} size={64} />
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/user/${person.userId}` as never)}
          style={styles.profileBtn}
        >
          <Ionicons name="person-circle-outline" size={18} color={colors.primary} />
          <Text style={styles.profileBtnText}>{he.admin.admins.detail.viewProfile}</Text>
        </Pressable>
      </View>

      {revokeErr !== null && (
        <Text style={styles.errorBanner}>
          {he.admin.admins.revokeErrors[revokeErr as keyof typeof he.admin.admins.revokeErrors]
            ?? he.admin.admins.revokeErrors.unknown}
        </Text>
      )}

      <Text style={styles.sectionTitle}>{he.admin.admins.detail.rolesSection}</Text>
      {person.activeRoles.length === 0 && (
        <Text style={styles.hint}>{he.admin.admins.detail.noActiveRoles}</Text>
      )}
      <View style={styles.card}>
        {person.grants.map((g) => (
          <AdminRow
            key={g.grantId}
            grant={g}
            canRevoke={canRevoke}
            busy={revoke.isPending}
            onRevoke={(id) => { void onRevoke(id); }}
          />
        ))}
      </View>

      <Text style={styles.sectionTitle}>{he.admin.admins.detail.managerSection}</Text>
      {myMemberships.length === 0 ? (
        <View style={styles.placeholder}>
          <Ionicons name="git-network-outline" size={20} color={colors.textSecondary} />
          <Text style={styles.hint}>{he.admin.admins.detail.managerNone}</Text>
        </View>
      ) : (
        myMemberships.map((m) => (
          <GrantManagerSection
            key={m.grantId}
            member={m}
            members={tree.members}
            canManage={canManage}
          />
        ))
      )}
    </ScrollView>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  root:    { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, gap: 8, width: '100%', maxWidth: 760, alignSelf: 'center' },
  center:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 8 },
  title:   { fontSize: 16, fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  hero:    { alignItems: 'center', gap: 10, paddingVertical: 12 },
  name:    { fontSize: 20, fontWeight: '800', color: colors.textPrimary },
  profileBtn: {
    flexDirection: rowDirectionStart, alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999,
    backgroundColor: colors.primaryLight,
  },
  profileBtnText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  errorBanner: {
    backgroundColor: colors.errorLight, padding: 10, borderRadius: 8,
    fontSize: 12, color: '#7f1d1d',
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: colors.textPrimary, marginTop: 12, textAlign: textAlignStart() },
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden' },
  placeholder: {
    flexDirection: rowDirectionStart, alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: radius.lg, padding: 14,
  },
  hint: { flex: 1, fontSize: 13, color: colors.textSecondary, textAlign: textAlignStart() },
}));
