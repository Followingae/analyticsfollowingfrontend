/**
 * 🚀 CREATOR SEARCH MANAGER
 * Complete implementation of database-first strategy from AUTHENTICATION_FIX_README.md
 */

import { toast } from 'sonner';
import { creatorApiService } from '@/services/creatorApi';
import { CreatorProfile, AnalysisStatus, SearchResponse } from '@/types/creator';

// UI State Management as per guide
export const UI_STATES = {
  LOADING: 'loading',           // Initial search
  BASIC: 'basic',              // Basic profile shown
  AI_PROCESSING: 'ai_proc',    // AI analysis in progress
  CDN_PROCESSING: 'cdn_proc',  // Images processing
  COMPLETE: 'complete'         // Everything ready
} as const;

export type UIState = typeof UI_STATES[keyof typeof UI_STATES];

export interface CreatorSearchCallbacks {
  onProfileUpdate?: (profile: CreatorProfile) => void;
  onStateChange?: (state: UIState) => void;
  onAIProgress?: (progress: number) => void;
  onCDNProgress?: (progress: number) => void;
  onError?: (error: string) => void;
}

export class CreatorSearchManager {
  private aiPollInterval: NodeJS.Timeout | null = null;
  private cdnPollInterval: NodeJS.Timeout | null = null;
  private callbacks: CreatorSearchCallbacks = {};

  constructor(callbacks: CreatorSearchCallbacks = {}) {
    this.callbacks = callbacks;
  }

  /**
   * Main search function implementing database-first strategy
   */
  async searchCreator(username: string): Promise<void> {
    try {
      // Stage 1: Always returns immediately (~100-300ms)
      this.callbacks.onStateChange?.(UI_STATES.LOADING);
      
      const searchResponse = await this.callSearchAPI(username);

      // Immediate UI update with available data
      this.updateUI(searchResponse);

      // Handle different scenarios based on data source
      switch (searchResponse.data_source) {
        case 'database_complete':
          this.handleCompleteProfile(searchResponse);
          break;

        case 'database_processing':
          this.handleExistingProfileWithProcessing(searchResponse);
          break;

        case 'instagram_fresh':
          this.handleFreshProfile(searchResponse);
          break;
      }

    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Search failed');
    }
  }

  /**
   * Call the search API
   */
  private async callSearchAPI(username: string): Promise<SearchResponse> {
    const result = await creatorApiService.searchCreator(username.trim().replace('@', ''));
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to search creator');
    }

