/**
 * Campaign Operations OS - API Service Layer
 * Handles all operations-related API calls with client-safe filtering
 */

import { fetchWithAuth } from '@/utils/apiInterceptor';
import {
  CampaignContainer,
  Workstream,
  Deliverable,
  Concept,
  ProductionBatch,
  Assignment,
  CampaignEvent,
  EventEnrollment,
  CreatorPayout,
  ActivityEvent,
  DeliverableStatus,
  ConceptApprovalStatus,
  AssignmentStatus,
  BulkOperation,
  BulkOperationResult,
  WorkstreamType,
  EventShortlist
} from '@/types/operations';
import { useUserStore } from '@/stores/userStore';
import {
  isInternalUser,
  isClientUser,
  hasPermission,
  getClientSafeData,
  getFilteredWorkstreams,
  getFilteredActivity
} from '@/utils/operationsAccess';

// Mock data flag for development
const USE_MOCK_DATA = true; // Set to false when backend is ready

class OperationsApiService {
  private baseUrl = '/api/v1/operations';

  // Get current user from store
  private getCurrentUser() {
    return useUserStore.getState().user;
  }

  // Helper to check if user is internal
  private isInternalUser(): boolean {
    const user = this.getCurrentUser();
    return isInternalUser(user);
  }

  // Helper to check specific permission
  private hasPermission(permission: any): boolean {
    const user = this.getCurrentUser();
    return hasPermission(user, permission);
  }

  // ============= Campaign Operations =============

  async getCampaigns(filters?: {
    brand?: string;
    status?: string;
    date_range?: [string, string];
    search?: string;
  }) {
    if (USE_MOCK_DATA) return this.getMockCampaigns();

    const params = new URLSearchParams();
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    return fetchWithAuth(`${this.baseUrl}/campaigns?${params}`);
  }

