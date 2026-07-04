// V2-ADMIN-ORG-7 — Hebrew strings for the /admin/org-approvals screen.
export const adminOrgApprovalsEn = {
  title:           'Organization approvals',
  forbiddenTitle:  'You do not have permission to access this screen.',
  loading:         'Loading...',
  emptyTitle:      'No matching requests',
  emptyHint:       'New requests will appear here as they come in.',
  filters: {
    pending:   'Pending',
    approved:  'Approved',
    rejected:  'Rejected',
    all:       'All',
  },
  status: {
    pending:  'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
  },
  row: {
    submittedBy:    (name: string) => `Submitted by ${name}`,
    submittedAt:    (when: string) => `Submitted on ${when}`,
    decidedBy:      (name: string) => `Decided by ${name}`,
    decidedAt:      (when: string) => `Decided on ${when}`,
    noteLabel:      'Note',
  },
  actions: {
    approve:        'Approve',
    reject:         'Reject',
    busy:           '...',
    confirmApprove: 'Approve this request? The action will be logged.',
    confirmReject:  'Reject this request? The action will be logged.',
  },
  totalCount: (n: number) => `${n} requests total`,
  errors: {
    forbidden:                    'You do not have permission to perform this action.',
    application_not_found:        'Request not found.',
    application_already_decided:  'This request has already been handled.',
    invalid_status:               'Invalid status.',
    unknown:                      'Something went wrong. Please try again.',
  },
};
