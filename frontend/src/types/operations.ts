/**
 * Campaign Operations OS - Type Definitions
 * Atomic unit-based system for managing all campaign execution types
 */

// ============= Core Building Blocks =============

export interface CampaignContainer {
  id: string;
  brand_id: string;
  brand_name: string;
  campaign_name: string;
  start_date: string;
  end_date: string;
  status: 'planning' | 'active' | 'completed' | 'archived';
  created_at: string;
  updated_at: string;
  metadata?: Record<string, any>;
}

export type WorkstreamType =
  | 'ugc'
  | 'influencer_paid'
  | 'influencer_barter'
  | 'video_shoot'
  | 'photo_shoot'
  | 'event_activation'
  | 'hybrid';

export interface Workstream {
  id: string;
  campaign_id: string;
  type: WorkstreamType;
  name: string;
  description?: string;
  status: 'draft' | 'active' | 'completed' | 'archived';
  deliverables_count: number;
  completion_percentage: number;
  pending_approvals: number;
  next_milestone?: {
    type: 'shoot' | 'event' | 'deadline';
    date: string;
    description: string;
  };
  created_at: string;
  updated_at: string;
  created_by: string;
  internal_notes?: string; // Hidden from clients
}

// ============= Deliverable System =============

export type DeliverableStatus =
  | 'IDEA'
  | 'DRAFTING'
  | 'AWAITING_APPROVAL'
  | 'APPROVED'
  | 'SCHEDULED'
  | 'IN_PRODUCTION'
  | 'EDITING'
  | 'IN_REVIEW'
  | 'REVISION_REQUIRED'
  | 'READY_TO_POST'
  | 'POSTED'
  | 'ARCHIVED';

export interface Deliverable {
  id: string;
  workstream_id: string;
  campaign_id: string;
  title: string;
  description?: string;
  type: 'video' | 'reel' | 'story_set' | 'photo_set' | 'event_content' | 'other';
  status: DeliverableStatus;
  due_date?: string;
  posting_date?: string;
  concept_id?: string;
  assignment_id?: string;
  production_batch_id?: string;
  assets?: DeliverableAssets;
  posting_proof?: PostingProof;
  internal_notes?: string;
  client_notes?: string;
  dependencies?: DeliverableDependency[];
  created_at: string;
  updated_at: string;
  created_by: string;
  last_modified_by?: string;
}

export interface DeliverableDependency {
  type: 'concept_approval' | 'creator_assignment' | 'assets' | 'custom';
  status: 'pending' | 'satisfied' | 'bypassed';
  required: boolean;
  bypass_reason?: string;
  bypassed_by?: string;
  bypassed_at?: string;
}

export interface DeliverableAssets {
  frame_io_folder?: string;
  frame_io_share_link?: string;
  hd_updated: boolean;
  hd_updated_at?: string;
  hd_updated_by?: string;
  versions?: AssetVersion[];
  raw_files?: string[];
  edited_files?: string[];
}

export interface AssetVersion {
  version: string;
  url: string;
  uploaded_at: string;
  uploaded_by: string;
  notes?: string;
}

export interface PostingProof {
  platform: 'instagram' | 'tiktok' | 'youtube' | 'other';
  url: string;
  posted_at: string;
  metrics_snapshot?: {
    views?: number;
    likes?: number;
    comments?: number;
    shares?: number;
    captured_at: string;
  };
}

// ============= Concept System =============

export type ConceptApprovalStatus =
  | 'NOT_SENT'
  | 'SENT_TO_CLIENT'
  | 'CLIENT_COMMENTED'
  | 'APPROVED'
  | 'CHANGES_REQUESTED';

