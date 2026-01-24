import { useState } from 'react';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  className?: string;
  placeholderSrc?: string;
  onError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  className = '',
  placeholderSrc = 'https://via.placeholder.com/400x300?text=No+Image',
  onError
}: ImageWithFallbackProps) {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    setImageError(true);
    setIsLoading(false);
    if (onError) {
      onError(e);
    } else {
      (e.target as HTMLImageElement).src = placeholderSrc;
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <div className="relative">
      {/* Loading skeleton */}
      {isLoading && !imageError && (
        <div className={`absolute inset-0 bg-gray-200 dark:bg-gray-700 animate-pulse ${className}`} />
      )}
      
      {/* Actual image */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        className={className}
        onError={handleError}
        onLoad={handleLoad}
        style={{ opacity: isLoading ? 0 : 1, transition: 'opacity 0.3s ease-in-out' }}
      />
    </div>
  );
}
