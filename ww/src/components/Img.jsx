import { useState } from 'react';

// Shows a photo. If the photo fails to load, shows a colourful placeholder instead.
export default function Img({ src, alt = '', className = '' }) {
  const [badSrc, setBadSrc] = useState(null);

  if (!src || badSrc === src) {
    return <div className={`img-fallback ${className}`} role="img" aria-label={alt} />;
  }
  return <img src={src} alt={alt} className={className} loading="lazy" onError={() => setBadSrc(src)} />;
}