import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Loader2, Calendar, MapPin, Clock, Ticket } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";

export default function TicketsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Fetch upcoming events with tickets
  const { data: events, isLoading } = useQuery<Event[]>({
    queryKey: ["/api/events/upcoming"],
  });

  // Handle ticket purchase
  const handlePurchaseTicket = (eventId: number) => {
    // If user is not logged in, show login notification
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please login to purchase tickets",
        variant: "destructive",
      });
      return;
    }

    // Set selected event
    setSelectedEventId(eventId);

    // Show success toast for now (in real implementation, this would redirect to checkout)
    toast({
      title: "Proceeding to checkout",
      description: "You will be redirected to the payment page",
    });

    // Here we would redirect to a checkout page with the event ID
    // history.push(`/checkout/tickets/${eventId}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1 },
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="container mx-auto px-4 py-20 min-h-screen">
        <div className="mt-20 text-center">
          <h1 className="text-3xl font-bold mb-6">Event Tickets</h1>
          <p className="text-muted-foreground">
            No upcoming events with tickets available.
          </p>
          <Link href="/events">
            <Button variant="outline" className="mt-4">
              View All Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Tickets - Izuran</title>
        <meta
          name="description"
          content="Purchase tickets for upcoming Izuran events and experiences.
            Immerse yourself in the mystical sounds of our artists."
        />
      </Helmet>

      <main className="pt-24 pb-16">
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold font-cinzel mb-6 glow-text">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-izuran-blue to-white">
                Event Tickets
              </span>
            </h1>
            <p className="text-lg max-w-3xl mx-auto text-gray-300">
              Purchase tickets for upcoming Izuran events and experiences.
              Immerse yourself in the mystical sounds of our artists.
            </p>
          </motion.div>
          <div className="container mx-auto px-4 py-20 min-h-screen">
            <div className="mt-15">
              <motion.div
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {events.map((event) => (
                  <motion.div key={event.id} variants={itemVariants}>
                    <Card className="h-full flex flex-col overflow-hidden hover:shadow-md transition-shadow border-border/50 bg-card/30 backdrop-blur-sm">
                      <div className="relative h-48 overflow-hidden">
                        <img
                          src={event.imageUrl}
                          alt={event.name}
                          className="w-full h-full object-cover transition-transform hover:scale-105 duration-500"
                        />
                        {event.ticketPrice && (
                          <div className="absolute top-4 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-medium">
                            {event.ticketPrice}
                          </div>
                        )}
                      </div>

                      <CardHeader>
                        <CardTitle className="font-cinzel">
                          {event.name}
                        </CardTitle>
                        <CardDescription className="text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.displayDate}</CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-3 flex-grow">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.displayDate}</span>
                        </div>

                        <div className="flex items-center text-sm">
                          <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                          <span className="text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.location}</span>
                        </div>

                        {event.lineup && (
                          <div className="flex items-start text-sm mt-4">
                            <div className="mr-2 text-muted-foreground">
                              Lineup:
                            </div>
                            <div className="text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{event.lineup}</div>
                          </div>
                        )}
                      </CardContent>

                      <CardFooter>
                        <Button
                          className="w-full"
                          onClick={() => handlePurchaseTicket(event.id)}
                          disabled={selectedEventId === event.id}
                        >
                          {selectedEventId === event.id ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Ticket className="mr-2 h-4 w-4" />
                              Buy Tickets
                            </>
                          )}
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