  async getCampaignDetails(campaignId: string) {
    if (USE_MOCK_DATA) return this.getMockCampaignDetails(campaignId);
    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}`);
  }

  async getCampaignOverview(campaignId: string) {
    if (USE_MOCK_DATA) return this.getMockCampaignOverview(campaignId);
    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}/overview`);
  }

  // ============= Workstreams =============

  async getWorkstreams(campaignId: string) {
    if (USE_MOCK_DATA) return this.getMockWorkstreams(campaignId);
    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}/workstreams`);
  }

  async createWorkstream(campaignId: string, data: Partial<Workstream>) {
    if (!this.hasPermission('create_workstream')) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.createMockWorkstream(data);

    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}/workstreams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateWorkstream(workstreamId: string, data: Partial<Workstream>) {
    if (!this.hasPermission('edit_workstream')) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return { success: true, data };

    return fetchWithAuth(`${this.baseUrl}/workstreams/${workstreamId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  // ============= Deliverables =============

  async getDeliverables(workstreamId: string, filters?: {
    status?: DeliverableStatus[];
    creator?: string;
    due_date?: string;
  }) {
    if (USE_MOCK_DATA) return this.getMockDeliverables(workstreamId);

    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.join(','));
    if (filters?.creator) params.append('creator', filters.creator);
    if (filters?.due_date) params.append('due_date', filters.due_date);

    return fetchWithAuth(`${this.baseUrl}/workstreams/${workstreamId}/deliverables?${params}`);
  }

  async createDeliverable(workstreamId: string, data: Partial<Deliverable>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.createMockDeliverable(data);

    return fetchWithAuth(`${this.baseUrl}/workstreams/${workstreamId}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateDeliverableStatus(
    deliverableId: string,
    status: DeliverableStatus,
    notes?: string
  ) {
    // Validate status transitions
    const validationError = this.validateStatusTransition(deliverableId, status);
    if (validationError) throw new Error(validationError);

    if (USE_MOCK_DATA) return { success: true, status };

    return fetchWithAuth(`${this.baseUrl}/deliverables/${deliverableId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, notes })
    });
  }

  async bulkUpdateDeliverables(operation: BulkOperation): Promise<BulkOperationResult[]> {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.mockBulkOperation(operation);

    return fetchWithAuth(`${this.baseUrl}/deliverables/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation)
    });
  }

  // ============= Concepts =============

  async getConcepts(workstreamId: string, filters?: {
    approval_status?: ConceptApprovalStatus[];
  }) {
    if (USE_MOCK_DATA) return this.getMockConcepts(workstreamId);

    const params = new URLSearchParams();
    if (filters?.approval_status) {
      params.append('approval_status', filters.approval_status.join(','));
    }

    return fetchWithAuth(`${this.baseUrl}/workstreams/${workstreamId}/concepts?${params}`);
  }

  async createConcept(workstreamId: string, data: Partial<Concept>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.createMockConcept(data);

    return fetchWithAuth(`${this.baseUrl}/workstreams/${workstreamId}/concepts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async submitConceptForApproval(conceptId: string) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/concepts/${conceptId}/submit-approval`, {
      method: 'POST'
    });
  }

  async approveOrRejectConcept(
    conceptId: string,
    decision: 'approve' | 'request_changes',
    comment?: string
  ) {
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/concepts/${conceptId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comment })
    });
  }

  // ============= Production =============

  async getProductionBatches(workstreamId: string) {
    if (USE_MOCK_DATA) return this.getMockProductionBatches(workstreamId);
    return fetchWithAuth(`${this.baseUrl}/workstreams/${workstreamId}/production-batches`);
  }

  async createProductionBatch(workstreamId: string, data: Partial<ProductionBatch>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.createMockProductionBatch(data);

    return fetchWithAuth(`${this.baseUrl}/workstreams/${workstreamId}/production-batches`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async updateProductionChecklist(
    batchId: string,
    deliverableId: string,
    checklist: any
  ) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(
      `${this.baseUrl}/production-batches/${batchId}/deliverables/${deliverableId}/checklist`,
      {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checklist)
      }
    );
  }

  // ============= Assignments =============

  async assignCreatorToDeliverable(
    deliverableId: string,
    creatorId: string,
    assignmentData: Partial<Assignment>
  ) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.createMockAssignment(assignmentData);

    return fetchWithAuth(`${this.baseUrl}/deliverables/${deliverableId}/assign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ creator_id: creatorId, ...assignmentData })
    });
  }

  async updateAssignmentStatus(assignmentId: string, status: AssignmentStatus) {
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/assignments/${assignmentId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  }

  // ============= Events =============

  async getEvents(campaignId: string) {
    if (USE_MOCK_DATA) return this.getMockEvents(campaignId);
    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}/events`);
  }

  async createEvent(campaignId: string, data: Partial<CampaignEvent>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.createMockEvent(data);

    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async shortlistCreatorForEvent(eventId: string, shortlist: Partial<EventShortlist>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/events/${eventId}/shortlist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(shortlist)
    });
  }

  async enrollCreatorInEvent(eventId: string, enrollment: Partial<EventEnrollment>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/events/${eventId}/enroll`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(enrollment)
    });
  }

  // ============= Assets =============

  async updateDeliverableAssets(deliverableId: string, assets: any) {
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/deliverables/${deliverableId}/assets`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(assets)
    });
  }

  async markHDUpdated(deliverableId: string, timestamp: string, notes?: string) {
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/deliverables/${deliverableId}/hd-updated`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ timestamp, notes })
    });
  }

  // ============= Finance (Internal Only) =============

  async getCreatorPayouts(campaignId: string) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return this.getMockPayouts(campaignId);

    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}/finance/payouts`);
  }

  async updatePayoutStatus(payoutId: string, status: string) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');
    if (USE_MOCK_DATA) return { success: true };

    return fetchWithAuth(`${this.baseUrl}/finance/payouts/${payoutId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
  }

  // ============= Activity Feed =============

  async getActivityFeed(campaignId: string, filters?: {
    type?: string[];
    date_range?: [string, string];
  }) {
    if (USE_MOCK_DATA) return this.getMockActivityFeed(campaignId);

    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type.join(','));

    return fetchWithAuth(`${this.baseUrl}/campaigns/${campaignId}/activity?${params}`);
  }

  // ============= Validation Helpers =============

  private validateStatusTransition(deliverableId: string, newStatus: DeliverableStatus): string | null {
    // Get current deliverable state (mock for now)
    const deliverable = this.getMockDeliverable(deliverableId);

    // Check dependencies
    if (newStatus === 'SCHEDULED' && !deliverable.concept_id) {
      return 'Cannot schedule deliverable without approved concept';
    }

    if (newStatus === 'POSTED' && !deliverable.posting_proof) {
      return 'Cannot mark as posted without posting proof';
    }

    return null;
  }

  // ============= Mock Data Generators =============

  private getMockCampaigns() {
    return {
      campaigns: [
        {
          id: '1',
          brand_id: 'b1',
          brand_name: 'Following x Barakat',
          campaign_name: 'Barakat 2025 Campaign',
          start_date: '2025-01-01',
          end_date: '2025-03-31',
          status: 'active',
          total_deliverables: 45,
          pending_approvals: 3,
          overdue_posts: 2,
          upcoming_shoots: 1,
          created_at: '2024-12-01T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z'
        }
      ],
      total: 1
    };
  }

  private getMockCampaignDetails(campaignId: string) {
    return {
      id: campaignId,
      brand_id: 'b1',
      brand_name: 'Following x Barakat',
      campaign_name: 'Barakat 2025 Campaign',
      start_date: '2025-01-01',
      end_date: '2025-03-31',
      status: 'active',
      created_at: '2024-12-01T00:00:00Z',
      updated_at: '2025-01-15T00:00:00Z'
    };
  }

  private getMockCampaignOverview(campaignId: string) {
    return {
      campaign_id: campaignId,
      summary: {
        total_workstreams: 5,
        total_deliverables: 45,
        completed_deliverables: 18,
        in_production: 12,
        pending_approval: 3,
        overdue: 2
      },
      this_week: {
        shoots: [
          {
            date: '2025-01-20',
            location: 'Studio A',
            deliverables_count: 5
          }
        ],
        deadlines: [
          {
            date: '2025-01-22',
            deliverable: 'Reel #5',
            creator: '@creator1'
          }
        ],
        events: []
      },
      blockers: this.isInternalUser() ? {
        missing_scripts: 3,
        pending_approvals: 3,
        missing_frameio: 5,
        overdue_deliverables: 2
      } : {
        pending_your_approval: 3
      },
      recent_activity: [
        {
          id: '1',
          type: 'approval',
          action: 'Concept approved',
          actor_name: 'John Doe',
          timestamp: '2025-01-15T10:00:00Z'
        }
      ]
    };
  }

  private getMockWorkstreams(campaignId: string) {
    return {
      workstreams: [
        {
          id: 'ws1',
          campaign_id: campaignId,
          type: 'ugc' as WorkstreamType,
          name: 'UGC Content Creation',
          status: 'active',
          deliverables_count: 20,
          completion_percentage: 40,
          pending_approvals: 2,
          next_milestone: {
            type: 'shoot',
            date: '2025-01-20',
            description: 'Studio shoot day'
          },
          created_at: '2024-12-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
          created_by: 'admin1'
        },
        {
          id: 'ws2',
          campaign_id: campaignId,
          type: 'influencer_paid' as WorkstreamType,
          name: 'Paid Influencer Campaign',
          status: 'active',
          deliverables_count: 15,
          completion_percentage: 60,
          pending_approvals: 1,
          created_at: '2024-12-15T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
          created_by: 'admin1'
        }
      ]
    };
  }

  private getMockDeliverables(workstreamId: string) {
    return {
      deliverables: [
        {
          id: 'd1',
          workstream_id: workstreamId,
          campaign_id: '1',
          title: 'Product Showcase Reel',
          type: 'reel',
          status: 'IN_PRODUCTION' as DeliverableStatus,
          due_date: '2025-01-25',
          concept_id: 'c1',
          assignment_id: 'a1',
          created_at: '2024-12-20T00:00:00Z',
          updated_at: '2025-01-15T00:00:00Z',
          created_by: 'admin1'
        }
      ]
    };
  }

  private getMockDeliverable(deliverableId: string) {
    return {
      id: deliverableId,
      workstream_id: 'ws1',
      campaign_id: '1',
      title: 'Sample Deliverable',
      status: 'DRAFTING' as DeliverableStatus,
      concept_id: null,
      posting_proof: null
    };
  }

  private createMockWorkstream(data: Partial<Workstream>) {
    return {
      id: `ws_${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private createMockDeliverable(data: Partial<Deliverable>) {
    return {
      id: `d_${Date.now()}`,
      ...data,
      status: 'IDEA' as DeliverableStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private createMockConcept(data: Partial<Concept>) {
    return {
      id: `c_${Date.now()}`,
      ...data,
      approval_status: 'NOT_SENT' as ConceptApprovalStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private getMockConcepts(workstreamId: string) {
    return {
      concepts: [
        {
          id: 'c1',
          workstream_id: workstreamId,
          title: 'Product Benefits Hook',
          hook: 'Did you know that...',
          script: 'Full script here...',
          approval_status: 'APPROVED' as ConceptApprovalStatus,
          deliverable_ids: ['d1', 'd2'],
          created_at: '2024-12-20T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z'
        }
      ]
    };
  }

  private createMockProductionBatch(data: Partial<ProductionBatch>) {
    return {
      id: `pb_${Date.now()}`,
      ...data,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private getMockProductionBatches(workstreamId: string) {
    return {
      batches: [
        {
          id: 'pb1',
          workstream_id: workstreamId,
          name: 'Studio Day 1',
          date: '2025-01-20',
          location: 'Studio A',
          deliverable_ids: ['d1', 'd2', 'd3'],
          created_at: '2025-01-10T00:00:00Z'
        }
      ]
    };
  }

  private createMockAssignment(data: Partial<Assignment>) {
    return {
      id: `a_${Date.now()}`,
      ...data,
      status: 'INVITED' as AssignmentStatus,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private getMockEvents(campaignId: string) {
    return {
      events: [
        {
          id: 'e1',
          campaign_id: campaignId,
          name: 'Ramadan Activation',
          date: '2025-03-01',
          venue: 'Dubai Mall',
          type: 'activation',
          barter_type: 'tickets',
          status: 'planning',
          created_at: '2025-01-01T00:00:00Z'
        }
      ]
    };
  }

  private createMockEvent(data: Partial<CampaignEvent>) {
    return {
      id: `e_${Date.now()}`,
      ...data,
      status: 'planning',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
  }

  private getMockPayouts(campaignId: string) {
    if (!this.isInternalUser()) return { payouts: [] };

    return {
      payouts: [
        {
          id: 'p1',
          campaign_id: campaignId,
          creator_name: 'Creator 1',
          amount: 1000,
          currency: 'AED',
          status: 'pending',
          created_at: '2025-01-10T00:00:00Z'
        }
      ]
    };
  }

  private getMockActivityFeed(campaignId: string) {
    const isInternal = this.isInternalUser();

    return {
      activities: [
        {
          id: 'act1',
          campaign_id: campaignId,
          type: 'status_change',
          actor_name: 'John Doe',
          actor_role: 'internal',
          action: 'Changed deliverable status to IN_PRODUCTION',
          timestamp: '2025-01-15T14:00:00Z',
          is_client_visible: true
        },
        ...(isInternal ? [{
          id: 'act2',
          campaign_id: campaignId,
          type: 'comment',
          actor_name: 'Admin',
          actor_role: 'internal',
          action: 'Added internal note',
          timestamp: '2025-01-15T13:00:00Z',
          is_client_visible: false
        }] : [])
      ]
    };
  }

  private mockBulkOperation(operation: BulkOperation): BulkOperationResult[] {
    return operation.target_ids.map(id => ({
      id,
      success: Math.random() > 0.1, // 90% success rate for mock
      error: Math.random() > 0.9 ? 'Failed to update' : undefined
    }));
  }
}

export const operationsApi = new OperationsApiService();