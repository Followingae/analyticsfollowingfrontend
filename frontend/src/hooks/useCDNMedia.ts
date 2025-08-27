import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cdnMediaService, CDNMediaResponse, CreatorProfileWithCDN } from '@/services/cdnMediaApi';
import { authService } from '@/services/authService';
import { toast } from 'sonner';

/**
 * Hook to fetch CDN media for a profile
 */
export function useCDNMedia(profileId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['cdn-media', profileId],
    queryFn: async (): Promise<CDNMediaResponse> => {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }
      return cdnMediaService.getCDNMedia(profileId, token);
    },
    enabled: enabled && !!profileId,
    staleTime: 10 * 60 * 1000, // 10 minutes - CDN URLs are immutable
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch profile with CDN data combined
 */
export function useProfileWithCDN(username: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['profile-with-cdn', username],
    queryFn: async (): Promise<CreatorProfileWithCDN> => {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }
      return cdnMediaService.getProfileWithCDN(username, token);
    },
    enabled: enabled && !!username,
    staleTime: 5 * 60 * 1000, // 5 minutes for profile data
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to refresh CDN media (trigger reprocessing)
 */
export function useCDNMediaRefresh() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profileId: string) => {
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token');
      }
      return cdnMediaService.refreshCDNMedia(profileId, token);
    },
    onSuccess: (data, profileId) => {
      toast.success('CDN media refresh initiated');
      // Invalidate both CDN media and profile queries
      queryClient.invalidateQueries({ queryKey: ['cdn-media', profileId] });
      queryClient.invalidateQueries({ queryKey: ['profile-with-cdn'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to refresh media: ${error.message}`);
    },
  });
}

/**
 * Hook to get the best available image URL (CDN first, then fallback)
 */
export function useOptimalImageUrl(
  cdnUrl: string | undefined | null,
  fallbackUrl: string | undefined | null,
  size: 'small' | 'large' = 'large'
) {
  const placeholders = cdnMediaService.getPlaceholderUrls();

  if (cdnUrl && cdnMediaService.isCDNUrl(cdnUrl)) {
    return cdnUrl; // Use CDN URL (permanent, optimized)
  }

  // Don't use Instagram URLs anymore - they expire and need proxy
  if (fallbackUrl && cdnMediaService.isInstagramUrl(fallbackUrl)) {
    return size === 'large' ? placeholders.avatar.large : placeholders.avatar.small;
  }

  return fallbackUrl || (size === 'large' ? placeholders.avatar.large : placeholders.avatar.small);
}

/**
 * Hook to check CDN processing status
 */
export function useCDNProcessingStatus(profileId: string) {
  const { data: cdnData, isLoading, error } = useCDNMedia(profileId);

  if (isLoading || error || !cdnData) {
    return {
      isProcessing: false,
      completionPercentage: 0,
      totalAssets: 0,
      completedAssets: 0,
      isQueued: false,
    };
  }

  return {
    isProcessing: cdnData.processing_status.queued,
    completionPercentage: cdnData.processing_status.completion_percentage,
    totalAssets: cdnData.processing_status.total_assets,
    completedAssets: cdnData.processing_status.completed_assets,
    isQueued: cdnData.processing_status.queued,
  };
}

/**
 * Custom hook for progressive image loading with CDN migration
 */
export function useProgressiveImageLoading(
  profileId: string | undefined,
  originalImageUrl: string | undefined | null
) {
  const { data: cdnData, isLoading: cdnLoading } = useCDNMedia(profileId || '', !!profileId);

  // Determine the best image URL to use
  const imageUrl = useOptimalImageUrl(
    cdnData?.avatar.available ? cdnData.avatar['512'] : null,
    originalImageUrl
  );

  const isProcessing = cdnData?.processing_status.queued || false;
  const processingPercentage = cdnData?.processing_status.completion_percentage || 0;

  return {
    imageUrl,
    isLoading: cdnLoading,
    isProcessing,
    processingPercentage,
    hasCDNData: !!cdnData,
    usingCDN: cdnData?.avatar.available || false,
  };
}