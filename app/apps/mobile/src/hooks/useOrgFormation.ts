// FR-ADMIN-021 — data + mutations for the "Journey to a Nonprofit" portal section.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type {
  FormationStepStatus,
  GovernanceRole,
} from '@kc/domain';
import { container } from '../lib/container';

export function useOrgFormation(country = 'IL') {
  const queryClient = useQueryClient();

  const journey = useQuery({
    queryKey: ['orgFormation.journey', country],
    queryFn: () => container.getFormationJourney.execute(country),
    staleTime: 60_000,
  });
  const journeyId = journey.data?.journeyId;

  const steps = useQuery({
    queryKey: ['orgFormation.steps', journeyId],
    queryFn: () => container.listFormationSteps.execute(journeyId as string),
    enabled: journeyId != null,
    staleTime: 15_000,
  });

  const governance = useQuery({
    queryKey: ['orgFormation.governance', journeyId],
    queryFn: () => container.listGovernance.execute(journeyId as string),
    enabled: journeyId != null,
    staleTime: 15_000,
  });

  const invalidateSteps = () =>
    queryClient.invalidateQueries({ queryKey: ['orgFormation.steps', journeyId] });
  const invalidateGovernance = () =>
    queryClient.invalidateQueries({ queryKey: ['orgFormation.governance', journeyId] });

  const setStepProgress = useMutation({
    mutationFn: (input: { stepKey: string; status: FormationStepStatus; note?: string | null }) =>
      container.setStepProgress.execute({ journeyId: journeyId as string, ...input }),
    onSuccess: () => { void invalidateSteps(); },
  });

  const updateStepContent = useMutation({
    mutationFn: (input: { stepId: string; bodyText: string; tips: readonly string[] }) =>
      container.updateStepContent.execute(input),
    onSuccess: () => { void invalidateSteps(); },
  });

  const assignMember = useMutation({
    mutationFn: (input: { userId: string; governanceRole: GovernanceRole }) =>
      container.assignGovernanceMember.execute({ journeyId: journeyId as string, ...input }),
    onSuccess: () => { void invalidateGovernance(); },
  });

  const removeMember = useMutation({
    mutationFn: (assignmentId: string) =>
      container.removeGovernanceMember.execute(assignmentId),
    onSuccess: () => { void invalidateGovernance(); void invalidateSteps(); },
  });

  return {
    journey,
    steps,
    governance,
    journeyId,
    setStepProgress,
    updateStepContent,
    assignMember,
    removeMember,
  };
}
