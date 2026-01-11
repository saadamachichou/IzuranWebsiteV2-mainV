import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Plus, Search, Filter, Eye, Edit, Trash2, ShoppingBag, DollarSign, Package, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import ParticleField from "@/components/ui/particle-field";
import { Link, useLocation } from "wouter";
import { Product } from "@shared/schema.ts";

export default function AdminProductsPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all_categories");

  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ["/api/admin/products"],
  });

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all_categories" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Debug: Log imageUrl values specifically
  products.forEach(product => {
    console.log(`Product "${product.name}" imageUrl:`, product.imageUrl);
  });

  const categories = Array.from(new Set(products.map(product => product.category)));

  const deleteProduct = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        toast({
          title: "Success",
          description: "Product archived successfully",
        });
        refetch();
      } else {
        throw new Error('Failed to archive product');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to archive product",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="absolute inset-0 z-0 opacity-20">
          <ParticleField />
        </div>
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-amber-300 text-lg">Loading products...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black font-ami-r">
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 p-8">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <Button 
              variant="outline" 
              onClick={() => setLocation('/admin/dashboard')}
              className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10 mb-6"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight mb-2">Products Management</h1>
            <p className="text-amber-200/60 mb-6">Manage your store products and inventory</p>
            <div className="flex justify-end">
              <Button asChild className="bg-amber-600 hover:bg-amber-700 text-black">
                <Link href="/admin/products/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Link>
              </Button>
            </div>
          </motion.div>

          {/* Filters and Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-amber-400 h-4 w-4" />
                      <Input
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-amber-500/5 border-amber-500/20 text-amber-300 placeholder:text-amber-400/50"
                      />
                    </div>
                  </div>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full sm:w-48 bg-amber-500/5 border-amber-500/20 text-amber-300">
                      <Filter className="mr-2 h-4 w-4 text-amber-400" />
                      <SelectValue placeholder="Filter by category" />
                    </SelectTrigger>
                    <SelectContent className="bg-black border-amber-500/20">
                      <SelectItem value="all_categories" className="text-amber-300 hover:bg-amber-500/10">All Categories</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category} className="text-amber-300 hover:bg-amber-500/10">
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10"
                    onClick={() => refetch()}
                  >
                    Reload
                  </Button>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === "grid" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("grid")}
                      className={`border-amber-500/30 text-amber-300 ${viewMode === "grid" ? "bg-[#ffaa00e6]" : ""}`}
                    >
                      Grid
                    </Button>
                    <Button
                      variant={viewMode === "table" ? "default" : "outline"}
                      size="sm"
                      onClick={() => setViewMode("table")}
                      className={`border-amber-500/30 text-amber-300 ${viewMode === "table" ? "bg-[#ffaa00e6]" : ""}`}
                    >
                      Table
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Results Count */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-6"
          >
            <p className="text-amber-200/60">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </motion.div>

          {/* Grid View */}
          {viewMode === "grid" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.1 * index }}
                >
                  <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl hover:border-amber-500/40 transition-colors h-full">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex gap-2">
                          <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            {product.category}
                          </Badge>

                        </div>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                            <Link href={`/shop/${product.slug}`}>
                              <Eye className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                            <Link href={`/admin/products/${product.id}/edit`}>
                              <Edit className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="text-red-400 hover:bg-red-500/10"
                            onClick={() => deleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="aspect-square mb-4 bg-amber-500/10 rounded-lg overflow-hidden">
                        <img
                          src={product.imageUrl || '/placeholder.svg'}
                          alt={product.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.src = "/placeholder.svg";
                          }}
                        />
                      </div>
                      
                      <h3 className="text-lg font-semibold text-amber-300 mb-2 line-clamp-2">
                        {product.name}
                      </h3>
                      
                      <p className="text-amber-200/70 text-sm mb-4 line-clamp-3">
                        {product.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-semibold">
                            {product.price}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Package className="w-3 h-3 text-amber-400" />
                          <span className="text-amber-400 text-sm">{product.category}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Table View */}
          {viewMode === "table" && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-amber-500/20">
                          <th className="text-left p-4 text-amber-300 font-medium">Product</th>
                          <th className="text-left p-4 text-amber-300 font-medium">Category</th>
                          <th className="text-left p-4 text-amber-300 font-medium">Price</th>
                          <th className="text-left p-4 text-amber-300 font-medium">Stock</th>
                          <th className="text-left p-4 text-amber-300 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredProducts.map((product) => (
                          <tr key={product.id} className="border-b border-amber-500/10 hover:bg-amber-500/5">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-lg bg-amber-500/10 overflow-hidden">
                                  <img
                                    src={product.imageUrl || '/placeholder.svg'}
                                    alt={product.name}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      e.currentTarget.src = "/placeholder.svg";
                                    }}
                                  />
                                </div>
                                <div>
                                  <div className="text-amber-300 font-medium">{product.name}</div>
                                  <div className="text-amber-200/60 text-sm truncate max-w-48">
                                    {product.description}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                                  {product.category}
                                </Badge>

                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4 text-green-400" />
                                <span className="text-green-400 font-semibold">
                                  {product.price}
                                </span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-1">
                                <Package className="w-4 h-4 text-amber-400" />
                                <span className="text-amber-200/70">Available</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex gap-1">
                                <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                                  <Link href={`/shop/${product.slug}`}>
                                    <Eye className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button size="sm" variant="ghost" className="text-amber-400 hover:bg-amber-500/10" asChild>
                                  <Link href={`/admin/products/${product.id}/edit`}>
                                    <Edit className="h-4 w-4" />
                                  </Link>
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  className="text-red-400 hover:bg-red-500/10"
                                  onClick={() => deleteProduct(product.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredProducts.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-center py-12"
            >
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardContent className="p-12">
                  <ShoppingBag className="w-16 h-16 text-amber-400/50 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-amber-300 mb-2">No products found</h3>
                  <p className="text-amber-200/60 mb-6">
                    {searchTerm || categoryFilter !== "all_categories"
                      ? "Try adjusting your search or filter criteria"
                      : "Create your first product to get started"
                    }
                  </p>
                  <Button asChild className="bg-amber-600 hover:bg-amber-700 text-black">
                    <Link href="/admin/products/new">
                      <Plus className="mr-2 h-4 w-4" />
                      Create Product
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}