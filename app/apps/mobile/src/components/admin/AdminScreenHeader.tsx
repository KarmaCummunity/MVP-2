// app/apps/mobile/src/components/admin/AdminScreenHeader.tsx
// Shared header band for Admin Portal screens (FR-ADMIN-011). Gives every
// inner screen the same title typography, spacing and optional trailing
// action slot so the portal reads as one cohesive surface.
import type { ReactElement, ReactNode } from 'react';
import { Text, View } from 'react-native';
import { makeUseStyles, typography } from '@kc/ui';
import { rowDirectionStart, textAlignStart } from '../../lib/rtlLayout';

interface Props {
  title: string;
  subtitle?: string;
  right?: ReactNode;
}

export function AdminScreenHeader({ title, subtitle, right }: Props): ReactElement {
  const styles = useStyles();
  return (
    <View style={styles.header}>
      <View style={styles.row}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  header: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    gap: 2,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  row: { flexDirection: rowDirectionStart, alignItems: 'center', gap: 12 },
  title: {
    flex: 1,
    ...typography.h2,
    color: colors.textPrimary,
    textAlign: textAlignStart(),
  },
  right: { flexShrink: 0 },
  subtitle: {
    ...typography.bodySmall,
    color: colors.textSecondary,
    textAlign: textAlignStart(),
  },
}));
