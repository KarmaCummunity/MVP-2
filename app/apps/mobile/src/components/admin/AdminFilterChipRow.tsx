// app/apps/mobile/src/components/admin/AdminFilterChipRow.tsx
// Shared horizontal filter/sort chip scroller for Admin Portal sub-screens
// (FR-RESP-006). Centralises the chip row so every admin screen renders the
// same way on phone + mobile-web.
//
// Why this exists: a bare `<ScrollView horizontal>` placed as a flex child of a
// column screen collapses vertically on react-native-web (it inherits
// `flex-shrink: 1`), which clipped the chips and let them overlap the result
// count on narrow viewports. Pinning `flexGrow: 0` + `flexShrink: 0` keeps the
// row at its natural height, and `rowDirectionStart` makes the chips read from
// the inline-start edge under forced RTL.
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { makeUseStyles } from '@kc/ui';
import { rowDirectionStart } from '../../lib/rtlLayout';

export interface AdminFilterChipRowProps {
  readonly children: ReactNode;
}

export function AdminFilterChipRow({ children }: AdminFilterChipRowProps) {
  const styles = useStyles();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.content}
    >
      {children}
    </ScrollView>
  );
}

const useStyles = makeUseStyles(() => ({
  // Stops the horizontal scroller from being squeezed by sibling flex children
  // on web, which previously clipped the chips. Keeps it at natural height.
  scroll:  { flexGrow: 0, flexShrink: 0 },
  content: {
    flexDirection: rowDirectionStart,
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
}));
