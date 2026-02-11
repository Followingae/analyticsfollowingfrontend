/**
 * Campaign Operations OS - Context & State Management
 * Handles global operations state with client-safe mode
 */

'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  CampaignContainer,
  Workstream,
  Deliverable,
  OperationsUIState,
  UserAccess,
  DeliverableStatus,
  WorkstreamType
} from '@/types/operations';
import { operationsApi } from '@/services/operationsApi';
import { toast } from 'sonner';
import { useUserStore } from '@/stores/userStore';
import {
  checkOperationsAccess,
  hasPermission,
  isInternalUser,
  isClientUser,
  getClientSafeData,
  getFilteredWorkstreams,
  getFilteredActivity
} from '@/utils/operationsAccess';

interface OperationsContextType {
  // State
  campaigns: CampaignContainer[];
  currentCampaign: CampaignContainer | null;
  workstreams: Workstream[];
  currentWorkstream: Workstream | null;
  deliverables: Deliverable[];
  selectedDeliverables: string[];
  uiState: OperationsUIState;
  userAccess: UserAccess;

  // Actions
  loadCampaigns: () => Promise<void>;
  selectCampaign: (campaignId: string) => Promise<void>;
  selectWorkstream: (workstreamId: string) => Promise<void>;
  toggleDeliverableSelection: (deliverableId: string) => void;
  selectAllDeliverables: () => void;
  clearDeliverableSelection: () => void;
  setFilters: (filters: OperationsUIState['filters']) => void;
  setViewMode: (mode: 'internal' | 'client') => void;
  refreshData: () => Promise<void>;

  // Operations
  createWorkstream: (data: Partial<Workstream>) => Promise<void>;
  createDeliverable: (data: Partial<Deliverable>) => Promise<void>;
  updateDeliverableStatus: (deliverableId: string, status: DeliverableStatus) => Promise<void>;
  bulkUpdateDeliverables: (action: string, params: any) => Promise<void>;
}

const OperationsContext = createContext<OperationsContextType | null>(null);

export const useOperations = () => {
  const context = useContext(OperationsContext);
  if (!context) {
    throw new Error('useOperations must be used within OperationsProvider');
  }
  return context;
};

