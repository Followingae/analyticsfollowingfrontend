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
    onSuccess: (data) => {
      toast.success('Avatar updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-avatar'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: (error: Error) => {
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
    onSuccess: () => {
      toast.success('Avatar removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['user-avatar'] });
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
    },
    onError: () => {
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