import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User } from 'lucide-react';
import { proxyInstagramUrlCached } from '@/lib/image-cache';
import { cn } from '@/lib/utils';

interface ProfileAvatarProps {
  src?: string | null;
  alt?: string;
  fallbackText?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
};

export function ProfileAvatar({
  src,
  alt,
  fallbackText,
  size = 'md',
  className
}: ProfileAvatarProps) {
  return (
    <Avatar className={cn(sizeClasses[size], className)}>
      <AvatarImage
        src={proxyInstagramUrlCached(src)}
        alt={alt}
        crossOrigin="anonymous"
      />
      <AvatarFallback>
        {fallbackText ? (
          <span className="text-xs font-medium">
            {fallbackText.slice(0, 2).toUpperCase()}
          </span>
        ) : (
          <User className="h-4 w-4" />
        )}
      </AvatarFallback>
    </Avatar>
  );
}