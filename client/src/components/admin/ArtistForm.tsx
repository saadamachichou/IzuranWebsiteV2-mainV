import { useState, useEffect, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Artist, artistsInsertSchema } from "@shared/schema";
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
import { Loader2 } from "lucide-react";
import slugify from "slugify";
import { DESCRIPTION_LIMIT } from "@/lib/text-utils";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DescriptionInput } from "@/components/ui/DescriptionInput";
import { UploadCloud, X } from "lucide-react";

// Create a form schema based on the artistsInsertSchema but make id optional for new artists
const formSchema = artistsInsertSchema.extend({
  id: z.number().optional(),
  facebook: z.string().nullable(),
});

type ArtistFormValues = z.infer<typeof formSchema>;

interface ArtistFormProps {
  artist?: Artist;
  isEditing?: boolean;
}

export default function ArtistForm({ artist, isEditing = false }: ArtistFormProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(artist?.image_Url || null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Log artist data to debug
  console.log('ArtistForm received artist prop:', artist);
  console.log('isEditing prop:', isEditing);

  // Initialize form with existing artist data or defaults
  const form = useForm<ArtistFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: artist?.id,
      name: artist?.name || "",
      slug: artist?.slug || "",
      description: artist?.description || "",
      image_Url: artist?.image_Url || "",
      instagram: artist?.instagram || null,
      soundcloud: artist?.soundcloud || null,
      bandcamp: artist?.bandcamp || null,
      linktree: artist?.linktree || null,
      facebook: artist?.facebook || null,
      createdAt: artist?.createdAt || new Date(),
    },
  });

  // Auto-generate slug from name on every name change
  useEffect(() => {
    const subscription = form.watch((values, { name }) => {
      if (name === 'name' && values.name) {
        const generatedSlug = slugify(values.name, {
          lower: true,
          strict: true,
          trim: true
        });
        form.setValue('slug', generatedSlug, { shouldValidate: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Update form with new artist data when artist prop changes
  useEffect(() => {
    if (artist) {
      console.log("Updating form with artist data:", artist);
      form.reset({
        id: artist.id,
        name: artist.name || "",
        slug: artist.slug || "",
        description: artist.description || "",
        image_Url: artist.image_Url || "",
        instagram: artist.instagram || null,
        soundcloud: artist.soundcloud || null,
        bandcamp: artist.bandcamp || null,
        linktree: artist.linktree || null,
        facebook: artist.facebook || null,
        createdAt: artist.createdAt || new Date(),
      });
    }
  }, [artist, form]);

  async function onSubmit(values: ArtistFormValues) {
    setIsSubmitting(true);
    try {
      // For new artists, generate a slug from the name if not provided
      if (!values.slug) {
        values.slug = values.name
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");
      }
      
      // Remove createdAt from values to let the database handle it
      const formValues = { ...values };
      delete formValues.createdAt;

      // Better debug information
      console.log('Form submission values:', formValues);
      console.log('isEditing:', isEditing);
      console.log('artist id:', artist?.id);
      console.log('Current artist name before update:', artist?.name);
      console.log('New name being submitted:', formValues.name);

      const url = isEditing ? `/api/artists/${artist?.id}` : "/api/artists";
      const method = isEditing ? "PUT" : "POST";
      
      console.log('Request URL:', url);
      console.log('Request Method:', method);
      console.log('Request body:', JSON.stringify(formValues, null, 2));

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(formValues),
      });

      console.log('Response status:', response.status);
      
      const responseData = await response.json();
      console.log('Response data:', responseData);

      if (!response.ok) {
        throw new Error(responseData.message || "Failed to save artist");
      }

      toast({
        title: "Success",
        description: isEditing
          ? "Artist updated successfully"
          : "Artist created successfully",
      });

      // Redirect back to artists page
      setLocation("/admin/artists");
    } catch (error) {
      console.error("Error saving artist:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  // Manual form handling for troubleshooting
  const manualSubmit = () => {
    console.log("Manual submit triggered");
    console.log("Current form values:", form.getValues());
    
    // Get the form values
    const values = form.getValues();
    onSubmit(values);
  };

  // Restore original image upload and preview logic for artists, using image_Url
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
      const response = await fetch('/api/admin/artists/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      // Always set the full path for the image URL
      const image_Url = data.imageUrl.startsWith('/uploads/') ? data.imageUrl : `/uploads/artist_images/${data.imageUrl}`;
      form.setValue('image_Url', image_Url);
      setImagePreview(image_Url);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "Failed to upload image. Please try again.",
        variant: "destructive",
      });
      setImagePreview(null);
      form.setValue('image_Url', '');
    } finally {
      setIsUploading(false);
    }
  };

  // Drag & drop and clear logic
  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };
  const clearImage = () => {
    form.setValue("image_Url", "");
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Form {...form}>
      <div className="space-y-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" id="artist-form">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">Name</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Artist name" 
                    {...field} 
                    className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" 
                  />
                </FormControl>
                <FormDescription className="text-amber-200/60">
                  The name of the artist or group.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          {/* Slug is auto-generated and hidden from the UI, but always submitted */}
          <input type="hidden" {...form.register('slug')} />

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
                    placeholder="A detailed description of the artist, their style, and background."
                    id="artist-description"
                  />
                </FormControl>
                <FormDescription className="text-amber-200/60">
                  Provide a detailed description of the artist.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="image_Url"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">Artist Image</FormLabel>
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
                    <p className="text-amber-200/60 text-sm mt-2">
                      {imagePreview && imagePreview.startsWith('data:')
                        ? `Selected file: ${fileInputRef.current?.files?.[0]?.name || ''}`
                        : imagePreview
                          ? `Using URL: ${imagePreview}`
                          : ''}
                      {isUploading && <span className="ml-2 text-amber-400">Uploading...</span>}
                    </p>
                    <Input
                      {...field}
                      placeholder="Alternatively, enter image URL (e.g., https://example.com/image.jpg)"
                      className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                      disabled={isUploading || (!!imagePreview && imagePreview.startsWith('data:'))}
                      value={field.value || ''}
                      onChange={(e) => {
                        field.onChange(e);
                        if (imagePreview && imagePreview.startsWith('data:')) {
                          if (e.target.value) {
                            setImagePreview(e.target.value);
                            if (fileInputRef.current) {
                              fileInputRef.current.value = "";
                            }
                          } else {
                            setImagePreview(null);
                          }
                        } else {
                          if (e.target.value) {
                            setImagePreview(e.target.value);
                          } else {
                            setImagePreview(null);
                          }
                        }
                      }}
                    />
                    <FormDescription className="text-amber-200/60">
                      Recommended image aspect ratio: 1:1 for optimal display.
                    </FormDescription>
                  </div>
                </FormControl>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="facebook"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">Facebook Profile URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://facebook.com/yourprofile"
                    {...field}
                    value={field.value || ""}
                    className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  />
                </FormControl>
                <FormDescription className="text-amber-200/60">
                  Optional: Link to the artist's Facebook profile.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="instagram"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">Instagram Profile URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://instagram.com/yourprofile"
                    {...field}
                    value={field.value || ""}
                    className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  />
                </FormControl>
                <FormDescription className="text-amber-200/60">
                  Optional: Link to the artist's Instagram profile.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="soundcloud"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">SoundCloud Profile URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://soundcloud.com/yourprofile"
                    {...field}
                    value={field.value || ""}
                    className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  />
                </FormControl>
                <FormDescription className="text-amber-200/60">
                  Optional: Link to the artist's SoundCloud profile.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bandcamp"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">Bandcamp Profile URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://yourband.bandcamp.com"
                    {...field}
                    value={field.value || ""}
                    className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  />
                </FormControl>
                <FormDescription className="text-amber-200/60">
                  Optional: Link to the artist's Bandcamp profile.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="linktree"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">Linktree Profile URL</FormLabel>
                <FormControl>
                  <Input
                    placeholder="https://linktr.ee/yourprofile"
                    {...field}
                    value={field.value || ""}
                    className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  />
                </FormControl>
                <FormDescription className="text-amber-200/60">
                  Optional: Link to the artist's Linktree profile.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setLocation("/admin/artists")}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
            >
              Cancel
            </Button>
            <Button 
              type="button" 
              variant="default"
              onClick={manualSubmit}
              disabled={isSubmitting}
              className="bg-amber-600 hover:bg-amber-700 text-black font-medium"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Artist"
              )}
            </Button>
          </div>
        </form>
      </div>
    </Form>
  );
}