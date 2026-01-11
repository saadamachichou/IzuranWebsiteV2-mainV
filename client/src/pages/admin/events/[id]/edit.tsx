import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import EventForm from "@/components/admin/EventForm";
import { Event } from "@shared/schema";
import { Loader2, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import ParticleField from "@/components/ui/particle-field";
import { z } from "zod";

// Validation schema for event form
const eventFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().refine(
    (url) => {
      if (!url) return false; // Don't allow empty/null values since it's required
      // Accept both relative paths and absolute URLs
      return url.startsWith('/') || url.startsWith('http://') || url.startsWith('https://');
    },
    "Image URL must be a valid relative path or absolute URL"
  ),
  date: z.date({
    required_error: "Event date is required",
  }),
  endDate: z.date().optional(),
  location: z.string().min(3, "Location must be at least 3 characters"),
  lineup: z.string().optional(),
  // Legacy field - will be deprecated
  ticketPrice: z.string().optional(),
  // New tiered pricing fields
  earlyBirdPrice: z.string().optional(),
  earlyBirdEndDate: z.date().optional(),
  secondPhasePrice: z.string().optional(),
  secondPhaseEndDate: z.date().optional(),
  lastPhasePrice: z.string().optional(),
  displayDate: z.string().min(3, "Display date is required"),
  status: z.string().default("upcoming"),
  featured: z.boolean().default(false),
});

type EventFormValues = z.infer<typeof eventFormSchema>;

export default function EditEventPage() {
  const { id } = useParams();
  const [_, navigate] = useLocation();
  const { toast } = useToast();
  const eventId = parseInt(id || "0");
  
  // Fetch event by ID
  const { data: event, isLoading, error } = useQuery({
    queryKey: [`/api/admin/events/${eventId}`],
    queryFn: async () => {
      if (!id) throw new Error("Event ID is required");
      const response = await apiRequest("GET", `/api/admin/events/${eventId}`);
      return response.json();
    },
    enabled: !isNaN(eventId) && !!id,
  });

  // Update event mutation
  const updateMutation = useMutation({
    mutationFn: async (eventData: EventFormValues) => {
      // Convert Date objects to ISO strings
      const formattedData = {
        ...eventData,
        date: eventData.date instanceof Date ? eventData.date.toISOString() : eventData.date,
        endDate: eventData.endDate instanceof Date 
          ? eventData.endDate.toISOString() 
          : eventData.endDate || undefined,
        earlyBirdEndDate: eventData.earlyBirdEndDate instanceof Date 
          ? eventData.earlyBirdEndDate.toISOString() 
          : eventData.earlyBirdEndDate || undefined,
        secondPhaseEndDate: eventData.secondPhaseEndDate instanceof Date 
          ? eventData.secondPhaseEndDate.toISOString() 
          : eventData.secondPhaseEndDate || undefined,
      };
      
      console.log("Updating event with data:", formattedData);
      
      const response = await apiRequest("PUT", `/api/admin/events/${eventId}`, formattedData);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Update event API error:", errorData);
        throw new Error(errorData.message || "Failed to update event");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch events list and the current event
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/events/${eventId}`] });
    },
    onError: (error) => {
      console.error("Update event mutation error:", error);
      toast({
        title: "Failed to update event",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: EventFormValues) => {
    try {
      await updateMutation.mutateAsync(data);
      return true;
    } catch (error) {
      console.error("Update event exception:", error);
      throw error;
    }
  };

  // Format event data for the form
  const formatEventForForm = (event: Event): Partial<EventFormValues> => {
    const formData: Partial<EventFormValues> = {
      name: event.name,
      slug: event.slug,
      description: event.description,
      imageUrl: event.imageUrl.startsWith('/') ? event.imageUrl : `/uploads/event_images/${event.imageUrl}`,
      date: new Date(event.date),
      location: event.location,
      displayDate: event.displayDate,
      status: event.status,
      featured: event.featured || false,
    };

    // Handle optional fields with null checks
    if (event.endDate) {
      formData.endDate = new Date(event.endDate);
    }
    if (event.lineup) {
      formData.lineup = event.lineup;
    }
    if (event.ticketPrice) {
      formData.ticketPrice = event.ticketPrice;
    }
    if (event.earlyBirdPrice) {
      formData.earlyBirdPrice = event.earlyBirdPrice;
    }
    if (event.earlyBirdEndDate) {
      formData.earlyBirdEndDate = new Date(event.earlyBirdEndDate);
    }
    if (event.secondPhasePrice) {
      formData.secondPhasePrice = event.secondPhasePrice;
    }
    if (event.secondPhaseEndDate) {
      formData.secondPhaseEndDate = new Date(event.secondPhaseEndDate);
    }
    if (event.lastPhasePrice) {
      formData.lastPhasePrice = event.lastPhasePrice;
    }

    return formData;
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
      </div>
    );
  }

  // Error state
  if (error || !event) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="text-red-500 mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h3 className="text-xl font-bold mb-2 text-amber-300">Event not found</h3>
        <p className="text-amber-200/70 mb-4">
          The event you're looking for doesn't exist or an error occurred while loading.
        </p>
        <Button
          className="bg-amber-600 hover:bg-amber-700 text-black font-medium"
          onClick={() => navigate("/admin/events")}
        >
          Back to Events
        </Button>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center justify-between mb-8"
          >
            <div className="flex items-center gap-4">
              <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                <Link href="/admin/events">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Events
                </Link>
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
              Edit Event
            </h1>
            <p className="text-amber-200/60 mt-2">
              Update the details for "{event.name}"
            </p>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <EventForm 
              initialValues={formatEventForForm(event)}
              onSubmit={handleSubmit}
              isEditMode={true}
            />
          </motion.div>
        </div>
      </div>
    </div>
  );
}