import type { AdminRole } from './AdminRole';

export const ADMIN_PERMISSIONS = [
  'portal.access',
  'reports.view',
  'reports.confirm_or_dismiss',
  'reports.restore_target',
  'reports.permanent_ban',
  'reports.manual_remove_post',
  'reports.admin_edit_post',
  'chat.delete_message',
  'tasks.view',
  'tasks.create',
  'tasks.delete_any',
  'admins.view',
  'admins.grant_role',
  'admins.revoke_role',
  'users.search',
  'users.privacy_override',
  'posts.search',
  'audit.view_own',
  'audit.view_any',
  'time.report',
  'time.approve',
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

export const PERMISSION_MATRIX: Readonly<Record<AdminPermission, readonly AdminRole[]>> = {
  'portal.access':              ['super_admin', 'moderator', 'support'],
  'reports.view':               ['super_admin', 'moderator', 'support'],
  'reports.confirm_or_dismiss': ['super_admin', 'moderator'],
  'reports.restore_target':     ['super_admin', 'moderator'],
  'reports.permanent_ban':      ['super_admin'],
  'reports.manual_remove_post': ['super_admin', 'moderator'],
  'reports.admin_edit_post':    ['super_admin', 'moderator'],
  'chat.delete_message':        ['super_admin', 'moderator'],
  'tasks.view':                 ['super_admin', 'moderator', 'support'],
  'tasks.create':               ['super_admin', 'moderator', 'support'],
  'tasks.delete_any':           ['super_admin'],
  'admins.view':                ['super_admin', 'moderator'],
  'admins.grant_role':          ['super_admin'],
  'admins.revoke_role':         ['super_admin'],
  'users.search':               ['super_admin', 'moderator', 'support'],
  'users.privacy_override':     ['super_admin', 'moderator', 'support'],
  'posts.search':               ['super_admin', 'moderator', 'support'],
  'audit.view_own':             ['super_admin', 'moderator', 'support'],
  'audit.view_any':             ['super_admin'],
  'time.report':                ['super_admin', 'moderator', 'support'],
  'time.approve':               ['super_admin', 'moderator'],
};

export function hasPermission(
  roles: readonly AdminRole[],
  permission: AdminPermission,
): boolean {
  const allowed = PERMISSION_MATRIX[permission];
  for (const r of roles) {
    if (allowed.includes(r)) return true;
  }
  return false;
}
