import React, { useState, useEffect, useRef } from 'react';

interface SoundCloudPlayerProps {
  url: string;
  height?: number;
}

// Helper to check if a URL is a valid SoundCloud link
function isSoundCloudUrl(url: string) {
  return /^https?:\/\/(soundcloud\.com|snd\.sc)\//.test(url);
}

const SoundCloudPlayer: React.FC<SoundCloudPlayerProps> = ({ url, height = 300 }) => {
  const [shouldLoad, setShouldLoad] = useState(false);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Use Intersection Observer to lazy load iframe only when visible
  useEffect(() => {
    if (!containerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsIntersecting(true);
            // Small delay to improve bfcache compatibility
            setTimeout(() => setShouldLoad(true), 100);
            observer.disconnect();
          }
        });
      },
      { rootMargin: '50px' } // Start loading slightly before visible
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Handle bfcache restoration and cleanup
  useEffect(() => {
    const handleBfcacheRestore = () => {
      // When restored from bfcache, ensure iframe is properly loaded if it should be
      if (iframeRef.current && shouldLoad && !iframeRef.current.src) {
        const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&show_artwork=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true`;
        iframeRef.current.src = embedUrl;
      }
    };

    window.addEventListener('bfcacheRestore', handleBfcacheRestore);

    return () => {
      window.removeEventListener('bfcacheRestore', handleBfcacheRestore);
      // Only clean up iframe on actual unmount (not bfcache)
      // Don't clear src on bfcache as it will be preserved by the browser
    };
  }, [url, shouldLoad]);

  if (!isSoundCloudUrl(url)) {
    return <div className="text-red-400">Invalid SoundCloud URL</div>;
  }

  // SoundCloud widget embed URL with only visual=true for best compatibility
  const embedUrl = `https://w.soundcloud.com/player/?url=${encodeURIComponent(url)}&auto_play=false&show_artwork=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=true&visual=true`;

  return (
    <div 
      ref={containerRef}
      className="w-full bg-[#18181b] rounded-lg border border-amber-500/20 overflow-hidden" 
      style={{ minHeight: height }}
    >
      {shouldLoad ? (
        <iframe
          ref={iframeRef}
          width="100%"
          height={height}
          scrolling="no"
          frameBorder="no"
          allow="autoplay; encrypted-media"
          src={embedUrl}
          title="SoundCloud Player"
          className="rounded-lg"
          style={{ background: '#18181b' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      ) : (
        <div 
          className="w-full flex items-center justify-center text-amber-400/60"
          style={{ height: height }}
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-400 mx-auto mb-2"></div>
            <p className="text-sm">Loading player...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SoundCloudPlayer; 