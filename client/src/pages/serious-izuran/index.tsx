import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import ParticleField from '@/components/ui/particle-field';
import { Podcast } from '@shared/schema';
import PodcastCard from '@/components/podcast/PodcastCard';

export default function SeriousIzuran() {
  const [podcasts, setPodcasts] = useState<Podcast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchPodcasts();
  }, []);

  const fetchPodcasts = async () => {
    try {
      const response = await fetch('/api/podcasts');
      if (response.ok) {
        const data = await response.json();
        // Sort by displayOrder and createdAt
        const sortedPodcasts = data.sort((a: Podcast, b: Podcast) => {
          // Custom ordering: Ensure XianZai appears before Unity Gathering
          const aTitleLower = a.title.toLowerCase();
          const bTitleLower = b.title.toLowerCase();
          
          const aIsXianZai = aTitleLower.includes("xian") && 
                            (aTitleLower.includes("existance") || aTitleLower.includes("existence") || aTitleLower.includes("festival"));
          const bIsXianZai = bTitleLower.includes("xian") && 
                            (bTitleLower.includes("existance") || bTitleLower.includes("existence") || bTitleLower.includes("festival"));
          const aIsUnityGathering = aTitleLower.includes("unity") && 
                                   (aTitleLower.includes("breakoacoustique") || aTitleLower.includes("break") || aTitleLower.includes("gathering"));
          const bIsUnityGathering = bTitleLower.includes("unity") && 
                                   (bTitleLower.includes("breakoacoustique") || bTitleLower.includes("break") || bTitleLower.includes("gathering"));
          
          // If comparing XianZai with Unity Gathering, XianZai comes first (appears above)
          if (aIsXianZai && bIsUnityGathering) return -1;
          if (aIsUnityGathering && bIsXianZai) return 1;
          
          // Otherwise, use normal sorting
          if (a.displayOrder !== b.displayOrder) {
            return (a.displayOrder || 0) - (b.displayOrder || 0);
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        
        // Rearrange to ensure Unity Gathering appears in a different row (2-column grid)
        // Find indices of XianZai and Unity Gathering with very flexible matching
        let xianZaiIndex = -1;
        let unityGatheringIndex = -1;
        
        sortedPodcasts.forEach((p, index) => {
          const titleLower = p.title.toLowerCase();
          // Match XianZai - very flexible matching
          if (xianZaiIndex === -1 && 
              titleLower.includes("xian") &&
              (titleLower.includes("existance") || titleLower.includes("existence") || titleLower.includes("festival"))) {
            xianZaiIndex = index;
          }
          // Match Unity Gathering - very flexible matching
          if (unityGatheringIndex === -1 &&
              titleLower.includes("unity") &&
              (titleLower.includes("breakoacoustique") || titleLower.includes("break") || titleLower.includes("gathering"))) {
            unityGatheringIndex = index;
          }
        });
        
        // If both found, ensure Unity Gathering is at least 2 positions after XianZai
        if (xianZaiIndex !== -1 && unityGatheringIndex !== -1) {
          // In a 2-column grid: row 1 = [0,1], row 2 = [2,3], row 3 = [4,5], etc.
          // We need Unity Gathering to be at least 2 positions after XianZai to be in a different row
          const currentDistance = unityGatheringIndex - xianZaiIndex;
          
          if (currentDistance <= 1) {
            // Remove Unity Gathering from current position
            const unityGathering = sortedPodcasts.splice(unityGatheringIndex, 1)[0];
            
            // Calculate target index: at least 2 positions after XianZai
            // If Unity was before XianZai, xianZaiIndex is now reduced by 1
            const adjustedXianZaiIndex = unityGatheringIndex < xianZaiIndex ? xianZaiIndex - 1 : xianZaiIndex;
            const targetIndex = adjustedXianZaiIndex + 2;
            
            // Insert Unity Gathering at the target position
            sortedPodcasts.splice(Math.min(targetIndex, sortedPodcasts.length), 0, unityGathering);
          }
        }
        
        setPodcasts(sortedPodcasts);
      } else {
        setError('Failed to load podcasts');
      }
    } catch (err) {
      setError('An error occurred while loading podcasts');
      console.error('Error fetching podcasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPodcasts = podcasts.filter(podcast => {
    const matchesSearch = 
      podcast.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      podcast.artistName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });


  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-yellow-200">Loading podcasts...</p>
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
            onClick={fetchPodcasts}
            className="px-4 py-2 bg-yellow-600 text-black rounded-md hover:bg-yellow-500 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Izuran Series - Izuran</title>
        <meta name="description" content="Listen to Izuran's exclusive podcasts featuring interviews, music, and discussions about Amazigh culture and electronic music." />
      </Helmet>
      
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
            {/* Header - matching homepage style */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Izuran Series</span>
              </h2>
              <p 
                className="text-yellow-200/70 text-lg max-w-2xl mx-auto"
                style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
              >
                Dive into our collection of exclusive podcasts featuring interviews, music showcases, and deep discussions about Amazigh culture and electronic music.
              </p>
            </div>

            {/* Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="mb-8 max-w-md mx-auto"
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-amber-400/50" />
                <Input
                  placeholder="Search podcasts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black/60 border-amber-500/30 text-amber-200 placeholder:text-amber-400/50 focus:border-amber-500"
                />
              </div>
            </motion.div>

            {/* Podcasts List - matching homepage style */}
            {filteredPodcasts.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-yellow-200/70 text-lg">
                  {searchQuery ? "No podcasts found matching your search." : "No podcasts available at the moment."}
                </p>
                <p className="text-yellow-200/50 text-sm mt-2">
                  {searchQuery ? "Try adjusting your search terms." : "Check back later for new content!"}
                </p>
              </div>
            ) : (
              <div className="space-y-8">
                {filteredPodcasts.map((podcast) => (
                  <PodcastCard key={podcast.id} podcast={podcast} />
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}

