import { useState, useEffect, useRef } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { format } from "date-fns";
import slugify from "slugify";
import { DESCRIPTION_LIMIT } from "@/lib/text-utils";

// UI Components
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/date-picker";
import { DescriptionInput } from "@/components/ui/DescriptionInput";
import { Loader2, UploadCloud, X } from "lucide-react";

// Validation schema for event form
const eventFormSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().min(3, "Slug must be at least 3 characters"),
  description: z.string(),
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

interface EventFormProps {
  initialValues?: Partial<EventFormValues>;
  onSubmit: (data: EventFormValues) => void;
  isEditMode?: boolean;
}

export default function EventForm({
  initialValues,
  onSubmit,
  isEditMode = false,
}: EventFormProps) {
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const [isGeneratingSlug, setIsGeneratingSlug] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(
    (isEditMode && initialValues?.imageUrl) ? initialValues.imageUrl : null
  );
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize form with default values
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: initialValues?.name || "",
      slug: initialValues?.slug || "",
      description: initialValues?.description || "",
      imageUrl: initialValues?.imageUrl || "/images/placeholder-event.jpg", // Set a default image
      date: initialValues?.date || new Date(),
      endDate: initialValues?.endDate,
      location: initialValues?.location || "",
      lineup: initialValues?.lineup || "",
      ticketPrice: initialValues?.ticketPrice || "",
      earlyBirdPrice: initialValues?.earlyBirdPrice || "",
      earlyBirdEndDate: initialValues?.earlyBirdEndDate,
      secondPhasePrice: initialValues?.secondPhasePrice || "",
      secondPhaseEndDate: initialValues?.secondPhaseEndDate,
      lastPhasePrice: initialValues?.lastPhasePrice || "",
      displayDate: initialValues?.displayDate || "",
      status: initialValues?.status || "upcoming",
      featured: initialValues?.featured || false,
    },
  });

  // Auto-generate slug from name
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === 'name' && values.name) {
        const generatedSlug = values.name
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");
        form.setValue('slug', generatedSlug, { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // When name changes, update slug if it hasn't been manually edited
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    form.setValue("name", newName);
    
    // Only auto-generate slug if we're in create mode and slug is empty or matches previous auto-generated slug
    if (!isEditMode || form.getValues("slug") === "") {
      setIsGeneratingSlug(true);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload the image
    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploading(true);
      const response = await fetch('/api/admin/events/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      // The server returns a filename, so we need to construct the full URL
      form.setValue('imageUrl', `/uploads/event_images/${data.imageUrl}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setImagePreview(null);
      form.setValue('imageUrl', '');
    } finally {
      setIsUploading(false);
    }
  };

  // Trigger file input click
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  // Clear image URL and selected file/preview
  const clearImage = () => {
    form.setValue("imageUrl", "");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = ""; // Clear the file input
    }
  };

  // Debug logging for imagePreview state
  useEffect(() => {
    console.log('EventForm: imagePreview changed to', imagePreview);
  }, [imagePreview]);

  // Debug logging
  useEffect(() => {
    console.log("Form state:", form.formState);
  }, [form.formState]);

  // Handle form submission
  const handleSubmit = async (data: EventFormValues) => {
    if (isUploading) {
      toast({
        title: "Image Upload In Progress",
        description: "Please wait for the image upload to complete.",
        variant: "default",
      });
      return;
    }

    // If there's an image preview (meaning either a URL is entered or a file is selected)
    // AND the imageUrl field is empty (meaning a file was selected but not uploaded to backend yet)
    // AND the imagePreview is a data URL (confirming it's a locally selected file)
    if (imagePreview && !data.imageUrl && imagePreview.startsWith('data:')) {
      toast({
        title: "Image Not Uploaded",
        description: "Please upload the image or provide a URL for the event image.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create a copy of the data for conversion but keep original data for onSubmit
      const processedData = { ...data };
      
      // Convert dates to ISO strings for logging/debugging
      const submitData = {
        ...processedData,
        date: processedData.date.toISOString(),
        endDate: processedData.endDate ? processedData.endDate.toISOString() : undefined,
        // Convert new tiered pricing date fields
        earlyBirdEndDate: processedData.earlyBirdEndDate ? processedData.earlyBirdEndDate.toISOString() : undefined,
        secondPhaseEndDate: processedData.secondPhaseEndDate ? processedData.secondPhaseEndDate.toISOString() : undefined,
      };
      
      // Debug the form data
      console.log("Submitting event with data:", submitData);
      
      // Send original data (with Date objects) to parent component for API call
      await onSubmit(data);
      
      toast({
        title: `Event ${isEditMode ? "updated" : "created"} successfully`,
        description: `The event "${data.name}" has been ${isEditMode ? "updated" : "created"}.`,
      });
      
      // Navigate back to events list
      setLocation("/admin/events");
    } catch (error) {
      console.error(`${isEditMode ? "Update" : "Create"} event error:`, error);
      toast({
        title: `Failed to ${isEditMode ? "update" : "create"} event`,
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full bg-zinc-900 border-amber-500/20 text-amber-100">
      <CardContent className="pt-6">
        <Tabs defaultValue="basic">
          <TabsList className="mb-4 bg-zinc-800 border border-amber-500/20">
            <TabsTrigger 
              value="basic" 
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black data-[state=active]:font-medium data-[state=active]:border-amber-600 text-amber-200/80 hover:bg-amber-500/10"
            >
              Basic Info
            </TabsTrigger>
            <TabsTrigger 
              value="details" 
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black data-[state=active]:font-medium data-[state=active]:border-amber-600 text-amber-200/80 hover:bg-amber-500/10"
            >
              Details
            </TabsTrigger>
            <TabsTrigger 
              value="tickets" 
              className="data-[state=active]:bg-amber-600 data-[state=active]:text-black data-[state=active]:font-medium data-[state=active]:border-amber-600 text-amber-200/80 hover:bg-amber-500/10"
            >
              Tickets
            </TabsTrigger>
          </TabsList>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6" id="event-form">
              <TabsContent value="basic" className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Event Name</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter event name" 
                          {...field} 
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                          onChange={handleNameChange}
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        The name of the event or performance.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Slug</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="URL-friendly identifier (auto-generated from name)"
                          {...field} 
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        A unique, URL-friendly identifier for the event.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Description</FormLabel>
                      <FormControl>
                        <DescriptionInput
                          value={field.value}
                          onChange={field.onChange}
                          limit={DESCRIPTION_LIMIT}
                          placeholder="A detailed description of the event, its theme, and what attendees can expect."
                          id="description"
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        Provide a detailed description of the event.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => {
                    console.log('imageUrl FormField render: field.value', field.value, 'imagePreview', imagePreview);
                    const fieldValue = field.value || ''; // Ensure it's a string, even if initially undefined
                    return (
                      <FormItem>
                        <FormLabel className="text-amber-300">Event Image</FormLabel>
                        <FormControl>
                          <div className="flex flex-col gap-2">
                            {imagePreview && (
                              <div className="relative w-full h-48 border border-amber-500/30 rounded-md overflow-hidden bg-black/60 flex items-center justify-center">
                                <img
                                  src={imagePreview}
                                  alt="Image Preview"
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  onClick={clearImage}
                                  className="absolute top-2 right-2 text-red-400 hover:bg-red-500/20"
                                >
                                  <X className="h-5 w-5" />
                                </Button>
                              </div>
                            )}
                            {!imagePreview && (
                              <div
                                className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-amber-500/30 rounded-md cursor-pointer bg-black/60 hover:bg-zinc-800/50 transition-colors"
                                onClick={triggerFileInput}
                                onDragOver={(e) => e.preventDefault()}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                                    handleImageChange({ target: { files: e.dataTransfer.files } } as React.ChangeEvent<HTMLInputElement>);
                                  }
                                }}
                              >
                                {isUploading ? (
                                  <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
                                ) : (
                                  <div className="flex flex-col items-center text-amber-200/60">
                                    <UploadCloud className="h-8 w-8 mb-2" />
                                    <p className="text-sm">Drag & drop an image here, or click to browse</p>
                                  </div>
                                )}
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleImageChange}
                                  className="hidden"
                                  accept="image/*"
                                />
                              </div>
                            )}
                            {imagePreview && (field.value || (fileInputRef.current?.files?.[0] && fileInputRef.current.files[0].name)) && (
                              <p className="text-amber-200/60 text-sm mt-2">
                                {imagePreview.startsWith('data:') 
                                  ? `Selected file: ${fileInputRef.current?.files?.[0]?.name || ''}`
                                  : `Using URL: ${imagePreview}`}
                                {isUploading && <span className="ml-2 text-amber-400">Uploading...</span>}
                              </p>
                            )}
                            <Input 
                              {...field} 
                              placeholder="Alternatively, enter image URL (e.g., https://example.com/image.jpg)"
                              className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                              disabled={isUploading || (!!imagePreview && imagePreview.startsWith('data:'))}
                              onChange={(e) => {
                                field.onChange(e); // Let react-hook-form update its internal state for imageUrl

                                // If an image file is currently selected (imagePreview is a data URL),
                                // we don't want the URL input to clear or change the imagePreview directly.
                                // The user must explicitly clear the image using the "X" button.
                                if (imagePreview && imagePreview.startsWith('data:')) {
                                  if (e.target.value) {
                                    setImagePreview(e.target.value);
                                    // Clear the file input if the user decides to use a URL
                                    if (fileInputRef.current) {
                                      fileInputRef.current.value = "";
                                    }
                                  } else {
                                    // If the URL input is cleared, clear the image preview.
                                    // This path is taken when the URL input is not disabled by a file preview.
                                    setImagePreview(null);
                                  }
                                } else {
                                  // If no file is previewed (or it was a URL from input), handle the URL input's value for preview.
                                  if (e.target.value) {
                                    setImagePreview(e.target.value);
                                  } else {
                                    setImagePreview(null);
                                  }
                                }
                              }}
                            />
                            <FormDescription className="text-amber-200/60">
                              Recommended image aspect ratio: 16:9 for optimal display.
                            </FormDescription>
                          </div>
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    );
                  }}
                />
                
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Status</FormLabel>
                      <FormControl>
                        <select
                          className="w-full rounded-md border border-amber-500/20 bg-black/60 text-amber-300 px-3 py-2 focus:ring-amber-400 focus:border-amber-400"
                          {...field}
                        >
                          <option value="upcoming">Upcoming</option>
                          <option value="past">Past</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        The current status of the event.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="featured"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border border-amber-500/20 p-4 bg-black/60">
                      <div className="space-y-0.5">
                        <FormLabel className="text-amber-300">Featured Event</FormLabel>
                        <FormDescription className="text-amber-200/60">
                          Mark this event as featured to display it prominently on the homepage and events page.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-amber-600"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-amber-300">Event Date</FormLabel>
                        <DatePicker
                          date={field.value}
                          setDate={field.onChange}
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                        />
                        <FormDescription className="text-amber-200/60">
                          The primary date of the event.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="endDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-amber-300">End Date (Optional)</FormLabel>
                        <DatePicker
                          date={field.value || undefined}
                          setDate={field.onChange}
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                        />
                        <FormDescription className="text-amber-200/60">
                          The end date of the event, if it spans multiple days.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>
                
                <FormField
                  control={form.control}
                  name="displayDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Display Date</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., May 15, 2025 or Every Friday"
                          {...field} 
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        A user-friendly date string for display on the website.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Location</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Event location (e.g., The Grand Venue, City)"
                          {...field} 
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        The physical location or venue of the event.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="lineup"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">Lineup (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="List artists or performers, separated by commas"
                          {...field} 
                          className="min-h-[120px] bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        Artists or performers scheduled for the event.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <TabsContent value="tickets" className="space-y-6">
                <div className="p-4 border rounded-md bg-black/60 border-amber-500/20 mb-6">
                  <h3 className="text-sm font-medium text-amber-300 mb-2">Tiered Ticket Pricing</h3>
                  <p className="text-sm text-amber-200/60">
                    Set up three-phase pricing to incentivize early purchases. Tickets will automatically advance to the next price tier after each end date.
                  </p>
                </div>
                 
                <FormField
                  control={form.control}
                  name="ticketPrice"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-amber-300">
                        Legacy Ticket Price
                        <span className="ml-2 text-xs text-amber-200/60">(Deprecated)</span>
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 50 MAD or 25 EUR"
                          {...field} 
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        This field is maintained for backward compatibility. Please use the tiered pricing below.
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="border-t border-amber-500/20 my-6"></div>
                 
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="earlyBirdPrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-300">Early Bird Price</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 150 MAD or 15 EUR"
                            {...field} 
                            className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                          />
                        </FormControl>
                        <FormDescription className="text-amber-200/60">
                          The initial, discounted price for early purchases.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="earlyBirdEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-amber-300">Early Bird End Date</FormLabel>
                        <DatePicker
                          date={field.value || undefined}
                          setDate={field.onChange}
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                        />
                        <FormDescription className="text-amber-200/60">
                          When this phase ends and pricing moves to Second Phase.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Second Phase Pricing */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <FormField
                    control={form.control}
                    name="secondPhasePrice"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-amber-300">Second Phase Price</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="e.g., 200 MAD or 20 EUR"
                            {...field} 
                            className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                          />
                        </FormControl>
                        <FormDescription className="text-amber-200/60">
                          The intermediate price after Early Bird period ends.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="secondPhaseEndDate"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel className="text-amber-300">Second Phase End Date</FormLabel>
                        <DatePicker
                          date={field.value || undefined}
                          setDate={field.onChange}
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                        />
                        <FormDescription className="text-amber-200/60">
                          When this phase ends and pricing moves to Last Phase.
                        </FormDescription>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Last Phase Pricing */}
                <FormField
                  control={form.control}
                  name="lastPhasePrice"
                  render={({ field }) => (
                    <FormItem className="mt-6">
                      <FormLabel className="text-amber-300">Last Phase Price</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="e.g., 250 MAD or 25 EUR"
                          {...field} 
                          className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                        />
                      </FormControl>
                      <FormDescription className="text-amber-200/60">
                        The final price until the event starts (or tickets sell out).
                      </FormDescription>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />
              </TabsContent>
              
              <div className="flex justify-end gap-4 mt-6">
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setLocation("/admin/events")}
                  className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  disabled={form.formState.isSubmitting || isUploading}
                  className="bg-amber-600 hover:bg-amber-700 text-black font-medium"
                >
                  {form.formState.isSubmitting || isUploading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-200" />
                      {isUploading ? "Uploading..." : isEditMode ? "Updating" : "Creating"}
                    </span>
                  ) : (
                    <>{isEditMode ? "Update" : "Create"} Event</>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </Tabs>
      </CardContent>
    </Card>
  );
}