import { useQuery } from "@tanstack/react-query";
import { Artist } from "@shared/schema";
import { motion } from "framer-motion";
import { Clock, Music, Instagram, Facebook } from "lucide-react";
import { SoundCloudIcon, BandcampIcon, LinktreeIcon } from "@/components/icons/BrandIcons";
import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";

interface LineupArtist {
  name: string;
  instagram?: string;
  time?: string;
  artistData?: Artist;
}

interface LineupDisplayProps {
  lineup: string;
  eventDate?: Date;
}

// Helper function to get fallback image URL based on artist name
const getFallbackImageUrl = (artistName: string): string | null => {
  // Normalize the name: lowercase, remove special chars for matching
  const nameNormalized = artistName.toLowerCase().replace(/[._-\s]/g, '');
  
  // Map artist names (normalized) to their image files
  const imageMap: Record<string, string> = {
    'aratri': '/uploads/artist_images/ARATRI.JPG',
    'blindox': '/uploads/artist_images/Blind-Ox.JPG',
    'xianzai': '/uploads/artist_images/XIANZAI.JPG',
    'breako': '/uploads/artist_images/BREAKOACOUSTIQUE.JPG',
    'breakacoustique': '/uploads/artist_images/BREAKOACOUSTIQUE.JPG',
    'breakoacoustique': '/uploads/artist_images/BREAKOACOUSTIQUE.JPG',
  };
  
  // Check exact normalized match first
  if (imageMap[nameNormalized]) {
    return imageMap[nameNormalized];
  }
  
  // Check if name contains any of the mapped keys
  for (const [key, imagePath] of Object.entries(imageMap)) {
    if (nameNormalized.includes(key) || key.includes(nameNormalized)) {
      return imagePath;
    }
  }
  
  // Also check original name with underscores/spaces for "blind_ox" and "blind-ox"
  const nameLower = artistName.toLowerCase();
  if (nameLower.includes('blind') && (nameLower.includes('ox') || nameLower.includes('0x'))) {
    return '/uploads/artist_images/Blind-Ox.JPG';
  }
  
  // Check for "break" variations
  if (nameLower.includes('breako') || nameLower.includes('break acoustique')) {
    return '/uploads/artist_images/BREAKOACOUSTIQUE.JPG';
  }
  
  return null;
};

