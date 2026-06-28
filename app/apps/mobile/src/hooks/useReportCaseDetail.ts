// app/apps/mobile/src/hooks/useReportCaseDetail.ts
// FR-ADMIN-013 — single-case detail fetch (reporters + timeline + target).
import { useQuery } from '@tanstack/react-query';
import type { AdminReportTargetType } from '@kc/domain';
import { container } from '../lib/container';

export function useReportCaseDetail(
  targetType: AdminReportTargetType | null,
  targetId: string | null,
) {
  return useQuery({
    queryKey: ['admin.reports.case', targetType, targetId],
    queryFn: () =>
      container.getReportCaseDetail.execute(targetType!, targetId!),
    enabled: targetType !== null && targetId !== null,
    staleTime: 10_000,
  });
}
