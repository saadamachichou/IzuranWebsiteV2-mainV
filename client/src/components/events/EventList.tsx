import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Event } from "@shared/schema";
import EventCard from "./EventCard";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export default function EventList({ limit = 0, queryKey = '/api/events/upcoming' }: { limit?: number; queryKey?: string }) {
  const [, navigate] = useLocation();
  const { data: events, isLoading, error } = useQuery<Event[]>({
    queryKey: [queryKey],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {[...Array(limit > 0 ? limit : 2)].map((_, i) => (
          <div key={i} className="glassmorphism rounded-lg overflow-hidden animate-pulse border border-amber-500/20">
            <div className="w-full h-100 bg-amber-500/20" />
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="h-6 bg-amber-500/30 rounded w-3/4 mb-2" />
                <div className="h-6 w-20 bg-amber-600/50 rounded" />
              </div>
              <div className="mt-3 space-y-2">
                <div className="h-4 bg-amber-500/20 rounded w-full" />
                <div className="h-4 bg-amber-500/20 rounded w-full" />
                <div className="h-4 bg-amber-500/20 rounded w-full" />
              </div>
              <div className="h-16 bg-amber-500/10 rounded w-full mt-4" />
              <div className="flex justify-between items-center mt-6">
                <div className="h-6 bg-amber-500/30 rounded w-1/4" />
                <div className="h-10 bg-amber-600/30 rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !events) {
    return (
      <div className="glassmorphism rounded-lg p-8 text-center">
        <p className="text-amber-400 mb-4">Unable to load events at this time.</p>
        <p className="text-gray-400">Please check back later.</p>
      </div>
    );
  }

  // Limit number of events if limit is provided
  const displayedEvents = limit > 0 ? events.slice(0, limit) : events;

  // Handle view all events click
  const handleViewAllClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate("/events");
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {displayedEvents.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
      
      {limit > 0 && events.length > limit && (
        <motion.div 
          className="text-center mt-12"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay:.3 }}
        >
          <motion.button
            onClick={handleViewAllClick}
            className="inline-flex items-center px-6 py-3 font-medium rounded-md border border-amber-500 text-amber-400 hover:bg-amber-500 hover:text-black transition-all glow-button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            View All Events
            <ArrowRight className="ml-2 w-4 h-4" />
          </motion.button>
        </motion.div>
      )}
    </>
  );
}
