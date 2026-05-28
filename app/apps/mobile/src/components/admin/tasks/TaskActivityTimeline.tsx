// app/apps/mobile/src/components/admin/tasks/TaskActivityTimeline.tsx
// FR-ADMIN-018 — activity timeline (comments + status/assignment/priority/due changes).
import { StyleSheet, Text, View } from 'react-native';
import type { AdminTaskActivity, AdminTaskActivityKind } from '@kc/domain';
import { makeUseStyles } from '@kc/ui';
import he from '../../../i18n/locales/he';

export interface TaskActivityTimelineProps {
  readonly activities: readonly AdminTaskActivity[];
}

function fmtTs(d: Date): string {
  return d.toLocaleString('he-IL', {
    year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit',
  });
}

function describe(activity: AdminTaskActivity): string {
  const p = (activity.payload ?? {}) as Record<string, unknown>;
  const k = activity.kind as AdminTaskActivityKind;
  switch (k) {
    case 'created':
      return he.admin.tasks.timeline.created;
    case 'comment':
      return typeof p['body'] === 'string' ? (p['body'] as string) : '';
    case 'status_change':
      return he.admin.tasks.timeline.statusChange(
        String(p['from'] ?? ''), String(p['to'] ?? ''),
      );
    case 'assignment_change':
      return p['to'] === null
        ? he.admin.tasks.timeline.assignmentCleared
        : he.admin.tasks.timeline.assignmentSet;
    case 'priority_change':
      return he.admin.tasks.timeline.priorityChange(
        String(p['from'] ?? ''), String(p['to'] ?? ''),
      );
    case 'due_change':
      return p['to'] === null
        ? he.admin.tasks.timeline.dueCleared
        : he.admin.tasks.timeline.dueSet;
    case 'title_change':
      return he.admin.tasks.timeline.titleChanged;
    case 'description_change':
      return he.admin.tasks.timeline.descriptionChanged;
    case 'labels_change':
      return he.admin.tasks.timeline.labelsChanged;
  }
}

export function TaskActivityTimeline({ activities }: TaskActivityTimelineProps) {
  const styles = useStyles();
  if (activities.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>{he.admin.tasks.timeline.empty}</Text>
      </View>
    );
  }
  return (
    <View>
      {activities.map((a) => (
        <View key={a.activityId} style={[styles.row, a.kind === 'comment' && styles.commentRow]}>
          <View style={styles.bullet} />
          <View style={styles.content}>
            <Text style={styles.body}>{describe(a)}</Text>
            <Text style={styles.meta}>
              {(a.actorDisplayName ?? he.admin.admins.row.unnamed)} · {fmtTs(a.createdAt)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  row: {
    flexDirection: 'row', gap: 10, paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth, borderColor: colors.border,
  },
  commentRow: { backgroundColor: colors.surface },
  bullet:     { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 6 },
  content:    { flex: 1, gap: 4 },
  body:       { fontSize: 13 },
  meta:       { fontSize: 11, opacity: 0.55 },
  empty:      { padding: 20, alignItems: 'center' },
  emptyText:  { fontSize: 13, opacity: 0.5 },
}));
