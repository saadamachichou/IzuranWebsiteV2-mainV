import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Artist } from "@shared/schema";
import { motion } from "framer-motion";
import { Instagram, ArrowRight } from "lucide-react";
import { SoundCloudIcon, BandcampIcon } from "@/components/icons/BrandIcons";
import { truncateText, DESCRIPTION_LIMIT } from "@/lib/text-utils";

export default function FeaturedArtists() {
  const [, setLocation] = useLocation();
  const { data: artists, isLoading, error } = useQuery<Artist[]>({
    queryKey: ['/api/artists'],
  });

  if (isLoading) {
    return (
      <section id="featured" className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Featured Artists</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="glassmorphism rounded-lg p-6 animate-pulse">
                <div className="w-full h-64 bg-amber-500/30 rounded mb-4" />
                <div className="h-6 bg-amber-500/30 rounded w-3/4 mb-2" />
                <div className="h-4 bg-amber-500/20 rounded w-full mb-4" />
                <div className="flex justify-between items-center">
                  <div className="h-4 bg-amber-400/30 rounded w-1/4" />
                  <div className="flex space-x-2">
                    <div className="h-4 w-4 bg-amber-500/30 rounded-full" />
                    <div className="h-4 w-4 bg-amber-500/30 rounded-full" />
                    <div className="h-4 w-4 bg-amber-500/30 rounded-full" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error || !artists) {
    return (
      <section id="featured" className="py-16 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold mb-12 text-center">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Featured Artists</span>
          </h2>
          <div className="glassmorphism rounded-lg p-8 text-center">
            <p className="text-amber-400 mb-4">Unable to load featured artists at this time.</p>
            <p className="text-gray-400">Please check back later.</p>
          </div>
        </div>
      </section>
    );
  }

  // Display up to 4 artists
  const featuredArtists = artists.slice(0, 4);

  return (
    <section id="featured" className="py-16 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.h2 
          className="text-3xl font-bold mb-12 text-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Featured Artists</span>
        </motion.h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-start">
          {featuredArtists.map((artist, index) => (
            <motion.div 
              key={artist.id}
              className="glassmorphism rounded-lg p-6 transition-all glow-card border border-amber-500/20 hover:border-amber-500/40 cursor-pointer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              onClick={() => setLocation(`/artists/${artist.slug || artist.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setLocation(`/artists/${artist.slug || artist.id}`); } }}
            >
              <div className="w-full h-64 overflow-hidden rounded mb-4 flex-shrink-0">
                <img
                  src={artist.image_Url || '/placeholder.svg'}
                  alt={artist.name}
                  className="w-full h-full object-cover object-center block"
                  loading="lazy"
                  onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                />
              </div>
              <h3 className="text-xl font-bold font-space text-white mb-2">{artist.name}</h3>
              <p className="text-sm md:text-base text-yellow-50 mb-4 line-clamp-3 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{truncateText(artist.description || "", DESCRIPTION_LIMIT)}</p>
              <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                <Link 
                  href={`/artists/${artist.slug || artist.id}`}
                  className="text-amber-400 hover:text-amber-200 transition-all flex items-center font-medium cursor-pointer"
                >
                  See profile <ArrowRight size={16} className="ml-1" />
                </Link>
                <div className="flex space-x-2">
                  {artist.instagram && (
                    <a href={artist.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-all" aria-label={`${artist.name} on Instagram`}>
                      <Instagram size={18} />
                    </a>
                  )}
                  {artist.soundcloud && (
                    <a href={artist.soundcloud} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-all" aria-label={`${artist.name} on SoundCloud`}>
                      <SoundCloudIcon size={18} />
                    </a>
                  )}
                  {artist.bandcamp && (
                    <a href={artist.bandcamp} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-400 transition-all" aria-label={`${artist.name} on Bandcamp`}>
                      <BandcampIcon size={18} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Link href="/artists" className="inline-block px-6 py-2 border border-amber-400 text-amber-400 rounded hover:bg-amber-400 hover:text-black transition-all glow-button">
            View All Artists
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
