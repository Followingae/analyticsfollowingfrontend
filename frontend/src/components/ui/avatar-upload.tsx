'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, Trash2, User, Loader2 } from 'lucide-react';
import { useAvatar, useAvatarUpload, useAvatarDelete } from '@/hooks/use-avatar';
import { proxyInstagramUrl } from '@/lib/image-proxy';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface AvatarUploadProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showUploadButton?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-16 w-16',
  lg: 'h-24 w-24',
  xl: 'h-32 w-32'
};

export function AvatarUpload({
  className,
  size = 'lg',
  showUploadButton = true
}: AvatarUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: avatarData, isLoading } = useAvatar();
  const uploadMutation = useAvatarUpload();
  const deleteMutation = useAvatarDelete();

  // Determine which avatar to show
  const currentAvatarUrl = avatarData?.has_custom_avatar
    ? avatarData.avatar_url
    : proxyInstagramUrl(avatarData?.avatar_url);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File too large (max 5MB)');
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Invalid file type. Please use JPEG, PNG, or WebP.');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    uploadMutation.mutate(file, {
      onSuccess: () => {
        setIsOpen(false);
        setPreview(null);
      },
      onError: () => {
        setPreview(null);
      }
    });
  };

  const handleDelete = () => {
    if (!avatarData?.has_custom_avatar) {
      toast.error('No custom avatar to delete');
      return;
    }

    deleteMutation.mutate(undefined, {
      onSuccess: () => {
        setIsOpen(false);
      }
    });
  };

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center", sizeClasses[size], className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const AvatarComponent = (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={preview || currentAvatarUrl || undefined} />
      <AvatarFallback>
        <User className="h-4 w-4" />
      </AvatarFallback>
    </Avatar>
  );

  if (!showUploadButton) {
    return AvatarComponent;
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className="relative p-0 rounded-full hover:opacity-80 transition-opacity"
        >
          {AvatarComponent}
          <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="h-4 w-4 text-white" />
          </div>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Avatar</DialogTitle>
          <DialogDescription>
            Upload a new profile picture or remove your current one.
            Maximum file size: 5MB. Supported formats: JPEG, PNG, WebP.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4">
          <Avatar className="h-32 w-32">
            <AvatarImage src={preview || currentAvatarUrl || undefined} />
            <AvatarFallback>
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>

          {/* Avatar Info */}
          {avatarData && (
            <div className="text-center text-sm text-muted-foreground">
              {avatarData.has_custom_avatar ? (
                <div>
                  <p>Custom avatar uploaded</p>
                  {avatarData.uploaded_at && (
                    <p>Uploaded: {new Date(avatarData.uploaded_at).toLocaleDateString()}</p>
                  )}
                  {avatarData.processed_size && (
                    <p>Size: {avatarData.processed_size}</p>
                  )}
                </div>
              ) : (
                <p>Using Instagram profile picture</p>
              )}
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadMutation.isPending}
            >
              <Upload className="h-4 w-4 mr-2" />
              {uploadMutation.isPending ? 'Uploading...' : 'Upload New'}
            </Button>

            {avatarData?.has_custom_avatar && (
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {deleteMutation.isPending ? 'Removing...' : 'Remove'}
              </Button>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Simple Avatar Display Component (no upload functionality)
export function UserAvatar({
  className,
  size = 'md',
  fallbackText
}: {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fallbackText?: string;
}) {
  const { data: avatarData, isLoading } = useAvatar();

  if (isLoading) {
    return (
      <div className={cn("flex items-center justify-center bg-muted rounded-full", sizeClasses[size], className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
      </div>
    );
  }

  const currentAvatarUrl = avatarData?.has_custom_avatar
    ? avatarData.avatar_url
    : proxyInstagramUrl(avatarData?.avatar_url);

  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage src={currentAvatarUrl || undefined} />
      <AvatarFallback>
        {fallbackText ? (
          <span className="font-medium text-xs">
            {fallbackText.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}