export const OperationsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // State
  const [campaigns, setCampaigns] = useState<CampaignContainer[]>([]);
  const [currentCampaign, setCurrentCampaign] = useState<CampaignContainer | null>(null);
  const [workstreams, setWorkstreams] = useState<Workstream[]>([]);
  const [currentWorkstream, setCurrentWorkstream] = useState<Workstream | null>(null);
  const [deliverables, setDeliverables] = useState<Deliverable[]>([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  const [uiState, setUiState] = useState<OperationsUIState>({
    selectedDeliverables: [],
    filters: {},
    viewMode: 'internal',
    isLoading: false
  });

  // Get user from proper user store
  const user = useUserStore(state => state.user);

  // User access based on role with proper backend roles
  const getUserAccess = (): UserAccess => {
    if (!user) {
      return {
        role: 'free',
        campaign_ids: [],
        permissions: {
          view_internal_notes: false,
          view_finance: false,
          view_banking: false,
          create_workstreams: false,
          create_deliverables: false,
          approve_concepts: false,
          manage_production: false,
          manage_events: false,
          export_data: false,
          bulk_operations: false
        }
      };
    }

    // Normalize role names (handle both super_admin and superadmin)
    const normalizedRole = user.role === 'superadmin' ? 'super_admin' : user.role;
    const normalizedUser = { ...user, role: normalizedRole };

    const internal = isInternalUser(normalizedUser);
    const client = isClientUser(normalizedUser);

    return {
      role: normalizedUser.role || 'free',
      campaign_ids: [], // Will be populated from API
      permissions: {
        view_internal_notes: hasPermission(normalizedUser, 'view_internal_notes'),
        view_finance: hasPermission(normalizedUser, 'view_finance'),
        view_banking: hasPermission(normalizedUser, 'view_banking_details'),
        create_workstreams: hasPermission(normalizedUser, 'create_workstream'),
        create_deliverables: hasPermission(normalizedUser, 'create_deliverable'),
        approve_concepts: hasPermission(normalizedUser, 'approve_concept'),
        manage_production: hasPermission(normalizedUser, 'edit_production'),
        manage_events: hasPermission(normalizedUser, 'manage_enrollments'),
        export_data: hasPermission(normalizedUser, 'export_campaigns'),
        bulk_operations: hasPermission(normalizedUser, 'bulk_operations')
      }
    };
  };

  const [userAccess, setUserAccess] = useState<UserAccess>(getUserAccess());

  // Update access when user changes
  useEffect(() => {
    setUserAccess(getUserAccess());
  }, [user]);

  // Set initial view mode based on user role
  useEffect(() => {
    const isInternal = userAccess.permissions.view_internal_notes;
    setUiState(prev => ({
      ...prev,
      viewMode: isInternal ? 'internal' : 'client'
    }));
  }, [userAccess]);

  // Actions
  const loadCampaigns = useCallback(async () => {
    setUiState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await operationsApi.getCampaigns();
      setCampaigns(response.campaigns);
    } catch (error) {
      console.error('Failed to load campaigns:', error);
      toast.error('Failed to load campaigns');
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const selectCampaign = useCallback(async (campaignId: string) => {
    setUiState(prev => ({ ...prev, isLoading: true, selectedCampaign: campaignId }));
    try {
      const [campaignDetails, workstreamsData] = await Promise.all([
        operationsApi.getCampaignDetails(campaignId),
        operationsApi.getWorkstreams(campaignId)
      ]);

      setCurrentCampaign(campaignDetails);
      setWorkstreams(workstreamsData.workstreams);
      setCurrentWorkstream(null);
      setDeliverables([]);
      setSelectedDeliverables([]);
    } catch (error) {
      console.error('Failed to load campaign:', error);
      toast.error('Failed to load campaign details');
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const selectWorkstream = useCallback(async (workstreamId: string) => {
    setUiState(prev => ({ ...prev, isLoading: true, selectedWorkstream: workstreamId }));
    try {
      const workstream = workstreams.find(ws => ws.id === workstreamId);
      if (!workstream) throw new Error('Workstream not found');

      setCurrentWorkstream(workstream);

      const deliverablesData = await operationsApi.getDeliverables(
        workstreamId,
        uiState.filters.status ? { status: uiState.filters.status } : undefined
      );

      setDeliverables(deliverablesData.deliverables);
      setSelectedDeliverables([]);
    } catch (error) {
      console.error('Failed to load workstream:', error);
      toast.error('Failed to load workstream details');
    } finally {
      setUiState(prev => ({ ...prev, isLoading: false }));
    }
  }, [workstreams, uiState.filters]);

  const toggleDeliverableSelection = useCallback((deliverableId: string) => {
    setSelectedDeliverables(prev => {
      if (prev.includes(deliverableId)) {
        return prev.filter(id => id !== deliverableId);
      }
      return [...prev, deliverableId];
    });
  }, []);

  const selectAllDeliverables = useCallback(() => {
    setSelectedDeliverables(deliverables.map(d => d.id));
  }, [deliverables]);

  const clearDeliverableSelection = useCallback(() => {
    setSelectedDeliverables([]);
  }, []);

  const setFilters = useCallback((filters: OperationsUIState['filters']) => {
    setUiState(prev => ({ ...prev, filters }));
    // Reload deliverables if workstream is selected
    if (currentWorkstream) {
      selectWorkstream(currentWorkstream.id);
    }
  }, [currentWorkstream, selectWorkstream]);

  const setViewMode = useCallback((mode: 'internal' | 'client') => {
    // Only allow internal users to switch to internal mode
    if (mode === 'internal' && !userAccess.permissions.view_internal_notes) {
      toast.error('You do not have permission to view internal mode');
      return;
    }
    setUiState(prev => ({ ...prev, viewMode: mode }));
  }, [userAccess]);

  const refreshData = useCallback(async () => {
    if (currentCampaign) {
      await selectCampaign(currentCampaign.id);
      if (currentWorkstream) {
        await selectWorkstream(currentWorkstream.id);
      }
    } else {
      await loadCampaigns();
    }
  }, [currentCampaign, currentWorkstream, loadCampaigns, selectCampaign, selectWorkstream]);

  // Operations
  const createWorkstream = useCallback(async (data: Partial<Workstream>) => {
    if (!userAccess.permissions.create_workstreams) {
      toast.error('You do not have permission to create workstreams');
      return;
    }

    if (!currentCampaign) {
      toast.error('No campaign selected');
      return;
    }

    try {
      const newWorkstream = await operationsApi.createWorkstream(currentCampaign.id, data);
      setWorkstreams(prev => [...prev, newWorkstream]);
      toast.success('Workstream created successfully');
    } catch (error) {
      console.error('Failed to create workstream:', error);
      toast.error('Failed to create workstream');
    }
  }, [currentCampaign, userAccess]);

  const createDeliverable = useCallback(async (data: Partial<Deliverable>) => {
    if (!userAccess.permissions.create_deliverables) {
      toast.error('You do not have permission to create deliverables');
      return;
    }

    if (!currentWorkstream) {
      toast.error('No workstream selected');
      return;
    }

    try {
      const newDeliverable = await operationsApi.createDeliverable(currentWorkstream.id, data);
      setDeliverables(prev => [...prev, newDeliverable]);
      toast.success('Deliverable created successfully');
    } catch (error) {
      console.error('Failed to create deliverable:', error);
      toast.error('Failed to create deliverable');
    }
  }, [currentWorkstream, userAccess]);

  const updateDeliverableStatus = useCallback(async (
    deliverableId: string,
    status: DeliverableStatus
  ) => {
    try {
      await operationsApi.updateDeliverableStatus(deliverableId, status);
      setDeliverables(prev => prev.map(d =>
        d.id === deliverableId ? { ...d, status } : d
      ));
      toast.success('Status updated successfully');
    } catch (error: any) {
      console.error('Failed to update status:', error);
      toast.error(error.message || 'Failed to update status');
    }
  }, []);

  const bulkUpdateDeliverables = useCallback(async (action: string, params: any) => {
    if (!userAccess.permissions.bulk_operations) {
      toast.error('You do not have permission to perform bulk operations');
      return;
    }

    if (selectedDeliverables.length === 0) {
      toast.error('No deliverables selected');
      return;
    }

    try {
      const results = await operationsApi.bulkUpdateDeliverables({
        type: action as any,
        target_ids: selectedDeliverables,
        params
      });

      const successCount = results.filter(r => r.success).length;
      const failCount = results.filter(r => !r.success).length;

      if (successCount > 0) {
        toast.success(`${successCount} deliverable(s) updated successfully`);
      }
      if (failCount > 0) {
        toast.error(`${failCount} deliverable(s) failed to update`);
      }

      // Refresh deliverables
      if (currentWorkstream) {
        await selectWorkstream(currentWorkstream.id);
      }
    } catch (error) {
      console.error('Bulk operation failed:', error);
      toast.error('Bulk operation failed');
    }
  }, [selectedDeliverables, currentWorkstream, selectWorkstream, userAccess]);

  const value: OperationsContextType = {
    // State
    campaigns,
    currentCampaign,
    workstreams,
    currentWorkstream,
    deliverables,
    selectedDeliverables,
    uiState,
    userAccess,

    // Actions
    loadCampaigns,
    selectCampaign,
    selectWorkstream,
    toggleDeliverableSelection,
    selectAllDeliverables,
    clearDeliverableSelection,
    setFilters,
    setViewMode,
    refreshData,

    // Operations
    createWorkstream,
    createDeliverable,
    updateDeliverableStatus,
    bulkUpdateDeliverables
  };

  return (
    <OperationsContext.Provider value={value}>
      {children}
    </OperationsContext.Provider>
  );
};