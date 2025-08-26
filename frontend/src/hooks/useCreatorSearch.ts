'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { creatorApiService } from '@/services/creatorApi';
import { 
  CreatorProfile, 
  AnalysisStatusResponse, 
  CreatorSearchResponse,
  CreatorDetailedResponse
} from '@/types/creator';

export interface CreatorSearchState {
  profile: CreatorProfile | null;
  loading: boolean;
  searching: boolean;
  aiAnalyzing: boolean;
  aiComplete: boolean;
  error: string | null;
  analysisStatus: AnalysisStatusResponse | null;
  stage: 'idle' | 'searching' | 'basic' | 'analyzing' | 'complete' | 'error';
}

export interface CreatorSearchActions {
  searchCreator: (username: string, options?: {
    force_refresh?: boolean;
    show_progress?: boolean;
  }) => Promise<void>;
  retryAnalysis: () => Promise<void>;
  clearSearch: () => void;
}

/**
 * 🔍 useCreatorSearch Hook - Complete creator search workflow
 * Handles two-phase search with automatic AI analysis polling
 */
export function useCreatorSearch(): CreatorSearchState & CreatorSearchActions {
  // State management
  const [state, setState] = useState<CreatorSearchState>({
    profile: null,
    loading: false,
    searching: false,
    aiAnalyzing: false,
    aiComplete: false,
    error: null,
    analysisStatus: null,
    stage: 'idle'
  });

  // Refs for cleanup and current operation tracking
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const currentUsernameRef = useRef<string>('');
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Status polling function
  const pollAnalysisStatus = useCallback(async (username: string) => {
    if (!username) return;

    try {
      const result = await creatorApiService.getAnalysisStatus(username);
      
      if (!result.success || !result.data) {
        setState(prev => ({
          ...prev,
          error: result.error || 'Failed to check analysis status',
          stage: 'error'
        }));
        cleanup();
        return;
      }

      const status = result.data;
      
      setState(prev => ({
        ...prev,
        analysisStatus: status,
        error: null
      }));

      // Handle different status states
      switch (status.status) {
        case 'completed':
          // Get detailed analysis
          const detailedResult = await creatorApiService.getDetailedAnalysis(username);
          
          if (detailedResult.success && detailedResult.data) {
            setState(prev => ({
              ...prev,
              profile: detailedResult.data!.profile,
              aiAnalyzing: false,
              aiComplete: true,
              loading: false,
              stage: 'complete'
            }));
            
            if (detailedResult.data.profile.ai_insights?.available) {
              toast.success('AI analysis completed! Enhanced insights are now available.');
            }
          }
          cleanup();
          break;

        case 'failed':
          setState(prev => ({
            ...prev,
            error: status.message || 'AI analysis failed',
            aiAnalyzing: false,
            loading: false,
            stage: 'error'
          }));
          toast.error('AI analysis failed. You can retry or view basic profile data.');
          cleanup();
          break;

        case 'not_found':
          setState(prev => ({
            ...prev,
            error: 'Profile not found for analysis',
            stage: 'error'
          }));
          cleanup();
          break;

        case 'processing':
          // Update progress and continue polling
          setState(prev => ({
            ...prev,
            aiAnalyzing: true,
            stage: 'analyzing'
          }));
          break;

        default:
          console.warn('Unknown analysis status:', status.status);
      }

    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to check analysis status',
        stage: 'error'
      }));
      cleanup();
    }
  }, [cleanup]);

  // Start polling with interval
  const startPolling = useCallback((username: string) => {
    cleanup(); // Clean up any existing polling
    
    // Initial status check after 5 seconds
    setTimeout(() => pollAnalysisStatus(username), 5000);
    
    // Then poll every 30 seconds
    pollIntervalRef.current = setInterval(() => {
      pollAnalysisStatus(username);
    }, 30000);

    // Stop polling after 10 minutes (safety timeout)
    setTimeout(() => {
      cleanup();
      setState(prev => {
        if (prev.stage === 'analyzing') {
          return {
            ...prev,
            aiAnalyzing: false,
            loading: false,
            error: 'AI analysis is taking longer than expected. Results may be available later.',
            stage: 'basic'
          };
        }
        return prev;
      });
    }, 600000); // 10 minutes
  }, [pollAnalysisStatus, cleanup]);

  // Main search function
  const searchCreator = useCallback(async (
    username: string, 
    options: {
      force_refresh?: boolean;
      show_progress?: boolean;
    } = {}
  ) => {
    if (!username?.trim()) {
      toast.error('Please enter a valid username');
      return;
    }

    const cleanUsername = username.trim().replace('@', '');
    currentUsernameRef.current = cleanUsername;

    // Reset state
    setState({
      profile: null,
      loading: true,
      searching: true,
      aiAnalyzing: false,
      aiComplete: false,
      error: null,
      analysisStatus: null,
      stage: 'searching'
    });

    cleanup(); // Clean up any previous operations

    try {
      // Create new abort controller for this search
      abortControllerRef.current = new AbortController();

      if (options.show_progress !== false) {
        toast.loading(`Searching for @${cleanUsername}...`, { id: 'creator-search' });
      }

      // Phase 1: Initial search
      const searchResult = await creatorApiService.searchCreator(cleanUsername, {
        force_refresh: options.force_refresh || false,
        include_posts: false,
        analysis_depth: 'standard'
      });

      if (!searchResult.success || !searchResult.data) {
        setState(prev => ({
          ...prev,
          error: searchResult.error || 'Failed to search creator',
          loading: false,
          searching: false,
          stage: 'error'
        }));
        
        if (options.show_progress !== false) {
          toast.error(searchResult.error || 'Failed to search creator', { id: 'creator-search' });
        }
        return;
      }

      const searchData = searchResult.data;

      setState(prev => ({
        ...prev,
        profile: searchData.profile,
        searching: false,
        error: null
      }));

      if (options.show_progress !== false) {
        toast.success(`Found @${cleanUsername}!`, { id: 'creator-search' });
      }

      // Check if analysis is already complete
      if (searchData.stage === 'complete' && searchData.profile.ai_insights?.available) {
        setState(prev => ({
          ...prev,
          aiComplete: true,
          loading: false,
          stage: 'complete'
        }));
        
        if (options.show_progress !== false) {
          toast.success('Profile with AI insights loaded!');
        }
        return;
      }

      // Phase 2: Start AI analysis polling if needed
      if (searchData.ai_analysis?.status === 'processing') {
        setState(prev => ({
          ...prev,
          aiAnalyzing: true,
          stage: 'analyzing'
        }));

        if (options.show_progress !== false) {
          const estimatedTime = searchData.ai_analysis.estimated_completion;
          const message = estimatedTime 
            ? `AI analysis in progress (${Math.ceil(estimatedTime / 60)} min remaining)...`
            : 'AI analysis in progress...';
          toast.loading(message, { id: 'ai-analysis' });
        }

        startPolling(cleanUsername);
      } else {
        // Basic profile without AI analysis
        setState(prev => ({
          ...prev,
          loading: false,
          stage: 'basic'
        }));
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Search failed';
      
      setState(prev => ({
        ...prev,
        error: errorMessage,
        loading: false,
        searching: false,
        stage: 'error'
      }));

      if (options.show_progress !== false) {
        toast.error(errorMessage, { id: 'creator-search' });
      }
      
      cleanup();
    }
  }, [startPolling, cleanup]);

  // Retry analysis function
  const retryAnalysis = useCallback(async () => {
    const username = currentUsernameRef.current;
    if (!username) return;

    setState(prev => ({
      ...prev,
      error: null,
      aiAnalyzing: true,
      stage: 'analyzing'
    }));

    toast.loading('Retrying AI analysis...', { id: 'retry-analysis' });
    startPolling(username);
  }, [startPolling]);

  // Clear search function
  const clearSearch = useCallback(() => {
    cleanup();
    currentUsernameRef.current = '';
    
    setState({
      profile: null,
      loading: false,
      searching: false,
      aiAnalyzing: false,
      aiComplete: false,
      error: null,
      analysisStatus: null,
      stage: 'idle'
    });

    // Dismiss any active toasts
    toast.dismiss('creator-search');
    toast.dismiss('ai-analysis');
    toast.dismiss('retry-analysis');
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ...state,
    searchCreator,
    retryAnalysis,
    clearSearch
  };
}

/**
 * 🔄 useAnalysisPolling Hook - Standalone polling for existing profiles
 * Use when you already have a profile and just need to poll for AI completion
 */
export function useAnalysisPolling(username: string) {
  const [status, setStatus] = useState<AnalysisStatusResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
  }, []);

  const startPolling = useCallback(async () => {
    if (!username) return;

    setLoading(true);
    setError(null);

    const poll = async () => {
      try {
        const result = await creatorApiService.getAnalysisStatus(username);
        
        if (result.success && result.data) {
          setStatus(result.data);
          
          if (result.data.status === 'completed' || result.data.status === 'failed') {
            cleanup();
            setLoading(false);
          }
        } else {
          setError(result.error || 'Failed to check status');
          cleanup();
          setLoading(false);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Polling failed');
        cleanup();
        setLoading(false);
      }
    };

    // Initial check
    await poll();

    // Start polling every 30 seconds if still processing
    if (status?.status === 'processing') {
      pollIntervalRef.current = setInterval(poll, 30000);
    }
  }, [username, cleanup, status?.status]);

  const stopPolling = useCallback(() => {
    cleanup();
    setLoading(false);
  }, [cleanup]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    status,
    loading,
    error,
    startPolling,
    stopPolling
  };
}