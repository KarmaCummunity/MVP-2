// FR-ADMIN-021 — Supabase adapter for the nonprofit-formation journey.
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  AssignGovernanceInput,
  IOrgFormationRepository,
  SetStepProgressInput,
  UpdateStepContentInput,
} from '@kc/application';
import {
  OrgFormationError,
  parseFormationStepStatus,
  parseGovernanceRole,
  type FormationJourney,
  type FormationStep,
  type GovernanceAssignment,
  type OrgFormationErrorCode,
} from '@kc/domain';

interface JourneyRow {
  journey_id: string; org_id: string; country_code: string;
  status: string; created_at: string; updated_at: string;
}
interface StepRow {
  step_id: string; step_key: string; sort_order: number; title_fallback: string;
  body_text: string; tips: unknown; is_critical_gate: boolean;
  progress_status: string; progress_note: string | null;
}
interface GovernanceRow {
  assignment_id: string; user_id: string; display_name: string | null;
  avatar_url: string | null; governance_role: string; created_at: string;
}

const KNOWN_CODES: readonly string[] = [
  'forbidden', 'invalid_country', 'invalid_status', 'invalid_tips',
  'invalid_governance_role', 'journey_not_found', 'step_not_found',
  'target_not_found', 'target_not_active', 'governance_overlap',
  'governance_incomplete', 'member_already_assigned', 'assignment_not_found',
];

function toError(err: { message?: string; code?: string } | null): OrgFormationError {
  const msg = err?.message ?? '';
  if (err?.code === '42501') return new OrgFormationError('forbidden');
  const match = KNOWN_CODES.find((c) => msg.includes(c));
  if (match) return new OrgFormationError(match as OrgFormationErrorCode);
  return new OrgFormationError('unknown', msg);
}

function mapTips(value: unknown): readonly string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((x): x is string => typeof x === 'string');
}

function mapStep(row: StepRow): FormationStep {
  return {
    stepId: row.step_id,
    stepKey: row.step_key,
    sortOrder: row.sort_order,
    titleFallback: row.title_fallback,
    bodyText: row.body_text,
    tips: mapTips(row.tips),
    isCriticalGate: row.is_critical_gate,
    progressStatus: parseFormationStepStatus(row.progress_status),
    progressNote: row.progress_note,
  };
}

export class SupabaseOrgFormationRepository implements IOrgFormationRepository {
  constructor(private readonly client: SupabaseClient) {}

  async getJourney(countryCode: string): Promise<FormationJourney> {
    const { data, error } = await this.client.rpc('org_formation_get_journey', {
      p_country: countryCode,
    });
    if (error) throw toError(error);
    const row = Array.isArray(data) ? (data[0] as JourneyRow | undefined) : undefined;
    if (!row) throw new OrgFormationError('journey_not_found');
    return {
      journeyId: row.journey_id,
      orgId: row.org_id,
      countryCode: row.country_code,
      status: row.status === 'registered' || row.status === 'active' ? row.status : 'in_progress',
      createdAt: new Date(row.created_at),
      updatedAt: new Date(row.updated_at),
    };
  }

  async listSteps(journeyId: string): Promise<readonly FormationStep[]> {
    const { data, error } = await this.client.rpc('org_formation_list_steps', {
      p_journey_id: journeyId,
    });
    if (error) throw toError(error);
    const raw = Array.isArray(data) ? (data as StepRow[]) : [];
    return raw.map(mapStep);
  }

  async listGovernance(journeyId: string): Promise<readonly GovernanceAssignment[]> {
    const { data, error } = await this.client.rpc('org_formation_list_governance', {
      p_journey_id: journeyId,
    });
    if (error) throw toError(error);
    const raw = Array.isArray(data) ? (data as GovernanceRow[]) : [];
    const out: GovernanceAssignment[] = [];
    for (const r of raw) {
      const role = parseGovernanceRole(r.governance_role);
      if (role === null) continue;
      out.push({
        assignmentId: r.assignment_id,
        userId: r.user_id,
        displayName: r.display_name,
        avatarUrl: r.avatar_url,
        governanceRole: role,
        createdAt: new Date(r.created_at),
      });
    }
    return out;
  }

  async setStepProgress(input: SetStepProgressInput): Promise<void> {
    const { error } = await this.client.rpc('org_formation_set_step_progress', {
      p_journey_id: input.journeyId,
      p_step_key: input.stepKey,
      p_status: input.status,
      p_note: input.note ?? null,
    });
    if (error) throw toError(error);
  }

  async updateStepContent(input: UpdateStepContentInput): Promise<void> {
    const { error } = await this.client.rpc('org_formation_update_step_content', {
      p_step_id: input.stepId,
      p_body_text: input.bodyText,
      p_tips: [...input.tips],
    });
    if (error) throw toError(error);
  }

  async assignMember(input: AssignGovernanceInput): Promise<string> {
    const { data, error } = await this.client.rpc('org_formation_assign_member', {
      p_journey_id: input.journeyId,
      p_user_id: input.userId,
      p_governance_role: input.governanceRole,
    });
    if (error) throw toError(error);
    if (typeof data !== 'string') {
      throw new OrgFormationError('unknown', 'assign_member did not return an id');
    }
    return data;
  }

  async removeMember(assignmentId: string): Promise<void> {
    const { error } = await this.client.rpc('org_formation_remove_member', {
      p_assignment_id: assignmentId,
    });
    if (error) throw toError(error);
  }
}
