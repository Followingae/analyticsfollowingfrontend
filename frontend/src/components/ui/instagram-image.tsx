import { forwardRef, ImgHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { proxyInstagramUrl, handleImageError } from '@/lib/image-proxy';

interface InstagramImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined;
  fallback?: React.ReactNode;
  className?: string;
}

/**
 * Instagram Image component with automatic CORS proxy
 * Handles Instagram CDN URLs and provides graceful error handling
 */
export const InstagramImage = forwardRef<HTMLImageElement, InstagramImageProps>(
  ({ src, alt, className, fallback, onError, ...props }, ref) => {
    const proxiedSrc = proxyInstagramUrl(src);

    // Don't render if no source
    if (!proxiedSrc) {
      return fallback ? <>{fallback}</> : null;
    }

    return (
      <img
        ref={ref}
        src={proxiedSrc}
        alt={alt}
        className={cn("object-cover", className)}
        onError={onError || handleImageError}
        {...props}
      />
    );
  }
);

InstagramImage.displayName = "InstagramImage";