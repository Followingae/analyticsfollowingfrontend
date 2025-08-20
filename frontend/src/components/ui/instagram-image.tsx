import { forwardRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { proxyInstagramUrlCached } from '@/lib/image-cache';
import { handleImageError } from '@/lib/image-proxy';

interface InstagramImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Instagram Image component with automatic CORS proxy
 * Handles Instagram CDN URLs and provides graceful error handling
 * FIXED: Uses regular img tag to avoid Next.js server-side optimization
 */
export const InstagramImage = forwardRef<HTMLImageElement, InstagramImageProps>(
  ({ src, alt, className, fallback, onError, ...props }, ref) => {
    const proxiedSrc = proxyInstagramUrlCached(src);

    // Don't render if no source
    if (!proxiedSrc) {
      return fallback ? <>{fallback}</> : null;
    }

    // Use regular img tag to avoid Next.js server-side optimization
    // which triggers CORS proxy 403 errors since proxy blocks server requests
    return (
      <img
        ref={ref}
        src={proxiedSrc}
        alt={alt}
        className={cn("object-cover", className)}
        crossOrigin="anonymous"
        onError={onError || handleImageError}
        {...props}
      />
    );
  }
);

InstagramImage.displayName = "InstagramImage";