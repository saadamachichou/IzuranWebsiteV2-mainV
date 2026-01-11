import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Music, 
  Users, 
  Ticket, 
  Share2,
  ArrowLeft,
  AlertCircle,
  Home
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useContext, useState } from "react";
import { CartContext } from "@/context/CartContext";
import ParticleField from "@/components/ui/particle-field";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import LineupDisplay from "@/components/events/LineupDisplay";

export default function EventDetail() {
  const [, navigate] = useLocation();
  const [match, params] = useRoute('/events/:slug');
  const { toast } = useToast();
  const cartContext = useContext(CartContext);
  const [selectedTicketType, setSelectedTicketType] = useState<string | null>(null);
  
  // Fetch event details
  const { data: event, isLoading, error } = useQuery<Event>({
    queryKey: [`/api/events/${params?.slug}`],
    enabled: !!params?.slug,
  });

  // Handle going back
  const handleGoBack = () => {
    navigate('/events');
  };

  // Handle sharing
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: event?.name || 'Izuran Event',
        text: `Check out this event: ${event?.name}`,
        url: window.location.href,
      })
      .catch((error) => {
        console.error('Error sharing', error);
        
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied to clipboard",
          description: "You can now share it with your friends",
        });
      });
    } else {
      // Fallback for browsers that don't support navigator.share
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied to clipboard",
        description: "You can now share it with your friends",
      });
    }
  };

  // Get current ticket price
  const getCurrentTicketPhases = () => {
    if (!event) return [];
    
    const now = new Date();
    const ticketPhases = [];
    
    // Early Bird Phase
    if (event.earlyBirdPrice && event.earlyBirdEndDate) {
      const earlyBirdEnd = new Date(event.earlyBirdEndDate);
      const isAvailable = now < earlyBirdEnd;
      
      ticketPhases.push({
        id: 'early-bird',
        name: 'Early Bird',
        price: event.earlyBirdPrice,
        available: isAvailable,
        active: isAvailable,
        endDate: event.earlyBirdEndDate,
      });
    }
    
    // Second Phase
    if (event.secondPhasePrice && event.secondPhaseEndDate) {
      const secondPhaseEnd = new Date(event.secondPhaseEndDate);
      const earlyBirdEnd = event.earlyBirdEndDate ? new Date(event.earlyBirdEndDate) : new Date(0);
      const isAvailable = now < secondPhaseEnd && (now >= earlyBirdEnd || !event.earlyBirdPrice);
      
      ticketPhases.push({
        id: 'second-phase',
        name: 'Second Phase',
        price: event.secondPhasePrice,
        available: isAvailable,
        active: isAvailable,
        endDate: event.secondPhaseEndDate,
      });
    }
    
    // Last Phase
    if (event.lastPhasePrice) {
      const secondPhaseEnd = event.secondPhaseEndDate ? new Date(event.secondPhaseEndDate) : new Date(0);
      const isAvailable = !event.secondPhasePrice || now >= secondPhaseEnd;
      
      ticketPhases.push({
        id: 'last-phase',
        name: 'Last Phase',
        price: event.lastPhasePrice,
        available: isAvailable,
        active: isAvailable,
      });
    }
    
    // Legacy ticket price support
    if (ticketPhases.length === 0 && event.ticketPrice) {
      ticketPhases.push({
        id: 'standard',
        name: 'Standard',
        price: event.ticketPrice,
        available: true,
        active: true,
      });
    }
    
    return ticketPhases;
  };

  // Format date
  const formatEventDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Format time - events don't have a time field, so we'll use a placeholder
  const formatEventTime = () => {
    return 'Time TBA';
  };

  const ticketPhases = getCurrentTicketPhases();
  
  // Get the currently active ticket phase
  const activeTicketPhase = ticketPhases.find(phase => phase.active);

  // Add ticket to cart
  const addTicketToCart = () => {
    if (!event || !cartContext) return;
    
    // Default to the active phase if none is selected
    const ticketType = selectedTicketType || (activeTicketPhase?.id || 'standard');
    const ticketPhase = ticketPhases.find(p => p.id === ticketType);
    
    if (!ticketPhase || !ticketPhase.available) {
      toast({
        title: "Unable to add ticket",
        description: "This ticket type is not available at the moment",
        variant: "destructive"
      });
      return;
    }
    
    // Create a product-like object for the cart
    const ticketProduct = {
      id: event.id,
      name: `${event.name} - ${ticketPhase.name} Ticket`,
      price: ticketPhase.price,
      currency: 'MAD',
      category: 'merch' as const,
      productType: 'physical' as const,
      description: `Ticket for ${event.name}`,
      imageUrl: event.imageUrl,
      slug: `${event.slug}-${ticketPhase.id}`,
      stockLevel: 999,
      isNewRelease: false,
      createdAt: event.createdAt,
      updatedAt: null,
      archived: false,
      artistName: null,
      cmiProductId: null,
      paypalProductId: null,
      digitalFileUrl: null,
    };
    
    cartContext.addToCart(ticketProduct);
    
    toast({
      title: "Ticket added to cart",
      description: `${event.name} - ${ticketPhase.name} ticket has been added to your cart`,
    });
  };

  // Loading state
  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="relative min-h-screen bg-black">
          <div className="absolute inset-0 z-0 opacity-20">
            <ParticleField />
          </div>
          <div className="relative z-10 pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="animate-pulse">
                <div className="h-8 bg-amber-600/30 rounded w-2/3 mb-4"></div>
                <div className="h-96 bg-amber-600/20 rounded-lg mb-8"></div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="col-span-2">
                    <div className="h-6 bg-amber-600/30 rounded w-full mb-4"></div>
                    <div className="h-4 bg-amber-600/20 rounded w-full mb-2"></div>
                    <div className="h-4 bg-amber-600/20 rounded w-full mb-2"></div>
                    <div className="h-4 bg-amber-600/20 rounded w-full mb-2"></div>
                  </div>
                  <div>
                    <div className="h-40 bg-amber-600/30 rounded-lg mb-4"></div>
                    <div className="h-10 bg-amber-500/30 rounded w-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <>
        <Navbar />
        <div className="relative min-h-screen bg-black">
          <div className="absolute inset-0 z-0 opacity-20">
            <ParticleField />
          </div>
          <div className="relative z-10 pt-24 pb-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2 text-amber-200">Event Not Found</h1>
                <p className="text-amber-200/60 mb-6">The event you're looking for doesn't exist or has been removed.</p>
                <Button onClick={handleGoBack} variant="outline" className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back to Events
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{event.name} - Izuran Events</title>
        <meta name="description" content={event.description} />
        <meta property="og:title" content={`${event.name} - Izuran Events`} />
        <meta property="og:description" content={event.description} />
        <meta property="og:image" content={event.imageUrl} />
      </Helmet>
      
      <Navbar />
      
      <div className="relative min-h-screen bg-black">
        {/* Particle field background animation */}
        <div className="absolute inset-0 z-0 opacity-20">
          <ParticleField />
        </div>
        
        <div className="relative z-10 pt-24 pb-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Header Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                  <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                    <button onClick={handleGoBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Back to Events
                    </button>
                  </Button>
                  <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                    <button onClick={() => navigate('/')}>
                      <Home className="mr-2 h-4 w-4" />
                      Return to Website
                    </button>
                  </Button>
                </div>
                <Button variant="outline" onClick={handleShare} className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <Share2 className="mr-2 h-4 w-4" />
                  Share Event
                </Button>
              </div>
              
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                  <Calendar className="w-8 h-8 text-amber-400" />
                </div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                    {event.name}
                  </h1>
                  <p className="text-amber-200/60 mt-2" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                    {formatEventDate(event.date)} • {formatEventTime()}
                  </p>
                </div>
              </div>
            </motion.div>

            {/* Hero Image */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-12"
            >
              <div className="relative rounded-xl overflow-hidden">
                <img 
                  src={event.imageUrl} 
                  alt={event.name} 
                  className="w-full h-[70vh] object-cover object-top" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-6 left-6">
                  <Badge variant="outline" className="border-amber-500/30 text-amber-300 bg-black/60">
                    {event.status || 'upcoming'}
                  </Badge>
                </div>
              </div>
            </motion.div>
            
            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Event Details */}
              <motion.div 
                className="lg:col-span-2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl mb-8">
                  <CardHeader>
                    <CardTitle className="text-amber-300">Event Details</CardTitle>
                                          <CardDescription className="text-amber-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                        All the information you need about this event
                      </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-start">
                        <Calendar className="w-5 h-5 text-amber-400 mr-3 mt-0.5" />
                                                 <div>
                           <h3 className="font-medium text-amber-200">Date</h3>
                           <p className="text-sm md:text-base text-amber-100/80" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{formatEventDate(event.date)}</p>
                         </div>
                      </div>
                      
                                             <div className="flex items-start">
                         <Clock className="w-5 h-5 text-amber-400 mr-3 mt-0.5" />
                         <div>
                           <h3 className="font-medium text-amber-200">Time</h3>
                           <p className="text-sm md:text-base text-amber-100/80" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{formatEventTime()}</p>
                         </div>
                       </div>
                       
                       <div className="flex items-start">
                         <MapPin className="w-5 h-5 text-amber-400 mr-3 mt-0.5" />
                         <div>
                           <h3 className="font-medium text-amber-200">Location</h3>
                           <p className="text-sm md:text-base text-amber-100/80" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.location}</p>
                         </div>
                       </div>
                    </div>
                    
                    <Separator className="bg-amber-500/20" />
                    
                    <div>
                      <h3 className="font-bold flex items-center mb-4 text-amber-200">
                        <Music className="w-5 h-5 text-amber-400 mr-2" />
                        Lineup
                      </h3>
                      <LineupDisplay lineup={event.lineup || ''} eventDate={event.date ? new Date(event.date) : undefined} />
                    </div>
                    
                    <Separator className="bg-amber-500/20" />
                    
                    <div>
                      <h3 className="font-bold mb-3 text-amber-200">About This Event</h3>
                                             <div className="prose prose-invert max-w-none">
                         <p className="text-sm md:text-base text-amber-100/80 whitespace-pre-line" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.description}</p>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
              
              {/* Ticket Purchase - Only show for upcoming events */}
              {event.status !== 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl sticky top-24">
                    <CardHeader>
                      <CardTitle className="text-amber-300 flex items-center">
                        <Ticket className="w-5 h-5 text-amber-400 mr-2" />
                        Get Tickets
                      </CardTitle>
                      <CardDescription className="text-amber-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                        Secure your spot at this exclusive event
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {ticketPhases.length > 0 ? (
                        <>
                          <div className="space-y-4 mb-6">
                            {ticketPhases.map((phase) => (
                              <div
                                key={phase.id}
                                className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${
                                  selectedTicketType === phase.id
                                    ? 'border-amber-500 bg-amber-500/10'
                                    : phase.available
                                    ? 'border-amber-500/30 hover:border-amber-500/50 cursor-pointer'
                                    : 'border-gray-700 opacity-60'
                                }`}
                                onClick={() => phase.available && setSelectedTicketType(phase.id)}
                              >
                                <div>
                                  <h3 className="font-medium text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{phase.name}</h3>
                                  {phase.endDate && (
                                    <p className="text-xs text-amber-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                                      {phase.available
                                        ? `Until ${new Date(phase.endDate).toLocaleDateString()}`
                                        : 'No longer available'}
                                    </p>
                                  )}
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-amber-300" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>${phase.price}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          
                          <Button
                            className="w-full py-6 text-xl bg-amber-500 text-black hover:bg-amber-400"
                            onClick={addTicketToCart}
                            disabled={!activeTicketPhase}
                            style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
                          >
                            Add to Cart
                          </Button>
                          
                          {activeTicketPhase && (
                            <p className="text-xs text-center mt-2 text-amber-200/60">
                              Limited tickets available
                            </p>
                          )}
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <p className="text-amber-200/60 mb-2">Tickets are not available yet</p>
                          <p className="text-xs text-amber-200/40">Check back later for updates</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Event Status Card for Past Events */}
              {event.status === 'completed' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                >
                  <Card className="bg-black/60 border-gray-500/20 backdrop-blur-xl sticky top-24">
                    <CardHeader>
                      <CardTitle className="text-gray-300 flex items-center">
                        <AlertCircle className="w-5 h-5 text-gray-400 mr-2" />
                        Event Completed
                      </CardTitle>
                      <CardDescription className="text-gray-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                        This event has already taken place
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-6">
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-gray-600/30 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Calendar className="w-8 h-8 text-gray-400" />
                          </div>
                          <h3 className="text-lg font-semibold text-gray-300 mb-2">Event Ended</h3>
                          <p className="text-sm text-gray-200/60" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                            Ticket sales are no longer available for this event
                          </p>
                        </div>
                        <Badge variant="outline" className="border-gray-500/30 text-gray-300">
                          Past Event
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}