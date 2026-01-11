import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Radio } from 'lucide-react';
import ParticleField from '@/components/ui/particle-field';

interface Stream {
  id: number;
  title: string;
  twitchChannelName?: string;
  iframeCode?: string;
  description?: string;
  displayOrder: number;
  isActive: boolean;
}

export default function Streams() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStreams();
  }, []);

  const fetchStreams = async () => {
    try {
      const response = await fetch('/api/streams', {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        // Filter only active streams and sort by displayOrder
        const activeStreams = data
          .filter((stream: Stream) => stream.isActive)
          .sort((a: Stream, b: Stream) => a.displayOrder - b.displayOrder);
        setStreams(activeStreams);
      } else {
        setError('Failed to load streams');
      }
    } catch (err) {
      setError('An error occurred while loading streams');
      console.error('Error fetching streams:', err);
    } finally {
      setLoading(false);
    }
  };

  // Get the current domain for Twitch embed
  const getDomain = () => {
    if (typeof window !== 'undefined') {
      return window.location.hostname;
    }
    return 'localhost';
  };

  // Update parent domain in iframe code
  const updateIframeDomain = (iframeCode: string): string => {
    if (!iframeCode) return iframeCode;
    const currentDomain = getDomain();
    return iframeCode.replace(
      /parent=([^"&\s]+)/g,
      `parent=${currentDomain}`
    );
  };

  // Render stream embed
  const renderStreamEmbed = (stream: Stream) => {
    if (stream.iframeCode) {
      // Render iframe code directly with consistent aspect ratio
      const updatedIframe = updateIframeDomain(stream.iframeCode);
      return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%', minHeight: '400px' }}>
          <div 
            className="absolute inset-0 flex items-center justify-center"
            dangerouslySetInnerHTML={{ __html: updatedIframe }}
          />
        </div>
      );
    } else if (stream.twitchChannelName) {
      // Render channel-based embed
      return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%', minHeight: '400px' }}>
          <iframe
            src={`https://player.twitch.tv/?channel=${stream.twitchChannelName}&parent=${getDomain()}&muted=false`}
            height="100%"
            width="100%"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full rounded-lg"
          />
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-200">Loading streams...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error}</p>
          <button
            onClick={fetchStreams}
            className="px-4 py-2 bg-yellow-600 text-black rounded-md hover:bg-yellow-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>

      <div className="relative z-10 pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Radio className="h-8 w-8 text-yellow-400" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-yellow-200 to-yellow-400 bg-clip-text text-transparent">
                Live Streams
              </h1>
            </div>
            <p 
              className="text-yellow-200/70 text-lg max-w-2xl mx-auto"
              style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
            >
              Watch our artists live on Twitch
            </p>
          </div>

          {/* Streams Grid */}
          {streams.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-yellow-200/70 text-lg">No active streams at the moment.</p>
              <p className="text-yellow-200/50 text-sm mt-2">Check back later for live content!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {streams.map((stream, index) => (
                <motion.div
                  key={stream.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className="bg-black/60 border border-yellow-400/30 rounded-lg overflow-hidden backdrop-blur-xl hover:border-yellow-400/50 transition-all duration-300 h-full flex flex-col"
                >
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 
                      className="text-xl font-semibold text-yellow-200 mb-2 font-tahoma"
                      style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                    >
                      {stream.title}
                    </h3>
                    {stream.description && (
                      <p 
                        className="text-yellow-200/70 text-sm mb-4 line-clamp-2"
                        style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                      >
                        {stream.description}
                      </p>
                    )}
                  </div>
                  <div className="w-full flex-shrink-0">
                    {renderStreamEmbed(stream)}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

