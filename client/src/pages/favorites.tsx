import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Podcast } from "@shared/schema";
import { Heart, Music, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import FloatingSymbols from "@/components/ui/floating-symbols";

export default function Favorites() {
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  
  // Fetch favorite podcasts
  const { 
    data: favoritePodcasts, 
    isLoading: isFavoritesLoading,
    refetch: refetchFavorites
  } = useQuery<Podcast[]>({
    queryKey: ['/api/favorites/podcasts'],
    enabled: !!user, // Only run query if user is logged in
  });
  
  // If still loading, show loading state
  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-4">
        <div className="flex items-center space-x-2">
          <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
          <span className="text-lg">{t("favorites.loading")}</span>
        </div>
      </main>
    );
  }
  
  const [, setLocation] = useLocation();
  
  // If no user is logged in, redirect to home
  if (!user && !isLoading) {
    setLocation("/");
    return null;
  }
  
  // Handle removing a podcast from favorites
  const removeFavorite = async (podcastId: number) => {
    try {
      const response = await fetch(`/api/favorites/podcasts/${podcastId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        toast({
          title: t("favorites.removeSuccess"),
          description: t("favorites.removeSuccessDescription"),
        });
        refetchFavorites();
      } else {
        throw new Error(t("favorites.removeError"));
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: t("favorites.removeError"),
        description: t("favorites.removeErrorDescription"),
      });
    }
  };
  
  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-amber-50">
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <main className="relative z-10 w-full py-20 px-4 md:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-8">
            <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30 mr-4">
              <Heart className="h-8 w-8 text-amber-400" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-center bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              {t("favorites.title")}
            </h1>
          </div>
          
          <Tabs defaultValue="podcasts" className="w-full">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-1 mb-8">
              <TabsTrigger value="podcasts" className="text-lg">
                <Music className="h-4 w-4 mr-2" />
                {t("favorites.podcasts")}
              </TabsTrigger>
              {/* Can add more tabs for other favorites categories later */}
            </TabsList>
            
            <TabsContent value="podcasts">
              <Card className="bg-black/60 backdrop-blur-xl border-amber-500/20">
                <CardHeader>
                  <CardTitle className="text-amber-200">{t("favorites.podcastsTitle")}</CardTitle>
                  <CardDescription className="text-amber-300/80">
                    {t("favorites.podcastsDescription")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isFavoritesLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-amber-500"></div>
                      <span className="ml-2 text-amber-300">{t("favorites.loadingPodcasts")}</span>
                    </div>
                  ) : favoritePodcasts && favoritePodcasts.length > 0 ? (
                    <div className="grid grid-cols-1 gap-6">
                      {favoritePodcasts.map((podcast) => (
                        <motion.div
                          key={podcast.id}
                          className="flex flex-col md:flex-row gap-6 bg-black/60 backdrop-blur-xl rounded-lg p-6 border border-amber-500/20 hover:border-amber-500/40 transition-all shadow-lg"
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.6 }}
                        >
                          <img
                            src={podcast.coverUrl || '/placeholder.svg'}
                            alt={podcast.title}
                            className="w-full md:w-40 h-40 object-cover rounded border border-amber-500/10 shadow-md"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                          <div className="flex-1 flex flex-col justify-between">
                            <div>
                              <h3 className="text-xl font-bold text-amber-100 mb-1">{podcast.title}</h3>
                              <div className="flex flex-wrap items-center gap-4 mb-2 text-amber-200/80 text-sm">
                                <span><b>{t('favorites.artist')}:</b> {podcast.artistName}</span>
                                <span><b>{t('favorites.genre')}:</b> {podcast.genre}</span>
                                <span><b>{t('favorites.duration')}:</b> {podcast.duration}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 mt-4">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => removeFavorite(podcast.id)}
                                className="bg-red-600 hover:bg-red-700 text-white"
                                title={t('favorites.remove')}
                              >
                                <X className="h-4 w-4 mr-1" /> {t('favorites.remove')}
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <div className="p-4 bg-amber-500/10 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                        <Heart className="h-10 w-10 text-amber-400/50" />
                      </div>
                      <h3 className="text-xl font-medium mb-2 text-amber-200">{t("favorites.noPodcasts")}</h3>
                      <p className="text-amber-300/70 max-w-md mx-auto">
                        {t("favorites.noPodcastsDescription")}
                      </p>
                      <Button 
                        onClick={() => setLocation('/podcasts')} 
                        className="mt-6 bg-amber-600 hover:bg-amber-700 text-white"
                      >
                        Browse Podcasts
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}