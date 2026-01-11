import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Podcast } from "@shared/schema";
import { Waveform } from "@/components/ui/waveform";
import SoundCloudPlayer from "@/components/ui/SoundCloudPlayer";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface PodcastCardProps {
  podcast: Podcast;
}

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

export default function PodcastCard({ podcast }: PodcastCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isLoadingFavorite, setIsLoadingFavorite] = useState(false);
  const embedRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  // Handle iframes after render
  useEffect(() => {
    if (embedRef.current) {
      const iframes = embedRef.current.querySelectorAll('iframe');
      iframes.forEach((iframe: HTMLIFrameElement) => {
        // Add proper permissions and sandbox if it's a SoundCloud embed
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
        // Prevent iframe scroll events
        iframe.style.pointerEvents = 'none';
        iframe.addEventListener('load', () => {
          iframe.style.pointerEvents = 'auto';
        });
      });
    }
  }, [podcast.audioUrl, podcast.title]);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handlePause = () => {
    setIsPlaying(false);
  };

  // Check if podcast is favorited on component mount
  useEffect(() => {
    if (user) {
      checkFavoriteStatus();
    }
  }, [user, podcast.id]);

  const checkFavoriteStatus = async () => {
    try {
      const response = await fetch(`/api/favorites/podcasts/${podcast.id}/check`);
      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.isFavorited);
      }
    } catch (error) {
      console.error('Error checking favorite status:', error);
    }
  };

  const toggleFavorite = async () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to add podcasts to your favorites.",
        variant: "destructive",
      });
      return;
    }

    setIsLoadingFavorite(true);
    try {
      if (isFavorited) {
        // Remove from favorites
        const response = await fetch(`/api/favorites/podcasts/${podcast.id}`, {
          method: 'DELETE',
        });
        
        if (response.ok) {
          setIsFavorited(false);
          toast({
            title: "Removed from favorites",
            description: "Podcast removed from your favorites.",
          });
        } else {
          throw new Error('Failed to remove from favorites');
        }
      } else {
        // Add to favorites
        const response = await fetch(`/api/favorites/podcasts/${podcast.id}`, {
          method: 'POST',
        });
        
        if (response.ok) {
          setIsFavorited(true);
          toast({
            title: "Added to favorites",
            description: "Podcast added to your favorites!",
          });
        } else {
          throw new Error('Failed to add to favorites');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update favorites. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoadingFavorite(false);
    }
  };

  return (
    <motion.div 
      className={`glassmorphism rounded-lg p-6 transition-all border border-amber-500/20 hover:border-amber-500/40 glow-card ${isPlaying ? 'glow-border' : ''}`}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex flex-col md:flex-row gap-6">
        {podcast.coverUrl ? (
          <img 
            src={podcast.coverUrl}
            alt={podcast.title} 
            className="w-full md:w-48 h-48 object-cover rounded border border-amber-500/10" 
          />
        ) : (
          <div className="w-full md:w-48 h-48 bg-gradient-to-br from-amber-400 to-amber-600 rounded border border-amber-500/10 flex items-center justify-center">
            <span className="text-black font-bold">No Cover</span>
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-xl font-bold font-space text-white mb-2">{podcast.title}</h3>
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center">
              <span className="text-amber-200/70 mr-4">By {podcast.artistName}</span>
              <span className="text-amber-200/60">{podcast.duration} • {podcast.genre}</span>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFavorite}
              disabled={isLoadingFavorite}
              aria-label={isFavorited ? `Remove ${podcast.title} from favorites` : `Add ${podcast.title} to favorites`}
              className={`transition-all duration-200 ${
                isFavorited 
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10' 
                  : 'text-amber-200/70 hover:text-amber-300 hover:bg-amber-500/10'
              }`}
            >
              <Heart 
                className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} 
              />
            </Button>
          </div>
          <p className="text-sm md:text-base text-yellow-50 mb-4 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{podcast.description}</p>
          
          {/* Audio Player */}
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
                    onLoad={(e) => {
                      // Prevent iframe from causing scroll events
                      const iframe = e.currentTarget;
                      iframe.style.pointerEvents = 'none';
                      setTimeout(() => {
                        iframe.style.pointerEvents = 'auto';
                      }, 1000);
                    }}
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
                    onLoad={(e) => {
                      // Prevent iframe from causing scroll events
                      const iframe = e.currentTarget;
                      iframe.style.pointerEvents = 'none';
                      setTimeout(() => {
                        iframe.style.pointerEvents = 'auto';
                      }, 1000);
                    }}
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
                    src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/2058052332&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"
                    title="Hypnokrono @ Live Set Naturaíz"
                    className="rounded-lg border border-amber-500/20"
                    referrerPolicy="no-referrer-when-downgrade"
                    onLoad={(e) => {
                      // Prevent iframe from causing scroll events
                      const iframe = e.currentTarget;
                      iframe.style.pointerEvents = 'none';
                      setTimeout(() => {
                        iframe.style.pointerEvents = 'auto';
                      }, 1000);
                    }}
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
        </div>
      </div>
    </motion.div>
  );
}