export default function LineupDisplay({ lineup, eventDate }: LineupDisplayProps) {
  // Fetch all artists to match with lineup
  const { data: artists } = useQuery<Artist[]>({
    queryKey: ['/api/artists'],
  });

  // Parse lineup string to extract artist names, Instagram handles, and times
  const parseLineup = (lineupText: string): LineupArtist[] => {
    if (!lineupText) return [];

    // Split by comma and clean up
    const parts = lineupText.split(',').map(part => part.trim()).filter(Boolean);
    
    return parts.map(part => {
      // Extract time if present (format: HH:MM or HH:MM AM/PM)
      const timeMatch = part.match(/\b(\d{1,2}:\d{2}(?:\s?[AP]M)?)\b/i);
      const time = timeMatch ? timeMatch[1] : undefined;
      
      // Remove time from part
      let partWithoutTime = part.replace(/\b\d{1,2}:\d{2}(?:\s?[AP]M)?\b/gi, '').trim();
      
      // Extract Instagram handle if present (format: @username)
      const instagramMatch = partWithoutTime.match(/@([a-zA-Z0-9._]+)/);
      const instagram = instagramMatch ? instagramMatch[1] : undefined;
      
      // Remove @ symbol and extract name
      let name = partWithoutTime.replace(/@/g, '').trim();
      
      // Normalize common variations
      // Replace underscores with spaces for matching (but keep original for display)
      const normalizedName = name.replace(/_/g, ' ').trim();
      
      // Try to match with artist from database
      const artistData = artists?.find(artist => {
        const artistNameLower = artist.name.toLowerCase().replace(/[🜃🕯️🇲🇦\-]/g, '').trim();
        const artistSlugLower = artist.slug.toLowerCase();
        const partLower = name.toLowerCase();
        const normalizedLower = normalizedName.toLowerCase();
        
        // Check Instagram handle match first (most reliable)
        if (instagram && artist.instagram) {
          const artistInsta = artist.instagram.toLowerCase().replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/$/, '');
          if (artistInsta === instagram.toLowerCase() || artistInsta.includes(instagram.toLowerCase())) {
            return true;
          }
        }
        
        // Enhanced matching for various name formats
        // Exact match (case-insensitive)
        if (artistNameLower === partLower || artistNameLower === normalizedLower) return true;
        if (artistSlugLower === partLower || artistSlugLower === normalizedLower) return true;
        
        // Partial match - check if name contains or is contained in artist name
        if (artistNameLower.includes(partLower) || partLower.includes(artistNameLower)) return true;
        if (artistNameLower.includes(normalizedLower) || normalizedLower.includes(artistNameLower)) return true;
        
        // Slug-based matching (remove dashes/underscores for comparison)
        const slugNormalized = artistSlugLower.replace(/[-_]/g, '');
        const nameNormalized = partLower.replace(/[._]/g, '');
        if (slugNormalized === nameNormalized) return true;
        if (slugNormalized.includes(nameNormalized) || nameNormalized.includes(slugNormalized)) return true;
        
        // Special handling for all-caps names (PSYROOT, SKO, etc.)
        if (name === name.toUpperCase()) {
          const artistNameUpper = artist.name.toUpperCase();
          if (artistNameUpper.includes(name) || artist.name.toUpperCase().replace(/[^A-Z0-9]/g, '') === name.replace(/[^A-Z0-9]/g, '')) {
            return true;
          }
        }
        
        return false;
      });

      return {
        name: name,
        instagram,
        time,
        artistData,
      };
    });
  };

  const lineupArtists = parseLineup(lineup);

  if (lineupArtists.length === 0) {
    return (
      <p className="text-sm md:text-base text-amber-100/80 whitespace-pre-line" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
        Lineup to be announced
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {lineupArtists.map((lineupArtist, index) => {
        const ArtistCard = ({ lineupArtist, index }: { lineupArtist: LineupArtist; index: number }) => {
          const [imageError, setImageError] = useState(false);
          const artist = lineupArtist.artistData;
          const displayName = artist?.name || lineupArtist.name;
          // Try artist image from database first, then fallback to mapped images
          const imageUrl = artist?.image_Url || getFallbackImageUrl(lineupArtist.name);
          const shouldShowImage = imageUrl && !imageError;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="bg-black/40 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Artist Image - Larger and more prominent */}
                    <div className="flex-shrink-0">
                      {shouldShowImage ? (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden border-2 border-amber-500/40 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/10">
                          <img
                            src={imageUrl}
                            alt={displayName}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-amber-500/20 to-purple-500/20 border-2 border-amber-500/40 shadow-lg shadow-amber-500/20 ring-2 ring-amber-500/10 flex items-center justify-center">
                          <Music className="w-10 h-10 sm:w-12 sm:h-12 text-amber-400/50" />
                        </div>
                      )}
                    </div>

                  {/* Artist Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 
                          className="font-semibold text-amber-200 text-lg mb-1"
                          style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                        >
                          {displayName}
                        </h4>
                        {lineupArtist.time && (
                          <div className="flex items-center gap-1 text-amber-200/70 text-sm">
                            <Clock className="w-3 h-3" />
                            <span style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                              {lineupArtist.time}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Social Media Links */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {artist?.instagram && (
                        <a
                          href={artist.instagram}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-200"
                          aria-label={`${displayName} Instagram`}
                        >
                          <Instagram className="w-4 h-4 text-amber-300 hover:text-amber-200" />
                        </a>
                      )}
                      {artist?.soundcloud && (
                        <a
                          href={artist.soundcloud}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-200"
                          aria-label={`${displayName} SoundCloud`}
                        >
                          <SoundCloudIcon className="w-4 h-4 text-amber-300 hover:text-amber-200" />
                        </a>
                      )}
                      {artist?.bandcamp && (
                        <a
                          href={artist.bandcamp}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-200"
                          aria-label={`${displayName} Bandcamp`}
                        >
                          <BandcampIcon className="w-4 h-4 text-amber-300 hover:text-amber-200" />
                        </a>
                      )}
                      {artist?.facebook && (
                        <a
                          href={artist.facebook}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-200"
                          aria-label={`${displayName} Facebook`}
                        >
                          <Facebook className="w-4 h-4 text-amber-300 hover:text-amber-200" />
                        </a>
                      )}
                      {artist?.linktree && (
                        <a
                          href={artist.linktree}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-200"
                          aria-label={`${displayName} Linktree`}
                        >
                          <LinktreeIcon className="w-4 h-4 text-amber-300 hover:text-amber-200" />
                        </a>
                      )}
                      {/* Fallback: If no artist data but has Instagram handle */}
                      {!artist && lineupArtist.instagram && (
                        <a
                          href={`https://instagram.com/${lineupArtist.instagram}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-black/40 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-500/50 transition-all duration-200"
                          aria-label={`${displayName} Instagram`}
                        >
                          <Instagram className="w-4 h-4 text-amber-300 hover:text-amber-200" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
          );
        };
        
        return <ArtistCard key={`artist-${index}`} lineupArtist={lineupArtist} index={index} />;
      })}
    </div>
  );
}

