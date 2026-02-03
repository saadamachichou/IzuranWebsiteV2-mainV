import { useState } from "react";
import { motion } from "framer-motion";
import { Music, ArrowLeft, RotateCcw, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ParticleField from "@/components/ui/particle-field";
import { useLocation } from "wouter";

interface Release {
  id: string;
  title: string;
  artist: string;
  type: 'album' | 'ep' | 'single' | 'compilation';
  releaseDate: string;
  genre: string;
  description: string;
  bandcampUrl: string;
  embedCode: string;
  coverArt: string;
  tracks: Track[];
}

interface Track {
  id: string;
  title: string;
  duration: string;
  bandcampUrl: string;
}

export default function ReleasesPage() {
  const [, setLocation] = useLocation();
  
  const handleReload = () => {
    // Hard reload - bypass cache and reload all resources
    // Method 1: Try reload with forceReload parameter
    try {
      window.location.reload(true);
    } catch (e) {
      // Method 2: Force reload by setting location with timestamp
      const url = new URL(window.location.href);
      url.searchParams.set('_t', Date.now().toString());
      window.location.href = url.toString();
    }
  };
  
  const [releases, setReleases] = useState<Release[]>([
    {
      id: "1",
      title: "EP - Son of Sands",
      artist: "Dahula",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic",
      description: "A mystical journey through desert soundscapes and ancient rhythms.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-son-of-sands",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=3453659420/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-son-of-sands">EP - Son of Sands de Dahula</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "2",
      title: "EP - Hiranyagarbha: Primordial Pulse",
      artist: "KalimbAwa & Appa",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic",
      description: "A primordial exploration of sound and rhythm from the cosmic egg.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-hiranyagarbha-primordial-pulse",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=965419212/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-hiranyagarbha-primordial-pulse">EP - Hiranyagarbha: Primordial Pulse de KalimbAwa &amp; Appa</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "3",
      title: "VA-Cradle of Aeons",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A mystical journey through ancient aeons and cosmic soundscapes.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-cradle-of-aeons",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=1221416351/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/va-cradle-of-aeons">VA-Cradle of Aeons de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "4",
      title: "VA-Catafalque",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A compilation of dark and mystical electronic music from the depths of consciousness.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-catafalque",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2366517237/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" allow="autoplay" seamless><a href="https://izuranrecords.bandcamp.com/album/va-catafalque">VA-Catafalque de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "5",
      title: "EP - Echoes of the Infinite",
      artist: "Chilllight",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic / Ambient",
      description: "A journey through infinite sonic landscapes and ethereal soundscapes.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-echoes-of-the-infinite",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=3779744460/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" allow="autoplay" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-echoes-of-the-infinite">EP - Echoes of the Infinite de Chilllight</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "6",
      title: "EP - Shuma Gore",
      artist: "Cranium Drill",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic / Industrial",
      description: "Dark industrial rhythms and mechanical soundscapes from the depths.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-shuma-gore",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2727385677/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" allow="autoplay" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-shuma-gore">EP - Shuma Gore de Cranium Drill</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "7",
      title: "VA-The Arkhetupon Dialectic",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A philosophical exploration through sound and rhythm.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-the-arkhetupon-dialectic",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=793235286/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" allow="autoplay" seamless><a href="https://izuranrecords.bandcamp.com/album/va-the-arkhetupon-dialectic">VA-The Arkhetupon Dialectic de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "8",
      title: "VA-Hymns of Kemet",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "Ancient Egyptian-inspired electronic hymns and sacred soundscapes.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-hymns-of-kemet",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2893629425/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" allow="autoplay" seamless><a href="https://izuranrecords.bandcamp.com/album/va-hymns-of-kemet">VA-Hymns of Kemet de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "9",
      title: "VA-CATHARSIS",
      artist: "Izuran Records",
      type: "compilation",
      releaseDate: "2024",
      genre: "Various Artists",
      description: "A transformative journey through cathartic electronic experiences.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/va-catharsis",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=2900729510/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" allow="autoplay" seamless><a href="https://izuranrecords.bandcamp.com/album/va-catharsis">VA-CATHARSIS de Izuran Records</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "10",
      title: "EP - Sunken Omen",
      artist: "Symbiotik",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic",
      description: "Deep and immersive electronic soundscapes from Symbiotik.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-sunken-omen",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=3848567182/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-sunken-omen">EP - Sunken Omen by Symbiotik</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "11",
      title: "EP - Baphomet",
      artist: "Haniba & Friends",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic",
      description: "Mystical and ritualistic electronic explorations.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-baphomet",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=1498184137/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-baphomet">EP - Baphomet by Haniba &amp; Friends</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    },
    {
      id: "12",
      title: "EP - Atavistic Echoes",
      artist: "J-MRGL",
      type: "ep",
      releaseDate: "2024",
      genre: "Electronic",
      description: "Primordial echoes and ancient rhythms in electronic form.",
      bandcampUrl: "https://izuranrecords.bandcamp.com/album/ep-atavistic-echoes",
      embedCode: `<iframe style="border: 0; width: 350px; height: 470px;" src="https://bandcamp.com/EmbeddedPlayer/album=1462298002/size=large/bgcol=333333/linkcol=e99708/tracklist=false/transparent=true/" seamless><a href="https://izuranrecords.bandcamp.com/album/ep-atavistic-echoes">EP - Atavistic Echoes by J-MRGL</a></iframe>`,
      coverArt: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=80",
      tracks: []
    }
  ]);
  
  const [filter, setFilter] = useState<'all' | 'ep' | 'va'>('all');
  
  // Filter releases based on selected filter
  const filteredReleases = releases.filter((release) => {
    if (filter === 'all') return true;
    if (filter === 'ep') return release.type === 'ep';
    if (filter === 'va') return release.type === 'compilation';
    return true;
  });

  // Show newest releases (Sunken Omen, Baphomet, Atavistic Echoes) at the top
  const TOP_RELEASE_IDS = ["10", "11", "12"];
  const sortedReleases = [
    ...filteredReleases.filter((r) => TOP_RELEASE_IDS.includes(r.id)),
    ...filteredReleases.filter((r) => !TOP_RELEASE_IDS.includes(r.id)),
  ];

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto w-full">
                     {/* Header */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6 }}
             className="mb-12"
           >
             {/* Back Button and Reload Button */}
             <div className="mb-6 flex gap-3">
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => setLocation("/")}
                 className="text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 group"
               >
                 <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform duration-300" />
                 Back to Home
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={handleReload}
                 className="text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 border border-amber-500/30 hover:border-amber-400/50 transition-all duration-300 group"
               >
                 <RotateCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-300" />
                 Reload
               </Button>
             </div>
             
             <div className="space-y-4 sm:space-y-6">
               <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center sm:text-left">
                 <div className="p-3 sm:p-4 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-2xl border border-amber-500/30">
                   <Music className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400" />
                 </div>
                 <div className="max-w-full">
                   <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-amber-200 via-amber-300 to-yellow-400 bg-clip-text text-transparent tracking-tight mb-2 sm:mb-3 leading-tight">
                     Izuran Records
                   </h1>
                   <p className="text-amber-200/80 text-lg sm:text-xl font-medium max-w-2xl" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                     Discover the dark and mystical electronic music from Izuran Records
                   </p>
                 </div>
               </div>
             </div>
           </motion.div>

           {/* Filter Buttons */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.2 }}
             className="mb-8"
           >
             <div className="flex flex-wrap items-center gap-3 justify-center">
               <div className="flex items-center gap-2 text-amber-300/80">
                 <Filter className="w-4 h-4" />
                 <span className="text-sm font-medium">Filter:</span>
               </div>
               <Button
                 variant={filter === 'all' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setFilter('all')}
                 className={
                   filter === 'all'
                     ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                     : "text-amber-300/70 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/30"
                 }
               >
                 All
               </Button>
               <Button
                 variant={filter === 'ep' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setFilter('ep')}
                 className={
                   filter === 'ep'
                     ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                     : "text-amber-300/70 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/30"
                 }
               >
                 EP
               </Button>
               <Button
                 variant={filter === 'va' ? 'default' : 'outline'}
                 size="sm"
                 onClick={() => setFilter('va')}
                 className={
                   filter === 'va'
                     ? "bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30"
                     : "text-amber-300/70 hover:text-amber-300 hover:bg-amber-500/10 border-amber-500/30"
                 }
               >
                 VA
               </Button>
               <div className="ml-2 text-amber-300/60 text-sm">
                 ({sortedReleases.length} {sortedReleases.length === 1 ? 'release' : 'releases'})
               </div>
             </div>
           </motion.div>

           {/* Releases Grid */}
           <motion.div
             initial={{ opacity: 0, y: 20 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ duration: 0.6, delay: 0.3 }}
             className="releases-grid"
           >
             {sortedReleases.map((release) => (
               <Card key={release.id} className="releases-card group bg-gradient-to-br from-black/80 to-amber-500/10 border-amber-500/40 hover:border-amber-400/60 hover:shadow-2xl hover:shadow-amber-500/20 transition-all duration-500 overflow-hidden transform hover:scale-[1.02]">
                 <CardHeader className="pb-3 px-4 pt-4">
                   <CardTitle className="text-amber-100 text-lg font-bold text-center leading-tight" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                     {release.title}
                   </CardTitle>
                   <div className="flex items-center justify-center gap-2 mt-2">
                     <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-300 rounded-full border border-amber-500/30">
                       {release.type}
                     </span>
                     <span className="text-xs text-amber-400/60">
                       {release.artist}
                     </span>
                   </div>
                 </CardHeader>
                 
                <CardContent className="px-4 pb-4">
                  {/* Bandcamp Embed */}
                  <div className="releases-embed bg-gradient-to-br from-black/40 to-amber-500/5 rounded-xl p-4 border border-amber-500/30 shadow-inner">
                    <div className="w-full flex justify-center">
                      <iframe
                        style={{ border: 0, width: '350px', height: '470px' }}
                        src={release.embedCode.match(/src="([^"]+)"/)?.[1] || ''}
                        allow="autoplay; fullscreen"
                        sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                        loading="lazy"
                        title={`${release.title} by ${release.artist}`}
                      />
                    </div>
                  </div>
                  
                  {/* Fallback Button */}
                  <div className="mt-4 flex justify-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(release.bandcampUrl, '_blank')}
                      className="text-amber-300 hover:text-amber-100 hover:bg-amber-500/20 border-amber-500/40 hover:border-amber-400/60 transition-all duration-300"
                    >
                      <Music className="w-4 h-4 mr-2" />
                      Listen on Bandcamp
                    </Button>
                  </div>
                </CardContent>
               </Card>
             ))}
           </motion.div>
        </div>
      </div>
    </div>
  );
}
