import { Helmet } from "react-helmet";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Artist } from "@shared/schema";
import { motion } from "framer-motion";
import { Instagram, ArrowRight, Search, Facebook } from "lucide-react";
import { SoundCloudIcon, BandcampIcon } from "@/components/icons/BrandIcons";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { truncateText, DESCRIPTION_LIMIT } from "@/lib/text-utils";

export default function Artists() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedDescriptions, setExpandedDescriptions] = useState<Record<string, boolean>>({});
  
  const { data: artists, isLoading, error } = useQuery<Artist[]>({
    queryKey: ['/api/artists'],
  });

  // Filter artists based on search query
  const filteredArtists = artists?.filter(artist => 
    artist.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    artist.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleDescription = (artistId: string) => {
    setExpandedDescriptions(prev => ({
      ...prev,
      [artistId]: !prev[artistId]
    }));
  };

  return (
    <>
      <Helmet>
        <title>Artists - Izuran</title>
        <meta name="description" content="Discover the talented artists of Izuran, blending Amazigh culture with electronic and psychedelic sounds." />
      </Helmet>
      
      <div className="bg-black min-h-screen">
        <div className="mt-32 pb-8 bg-gradient-to-b from-amber-500/10 to-transparent">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Our Artists</span>
              </h1>
              <p className="text-lg max-w-3xl mx-auto text-gray-300" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                Meet the visionary artists of Izuran, each bringing their unique sonic explorations and mystical influences.
              </p>
            </motion.div>
          </div>
        </div>

        <main className="py-8">
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="mb-12 max-w-md mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400" size={18} />
                <Input
                  type="text"
                  placeholder="Search artists..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-black bg-opacity-50 border-amber-500 text-white placeholder:text-amber-200/60 focus:border-amber-400 focus:ring-amber-400"
                />
              </div>
            </motion.div>
            
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="glassmorphism rounded-lg p-6 animate-pulse border border-amber-500/20">
                    <div className="w-full h-64 bg-amber-600/30 rounded mb-4" />
                    <div className="h-6 bg-amber-600/30 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-amber-600/20 rounded w-full mb-4" />
                    <div className="flex justify-between items-center">
                      <div className="h-4 bg-amber-500/30 rounded w-1/4" />
                      <div className="flex space-x-2">
                        <div className="h-4 w-4 bg-amber-600/30 rounded-full" />
                        <div className="h-4 w-4 bg-amber-600/30 rounded-full" />
                        <div className="h-4 w-4 bg-amber-600/30 rounded-full" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="glassmorphism rounded-lg p-8 text-center border border-amber-500/20">
                <p className="text-amber-400 mb-4">Unable to load artists at this time.</p>
                <p className="text-gray-400">Please check back later.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredArtists && filteredArtists.length > 0 ? (
                  filteredArtists.map((artist, index) => (
                    <motion.div 
                      key={artist.id}
                      className="glassmorphism rounded-lg p-6 transition-all glow-card"
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                    >
                      <img 
                        src={artist.image_Url || '/placeholder-artist.jpg'} 
                        alt={artist.name} 
                        className="w-full h-80 object-cover rounded mb-4"
                        onError={(e) => {
                          console.error('Image failed to load:', artist.image_Url);
                          e.currentTarget.src = '/placeholder-artist.jpg';
                        }}
                      />
                      <h3 className="text-xl font-bold font-space text-white mb-2">{artist.name}</h3>
                      <div className="text-amber-200/80 mb-4">
                        <p className="line-clamp-3" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                          {expandedDescriptions[String(artist.id)] 
                            ? artist.description 
                            : truncateText(artist.description || "", DESCRIPTION_LIMIT)}
                        </p>
                        {artist.description && artist.description.length > DESCRIPTION_LIMIT && (
                          <button
                            onClick={() => toggleDescription(String(artist.id))}
                            className="text-amber-400 hover:text-amber-300 text-sm mt-1 transition-colors"
                            style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                          >
                            {expandedDescriptions[String(artist.id)] ? "Show less" : "Read more"}
                          </button>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <Link href={`/artists/${artist.id}`} className="text-amber-400 hover:text-amber-300 transition-all flex items-center font-medium">
                          See profile <ArrowRight size={16} className="ml-1" />
                        </Link>
                        <div className="flex space-x-2">
                          {artist.instagram && (
                            <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-pink-500 transition-all" aria-label={`${artist.name} on Instagram`}>
                              <Instagram size={18} />
                            </a>
                          )}
                          {artist.soundcloud && (
                            <a href={artist.soundcloud} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-orange-500 transition-all" aria-label={`${artist.name} on SoundCloud`}>
                              <SoundCloudIcon size={18} />
                            </a>
                          )}
                          {artist.bandcamp && (
                            <a href={artist.bandcamp} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-cyan-400 transition-all" aria-label={`${artist.name} on Bandcamp`}>
                              <BandcampIcon size={18} />
                            </a>
                          )}
                          {artist.facebook && (
                            <a href={artist.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-600 transition-all" aria-label={`${artist.name} on Facebook`}>
                              <Facebook size={18} />
                            </a>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full glassmorphism rounded-lg p-8 text-center border border-amber-500/20">
                    <p className="text-amber-400 mb-4">No artists found matching your search.</p>
                    <p className="text-amber-200/60">Try a different search term or browse all artists.</p>
                  </div>
                )}
              </div>
            )}
          </section>
        </main>
      </div>
    </>
  );
}
