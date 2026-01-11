import { useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Loader2, ArrowLeft } from "lucide-react";
import { api } from "@/lib/api";
import { Podcast } from "@shared/schema";
import Navbar from "@/components/layout/Navbar";
import SoundCloudPlayer from "@/components/ui/SoundCloudPlayer";

// Helper function to process embed HTML and add encrypted-media permission and disable autoplay
const processEmbedHtml = (html: string, title: string = 'SoundCloud Player'): string => {
  // Check if it's a SoundCloud embed and add encrypted-media to allow attribute
  if (html.includes('soundcloud.com') || html.includes('w.soundcloud.com')) {
    // Disable autoplay in SoundCloud embed URLs
    html = html.replace(/auto_play=true/gi, 'auto_play=false');
    html = html.replace(/auto_play=1/gi, 'auto_play=0');
    
    // Add encrypted-media to existing allow attributes
    html = html.replace(/allow=["']([^"']*?)["']/gi, (match, currentAllow) => {
      if (!currentAllow.includes('encrypted-media')) {
        return `allow="${currentAllow}; encrypted-media"`;
      }
      return match;
    });
    // If no allow attribute exists, add one
    if (!html.includes('allow=')) {
      html = html.replace(/<iframe/gi, '<iframe allow="encrypted-media"');
    }
    // Add loading="lazy" if it doesn't exist
    if (!html.includes('loading=')) {
      html = html.replace(/<iframe/gi, '<iframe loading="lazy"');
    }
    // Add referrerPolicy for better cookie handling
    if (!html.includes('referrerPolicy=')) {
      html = html.replace(/<iframe/gi, '<iframe referrerPolicy="no-referrer-when-downgrade"');
    }
    // Add title attribute if it doesn't exist
    if (!html.includes('title=')) {
      html = html.replace(/<iframe/gi, `<iframe title="${title}"`);
    } else {
      // Replace existing title if it's empty or generic
      html = html.replace(/title=["'][^"']*["']/gi, `title="${title}"`);
    }
  }
  return html;
};

