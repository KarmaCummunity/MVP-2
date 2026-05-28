// app/apps/mobile/src/hooks/useAdminTaskMutations.ts
// FR-ADMIN-018 — mutations + invalidation for tasks list/detail.
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { AdminTaskStatus } from '@kc/domain';
import type { CreateAdminTaskInput, UpdateAdminTaskInput } from '@kc/application';
import { container } from '../lib/container';

function invalidate(qc: ReturnType<typeof useQueryClient>) {
  void qc.invalidateQueries({ queryKey: ['admin.tasks.list'] });
  void qc.invalidateQueries({ queryKey: ['admin.tasks.detail'] });
}

export function useCreateAdminTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAdminTaskInput) => container.createAdminTask.execute(input),
    onSuccess:  () => invalidate(qc),
  });
}

export function useUpdateAdminTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { taskId: string; patch: UpdateAdminTaskInput }) =>
      container.updateAdminTask.execute(vars),
    onSuccess:  () => invalidate(qc),
  });
}

export function useSetAdminTaskStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { taskId: string; newStatus: AdminTaskStatus }) =>
      container.setAdminTaskStatus.execute(vars),
    onSuccess:  () => invalidate(qc),
  });
}

export function useAssignAdminTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { taskId: string; newAssigneeId: string | null }) =>
      container.assignAdminTask.execute(vars),
    onSuccess:  () => invalidate(qc),
  });
}

export function useAddAdminTaskComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vars: { taskId: string; body: string }) =>
      container.addAdminTaskComment.execute(vars),
    onSuccess:  () => invalidate(qc),
  });
}

export function useDeleteAdminTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => container.deleteAdminTask.execute(taskId),
    onSuccess:  () => invalidate(qc),
  });
}
