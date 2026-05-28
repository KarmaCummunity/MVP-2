import { describe, expect, it } from 'vitest';
import {
  ADMIN_TASK_ACTIVITY_KINDS,
  parseAdminTaskActivityKind,
} from '../AdminTaskActivity';

describe('AdminTaskActivity', () => {
  it('exposes known activity kinds', () => {
    expect(ADMIN_TASK_ACTIVITY_KINDS).toContain('status_change');
  });

  it('parseAdminTaskActivityKind accepts known values and rejects unknown', () => {
    expect(parseAdminTaskActivityKind('comment')).toBe('comment');
    expect(parseAdminTaskActivityKind('deleted')).toBeNull();
    expect(parseAdminTaskActivityKind(undefined)).toBeNull();
  });
});