export interface Concept {
  id: string;
  workstream_id: string;
  campaign_id: string;
  title: string;
  hook?: string;
  script?: string;
  on_screen_text?: string;
  reference_links?: string[];
  key_messages?: string[];
  purpose?: string;
  pillar?: string;
  internal_version?: string;
  client_facing_version?: string;
  approval_status: ConceptApprovalStatus;
  approval_history?: ApprovalEvent[];
  comments?: ConceptComment[];
  deliverable_ids: string[]; // One concept can map to multiple deliverables
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface ApprovalEvent {
  id: string;
  status: ConceptApprovalStatus;
  user_id: string;
  user_name: string;
  user_role: 'internal' | 'client';
  timestamp: string;
  comment?: string;
}

export interface ConceptComment {
  id: string;
  user_id: string;
  user_name: string;
  user_role: 'internal' | 'client';
  comment: string;
  timestamp: string;
  is_internal?: boolean; // Internal-only comments
}

// ============= Production System =============

export type ProductionChecklistStatus =
  | 'QUEUED'
  | 'FILMING'
  | 'DONE'
  | 'MISSING'
  | 'RESHOOT';

export interface ProductionBatch {
  id: string;
  workstream_id: string;
  campaign_id: string;
  name: string;
  date: string;
  location?: string;
  call_time?: string;
  wrap_time?: string;
  roster?: ProductionRoster[];
  deliverable_ids: string[];
  checklist_items?: ProductionChecklistItem[];
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ProductionRoster {
  role: 'director' | 'producer' | 'talent' | 'crew' | 'other';
  name: string;
  contact?: string;
  notes?: string;
}

export interface ProductionChecklistItem {
  deliverable_id: string;
  status: ProductionChecklistStatus;
  pre_shoot_tasks?: ChecklistTask[];
  filming_tasks?: ChecklistTask[];
  post_shoot_tasks?: ChecklistTask[];
  reshoot_notes?: string;
  last_updated_by?: string;
  last_updated_at?: string;
}

export interface ChecklistTask {
  id: string;
  task: string;
  completed: boolean;
  completed_by?: string;
  completed_at?: string;
}

// ============= Assignment System =============

export type AssignmentStatus =
  | 'INVITED'
  | 'CONFIRMED'
  | 'PRODUCT_OR_BARTER_ISSUED'
  | 'CONTENT_PENDING'
  | 'SUBMITTED'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'POSTED'
  | 'CLOSED';

export interface Assignment {
  id: string;
  deliverable_id: string;
  creator_id: string;
  creator_username: string;
  creator_name: string;
  status: AssignmentStatus;
  type: 'paid' | 'barter' | 'ugc';
  scope?: AssignmentScope;
  compensation?: AssignmentCompensation;
  deadlines?: AssignmentDeadlines;
  revision_history?: RevisionEvent[];
  created_at: string;
  updated_at: string;
}

export interface AssignmentScope {
  reels?: number;
  stories?: number;
  posts?: number;
  custom?: string;
}

export interface AssignmentCompensation {
  type: 'monetary' | 'product' | 'tickets' | 'other';
  amount?: number;
  currency?: string;
  products?: string[];
  notes?: string;
}

export interface AssignmentDeadlines {
  content_submission: string;
  posting_date: string;
  revision_deadline?: string;
}

export interface RevisionEvent {
  requested_at: string;
  requested_by: string;
  notes: string;
  resolved_at?: string;
}

// ============= Event System =============

export type EventEnrollmentStatus =
  | 'SHORTLISTED'
  | 'SELECTED'
  | 'INVITED'
  | 'ATTENDED'
  | 'CONTENT_READY'
  | 'POSTED';

export interface CampaignEvent {
  id: string;
  campaign_id: string;
  workstream_id?: string;
  name: string;
  date: string;
  venue?: string;
  type: 'activation' | 'shoot' | 'experience' | 'other';
  barter_type?: 'tickets' | 'products' | 'both';
  barter_inventory?: number;
  status: 'planning' | 'confirmed' | 'completed' | 'cancelled';
  shortlist?: EventShortlist[];
  enrollments?: EventEnrollment[];
  internal_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface EventShortlist {
  id: string;
  event_id: string;
  creator_id: string;
  creator_username: string;
  creator_name: string;
  tickets_requested?: number;
  products_requested?: string[];
  internal_notes?: string;
  selection_status: 'pending' | 'selected' | 'rejected';
  selected_at?: string;
  selected_by?: string;
}

export interface EventEnrollment {
  id: string;
  event_id: string;
  creator_id: string;
  creator_username: string;
  creator_name: string;
  status: EventEnrollmentStatus;
  barter_given?: {
    tickets?: number;
    products?: string[];
  };
  visit_date?: string;
  visit_time?: string;
  attendance_confirmed: boolean;
  content_deliverables?: string[];
  posting_urls?: string[];
  compliance_status: 'pending' | 'compliant' | 'overdue' | 'violation';
  created_at: string;
  updated_at: string;
}

// ============= Finance System (Internal Only) =============

export interface CreatorPayout {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator_name: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'failed';
  payment_method?: 'bank_transfer' | 'paypal' | 'other';
  banking_details?: BankingDetails; // Masked by default
  invoice_number?: string;
  paid_at?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface BankingDetails {
  account_holder?: string;
  account_number_masked?: string; // ****1234
  bank_name?: string;
  swift_code?: string;
  iban_masked?: string;
  // Full details only for authorized roles
  account_number_full?: string;
  iban_full?: string;
}

export interface ClientPaymentMilestone {
  id: string;
  campaign_id: string;
  milestone_name: string;
  amount: number;
  currency: string;
  due_date: string;
  status: 'pending' | 'invoiced' | 'paid' | 'overdue';
  invoice_number?: string;
  paid_at?: string;
  notes?: string;
}

// ============= Activity System =============

export type ActivityType =
  | 'status_change'
  | 'approval'
  | 'comment'
  | 'asset_update'
  | 'assignment'
  | 'payment'
  | 'revision';

export interface ActivityEvent {
  id: string;
  campaign_id: string;
  workstream_id?: string;
  deliverable_id?: string;
  type: ActivityType;
  actor_id: string;
  actor_name: string;
  actor_role: 'internal' | 'client';
  action: string;
  details?: Record<string, any>;
  timestamp: string;
  is_client_visible: boolean;
}

// ============= Permissions & Access =============

export interface UserAccess {
  role: 'admin' | 'internal' | 'client' | 'creator';
  campaign_ids: string[];
  permissions: {
    view_internal_notes: boolean;
    view_finance: boolean;
    view_banking: boolean;
    create_workstreams: boolean;
    create_deliverables: boolean;
    approve_concepts: boolean;
    manage_production: boolean;
    manage_events: boolean;
    export_data: boolean;
    bulk_operations: boolean;
  };
}

// ============= UI State Management =============

export interface OperationsUIState {
  selectedCampaign?: string;
  selectedWorkstream?: string;
  selectedDeliverables: string[];
  filters: {
    status?: DeliverableStatus[];
    workstream_type?: WorkstreamType[];
    date_range?: [string, string];
    creator?: string[];
    search?: string;
  };
  viewMode: 'internal' | 'client';
  isLoading: boolean;
  error?: string;
}

// ============= Bulk Operations =============

export interface BulkOperation {
  type: 'status_change' | 'assign_creator' | 'schedule_batch' | 'delete';
  target_ids: string[];
  params: Record<string, any>;
  results?: BulkOperationResult[];
}

export interface BulkOperationResult {
  id: string;
  success: boolean;
  error?: string;
  previous_state?: any;
  new_state?: any;
}