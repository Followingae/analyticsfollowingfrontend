/**
 * Campaign Operations OS - API Service Layer
 *
 * Surface trimmed in May 2026 audit: methods that hit endpoints with no backend
 * implementation (events, finance/payouts, production batches, asset/HD tracking,
 * creator assignment, deliverable status writes, concept submit-approval, activity
 * feed) were removed along with their UI pages. Only the live operations endpoints
 * remain here.
 */

import { fetchWithAuth } from '@/utils/apiInterceptor';
import { API_CONFIG } from '@/config/api';
import {
  Workstream,
  Deliverable,
  Concept,
  ConceptApprovalStatus,
  BulkOperation,
  BulkOperationResult,
  WorkstreamType,
  DeliverableStatus
} from '@/types/operations';
import { useUserStore } from '@/stores/userStore';
import {
  isInternalUser,
  hasPermission
} from '@/utils/operationsAccess';

class OperationsApiService {
  // Absolute API base. Previously a bare '/api/v1/operations', which fetch()
  // resolves against the FRONTEND origin (there is no /api proxy rewrite) — so
  // every ops call silently hit the wrong host. The API lives on API_CONFIG.BASE_URL.
  private baseUrl = `${API_CONFIG.BASE_URL}/api/v1/operations`;

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

  // ============= Agency Dashboard (cross-campaign, real data) =============

  /**
   * Command-center aggregate: real campaigns in flight + live action-queue
   * counts. Uses the absolute API base (the relative-path methods below only
   * resolve when same-origin); this one is host-correct.
   */
  async getDashboard(): Promise<any> {
    const res = await fetchWithAuth(`${this.baseUrl}/dashboard`);
    return res.json();
  }

  // ============= Campaign Operations =============

  // All methods return PARSED JSON. (They previously returned the raw fetch
  // Response, so callers' `data.deliverables` etc. were always undefined — a
  // second reason the ops surface never worked.)
  private async getJson(url: string, init?: RequestInit): Promise<any> {
    const res = await fetchWithAuth(url, init);
    return res.json();
  }

  async getCampaigns(filters?: {
    brand?: string;
    status?: string;
    date_range?: [string, string];
    search?: string;
  }) {
    const params = new URLSearchParams();
    if (filters?.brand) params.append('brand', filters.brand);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    return this.getJson(`${this.baseUrl}/campaigns?${params}`);
  }

  async getCampaignDetails(campaignId: string) {
    return this.getJson(`${this.baseUrl}/campaigns/${campaignId}`);
  }

  async getCampaignOverview(campaignId: string) {
    return this.getJson(`${this.baseUrl}/campaigns/${campaignId}/overview`);
  }

  async getCampaignSettings(campaignId: string) {
    return this.getJson(`${this.baseUrl}/campaigns/${campaignId}/settings`);
  }

  async updateCampaignSettings(campaignId: string, settings: any) {
    return this.getJson(`${this.baseUrl}/campaigns/${campaignId}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    });
  }

  // ============= Workstreams =============

  async getWorkstreams(campaignId: string) {
    return this.getJson(`${this.baseUrl}/campaigns/${campaignId}/workstreams`);
  }

  async createWorkstream(campaignId: string, data: Partial<Workstream>) {
    if (!this.hasPermission('create_workstream')) throw new Error('Insufficient permissions');

    return this.getJson(`${this.baseUrl}/campaigns/${campaignId}/workstreams`, {
      method: 'POST',
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
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status.join(','));
    if (filters?.creator) params.append('creator', filters.creator);
    if (filters?.due_date) params.append('due_date', filters.due_date);

    return this.getJson(`${this.baseUrl}/workstreams/${workstreamId}/deliverables?${params}`);
  }

  async createDeliverable(workstreamId: string, data: Partial<Deliverable>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');

    return this.getJson(`${this.baseUrl}/workstreams/${workstreamId}/deliverables`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async bulkUpdateDeliverables(operation: BulkOperation): Promise<BulkOperationResult[]> {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');

    const json = await this.getJson(`${this.baseUrl}/deliverables/bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(operation)
    });
    // Backend returns { results: [...] }
    return (json?.results ?? json ?? []) as BulkOperationResult[];
  }

  // ============= Concepts =============

  async getConcepts(workstreamId: string, filters?: {
    approval_status?: ConceptApprovalStatus[];
  }) {
    const params = new URLSearchParams();
    if (filters?.approval_status) {
      params.append('approval_status', filters.approval_status.join(','));
    }

    return this.getJson(`${this.baseUrl}/workstreams/${workstreamId}/concepts?${params}`);
  }

  async createConcept(workstreamId: string, data: Partial<Concept>) {
    if (!this.isInternalUser()) throw new Error('Insufficient permissions');

    return this.getJson(`${this.baseUrl}/workstreams/${workstreamId}/concepts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
  }

  async approveOrRejectConcept(
    conceptId: string,
    decision: 'approve' | 'request_changes',
    comment?: string
  ) {
    return this.getJson(`${this.baseUrl}/concepts/${conceptId}/decision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, comment })
    });
  }
}

export const operationsApi = new OperationsApiService();
