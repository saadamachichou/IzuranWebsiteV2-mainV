import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import EventForm from "@/components/admin/EventForm";
import { Event } from "@shared/schema";

export default function NewEventPage() {
  const { toast } = useToast();

  // Create event mutation
  const createMutation = useMutation({
    mutationFn: async (eventData: any) => {
      // Convert Date objects to ISO strings
      const formattedData = {
        ...eventData,
        date: eventData.date instanceof Date ? eventData.date.toISOString() : eventData.date,
        endDate: eventData.endDate instanceof Date 
          ? eventData.endDate.toISOString() 
          : eventData.endDate || undefined
      };
      
      console.log("Creating event with data:", formattedData);
      
      const response = await apiRequest("POST", "/api/admin/events", formattedData);
      if (!response.ok) {
        const errorData = await response.json();
        console.error("Create event API error:", errorData);
        throw new Error(errorData.message || "Failed to create event");
      }
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch events list
      queryClient.invalidateQueries({ queryKey: ["/api/admin/events"] });
    },
    onError: (error) => {
      console.error("Create event mutation error:", error);
      toast({
        title: "Failed to create event",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (data: any) => {
    try {
      await createMutation.mutateAsync(data);
      return true;
    } catch (error) {
      console.error("Create event exception:", error);
      throw error;
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-3xl font-bold tracking-tight">Create New Event</h2>
      <p className="text-muted-foreground">
        Add a new event to your lineup. Fill in the details below to create your event.
      </p>
      
      <EventForm 
        onSubmit={handleSubmit} 
        isEditMode={false}
      />
    </div>
  );
}