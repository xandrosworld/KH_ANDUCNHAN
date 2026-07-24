import { useEffect, useState, type ImgHTMLAttributes } from 'react';

type ResilientImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & {
  src?: string | null;
  fallbackSrc: string;
};

export default function ResilientImage({
  src,
  fallbackSrc,
  alt = '',
  className = '',
  onError,
  ...props
}: ResilientImageProps) {
  const preferredSrc = typeof src === 'string' ? src.trim() : '';
  const [activeSrc, setActiveSrc] = useState(preferredSrc || fallbackSrc);
  const [unavailable, setUnavailable] = useState(false);

  useEffect(() => {
    setActiveSrc(preferredSrc || fallbackSrc);
    setUnavailable(false);
  }, [preferredSrc, fallbackSrc]);

  if (unavailable) {
    return (
      <span
        role="img"
        aria-label={alt}
        className={`${className} block bg-[#f3f0ef]`}
      />
    );
  }

  return (
    <img
      {...props}
      src={activeSrc}
      alt={alt}
      className={className}
      onError={(event) => {
        onError?.(event);
        if (activeSrc !== fallbackSrc) {
          setActiveSrc(fallbackSrc);
          return;
        }
        setUnavailable(true);
      }}
    />
  );
}