export default function SinglePodcastPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const slug = params.slug;
  const embedRef = useRef<HTMLDivElement>(null);

  const { data: podcast, isLoading, error } = useQuery<Podcast>({
    queryKey: [`/api/podcasts/${slug}`],
    enabled: !!slug, // Only fetch if slug is available
  });

  const handleBackToPodcasts = () => {
    setLocation('/podcasts');
  };

  useEffect(() => {
    if (error) {
      console.error("Error fetching podcast:", error);
    }
  }, [error]);

  // Handle iframes after render to ensure encrypted-media permission
  useEffect(() => {
    if (embedRef.current && podcast) {
      const iframes = embedRef.current.querySelectorAll('iframe');
      iframes.forEach((iframe: HTMLIFrameElement) => {
        // Add proper permissions if it's a SoundCloud embed
        if (iframe.src.includes('soundcloud.com') || iframe.src.includes('w.soundcloud.com')) {
          const currentAllow = iframe.getAttribute('allow') || '';
          if (!currentAllow.includes('encrypted-media')) {
            iframe.setAttribute('allow', currentAllow ? `${currentAllow}; encrypted-media` : 'encrypted-media');
          }
          // Add loading="lazy" if it doesn't exist
          if (!iframe.hasAttribute('loading')) {
            iframe.setAttribute('loading', 'lazy');
          }
          // Add referrerPolicy for better cookie handling
          if (!iframe.hasAttribute('referrerPolicy')) {
            iframe.setAttribute('referrerPolicy', 'no-referrer-when-downgrade');
          }
          // Add title attribute if it doesn't exist
          if (!iframe.hasAttribute('title') || iframe.getAttribute('title') === '') {
            iframe.setAttribute('title', `SoundCloud Player: ${podcast.title}`);
          }
        }
      });
    }
  }, [podcast?.audioUrl, podcast?.title]);

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-amber-400" />
        </div>
      </>
    );
  }

  if (error || !podcast) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6">
          <h1 className="text-4xl font-bold text-amber-400 mb-4">Podcast Not Found</h1>
          <p className="text-lg text-gray-300 mb-8">The podcast you are looking for does not exist or has been removed.</p>
          <img src="/not-found-image.svg" alt="Not Found" className="w-64 h-auto mb-8" />
          {error && <p className="text-red-400 text-sm mt-4">Error: {error.message}</p>}
          
          {/* Back Button for Error State */}
          <button
            onClick={handleBackToPodcasts}
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 hover:border-amber-400/60 rounded-lg transition-all duration-300 font-medium hover:scale-105"
            aria-label="Back to Podcasts"
          >
            <ArrowLeft className="h-5 w-5" />
            Back to Podcasts
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{podcast.title} | Izuran Podcasts</title>
        <meta name="description" content={podcast.description} />
        {podcast.coverUrl && <meta property="og:image" content={podcast.coverUrl} />}
      </Helmet>
      <Navbar />
      <div className="min-h-screen bg-black text-white pt-32 pb-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold font-cinzel text-amber-300 mb-6 text-center">{podcast.title}</h1>
          
          {/* Back Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={handleBackToPodcasts}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/40 hover:border-amber-400/60 rounded-lg transition-all duration-300 font-medium hover:scale-105"
              aria-label="Back to Podcasts"
            >
              <ArrowLeft className="h-5 w-5" />
              Back to Podcasts
            </button>
          </div>
          
          {podcast.coverUrl && (
            <div className="mb-8 flex justify-center">
              <div className="w-96 h-96 rounded-lg overflow-hidden shadow-lg border border-amber-500/20">
                <img 
                  src={podcast.coverUrl} 
                  alt={podcast.title} 
                  className="w-full h-full object-cover" 
                />
              </div>
            </div>
          )}
          <p className="text-sm md:text-base text-yellow-50 leading-relaxed mb-6 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{podcast.description}</p>

          {(() => {
            // Check if audioUrl contains embed code
            const isEmbedCode = podcast.audioUrl.includes('<iframe') || podcast.audioUrl.includes('<embed') || podcast.audioUrl.includes('<object');
            
            if (isEmbedCode) {
              // Process embed HTML to add encrypted-media permission
              const processedHtml = processEmbedHtml(podcast.audioUrl, `SoundCloud Player: ${podcast.title}`);
              
              return (
                <div 
                  ref={embedRef}
                  className="w-full bg-[#18181b] rounded-lg border border-amber-500/20 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: processedHtml }}
                />
              );
            } else if (podcast.title.toLowerCase().includes("breakoacoustique")) {
              // Special case for breakoacoustique
              return (
                <div>
                  <iframe
                    width="100%"
                    height="300"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay; encrypted-media"
                    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1334882632&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
                    title="Breakoacoustique"
                    className="rounded-lg border border-amber-500/20"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <div style={{
                    fontSize: 10,
                    color: "#cccccc",
                    lineBreak: "anywhere",
                    wordBreak: "normal",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontFamily: "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif",
                    fontWeight: 100
                  }}>
                    <a href="https://soundcloud.com/radiozora" title="radiOzora" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>radiOzora</a> · <a href="https://soundcloud.com/radiozora/breakoacoustique-quadrivium-records-presents" title="BREAKOACOUSTIQUE | Quadrivium Records Presents | 29/07/2022" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>BREAKOACOUSTIQUE | Quadrivium Records Presents | 29/07/2022</a>
                  </div>
                </div>
              );
            } else if (podcast.title.toLowerCase().includes("black phillip")) {
              // Special case for BLACK PHILLIP LIVE
              return (
                <div>
                  <iframe
                    width="100%"
                    height="300"
                    scrolling="no"
                    frameBorder="no"
                    allow="autoplay; encrypted-media"
                    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1961602567&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
                    title="BLACK PHILLIP LIVE"
                    className="rounded-lg border border-amber-500/20"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <div style={{
                    fontSize: 10,
                    color: "#cccccc",
                    lineBreak: "anywhere",
                    wordBreak: "normal",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontFamily: "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif",
                    fontWeight: 100
                  }}>
                    <a href="https://soundcloud.com/unity-community" title="Unity Community" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>Unity Community</a> · <a href="https://soundcloud.com/unity-community/black-phillip-live" title="BLACK PHILLIP LIVE" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>BLACK PHILLIP LIVE</a>
                  </div>
                </div>
              );
            } else if (podcast.title.toLowerCase().includes("hypnokrono")) {
              // Special case for hypnokrono with the provided embed code
              return (
                <div>
                  <iframe 
                    width="100%" 
                    height="166" 
                    scrolling="no" 
                    frameBorder="no" 
                    allow="autoplay; encrypted-media" 
                    allowFullScreen
                    loading="lazy"
                    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2058052332&color=%23ff5500&auto_play=true&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                    title="Hypnokrono @ Live Set Naturaíz"
                    className="rounded-lg border border-amber-500/20"
                    referrerPolicy="no-referrer-when-downgrade"
                  ></iframe>
                  <div style={{
                    fontSize: 10,
                    color: "#cccccc",
                    lineBreak: "anywhere",
                    wordBreak: "normal",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    fontFamily: "Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif",
                    fontWeight: 100
                  }}>
                    <a href="https://soundcloud.com/naturaiz" title="Naturaíz Records" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>Naturaíz Records</a> · <a href="https://soundcloud.com/naturaiz/hypnokrono-live-set-naturaiz" title="Hypnokrono @ Live Set Naturaíz" target="_blank" rel="noopener noreferrer" style={{ color: "#cccccc", textDecoration: "none" }}>Hypnokrono @ Live Set Naturaíz</a>
                  </div>
                </div>
              );
            } else {
              // Use SoundCloudPlayer for regular URLs
              return <SoundCloudPlayer url={podcast.audioUrl} height={300} />;
            }
          })()}

          <div className="text-amber-300/80 text-sm grid grid-cols-2 gap-4">
            <p><strong>Artist:</strong> {podcast.artistName}</p>
            <p><strong>Duration:</strong> {podcast.duration}</p>
            <p><strong>Genre:</strong> {podcast.genre}</p>
            <p><strong>Release Date:</strong> {new Date(podcast.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </>
  );
} 