import { useEffect, useState, useRef } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useLocation } from "wouter";
import { Loader2, UploadCloud, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Product } from "@shared/schema";

const productSchema = z.object({
  id: z.number().optional(),
  name: z.string().min(3, "Name must be at least 3 characters"),
  slug: z.string().optional(),
  description: z.string().min(10, "Description must be at least 10 characters"),
  imageUrl: z.string().nullable().optional(),
  price: z.coerce.number().positive("Price must be greater than 0"),
  currency: z.string().min(3, "Currency code must be 3 characters").max(3, "Currency code must be 3 characters"),
  category: z.enum(["vinyl", "digital", "merch", "clothing", "accessories", "other"]),
  productType: z.enum(["physical", "digital"]),
  artistName: z.string().optional(),
  stockLevel: z.coerce.number().min(0, "Stock level must be 0 or greater"),
  isNewRelease: z.boolean().optional(),
  cmiProductId: z.string().optional(),
  paypalProductId: z.string().optional(),
  digitalFileUrl: z.string().optional(),
});

type ProductFormValues = z.infer<typeof productSchema>;

interface ProductFormProps {
  product?: ProductFormValues;
  isEdit?: boolean;
  onSuccess?: () => void;
}

export function ProductForm({ product, isEdit = false, onSuccess }: ProductFormProps) {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      id: product?.id,
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      imageUrl: product?.imageUrl || "",
      price: product?.price || 0,
      currency: product?.currency || "MAD",
      category: product?.category || "merch",
      productType: product?.productType || "physical",
      artistName: product?.artistName || "",
      stockLevel: product?.stockLevel || 0,
      isNewRelease: product?.isNewRelease || false,
      cmiProductId: product?.cmiProductId ?? "",
      paypalProductId: product?.paypalProductId ?? "",
      digitalFileUrl: product?.digitalFileUrl ?? "",
    },
  });

  // Use form.watch to always reflect the current imageUrl
  const watchedImageUrl = form.watch("imageUrl");
  const [isUploading, setIsUploading] = useState(false);
  const initialProductId = useRef(product?.id);

  // Auto-generate slug from name
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'name' && value.name) {
        const generatedSlug = value.name
          .toLowerCase()
          .replace(/[^\w\s]/gi, "")
          .replace(/\s+/g, "-");
        form.setValue('slug', generatedSlug);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Only reset form when product ID changes
  useEffect(() => {
    // Only reset if the product ID changes (i.e., new product loaded)
    if (product && product.id !== initialProductId.current) {
      form.reset({
        ...product,
        imageUrl: product.imageUrl || "",
        cmiProductId: product.cmiProductId ?? "",
        paypalProductId: product.paypalProductId ?? "",
        digitalFileUrl: product.digitalFileUrl ?? "",
      });
      // No need to set imagePreview, use watchedImageUrl
      initialProductId.current = product.id;
    }
    // Only run when product ID changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('image', file);

    try {
      setIsUploading(true);
      const response = await fetch('/api/admin/products/upload-image', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to upload image');
      const data = await response.json();
      // Set the full path for the image URL
      form.setValue('imageUrl', `/uploads/product_images/${data.filename}`);
    } catch (error) {
      form.setValue('imageUrl', '');
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProductFormValues) => {
    try {
      setIsSubmitting(true);
      const url = isEdit ? `/api/admin/products/${product?.id}` : '/api/admin/products';
      const method = isEdit ? 'PUT' : 'POST';
      const submitData = {
        ...data,
        imageUrl: data.imageUrl || null,
        cmiProductId: data.cmiProductId ?? '',
        paypalProductId: data.paypalProductId ?? '',
        digitalFileUrl: data.digitalFileUrl ?? '',
      };
      
      console.log('Submitting product data:', submitData);
      console.log('URL:', url);
      console.log('Method:', method);
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(submitData),
      });
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.message || 'Failed to save product');
      }
      
      const result = await response.json();
      console.log('Success response:', result);
      
      toast({
        title: isEdit ? "Product Updated" : "Product Created",
        description: isEdit ? "Product updated successfully." : "Product created successfully.",
      });
      if (onSuccess) onSuccess();
      setLocation('/admin/products');
    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save product",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Image Upload Section */}
        <div className="space-y-4">
          <FormLabel className="text-amber-300">Product Image</FormLabel>
          <div className="flex flex-col items-center gap-4">
            {watchedImageUrl ? (
              <div className="relative w-full max-w-xs aspect-square rounded-lg overflow-hidden border border-amber-500/20">
                <img
                  src={watchedImageUrl}
                  alt="Product preview"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                                            e.currentTarget.src = "/placeholder.svg";
                  }}
                />
                <button
                  type="button"
                  onClick={() => form.setValue('imageUrl', '')}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full hover:bg-black/70 transition-colors"
                >
                  <X className="h-4 w-4 text-white" />
                </button>
              </div>
            ) : (
              <div className="w-full max-w-xs aspect-square rounded-lg border-2 border-dashed border-amber-500/20 flex flex-col items-center justify-center p-6 hover:border-amber-500/40 transition-colors">
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
              id="product-image"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => document.getElementById('product-image')?.click()}
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
                  {watchedImageUrl ? 'Change Image' : 'Upload Image'}
                </>
              )}
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Product Name</FormLabel>
              <FormControl>
                <Input placeholder="Product name" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The name of the product.
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
              <FormLabel className="text-amber-300">Slug (URL Path)</FormLabel>
              <FormControl>
                <Input placeholder="product-name-slug" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                URL-friendly unique identifier (auto-generated if empty).
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
                <Textarea placeholder="Product description" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400 min-h-[100px]" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                A detailed description of the product.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="price"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Price</FormLabel>
              <FormControl>
                <Input type="number" min={0} step={0.01} placeholder="Price" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The price of the product.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="currency"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Currency</FormLabel>
              <FormControl>
                <Input placeholder="MAD" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                The currency code (e.g., MAD, USD, EUR).
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-black/60 border-amber-500/20 text-amber-300 focus:border-amber-400 focus:ring-amber-400">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-black border-amber-500/20">
                  <SelectItem value="vinyl">Vinyl</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="merch">Merch</SelectItem>
                  <SelectItem value="clothing">Clothing</SelectItem>
                  <SelectItem value="accessories">Accessories</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-amber-200/60">
                The category of the product.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="productType"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Product Type</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger className="bg-black/60 border-amber-500/20 text-amber-300 focus:border-amber-400 focus:ring-amber-400">
                    <SelectValue placeholder="Select a type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-black border-amber-500/20">
                  <SelectItem value="physical">Physical</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription className="text-amber-200/60">
                The type of product (physical or digital).
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
              <FormLabel className="text-amber-300">Artist Name (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Artist name" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                If this product is associated with a specific artist.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="stockLevel"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Stock Level</FormLabel>
              <FormControl>
                <Input type="number" min={0} placeholder="Stock level" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                Number of units available in stock.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="isNewRelease"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">New Release</FormLabel>
              <FormControl>
                <input type="checkbox" checked={field.value} onChange={field.onChange} />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                Mark as a new release to highlight it on the site.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="cmiProductId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">CMI Product ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="CMI Product ID" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                For CMI payment gateway integration.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="paypalProductId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">PayPal Product ID (optional)</FormLabel>
              <FormControl>
                <Input placeholder="PayPal Product ID" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                For PayPal integration.
              </FormDescription>
              <FormMessage className="text-red-400" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="digitalFileUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-amber-300">Digital File URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="https://example.com/file.zip" {...field} className="bg-black/60 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50 focus:border-amber-400 focus:ring-amber-400" />
              </FormControl>
              <FormDescription className="text-amber-200/60">
                For digital products, provide a download link.
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
              {isEdit ? "Updating..." : "Creating..."}
            </>
          ) : (
            isEdit ? "Update Product" : "Create Product"
          )}
        </Button>
      </form>
    </Form>
  );
}
