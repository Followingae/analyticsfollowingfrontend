import { User } from '@/types/user';

// Role hierarchy and permissions
export const ROLE_HIERARCHY = {
  super_admin: 4,
  admin: 3,
  premium: 2,
  standard: 1,
  free: 0
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

// Permission matrix for Operations OS features
export const OPERATIONS_PERMISSIONS = {
  // Campaign Management
  view_campaigns: ['super_admin', 'standard', 'premium'],
  create_campaign: ['super_admin'],
  edit_campaign: ['super_admin'],
  delete_campaign: ['super_admin'],
  export_campaigns: ['super_admin'],

  // Workstream Management
  view_workstreams: ['super_admin', 'standard', 'premium'],
  create_workstream: ['super_admin'],
  edit_workstream: ['super_admin'],
  delete_workstream: ['super_admin'],

  // Deliverables
  view_deliverables: ['super_admin', 'standard', 'premium'],
  create_deliverable: ['super_admin'],
  edit_deliverable: ['super_admin'],
  approve_deliverable: ['super_admin'],

  // Finance (Internal Only)
  view_finance: ['super_admin'],
  edit_finance: ['super_admin'],
  view_banking_details: ['super_admin'],
  process_payments: ['super_admin'],

  // Settings (Internal Only)
  view_settings: ['super_admin'],
  edit_settings: ['super_admin'],
  manage_visibility: ['super_admin'],

  // Events
  view_events: ['super_admin', 'standard', 'premium'],
  create_event: ['super_admin'],
  manage_enrollments: ['super_admin'],

  // Assets
  view_assets: ['super_admin', 'standard', 'premium'],
  upload_assets: ['super_admin'],
  download_hd: ['super_admin', 'premium'],

  // Production
  view_production: ['super_admin', 'standard', 'premium'],
  edit_production: ['super_admin'],

  // Concepts
  view_concepts: ['super_admin', 'standard', 'premium'],
  create_concept: ['super_admin'],
  approve_concept: ['super_admin'],

  // Talent
  view_talent: ['super_admin', 'standard', 'premium'],
  manage_talent: ['super_admin'],
  view_talent_contracts: ['super_admin'],

  // Activity & Comments
  view_activity: ['super_admin', 'standard', 'premium'],
  add_comments: ['super_admin', 'standard', 'premium'],
  delete_any_comment: ['super_admin'],

  // Bulk Operations
  bulk_operations: ['super_admin'],

  // Client-Sensitive Data
  view_internal_notes: ['super_admin'],
  view_profit_margins: ['super_admin'],
  view_creator_rates: ['super_admin'],
  view_all_workstreams: ['super_admin'],

  // Status Management
  force_status_change: ['super_admin'],
  override_dependencies: ['super_admin']
} as const;

export type OperationPermission = keyof typeof OPERATIONS_PERMISSIONS;

// Check if user has specific permission
export function hasPermission(
  user: User | null,
  permission: OperationPermission
): boolean {
  if (!user) return false;

  const userRole = user.role as UserRole;
  const allowedRoles = OPERATIONS_PERMISSIONS[permission];

  return allowedRoles.includes(userRole);
}

// Check if user has any of the specified permissions
export function hasAnyPermission(
  user: User | null,
  permissions: OperationPermission[]
): boolean {
  return permissions.some(permission => hasPermission(user, permission));
}

// Check if user has all specified permissions
export function hasAllPermissions(
  user: User | null,
  permissions: OperationPermission[]
): boolean {
  return permissions.every(permission => hasPermission(user, permission));
}

// Check if user is internal (super_admin)
export function isInternalUser(user: User | null): boolean {
  if (!user) return false;
  return user.role === 'super_admin';
}

// Check if user is client (standard, premium)
export function isClientUser(user: User | null): boolean {
  if (!user) return false;
  return ['standard', 'premium'].includes(user.role);
}

// Get client-safe data (filter out internal fields)
export function getClientSafeData<T extends Record<string, any>>(
  data: T,
  user: User | null
): Partial<T> {
  if (isInternalUser(user)) {
    return data; // Internal users see everything
  }

  // Fields to exclude for client users
  const internalFields = [
    'internal_notes',
    'profit_margin',
    'creator_rate',
    'banking_details',
    'cost_breakdown',
    'internal_comments',
    'admin_notes',
    'payment_status',
    'invoice_details'
  ];

  const safeData = { ...data };

  // Remove internal fields
  internalFields.forEach(field => {
    delete safeData[field];
  });

  return safeData;
}

// Get visible tabs based on user role
export function getVisibleTabs(user: User | null) {
  const allTabs = [
    { id: 'overview', label: 'Overview', permission: 'view_campaigns' },
    { id: 'workstreams', label: 'Workstreams', permission: 'view_workstreams' },
    { id: 'deliverables', label: 'Deliverables', permission: 'view_deliverables' },
    { id: 'production', label: 'Production', permission: 'view_production' },
    { id: 'events', label: 'Events', permission: 'view_events' },
    { id: 'assets', label: 'Assets', permission: 'view_assets' },
    { id: 'finance', label: 'Finance', permission: 'view_finance' },
    { id: 'settings', label: 'Settings', permission: 'view_settings' }
  ];

  return allTabs.filter(tab =>
    hasPermission(user, tab.permission as OperationPermission)
  );
}

// Check operations access
export function checkOperationsAccess(user: User | null): boolean {
  // Operations OS is available to super_admin, standard, and premium users
  if (!user) return false;
  return ['super_admin', 'standard', 'premium'].includes(user.role);
}

// Get filtered workstreams based on user role
export function getFilteredWorkstreams(workstreams: any[], user: User | null) {
  if (isInternalUser(user)) {
    return workstreams; // Internal users see all workstreams
  }

  // Client users only see non-internal workstreams
  return workstreams.filter(ws => !ws.is_internal);
}

// Get filtered activity based on user role
export function getFilteredActivity(activities: any[], user: User | null) {
  if (isInternalUser(user)) {
    return activities; // Internal users see all activity
  }

  // Client users don't see internal activity types
  const internalActivityTypes = [
    'payment_processed',
    'internal_note_added',
    'profit_calculated',
    'cost_updated',
    'banking_updated'
  ];

  return activities.filter(activity =>
    !internalActivityTypes.includes(activity.type)
  );
}

// Check if user can perform action on entity
export function canPerformAction(
  user: User | null,
  action: string,
  entity: any
): boolean {
  if (!user) return false;

  // Super admins can do everything
  if (user.role === 'super_admin') return true;

  // Map actions to permissions
  const actionPermissionMap: Record<string, OperationPermission> = {
    'edit': 'edit_campaign',
    'delete': 'delete_campaign',
    'approve': 'approve_deliverable',
    'create': 'create_campaign',
    'export': 'export_campaigns',
    'view_finance': 'view_finance',
    'process_payment': 'process_payments'
  };

  const permission = actionPermissionMap[action];
  if (!permission) return false;

  return hasPermission(user, permission);
}

// Format data based on user role (e.g., mask sensitive info)
export function formatDataForRole<T extends Record<string, any>>(
  data: T,
  user: User | null
): T {
  if (isInternalUser(user)) {
    return data; // No masking for internal users
  }

  const formatted = { ...data };

  // Mask banking details
  if (formatted.bank_account_number) {
    formatted.bank_account_number = '****' + formatted.bank_account_number.slice(-4);
  }

  // Mask sensitive rates
  if (formatted.creator_rate) {
    formatted.creator_rate = null; // Hide completely
  }

  // Hide profit margins
  if (formatted.profit_margin) {
    formatted.profit_margin = null;
  }

  return formatted;
}