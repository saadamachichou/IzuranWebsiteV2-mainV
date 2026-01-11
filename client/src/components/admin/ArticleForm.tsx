import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLocation } from "wouter";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Article } from "@shared/schema";

// Define our form schema with Zod
const formSchema = z.object({
  id: z.number().optional(),
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  imageUrl: z.string()
    .optional()
    .refine(value => {
      if (!value || value.trim() === '') return true; // Allow empty
      return value.startsWith('/') || value.startsWith('http://') || value.startsWith('https://');
    }, "Please enter a valid image URL or a relative path (e.g., /uploads/image.jpg) or leave empty"),
  category: z.string().min(1, "Category is required"),
  publishDate: z.date(),
  createdAt: z.date(),
});

type ArticleFormValues = z.infer<typeof formSchema>;

interface ArticleFormProps {
  article?: Article;
  isEditing?: boolean;
}

export default function ArticleForm({ article, isEditing = false }: ArticleFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(article?.imageUrl || null);

  // Initialize form with existing article data or defaults
  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: article?.id,
      title: article?.title || "",
      slug: article?.slug || "",
      content: article?.content || "",
      imageUrl: article?.imageUrl || "",
      category: article?.category || "culture",
      publishDate: article?.publishDate ? new Date(article.publishDate) : new Date(),
      createdAt: article?.createdAt ? new Date(article.createdAt) : new Date(),
    },
  });

  async function onSubmit(values: ArticleFormValues) {
    setIsSubmitting(true);
    try {
      // For new articles, generate a slug from the title if not provided
      if (!values.slug) {
        values.slug = values.title
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");
      }

      // Generate current timestamp for createdAt if not present
      if (!values.createdAt) {
        values.createdAt = new Date();
      }

      const url = isEditing ? `/api/admin/articles/${article?.id}` : "/api/admin/articles";
      const method = isEditing ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Article creation error:', errorData);
        
        // Show specific validation errors if available
        let errorMessage = errorData.message || "Failed to save article";
        if (errorData.errors && errorData.errors.length > 0) {
          const specificErrors = errorData.errors.map((err: any) => `${err.path?.join('.') || 'field'}: ${err.message}`).join(', ');
          errorMessage = `Validation errors: ${specificErrors}`;
        } else if (errorData.details) {
          errorMessage = errorData.details;
        }
        
        throw new Error(errorMessage);
      }

      toast({
        title: "Success",
        description: isEditing
          ? "Article updated successfully"
          : "Article created successfully",
      });

      // Redirect back to articles page
      setLocation("/admin/articles");
    } catch (error) {
      console.error("Error saving article:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload the file
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/admin/articles/upload-image', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('Failed to upload image');
        }

        const data = await response.json();
        // Set the full path for the image URL
        const imageUrl = `/uploads/article_images/${data.filename}`;
        form.setValue('imageUrl', imageUrl);
        setImagePreview(imageUrl);
      } catch (error) {
        console.error('Error uploading image:', error);
        toast({
          title: 'Error',
          description: 'Failed to upload image. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Article Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Article title" 
                  className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The title of the article.
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
                  placeholder="article-title" 
                  className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                URL-friendly version of the title. Leave blank to auto-generate from title.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="content"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Content</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Article content..." 
                  className="min-h-48 bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400"
                  {...field} 
                />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The main content of the article. Supports markdown formatting.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-amber-300">Category</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent className="bg-black border border-amber-500/20 text-amber-300">
                    <SelectItem value="music" className="hover:bg-amber-500/10">Music</SelectItem>
                    <SelectItem value="culture" className="hover:bg-amber-500/10">Culture</SelectItem>
                    <SelectItem value="history" className="hover:bg-amber-500/10">History</SelectItem>
                    <SelectItem value="art" className="hover:bg-amber-500/10">Art</SelectItem>
                    <SelectItem value="spirituality" className="hover:bg-amber-500/10">Spirituality</SelectItem>
                    <SelectItem value="other" className="hover:bg-amber-500/10">Other</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription className="text-amber-200/60">
                  The category of the article.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="publishDate"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel className="text-amber-300">Publish Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full pl-3 text-left font-normal bg-black/60 border-amber-500/20 text-amber-300 hover:bg-amber-500/10 hover:text-amber-300",
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
                      initialFocus
                      className="text-amber-300"
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription className="text-amber-200/60">
                  The date the article will be published.
                </FormDescription>
                <FormMessage className="text-red-400" />
              </FormItem>
            )}
          />
        </div>

        {/* Article Image Field */}
        <FormField
          control={form.control}
          name="imageUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Article Image</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="cursor-pointer bg-black/60 border-amber-500/20 text-amber-300"
                  />
                  {imagePreview && (
                    <div className="relative w-48 h-48">
                      <img
                        src={imagePreview}
                        alt="Article preview"
                        className="w-full h-full object-cover rounded-lg"
                      />
                    </div>
                  )}
                  <Input
                    type="hidden"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-amber-200/60">
                Upload an image for your article.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <Button 
          type="submit" 
          className="w-full bg-amber-500 text-black hover:bg-amber-600"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <span>{isEditing ? "Save Changes" : "Create Article"}</span>
          )}
        </Button>
      </form>
    </Form>
  );
}