import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

interface AvatarData {
  avatar_url: string | null;
  has_custom_avatar: boolean;
  uploaded_at?: string;
  file_size?: number;
  processed_size?: string;
}

interface UploadAvatarResponse {
  success: boolean;
  avatar_url: string;
  message: string;
}

// Get current avatar
export function useAvatar() {
  return useQuery({
    queryKey: ['user-avatar'],
    queryFn: async (): Promise<AvatarData> => {
      const { fetchWithAuth } = await import('@/utils/apiInterceptor');
      const response = await fetchWithAuth('/api/v1/user/avatar', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch avatar');
      }

      return response.json();
    },
  });
}

// Upload avatar
export function useAvatarUpload() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (file: File): Promise<UploadAvatarResponse> => {
      const { tokenManager } = await import('@/utils/tokenManager');
      const tokenResult = await tokenManager.getValidToken();
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/v1/user/avatar/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Upload failed');
      }

      return response.json();
    },
    onMutate: async (file) => {
      // Cancel queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['user-avatar'] });

      // Snapshot the previous value
      const previousAvatar = queryClient.getQueryData(['user-avatar']);

      // Create optimistic preview URL
      const previewUrl = URL.createObjectURL(file);

      // Optimistically update the avatar
      queryClient.setQueryData(['user-avatar'], (old: any) => ({
        ...old,
        avatar_url: previewUrl,
        has_custom_avatar: true,
        isUploading: true,
        uploaded_at: new Date().toISOString()
      }));

      return { previousAvatar, previewUrl };
    },
    onSuccess: (data, file, context) => {
      // Clean up the preview URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }

      // Update with real data
      queryClient.setQueryData(['user-avatar'], {
        avatar_url: data.avatar_url,
        has_custom_avatar: true,
        isUploading: false,
        uploaded_at: new Date().toISOString()
      });

      toast.success('Avatar updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: Error, file, context) => {
      // Clean up the preview URL
      if (context?.previewUrl) {
        URL.revokeObjectURL(context.previewUrl);
      }

      // Revert optimistic update
      if (context?.previousAvatar) {
        queryClient.setQueryData(['user-avatar'], context.previousAvatar);
      }

      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

// Delete avatar
export function useAvatarDelete() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { fetchWithAuth } = await import('@/utils/apiInterceptor');
      const response = await fetchWithAuth('/api/v1/user/avatar', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Delete failed');
      }

      return response.json();
    },
    onMutate: async () => {
      // Cancel queries to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: ['user-avatar'] });

      // Snapshot the previous value
      const previousAvatar = queryClient.getQueryData(['user-avatar']);

      // Optimistically remove the avatar
      queryClient.setQueryData(['user-avatar'], {
        avatar_url: null,
        has_custom_avatar: false,
        isDeleting: true
      });

      return { previousAvatar };
    },
    onSuccess: (data, variables, context) => {
      // Update with confirmation
      queryClient.setQueryData(['user-avatar'], {
        avatar_url: null,
        has_custom_avatar: false,
        isDeleting: false
      });

      toast.success('Avatar removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error, variables, context) => {
      // Revert optimistic update
      if (context?.previousAvatar) {
        queryClient.setQueryData(['user-avatar'], context.previousAvatar);
      }

      toast.error('Failed to remove avatar');
    },
  });
}

// Get complete user profile
export function useUserProfile() {
  return useQuery({
    queryKey: ['user-profile-complete'],
    queryFn: async () => {
      const { fetchWithAuth } = await import('@/utils/apiInterceptor');
      const response = await fetchWithAuth('/api/v1/user/profile/complete', {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch profile');
      }

      return response.json();
    },
  });
}