// app/apps/mobile/src/components/admin/AdminListControls.tsx
// FR-RESP-006 / FR-ADMIN-011 — one shared search + filter/sort control band for
// every Admin Portal sub-screen (reports, tasks, users, posts, audit, money,
// time, crm, org-approvals). Each screen only supplies its own search config
// and chip groups; the layout, spacing, RTL direction and mobile-web safe
// scrolling live here so the screens stay consistent and phone-friendly.
//
// Render order: search → afterSearch slot → filter/sort chip rows →
// afterFilters slot → total count. Complex screens use the slots for extra
// controls (e.g. audit date range, tasks assignee + due-range pickers).
import type { ReactNode } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { makeUseStyles } from '@kc/ui';
import { AdminFilterChip } from './AdminFilterChip';
import { AdminFilterChipRow } from './AdminFilterChipRow';

export interface AdminFilterOption {
  readonly key: string;
  readonly label: string;
  readonly active: boolean;
  readonly onPress: () => void;
}

export interface AdminFilterGroup {
  readonly key: string;
  readonly options: readonly AdminFilterOption[];
}

export interface AdminSearchConfig {
  readonly value: string;
  readonly onChangeText: (next: string) => void;
  readonly placeholder: string;
  readonly onSubmit?: () => void;
}

export interface AdminListControlsProps {
  readonly search?: AdminSearchConfig;
  readonly afterSearch?: ReactNode;
  readonly filterGroups?: readonly AdminFilterGroup[];
  readonly afterFilters?: ReactNode;
  readonly totalLabel?: string;
}

export function AdminListControls({
  search,
  afterSearch,
  filterGroups,
  afterFilters,
  totalLabel,
}: AdminListControlsProps) {
  const styles = useStyles();
  return (
    <View>
      {search ? (
        <TextInput
          style={styles.search}
          value={search.value}
          onChangeText={search.onChangeText}
          placeholder={search.placeholder}
          onSubmitEditing={search.onSubmit}
          returnKeyType={search.onSubmit ? 'search' : undefined}
          autoCapitalize="none"
          autoCorrect={false}
        />
      ) : null}
      {afterSearch}
      {filterGroups?.map((group) => (
        <AdminFilterChipRow key={group.key}>
          {group.options.map((option) => (
            <AdminFilterChip
              key={option.key}
              label={option.label}
              active={option.active}
              onPress={option.onPress}
            />
          ))}
        </AdminFilterChipRow>
      ))}
      {afterFilters}
      {totalLabel != null ? <Text style={styles.total}>{totalLabel}</Text> : null}
    </View>
  );
}

const useStyles = makeUseStyles(({ colors }) => ({
  search: {
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 10,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    fontSize: 14,
    // Free-text that can be Hebrew or English (and latin IDs): align by content
    // so names read right-to-left and UUIDs read left-to-right.
    textAlign: 'auto',
  },
  total: { paddingHorizontal: 16, paddingBottom: 4, fontSize: 11, opacity: 0.6 },
}));
