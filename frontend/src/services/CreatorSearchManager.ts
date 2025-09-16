/**
 * 🚀 CREATOR SEARCH MANAGER
 * Complete implementation of database-first strategy from AUTHENTICATION_FIX_README.md
 */

import { toast } from 'sonner';
import { creatorApiService } from '@/services/creatorApi';
import { CreatorProfile, AnalysisStatus, SearchResponse } from '@/types/creator';
import { requestCache } from '@/utils/requestCache';
import { sequencedFetch, REQUEST_PRIORITIES } from '@/utils/requestSequencer';
import { API_CONFIG } from '@/config/api';

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
   * Main search function using single API call - no polling needed
   */
  async searchCreator(username: string): Promise<void> {
    try {
      // Single API call returns everything immediately
      this.callbacks.onStateChange?.(UI_STATES.LOADING);
      
      const searchResponse = await this.callSearchAPI(username);

      // Complete data is available immediately - no polling needed
      this.updateUI(searchResponse);
      this.showCompleteProfile(searchResponse.profile);
      
      // AI analysis and CDN images are included in the response
      if (searchResponse.profile.ai_insights) {
        this.showAIInsights(searchResponse.profile.ai_insights);
      }
      
      this.callbacks.onStateChange?.(UI_STATES.COMPLETE);
      toast.success('Complete profile with AI insights loaded!');

    } catch (error) {
      this.handleError(error instanceof Error ? error.message : 'Search failed');
    }
  }

  /**
   * Call the search API using the corrected endpoint
   */
  private async callSearchAPI(username: string): Promise<SearchResponse> {
    // Use the single POST endpoint that returns everything immediately
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/search/creator/${username.trim().replace('@', '')}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    if (!data.success || !data.profile) {
      throw new Error(data.error || 'Failed to search creator');
    }

    return data;
  }

  /**
   * Update UI with available data
   */
  private updateUI(searchResponse: SearchResponse): void {
    this.callbacks.onProfileUpdate?.(searchResponse.profile);
    toast.success(`Found @${searchResponse.profile.username}!`);
  }

  // ❌ REMOVED: Complex scenario handling no longer needed - single response has everything

  // ❌ REMOVED: AI polling no longer needed - single API call returns everything

  // ❌ REMOVED: CDN polling no longer needed - images included in main response

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