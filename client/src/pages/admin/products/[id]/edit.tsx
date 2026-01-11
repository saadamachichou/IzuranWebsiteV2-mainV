import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet";
import { useQuery } from "@tanstack/react-query";
import { ProductForm } from "@/components/admin/ProductForm";
import { Product } from "@shared/schema";
import { Loader2, ArrowLeft } from "lucide-react";

export default function EditProductPage() {
  const { id } = useParams();
  const productId = parseInt(id as string);

  // Fetch product details
  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/admin/products/${productId}`],
    queryFn: async () => {
      const res = await fetch(`/api/admin/products/${productId}`, {
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error("Failed to fetch product");
      }
      return res.json();
    },
    enabled: !!productId && !isNaN(productId),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black p-8">
      <Helmet>
        <title>Edit Product | Izuran Admin</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/products" className="text-amber-400 hover:text-amber-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Edit Product
            </h1>
            <p className="text-amber-200/60 mt-2">
              Update product information and details
            </p>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center min-h-[300px]">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          </div>
        ) : error ? (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-md border border-red-500/20">
            Error loading product: {error instanceof Error ? error.message : "Unknown error"}
          </div>
        ) : product ? (
          <ProductForm product={product} isEdit={true} />
        ) : (
          <div className="bg-red-500/10 text-red-400 p-4 rounded-md border border-red-500/20">
            Product not found
          </div>
        )}
      </div>
    </div>
  );
}