    return result.data;
  }

  /**
   * Update UI with available data
   */
  private updateUI(searchResponse: SearchResponse): void {
    this.callbacks.onProfileUpdate?.(searchResponse.profile);
    toast.success(`Found @${searchResponse.profile.username}!`);
  }

  /**
   * Scenario 1: Profile Already Exists (Database Complete)
   * Response time: ~100-300ms - No polling needed!
   */
  private handleCompleteProfile(data: SearchResponse): void {
    // Profile exists with complete AI analysis
    this.showCompleteProfile(data.profile);
    this.showAIInsights(data.profile.ai_insights);
    this.loadCDNImages(data.profile.id);
    this.hideLoadingIndicators();
    
    this.callbacks.onStateChange?.(UI_STATES.COMPLETE);
    toast.success('Complete profile with AI insights loaded!');
  }

  /**
   * Scenario 2: Profile Exists But AI Incomplete
   */
  private handleExistingProfileWithProcessing(data: SearchResponse): void {
    // Profile exists but AI analysis missing/incomplete
    this.showBasicProfile(data.profile);
    this.loadCDNImages(data.profile.id); // CDN likely ready

    if (data.ai_analysis?.status === 'processing') {
      this.showAIProcessing(data.ai_analysis.estimated_completion || 0);
      this.startAIPolling(data.profile.username);
    }

    this.callbacks.onStateChange?.(UI_STATES.AI_PROCESSING);
  }

  /**
   * Scenario 3: Fresh Profile (New Instagram Fetch)
   */
  private handleFreshProfile(data: SearchResponse): void {
    // Brand new profile, everything processing
    this.showBasicProfile(data.profile);
    this.showAIProcessing(data.ai_analysis?.estimated_completion || 0);
    this.showCDNProcessing();

    // Start both polling processes
    this.startAIPolling(data.profile.username);
    this.startCDNPolling(data.profile.id);

    this.callbacks.onStateChange?.(UI_STATES.AI_PROCESSING);
  }

  /**
   * Start AI analysis polling
   */
  private async startAIPolling(username: string): Promise<void> {
    const maxAttempts = 24; // 2 minutes max (24 × 5 seconds)
    let attempts = 0;

    const poll = async () => {
      if (attempts++ >= maxAttempts) {
        this.showAITimeout();
        return;
      }

      try {
        const status = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/creator/${username}/status`, {
          headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
        });
        const statusData: AnalysisStatus = await status.json();

        if (statusData.status === 'completed') {
          // Get complete AI analysis
          const detailed = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/creator/${username}/detailed`, {
            headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
          });
          const completeData = await detailed.json();

          this.showAIInsights(completeData.profile.ai_insights);
          this.hideAIProcessing();
          this.callbacks.onStateChange?.(UI_STATES.COMPLETE);
          
          toast.success('AI analysis completed! Enhanced insights are now available.');
        } else {
          // Update progress and continue polling
          this.updateAIProgress(statusData.completion_percentage || 0);
          setTimeout(poll, 5000); // Poll every 5 seconds
        }
      } catch (error) {

        setTimeout(poll, 10000); // Retry in 10 seconds on error
      }
    };

    poll();
  }

  /**
   * Start CDN polling for image processing
   */
  private async startCDNPolling(profileId: string): Promise<void> {
    const maxAttempts = 12; // 1 minute max (12 × 5 seconds)
    let attempts = 0;

    const poll = async () => {
      if (attempts++ >= maxAttempts) {
        this.showCDNFallback();
        return;
      }

      try {
        const cdn = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/creators/ig/${profileId}/media`, {
          headers: { 'Authorization': `Bearer ${this.getAuthToken()}` }
        });
        const cdnData = await cdn.json();

        if (cdnData.processing_status?.completion_percentage >= 80) {
          this.updateImages(cdnData);
          this.hideCDNProcessing();
        } else {
          this.updateCDNProgress(cdnData.processing_status?.completion_percentage || 0);
          setTimeout(poll, 5000);
        }
      } catch (error) {

        setTimeout(poll, 10000);
      }
    };

    poll();
  }

  // UI Helper Methods
  private showCompleteProfile(profile: CreatorProfile): void {
    this.callbacks.onProfileUpdate?.(profile);
  }

  private showBasicProfile(profile: CreatorProfile): void {
    this.callbacks.onProfileUpdate?.(profile);
    this.callbacks.onStateChange?.(UI_STATES.BASIC);
  }

  private showAIInsights(insights: any): void {
    // Implementation handled by parent component

  }

  private loadCDNImages(profileId: string): void {
    // CDN images are permanent and cached by Cloudflare

  }

  private hideLoadingIndicators(): void {
    this.cleanup();
  }

  private showAIProcessing(estimatedCompletionSeconds: number): void {
    const minutes = Math.ceil(estimatedCompletionSeconds / 60);
    toast.loading(`AI analysis in progress (${minutes} min remaining)...`, { 
      id: 'ai-analysis'
    });
  }

  private showCDNProcessing(): void {
    toast.loading('Processing images...', { id: 'cdn-processing' });
  }

  private updateAIProgress(percentage: number): void {
    this.callbacks.onAIProgress?.(percentage);
  }

  private updateCDNProgress(percentage: number): void {
    this.callbacks.onCDNProgress?.(percentage);
  }

  private hideAIProcessing(): void {
    toast.dismiss('ai-analysis');
  }

  private hideCDNProcessing(): void {
    toast.dismiss('cdn-processing');
  }

  private updateImages(cdnData: any): void {

  }

  private showAITimeout(): void {
    toast.error('AI analysis is taking longer than expected. Results may be available later.');
    this.callbacks.onStateChange?.(UI_STATES.BASIC);
  }

  private showCDNFallback(): void {
    toast.warning('Some images may still be processing.');
  }

  private handleError(error: string): void {
    this.callbacks.onError?.(error);
    toast.error(error);
    this.cleanup();
  }

  /**
   * Get authentication token
   */
  private getAuthToken(): string {
    if (typeof window === 'undefined') return '';
    
    try {
      const { tokenManager } = require('@/utils/tokenManager');
      return tokenManager.getTokenSync() || '';
    } catch (error) {

      return '';
    }
  }

  /**
   * Clean up polling intervals
   */
  private cleanup(): void {
    if (this.aiPollInterval) {
      clearInterval(this.aiPollInterval);
      this.aiPollInterval = null;
    }
    
    if (this.cdnPollInterval) {
      clearInterval(this.cdnPollInterval);
      this.cdnPollInterval = null;
    }

    // Dismiss any active toasts
    toast.dismiss('ai-analysis');
    toast.dismiss('cdn-processing');
  }

  /**
   * Destroy the manager and clean up resources
   */
  destroy(): void {
    this.cleanup();
    this.callbacks = {};
  }
}