import { motion } from "framer-motion";
import { Event } from "@shared/schema";
import { Link, useLocation } from "wouter";
import { Calendar, MapPin, Music, Ticket } from "lucide-react";

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const [, navigate] = useLocation();

  // Calculate days until event or days since event
  const getDaysUntil = (): string => {
    const eventDate = new Date(event.date);
    const today = new Date();
    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (event.status === 'completed') {
      if (diffDays === 0) {
        return "Ended Today";
      } else if (diffDays === -1) {
        return "Ended Yesterday";
      } else {
        return `${Math.abs(diffDays)} days ago`;
      }
    } else {
      if (diffDays <= 0) {
        return "Today";
      } else if (diffDays === 1) {
        return "Tomorrow";
      } else {
        return `In ${diffDays} days`;
      }
    }
  };

  // Get the current active ticket price
  const getCurrentPrice = (): { price: string; phase: string } => {
    const now = new Date();
    
    // Check if early bird is available
    if (event.earlyBirdPrice && event.earlyBirdEndDate) {
      const earlyBirdEnd = new Date(event.earlyBirdEndDate);
      if (now < earlyBirdEnd) {
        return { price: event.earlyBirdPrice, phase: "Early Bird" };
      }
    }
    
    // Check if second phase is available
    if (event.secondPhasePrice && event.secondPhaseEndDate) {
      const secondPhaseEnd = new Date(event.secondPhaseEndDate);
      if (now < secondPhaseEnd) {
        return { price: event.secondPhasePrice, phase: "Second Phase" };
      }
    }
    
    // Default to last phase price
    if (event.lastPhasePrice) {
      return { price: event.lastPhasePrice, phase: "Last Phase" };
    }
    
    // Fallback to legacy ticket price if available
    if (event.ticketPrice) {
      return { price: event.ticketPrice, phase: "Standard" };
    }
    
    return { price: "", phase: "" };
  };

  // Format price to ensure proper currency display
  const formatPrice = (price: string): string => {
    if (!price) return "";
    // If price already contains $, return as is
    if (price.includes("$")) return price;
    // If it's a numeric value, add $ prefix
    return `$${price}`;
  };

  const { price, phase } = getCurrentPrice();

  // Handle buy ticket click
  const handleBuyTicketClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/events/${event.slug}`);
  };

  // Handle view details click for past events
  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(`/events/${event.slug}`);
  };

  return (
    <motion.div 
      className="glassmorphism rounded-lg overflow-hidden transition-all glow-card h-full flex flex-col border border-amber-500/20 hover:border-amber-500/40"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      whileHover={{ y: -5, boxShadow: "0 10px 30px -15px rgba(245, 158, 11, 0.3)" }}
    >
      <div className="relative overflow-hidden">
        <img
          src={event.imageUrl}
          alt={event.name}
          className="w-full h-96 object-cover object-center border-b border-amber-500/10"
          loading="lazy"
          onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
        />
        <div className={`absolute top-3 right-3 px-3 py-1 rounded text-sm font-medium ${
          event.status === 'completed' 
            ? 'bg-gray-600 text-gray-200' 
            : 'bg-amber-600 text-black'
        }`}>
          {getDaysUntil()}
        </div>
      </div>
      
      <div className="p-6 flex flex-col flex-grow">
        <h3 className="text-xl font-bold font-space text-white mb-4">{event.name}</h3>
        
        <div className="mt-1 space-y-2">
          <div className="flex items-center text-amber-200/80">
            <Calendar className="w-4 h-4 text-amber-400" />
            <span className="ml-2 text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.displayDate}</span>
          </div>
          <div className="flex items-center text-amber-200/80">
            <MapPin className="w-4 h-4 text-amber-400" />
            <span className="ml-2 text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.location}</span>
          </div>
          {event.lineup && (
            <div className="flex items-start text-yellow-50">
              <Music className="w-4 h-4 text-amber-400 mt-0.5" />
              <span className="ml-2 text-sm md:text-base line-clamp-1 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.lineup}</span>
            </div>
          )}
        </div>
        
        <p className="mt-4 text-sm md:text-base text-yellow-50 line-clamp-3 flex-grow drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.description}</p>
        
        <div className="mt-6 flex items-center justify-between">
          {event.status === 'completed' ? (
            <div className="flex flex-col">
              <span className="text-xs text-gray-400 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Event Completed</span>
              <span className="text-lg font-bold text-gray-300">Past Event</span>
            </div>
          ) : price ? (
            <div className="flex flex-col">
              <span className="text-xs text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{phase}</span>
              <span className="text-lg font-bold text-white">{formatPrice(price)}</span>
            </div>
          ) : (
            <div></div>
          )}
          
          {event.status === 'completed' ? (
            <motion.button
              onClick={handleViewDetailsClick}
              className="inline-flex items-center justify-center px-4 py-2 bg-gray-600 text-gray-200 font-medium rounded-md hover:bg-gray-500 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Calendar className="w-4 h-4 mr-2" />
              <span style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>View Details</span>
            </motion.button>
          ) : (
            <motion.button
              onClick={handleBuyTicketClick}
              className="inline-flex items-center justify-center px-4 py-2 bg-amber-500 text-black font-medium rounded-md hover:bg-amber-400 transition-all"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Ticket className="w-4 h-4 mr-2" />
              <span style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Get Tickets</span>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
