export type AdminTaskErrorCode =
  | 'forbidden'
  | 'invalid_title'
  | 'title_too_long'
  | 'invalid_priority'
  | 'invalid_category'
  | 'invalid_status'
  | 'invalid_transition'
  | 'invalid_input'
  | 'task_not_found'
  | 'assignee_not_admin'
  | 'empty_comment'
  | 'comment_too_long'
  | 'unknown';

export class AdminTaskError extends Error {
  readonly code: AdminTaskErrorCode;

  constructor(code: AdminTaskErrorCode, message?: string) {
    super(message ?? code);
    this.code = code;
    this.name = 'AdminTaskError';
  }
}

export function isAdminTaskError(err: unknown): err is AdminTaskError {
  return err instanceof AdminTaskError;
}
