import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Product } from '@shared/schema';
import { ProductForm } from '@/components/admin/ProductForm';
import ProductCard from '@/components/shop/ProductCard';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Loader2, Plus, Edit, Trash2 } from 'lucide-react';

export default function ShopManageProductsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: products = [], isLoading, refetch } = useQuery<Product[]>({
    queryKey: ['/api/admin/products'],
  });

  const handleEdit = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleAdd = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    try {
      const response = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        toast({ title: 'Success', description: 'Product archived successfully' });
        refetch();
      } else {
        throw new Error('Failed to archive product');
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to archive product', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-amber-600" />
        <span className="ml-2 text-lg text-amber-800 dark:text-amber-200">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-amber-700">Manage Shop Products</h1>
        <Button onClick={handleAdd} className="bg-amber-600 hover:bg-amber-700 text-black">
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>
      {showForm && (
        <div className="mb-8">
          <ProductForm
            product={editingProduct || undefined}
            isEdit={!!editingProduct}
          />
          <Button onClick={() => setShowForm(false)} variant="outline" className="mt-4">Cancel</Button>
        </div>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.filter(p => !p.archived).map(product => (
          <div key={product.id} className="relative group">
            <ProductCard product={product} />
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button size="icon" variant="outline" onClick={() => handleEdit(product)}><Edit className="h-4 w-4" /></Button>
              <Button size="icon" variant="destructive" onClick={() => handleDelete(product.id)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 