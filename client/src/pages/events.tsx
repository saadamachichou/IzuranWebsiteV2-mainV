import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { Calendar, MapPin } from "lucide-react";
import EventList from "@/components/events/EventList";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";

export default function Events() {
  const { data: upcomingEvents } = useQuery<Event[]>({
    queryKey: ['/api/events/upcoming'],
  });

  const { data: featuredEvents } = useQuery<Event[]>({
    queryKey: ['/api/events/featured'],
  });

  const { data: pastEvents } = useQuery<Event[]>({
    queryKey: ['/api/events/past'],
  });

  const getFeaturedEvent = () => {
    if (!featuredEvents || featuredEvents.length === 0) return null;
    // Return the first featured event
    return featuredEvents[0];
  };

  const featuredEvent = getFeaturedEvent();

  return (
    <>
      <Helmet>
        <title>Events - Izuran</title>
        <meta name="description" content="Explore Izuran's immersive events, parties, and festivals featuring the best in psychedelic and esoteric music." />
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
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400 tracking-wider drop-shadow-lg" style={{letterSpacing: '0.08em'}}>Mystical Events</span>
              </h1>
              <p className="text-lg max-w-3xl mx-auto text-gray-300" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                Immerse yourself in our transcendent gatherings, where ancient Amazigh culture merges with futuristic sounds in unique locations.
              </p>
            </motion.div>
          </div>
        </div>

        <main className="py-8">
          {/* Featured event section */}
          {featuredEvent && (
            <section className="mb-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <motion.div 
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <h2 className="text-2xl md:text-3xl font-bold font-cinzel inline-block">
                  <span className="border-b-2 border-amber-500 pb-1 text-amber-300">Featured Event</span>
                </h2>
              </motion.div>
              
              <motion.div 
                className="glassmorphism shadow-xl rounded-lg overflow-hidden border border-amber-500/20 hover:border-amber-500/40 transition-all glow-card"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <div className="md:flex h-full">
                  <div className="md:w-1/2 h-72 md:h-auto">
                    <img 
                      src={featuredEvent.imageUrl} 
                      alt={featuredEvent.name} 
                      className="w-full h-full object-cover border border-amber-500/10" 
                    />
                  </div>
                  <div className="md:w-1/2 p-6 md:p-8 flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-2xl font-bold font-space text-white">{featuredEvent.name}</h3>
                        <div className="bg-amber-600 px-3 py-1 rounded text-black text-sm font-semibold">
                          {featuredEvent.status === 'upcoming' ? 'Upcoming' : featuredEvent.status}
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-6">
                        <div className="flex items-center text-amber-200/80">
                          <Calendar className="w-5 h-5 text-amber-400 mr-2" />
                          <span className="text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{featuredEvent.displayDate}</span>
                        </div>
                        <div className="flex items-center text-amber-200/80">
                          <MapPin className="w-5 h-5 text-amber-400 mr-2" />
                          <span className="text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{featuredEvent.location}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm md:text-base text-yellow-50 mb-6 line-clamp-3 md:line-clamp-5 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{featuredEvent.description}</p>
                    </div>
                    
                    <div className="flex flex-col md:flex-row justify-between items-start gap-6">
                      <div className="w-full md:w-auto">
                        <h4 className="text-amber-300 font-semibold mb-3 text-sm uppercase tracking-wide">Ticket Pricing</h4>
                        <div className="space-y-3">
                          {featuredEvent.earlyBirdPrice && (
                            <div className="flex justify-between items-center bg-black/30 rounded-lg px-6 py-4 border border-white/20">
                              <div className="flex flex-col">
                                <span className="text-sm text-yellow-50 font-medium drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Early Bird</span>
                                <span className="text-xs text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Limited time offer</span>
                              </div>
                              <span className="text-lg font-bold text-white ml-4">${featuredEvent.earlyBirdPrice}</span>
                            </div>
                          )}
                          {featuredEvent.secondPhasePrice && (
                            <div className="flex justify-between items-center bg-black/30 rounded-lg px-6 py-4 border border-green-500/20">
                              <div className="flex flex-col">
                                <span className="text-sm text-yellow-50 font-medium drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Second Phase</span>
                                <span className="text-xs text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Standard pricing</span>
                              </div>
                              <span className="text-lg font-bold text-green-400 ml-4">${featuredEvent.secondPhasePrice}</span>
                            </div>
                          )}
                          {featuredEvent.lastPhasePrice && (
                            <div className="flex justify-between items-center bg-black/30 rounded-lg px-6 py-4 border border-amber-500/20">
                              <div className="flex flex-col">
                                <span className="text-sm text-yellow-50 font-medium drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Final Price</span>
                                <span className="text-xs text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>At the door</span>
                              </div>
                              <span className="text-lg font-bold text-amber-400 ml-4">${featuredEvent.lastPhasePrice}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-3 w-full md:w-auto">
                        <motion.button
                          className="px-8 py-4 bg-amber-500 text-black font-bold rounded-lg flex items-center justify-center gap-2 hover:bg-amber-400 transition-all glow-button shadow-lg"
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => window.location.href = `/events/${featuredEvent.slug}`}
                        >
                          <span style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Get Tickets</span>
                        </motion.button>
                        <p className="text-xs text-yellow-50 text-center drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Secure booking available</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </section>
          )}
          
          {/* Upcoming Events section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-16">
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold font-cinzel inline-block">
                <span className="border-b-2 border-amber-500 pb-1 text-amber-300">Upcoming Events</span>
              </h2>
            </motion.div>
            
            <div className="relative">
              <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute bottom-1/3 left-1/4 w-64 h-64 rounded-full bg-amber-600 blur-3xl animate-pulse-slow"></div>
              </div>
              
              <div className="relative z-10">
                <EventList />
              </div>
            </div>
          </section>

          {/* Past Events section */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.6 }}
            >
              <h2 className="text-2xl md:text-3xl font-bold font-cinzel inline-block">
                <span className="border-b-2 border-gray-500 pb-1 text-gray-400">Past Events</span>
              </h2>
            </motion.div>
            
            <div className="relative">
              <div className="absolute inset-0 z-0 opacity-10">
                <div className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-gray-600 blur-3xl animate-pulse-slow"></div>
              </div>
              
              <div className="relative z-10">
                <EventList queryKey="/api/events/past" />
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
