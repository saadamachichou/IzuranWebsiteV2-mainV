import { Helmet } from "react-helmet";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";
import { ProductForm } from "@/components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="min-h-screen bg-black p-8">
      <Helmet>
        <title>Add New Product | Izuran Admin</title>
      </Helmet>
      
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/products" className="text-amber-400 hover:text-amber-300 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent">
              Add New Product
            </h1>
            <p className="text-amber-200/60 mt-2">
              Create a new product for the Izuran shop
            </p>
          </div>
        </div>
        
        <ProductForm />
      </div>
    </div>
  );
}