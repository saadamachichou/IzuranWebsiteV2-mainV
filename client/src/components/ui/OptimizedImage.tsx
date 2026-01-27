import React, { useState } from 'react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  sizes?: string;
  className?: string;
  fallback?: string;
  priority?: boolean;
}

/**
 * OptimizedImage component that:
 * - Uses proper loading attributes (lazy by default)
 * - Provides proper decoding (async)
 * - Handles errors gracefully with fallback
 * - Supports width/height for aspect ratio hints
 * 
 * Note: For true responsive images with srcset, you would need:
 * 1. Image transformation service (Cloudinary, ImageKit, etc.)
 * 2. Or server-side image resizing
 * 
 * This component provides the foundation and can be extended.
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  className = '',
  fallback = '/placeholder.svg',
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  // If error, show fallback
  if (imageError) {
    return (
      <img
        src={fallback}
        alt={alt}
        className={className}
        width={width}
        height={height}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        {...props}
      />
    );
  }

  return (
    <div className="relative w-full h-full">
      {imageLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/50 z-10">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400"></div>
        </div>
      )}
      <img
        src={src}
        alt={alt}
        className={`${className} ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        width={width}
        height={height}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        fetchPriority={priority ? 'high' : 'auto'}
        decoding="async"
        onLoad={handleImageLoad}
        onError={handleImageError}
        {...props}
      />
    </div>
  );
}
