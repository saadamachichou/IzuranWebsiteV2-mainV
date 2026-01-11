import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { ArrowLeft, Music, Globe, Link, Instagram, Facebook } from "lucide-react";
import { SoundCloudIcon, BandcampIcon, LinktreeIcon } from "@/components/icons/BrandIcons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Artist } from "@shared/schema.ts";
import { Helmet } from "react-helmet";

export default function ArtistDetailPage() {
  const params = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [artist, setArtist] = useState<Artist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.slug) {
      fetchArtist(params.slug);
    }
  }, [params.slug]);

  const fetchArtist = async (slug: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/artists/${slug}`);
      if (response.ok) {
        const data = await response.json();
        setArtist(data);
      } else if (response.status === 404) {
        setError("Artist not found");
        toast({
          title: "Artist not found",
          description: "The artist you're looking for doesn't exist",
          variant: "destructive",
        });
      } else {
        throw new Error("Failed to fetch artist");
      }
    } catch (error) {
      console.error('Error fetching artist:', error);
      setError("Failed to load artist details");
      toast({
        title: "Error",
        description: "Failed to load artist details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black pt-32">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-amber-300 text-lg">Loading artist...</div>
        </div>
      </div>
    );
  }

  if (error || !artist) {
    return (
      <div className="min-h-screen bg-black pt-32">
        <div className="max-w-4xl mx-auto px-8 py-16">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-amber-300 mb-4">Artist Not Found</h1>
            <p className="text-amber-200/60 mb-8">
              {error || "The artist you're looking for doesn't exist or has been removed."}
            </p>
            <Button 
              variant="outline" 
              onClick={() => setLocation('/artists')}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Artists
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{artist.name} - Artist | Izuran</title>
        <meta name="description" content={artist.description || `Discover ${artist.name} on Izuran`} />
      </Helmet>
      
      <div className="min-h-screen bg-black pt-32">
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <Button 
                variant="outline" 
                onClick={() => setLocation('/artists')}
                className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 mb-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Artists
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-12"
            >
              {/* Artist Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.3 }}
                className="relative space-y-6"
              >
                {/* Artist name and badge - positioned above the image */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center lg:text-left space-y-4"
                >
                  {/* Badge with better contrast */}
                  <Badge className="bg-amber-500/90 text-black px-6 py-3 text-sm font-bold shadow-lg border border-amber-300/50">
                    Electronic Artist
                  </Badge>
                  
                  {/* Artist name with improved typography and contrast */}
                  <div className="space-y-3">
                    <h1 className="text-4xl lg:text-5xl font-bold text-amber-200 leading-tight drop-shadow-lg">
                      {artist.name}
                    </h1>
                    <div className="h-1 w-32 bg-amber-400 rounded-full shadow-lg mx-auto lg:mx-0"></div>
                  </div>
                </motion.div>

                {/* Image without text overlay */}
                <Card className="bg-black border-amber-500/30 overflow-hidden hover:border-amber-500/50 transition-all duration-500">
                  <CardContent className="p-0">
                    <div className="aspect-[4/5] relative">
                      <motion.img
                        src={artist.image_Url || '/placeholder-artist.jpg'}
                        alt={artist.name}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05, rotate: 2 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder-artist.jpg';
                        }}
                      />
                      
                      {/* Subtle border overlay for visual enhancement */}
                      <div className="absolute inset-0 border-2 border-amber-500/20 rounded-lg pointer-events-none"></div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Artist Info */}
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Card className="bg-black/80 border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <h2 className="text-2xl font-bold text-amber-300 mb-6 flex items-center gap-3">
                        <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
                        About
                      </h2>
                      <p className="text-amber-200/90 leading-relaxed text-lg" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                        {artist.description || "No description available for this artist."}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>

                {/* Social Links */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <Card className="bg-black/80 border-amber-500/30 hover:border-amber-500/50 transition-all duration-300 backdrop-blur-sm">
                    <CardContent className="p-8">
                      <h2 className="text-2xl font-bold text-amber-300 mb-6 flex items-center gap-3">
                        <Globe className="w-6 h-6 text-amber-400" />
                        Connect with {artist.name}
                      </h2>
                      <div className="flex flex-wrap gap-4 justify-center">
                        {artist.facebook && (
                          <a
                            href={artist.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-16 h-16 bg-[#1877F2] rounded-xl flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl hover:shadow-[#1877F2]/30 transition-all duration-300"
                            aria-label={`${artist.name} on Facebook`}
                          >
                            <Facebook className="w-8 h-8 text-white" />
                          </a>
                        )}
                        {artist.instagram && (
                          <a
                            href={artist.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-16 h-16 bg-gradient-to-tr from-purple-500 via-pink-500 to-orange-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl hover:shadow-pink-500/30 transition-all duration-300"
                            aria-label={`${artist.name} on Instagram`}
                          >
                            <Instagram className="w-8 h-8 text-white" />
                          </a>
                        )}
                        {artist.soundcloud && (
                          <a
                            href={artist.soundcloud}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-16 h-16 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl hover:shadow-orange-500/30 transition-all duration-300"
                            aria-label={`${artist.name} on SoundCloud`}
                          >
                            <SoundCloudIcon className="w-8 h-8 text-white" />
                          </a>
                        )}
                        {artist.bandcamp && (
                          <a
                            href={artist.bandcamp}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-16 h-16 bg-[#629aa9] rounded-xl flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl hover:shadow-[#629aa9]/30 transition-all duration-300"
                            aria-label={`${artist.name} on Bandcamp`}
                          >
                            <BandcampIcon className="w-8 h-8 text-white" />
                          </a>
                        )}
                        {artist.linktree && (
                          <a
                            href={artist.linktree}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-16 h-16 bg-[#39e09b] rounded-xl flex items-center justify-center shadow-lg hover:scale-110 hover:shadow-xl hover:shadow-[#39e09b]/30 transition-all duration-300"
                            aria-label={`${artist.name} on Linktree`}
                          >
                            <LinktreeIcon className="w-8 h-8 text-white" />
                          </a>
                        )}
                      </div>
                      {!artist.facebook && !artist.instagram && !artist.soundcloud && !artist.bandcamp && !artist.linktree && (
                        <p className="text-amber-200/60 text-center mt-4">No social links available for this artist.</p>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}