import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Podcast } from "@shared/schema";
import PodcastCard from "./PodcastCard";
import { motion } from "framer-motion";

export default function PodcastList({ limit = 0 }: { limit?: number }) {
  const { data: podcasts, isLoading, error } = useQuery<Podcast[]>({
    queryKey: ['/api/podcasts'],
  });

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[...Array(limit > 0 ? limit : 2)].map((_, i) => (
          <div key={i} className="glassmorphism rounded-lg p-6 animate-pulse border border-amber-500/20">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full md:w-48 h-48 bg-amber-600/30 rounded" />
              <div className="flex-1">
                <div className="h-6 bg-amber-600/30 rounded w-3/4 mb-2" />
                <div className="flex items-center mb-2">
                  <div className="h-4 bg-amber-600/20 rounded w-1/4 mr-4" />
                  <div className="h-4 bg-amber-600/20 rounded w-1/4" />
                </div>
                <div className="h-4 bg-amber-600/20 rounded w-full mb-4" />
                <div className="h-20 bg-amber-600/10 rounded w-full mt-8" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !podcasts) {
    return (
      <div className="glassmorphism rounded-lg p-8 text-center border border-amber-500/20">
        <p className="text-amber-400 mb-4">Unable to load podcasts at this time.</p>
        <p className="text-amber-200/60">Please check back later.</p>
      </div>
    );
  }

  // Limit number of podcasts if limit is provided
  const displayedPodcasts = limit > 0 ? podcasts.slice(0, limit) : podcasts;

  return (
    <>
      <div className="space-y-8">
        {displayedPodcasts.map((podcast) => (
          <PodcastCard key={podcast.id} podcast={podcast} />
        ))}
      </div>
      
      {limit > 0 && podcasts.length > limit && (
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
                          <Link href="/podcasts" className="inline-block px-6 py-2 border border-amber-500 text-amber-400 rounded hover:bg-amber-500 hover:text-black transition-all glow-button">
            View All Podcasts
          </Link>
        </motion.div>
      )}
    </>
  );
}
