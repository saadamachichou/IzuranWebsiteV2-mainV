import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Product } from '@shared/schema';
import ProductCard from './ProductCard';
import { useToast } from '@/hooks/use-toast';
import { Loader2, FilterX, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLanguage } from '@/context/LanguageContext';
import { motion } from 'framer-motion';

interface ProductListProps {
  onAddToCart?: (product: Product) => void;
  limit?: number;
}

export default function ProductList({ onAddToCart, limit }: ProductListProps) {
  const { toast } = useToast();
  const { t } = useLanguage();
  
  // State for filters
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortOption, setSortOption] = useState<string>('default');
  
  // Query products from API
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['/api/products', categoryFilter],
    queryFn: async () => {
      const url = categoryFilter !== 'all' 
        ? `/api/products?category=${categoryFilter}` 
        : '/api/products';
      
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Failed to fetch products');
      }
      return res.json() as Promise<Product[]>;
    }
  });
  
  // Filter products based on type
  const filteredProducts = products?.filter(product => {
    if (typeFilter === 'all') return true;
    return product.productType === typeFilter;
  });
  
  // Sort products based on selected option
  const sortedProducts = React.useMemo(() => {
    if (!filteredProducts) return [];
    
    const productsCopy = [...filteredProducts];
    
    switch (sortOption) {
      case 'price-asc':
        return productsCopy.sort((a, b) => {
          const aPrice = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const bPrice = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return aPrice - bPrice;
        });
      case 'price-desc':
        return productsCopy.sort((a, b) => {
          const aPrice = typeof a.price === 'string' ? parseFloat(a.price) : a.price;
          const bPrice = typeof b.price === 'string' ? parseFloat(b.price) : b.price;
          return bPrice - aPrice;
        });
      case 'newest':
        return productsCopy.sort((a, b) => {
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return bDate - aDate;
        });
      case 'name-asc':
        return productsCopy.sort((a, b) => a.name.localeCompare(b.name));
      case 'name-desc':
        return productsCopy.sort((a, b) => b.name.localeCompare(a.name));
      default:
        // Show "New Releases" first, then sort by created date
        return productsCopy.sort((a, b) => {
          if (a.isNewRelease && !b.isNewRelease) return -1;
          if (!a.isNewRelease && b.isNewRelease) return 1;
          
          const aDate = new Date(a.createdAt).getTime();
          const bDate = new Date(b.createdAt).getTime();
          return bDate - aDate;
        });
    }
  }, [filteredProducts, sortOption]);
  
  // Handle adding to cart
  const handleAddToCart = (product: Product) => {
    if (onAddToCart) {
      onAddToCart(product);
      toast({
        title: t('Added to Cart'),
        description: `${product.name} ${t('has been added to your cart')}`,
      });
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setCategoryFilter('all');
    setTypeFilter('all');
    setSortOption('default');
  };
  
  // Determine if filters are applied
  const hasActiveFilters = categoryFilter !== 'all' || typeFilter !== 'all' || sortOption !== 'default';
  
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center space-x-3"
        >
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <span className="text-lg text-amber-200 font-medium">{t('Loading products')}...</span>
        </motion.div>
      </div>
    );
  }
  
  if (error) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-red-900/20 to-red-800/10 border border-red-500/30 text-red-200 p-8 rounded-2xl backdrop-blur-sm"
      >
        <h3 className="text-xl font-bold mb-3 flex items-center">
          <Sparkles className="h-5 w-5 mr-2 text-red-400" />
          {t('Error Loading Products')}
        </h3>
        <p className="mb-4 text-red-200/80">{error instanceof Error ? error.message : t('Unknown error occurred')}</p>
        <Button 
          onClick={() => window.location.reload()} 
          className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium"
        >
          {t('Try Again')}
        </Button>
      </motion.div>
    );
  }
  
  // Apply limit if provided
  const displayProducts = limit 
    ? sortedProducts.slice(0, limit)
    : sortedProducts;

  // If limit is provided, display a simplified version without filters
  if (limit) {
    return (
      <div className="space-y-8">
        {/* Product Grid */}
        {displayProducts.length === 0 ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-amber-500/30 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-sm"
          >
            <Sparkles className="h-12 w-12 text-amber-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2 text-amber-200">{t('No Products Found')}</h3>
            <p className="text-amber-200/60 mb-6 text-center max-w-md">
              {t('Check back later for new products!')}
            </p>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ staggerChildren: 0.1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
          >
            {displayProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard 
                  product={product}
                  onAddToCart={onAddToCart ? handleAddToCart : undefined}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    );
  }

  // Full version with filters  
  return (
    <div className="space-y-8">
      {/* Filters and Sort Options */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row gap-6 justify-between items-start md:items-center p-6 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-sm border border-amber-500/20"
      >
        <div className="flex flex-wrap gap-3">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] border-amber-500/50 text-amber-200 bg-black/30 hover:bg-black/50 focus:ring-amber-500 backdrop-blur-sm" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
              <SelectValue placeholder={t('Category')} />
            </SelectTrigger>
            <SelectContent className="border-amber-500/50 bg-black/90 backdrop-blur-sm">
              <SelectItem value="all" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('All Categories')}</SelectItem>
              <SelectItem value="vinyl" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Vinyl</SelectItem>
              <SelectItem value="digital" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>Digital</SelectItem>
              <SelectItem value="merch" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Merchandise')}</SelectItem>
              <SelectItem value="clothing" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Clothing')}</SelectItem>
              <SelectItem value="accessories" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Accessories')}</SelectItem>
              <SelectItem value="other" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Other')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[150px] border-amber-500/50 text-amber-200 bg-black/30 hover:bg-black/50 focus:ring-amber-500 backdrop-blur-sm" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
              <SelectValue placeholder={t('Type')} />
            </SelectTrigger>
            <SelectContent className="border-amber-500/50 bg-black/90 backdrop-blur-sm">
              <SelectItem value="all" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('All Types')}</SelectItem>
              <SelectItem value="physical" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Physical')}</SelectItem>
              <SelectItem value="digital" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Digital')}</SelectItem>
            </SelectContent>
          </Select>
          
          {hasActiveFilters && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <Button 
                variant="outline" 
                size="icon" 
                onClick={clearFilters}
                aria-label={t('Clear filters')}
                className="border-amber-500/50 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 hover:border-amber-400 backdrop-blur-sm"
              >
                <FilterX className="h-4 w-4" />
              </Button>
            </motion.div>
          )}
        </div>
        
        <div className="w-full md:w-auto">
          <Select value={sortOption} onValueChange={setSortOption}>
            <SelectTrigger className="w-full md:w-[200px] border-amber-500/50 text-amber-200 bg-black/30 hover:bg-black/50 focus:ring-amber-500 backdrop-blur-sm" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
              <SelectValue placeholder={t('Sort By')} />
            </SelectTrigger>
            <SelectContent className="border-amber-500/50 bg-black/90 backdrop-blur-sm">
              <SelectItem value="default" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Featured & New')}</SelectItem>
              <SelectItem value="newest" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Newest First')}</SelectItem>
              <SelectItem value="price-asc" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Price: Low to High')}</SelectItem>
              <SelectItem value="price-desc" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Price: High to Low')}</SelectItem>
              <SelectItem value="name-asc" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Name: A to Z')}</SelectItem>
              <SelectItem value="name-desc" className="hover:bg-amber-500/20 text-amber-200" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{t('Name: Z to A')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>
      
      {/* Results count */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <Badge variant="outline" className="text-sm px-4 py-2 border-amber-500/50 text-amber-300 bg-amber-500/10 backdrop-blur-sm">
          <Sparkles className="h-3 w-3 mr-2" />
          {displayProducts.length} {t('products found')}
        </Badge>
        
        {hasActiveFilters && (
          <div className="flex gap-2 flex-wrap">
            {categoryFilter !== 'all' && (
              <Badge variant="secondary" className="capitalize bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30">
                {t('Category')}: {categoryFilter}
              </Badge>
            )}
            {typeFilter !== 'all' && (
              <Badge variant="secondary" className="capitalize bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30">
                {t('Type')}: {typeFilter}
              </Badge>
            )}
            {sortOption !== 'default' && (
              <Badge variant="secondary" className="bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 border border-amber-500/30">
                {t('Sorted by')}: {sortOption.replace('-', ' ').replace('asc', 'ascending').replace('desc', 'descending')}
              </Badge>
            )}
          </div>
        )}
      </motion.div>
      
      {/* Product Grid */}
      {displayProducts.length === 0 ? (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 px-4 border border-dashed border-amber-500/30 rounded-2xl bg-gradient-to-br from-amber-500/5 to-transparent backdrop-blur-sm"
        >
          <Sparkles className="h-12 w-12 text-amber-400 mb-4" />
          <h3 className="text-xl font-semibold mb-2 text-amber-200">{t('No Products Found')}</h3>
          <p className="text-amber-200/60 mb-6 text-center max-w-md">
            {t('No products match your current filter criteria. Try adjusting your filters or check back later!')}
          </p>
          <Button 
            onClick={clearFilters}
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium"
          >
            {t('Clear All Filters')}
          </Button>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
        >
          {displayProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <ProductCard 
                product={product}
                onAddToCart={onAddToCart ? handleAddToCart : undefined}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
}