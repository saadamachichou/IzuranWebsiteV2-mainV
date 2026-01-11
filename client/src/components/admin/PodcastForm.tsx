import { useEffect, useState } from "react";
import { format } from "date-fns";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Loader2, CalendarIcon, UploadCloud, X, Link, Code } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Podcast } from "@shared/schema";
import { api } from '@/lib/api';

// Define our form schema with Zod
const formSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  coverUrl: z.string().nullable().optional(),
  audioUrl: z.string().min(1, "Audio source is required"),
  artistName: z.string().min(2, "Artist name is required"),
  duration: z.string().min(1, "Duration is required"),
  genre: z.string().min(1, "Genre is required"),
  createdAt: z.date(),
});

type PodcastFormValues = z.infer<typeof formSchema>;

interface PodcastFormProps {
  podcast?: PodcastFormValues;
  isEditing?: boolean;
  onSuccess?: () => void;
}

export default function PodcastForm({ podcast, isEditing = false, onSuccess }: PodcastFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [audioInputType, setAudioInputType] = useState<'url' | 'embed'>('url');

  console.log("PodcastForm render - podcast prop:", podcast);
  console.log("PodcastForm render - isEditing:", isEditing);

  const form = useForm<PodcastFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: podcast?.id,
      title: podcast?.title || "",
      slug: podcast?.slug || "",
      description: podcast?.description || "",
      coverUrl: podcast?.coverUrl || null,
      audioUrl: podcast?.audioUrl || "",
      artistName: podcast?.artistName || "",
      duration: podcast?.duration || "",
      genre: podcast?.genre || "music",
      createdAt: podcast?.createdAt ? new Date(podcast.createdAt) : new Date(),
    },
  });

  // Reset form with new podcast data when it changes (e.g., on initial load or if switching podcasts)
  useEffect(() => {
    if (podcast) {
      console.log("PodcastForm useEffect - podcast data received:", podcast);
      
      // Ensure we have the correct field mappings
      const formData = {
        id: podcast!.id,
        title: podcast!.title || "",
        slug: podcast!.slug || "",
        description: podcast!.description || "",
        coverUrl: podcast!.coverUrl || null,
        audioUrl: podcast!.audioUrl || "",
        artistName: podcast!.artistName || "",
        duration: podcast!.duration || "",
        genre: podcast!.genre || "music",
        createdAt: podcast!.createdAt ? new Date(podcast!.createdAt) : new Date(),
      };
      
      console.log("PodcastForm useEffect - resetting form with data:", formData);
      
      // Reset the form with the podcast data
      form.reset(formData);
      
      // Set the image preview
      if (podcast!.coverUrl) {
        console.log("PodcastForm useEffect - setting image preview:", podcast!.coverUrl);
        setImagePreview(podcast!.coverUrl);
      } else {
        setImagePreview(null);
      }

      // Detect audio input type based on existing data
      if (podcast!.audioUrl) {
        const isEmbedCode = podcast!.audioUrl.includes('<iframe') || podcast!.audioUrl.includes('<embed') || podcast!.audioUrl.includes('<object');
        setAudioInputType(isEmbedCode ? 'embed' : 'url');
      }
      
      // Debug: Check form values after reset
      setTimeout(() => {
        const currentValues = form.getValues();
        console.log("PodcastForm useEffect - form values after reset:", currentValues);
        console.log("PodcastForm useEffect - imagePreview state:", imagePreview);
      }, 100);
    }
  }, [podcast, form]);

  // Debug: Log form values on every render
  useEffect(() => {
    console.log("PodcastForm - current form values:", form.getValues());
  });

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
      const response = await fetch('/api/admin/podcasts/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      // The server returns a filename, so we need to construct the full URL
      form.setValue('coverUrl', `/uploads/podcast_images/${data.filename}`);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setImagePreview(null);
      form.setValue('coverUrl', '');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: PodcastFormValues) => {
    console.log('PodcastForm: onSubmit triggered!');
    try {
      setIsSubmitting(true);
      console.log('Form submission started');
      console.log('Form data:', data);
      console.log('Is editing:', isEditing);
      console.log('Podcast ID:', podcast?.id);
      console.log('Audio input type:', audioInputType);
      console.log('Audio URL value:', data.audioUrl);

      // Ensure we have a valid ID when editing
      if (isEditing && !podcast?.id) {
        console.error('No podcast ID found for update');
        throw new Error('No podcast ID found for update');
      }

      const url = isEditing 
        ? `/admin/podcasts/${podcast?.id}`
        : '/admin/podcasts';
      
      console.log('Making request to:', url);
      console.log('Request method:', isEditing ? 'PUT' : 'POST');

      // Prepare the data for submission
      const submitData = {
        ...data,
        // If we're editing, include the ID
        ...(isEditing && podcast?.id ? { id: podcast.id } : {}),
        // Handle coverUrl - if it's a full URL, keep it, otherwise it's already handled by the image upload
        coverUrl: data.coverUrl?.startsWith('http') ? data.coverUrl : data.coverUrl,
        // Ensure slug is provided (generate from title if not provided)
        slug: data.slug || data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''),
        // Convert createdAt to ISO string for proper serialization
        createdAt: data.createdAt ? data.createdAt.toISOString() : new Date().toISOString(),
      };

      console.log('Submit data being sent to server:', JSON.stringify(submitData, null, 2));
      console.log('Audio input type:', audioInputType);
      console.log('Audio URL value:', submitData.audioUrl);

      const response = await api({
        url,
        method: isEditing ? 'PUT' : 'POST',
        data: submitData
      });

      console.log('Response data:', response.data);

      toast({
        title: isEditing ? "Podcast Updated" : "Podcast Created",
        description: isEditing 
          ? "Your podcast has been updated successfully."
          : "Your podcast has been created successfully.",
      });

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Navigate back to podcasts list
      setLocation('/admin/podcasts');
    } catch (error: any) {
      console.error('Error saving podcast:', error);
      
      // Enhanced error handling to show validation errors
      let errorMessage = "Failed to save podcast";
      
      if (error.response?.data) {
        const responseData = error.response.data;
        console.log('Full error response:', responseData);
        
        if (responseData.errors && Array.isArray(responseData.errors)) {
          errorMessage = `Validation errors: ${responseData.errors.map((e: any) => e.message || e).join(', ')}`;
        } else if (responseData.error?.errors && Array.isArray(responseData.error.errors)) {
          errorMessage = `Validation errors: ${responseData.error.errors.map((e: any) => e.message || e).join(', ')}`;
        } else if (responseData.details) {
          errorMessage = responseData.details;
        } else if (responseData.message) {
          errorMessage = responseData.message;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Add a hidden field for the ID when editing */}
        {isEditing && podcast?.id && (
          <input type="hidden" name="id" value={podcast.id} />
        )}

        {/* Image Upload Section */}
        <div className="space-y-4">
          <FormLabel className="text-amber-300">Cover Image</FormLabel>
          <div className="flex flex-col items-center gap-4">
            {imagePreview ? (
              <div className="relative w-full max-w-md aspect-video rounded-lg overflow-hidden border border-amber-500/20">
                <img
                  src={imagePreview}
                  alt="Cover preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error("Image failed to load:", imagePreview);
                    e.currentTarget.style.display = 'none';
                    setImagePreview(null);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    form.setValue('coverUrl', '');
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-md aspect-video rounded-lg border-2 border-dashed border-amber-500/20 flex flex-col items-center justify-center p-6 hover:border-amber-500/40 transition-colors">
                <UploadCloud className="h-10 w-10 text-amber-400 mb-2" />
                <p className="text-sm text-amber-200/60 text-center">
                  Click to upload or drag and drop
                </p>
                <p className="text-xs text-amber-200/40 mt-1">
                  PNG, JPG, GIF up to 10MB
                </p>
              </div>
            )}
            <Input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
              id="cover-image"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('cover-image')?.click()}
              disabled={isUploading}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-2 h-4 w-4" />
                  {imagePreview ? 'Change Image' : 'Upload Image'}
                </>
              )}
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Podcast Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Podcast title" 
                  {...field} 
                  className="bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/40"
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The title of the podcast episode.
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
                  placeholder="podcast-title" 
                  {...field} 
                  className="bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/40"
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The URL-friendly version of the title.
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
                <Textarea 
                  placeholder="Podcast description" 
                  {...field} 
                  className="bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/40 min-h-[100px]"
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                A detailed description of the podcast episode.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="audioUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Audio Source</FormLabel>
              <div className="flex gap-2 mb-2">
                <button
                  type="button"
                  onClick={() => setAudioInputType('url')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    audioInputType === 'url'
                      ? 'bg-amber-500 text-black'
                      : 'bg-black/40 border border-amber-500/20 text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <Link className="h-4 w-4" />
                  URL
                </button>
                <button
                  type="button"
                  onClick={() => setAudioInputType('embed')}
                  className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    audioInputType === 'embed'
                      ? 'bg-amber-500 text-black'
                      : 'bg-black/40 border border-amber-500/20 text-amber-300 hover:bg-amber-500/10'
                  }`}
                >
                  <Code className="h-4 w-4" />
                  Embed Code
                </button>
              </div>
              <FormControl>
                {audioInputType === 'url' ? (
                  <Input 
                    placeholder="https://example.com/audio.mp3" 
                    {...field} 
                    className="bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/40"
                  />
                ) : (
                  <Textarea 
                    placeholder="<iframe src='https://w.soundcloud.com/player/?url=...' width='100%' height='300' frameborder='no'></iframe>" 
                    {...field} 
                    className="bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/40 min-h-[120px] font-mono text-sm"
                  />
                )}
              </FormControl>
              <FormDescription className="text-amber-200/60">
                {audioInputType === 'url' 
                  ? "The URL to the podcast audio file or streaming service."
                  : "Paste the full embed code (iframe) from SoundCloud, YouTube, or other platforms."
                }
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="artistName"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Artist Name</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Artist name" 
                  {...field} 
                  className="bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/40"
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The name of the artist or host.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="duration"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Duration</FormLabel>
              <FormControl>
                <Input 
                  placeholder="1:30:00" 
                  {...field} 
                  className="bg-black/40 border-amber-500/20 text-amber-100 placeholder:text-amber-400/50 focus:border-amber-500/40"
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The duration of the podcast episode (e.g., 1:30:00 for 1 hour and 30 minutes).
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="genre"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Genre</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-black/40 border-amber-500/20 text-amber-100 focus:border-amber-500/40">
                    <SelectValue placeholder="Select a genre" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-black border-amber-500/20">
                  <SelectItem value="music">Music</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="talk">Talk Show</SelectItem>
                  <SelectItem value="news">News</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-amber-200/60">
                The genre of the podcast episode.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="createdAt"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel className="text-amber-300">Release Date</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-[240px] pl-3 text-left font-normal bg-black/40 border-amber-500/20 text-amber-100 hover:bg-amber-500/10",
                        !field.value && "text-muted-foreground"
                      )}
                    >
                      {field.value ? (
                        format(field.value, "PPP")
                      ) : (
                        <span>Pick a date</span>
                      )}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-black border-amber-500/20" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value}
                    onSelect={field.onChange}
                    disabled={(date) =>
                      date > new Date() || date < new Date("1900-01-01")
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <FormDescription className="text-amber-200/60">
                The release date of the podcast episode.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          disabled={isSubmitting}
          className="w-full bg-amber-500 text-black hover:bg-amber-400"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEditing ? "Update Podcast" : "Create Podcast"
          )}
        </Button>
      </form>
    </Form>
  );
}