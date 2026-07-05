// app/apps/mobile/src/hooks/useSetManager.ts
// FR-ADMIN-025 — assign/clear a grant's direct manager.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { container } from '../lib/container';

export interface SetManagerVars {
  readonly grantId: string;
  readonly managerGrantId: string | null;
}

export function useSetManager() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: SetManagerVars) =>
      container.setManager.execute({
        grantId: vars.grantId,
        managerGrantId: vars.managerGrantId,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin.org.tree'] });
    },
  });
}
