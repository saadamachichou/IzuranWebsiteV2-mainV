import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart, ExternalLink, Star, Package } from 'lucide-react';
import { Product } from '@shared/schema';

// Format price with proper currency symbol
const formatPrice = (price: string | number, currency: string = 'USD') => {
  const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  // Handle display of currency symbols
  let symbol = '';
  switch (currency) {
    case 'USD':
      symbol = '$';
      break;
    case 'EUR':
      symbol = '€';
      break;
    case 'GBP':
      symbol = '£';
      break;
    case 'MAD':
      symbol = 'MAD';
      break;
    default:
      symbol = '$';
      break;
  }
  
  // Format the price
  const formattedPrice = numericPrice.toFixed(2);
  
  // Place the symbol before or after based on currency convention
  return ['USD', 'EUR', 'GBP'].includes(currency) 
    ? `${symbol}${formattedPrice}`
    : `${formattedPrice} ${symbol}`;
};

interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const isOutOfStock = product.productType === 'physical' && product.stockLevel === 0;
  const isNewRelease = product.createdAt && 
    new Date(product.createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="group"
    >
      <Card className="overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-800/60 backdrop-blur-sm border border-amber-500/20 hover:border-amber-500/40 shadow-xl hover:shadow-2xl transition-all duration-300">
        {/* Image Section */}
        <div className="relative overflow-hidden">
          <div className="aspect-[2/3] relative bg-gray-900 overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                loading="lazy"
                onError={(e) => { (e.target as HTMLImageElement).src = '/placeholder.svg'; }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-700">
                <Package className="w-16 h-16 text-amber-400/50" />
              </div>
            )}
          </div>
          
          {/* Badges */}
          <div className="absolute top-4 left-4 flex flex-col gap-2">
            {isNewRelease && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              >
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-black font-semibold border-0 shadow-lg">
                  <Star className="w-3 h-3 mr-1" />
                  New Release
                </Badge>
              </motion.div>
            )}
            
            <Badge className="bg-black/80 backdrop-blur-sm text-amber-200 hover:bg-black/90 border border-amber-500/30 font-medium">
              {product.productType === 'physical' ? 'Physical' : 'Digital'}
            </Badge>
          </div>
        </div>

        {/* Content Section */}
        <CardContent className="p-6 space-y-4">
          {/* Product Info */}
          <div className="space-y-3">
            {/* Category */}
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-xs border-amber-500/30 text-amber-300">
                {product.category}
              </Badge>
            </div>
            
            {/* Product Name */}
            <h3 
              className="font-bold text-xl text-white hover:text-amber-400 transition-colors duration-200 cursor-pointer line-clamp-2"
              style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
            >
              {product.name}
            </h3>
            
            {/* Description */}
            <p 
              className="text-sm text-gray-300 line-clamp-2 leading-relaxed"
              style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}
            >
              {product.description}
            </p>
          </div>

          {/* Price and Stock */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-500/10 to-transparent rounded-lg border border-amber-500/20">
            <div className="space-y-1">
              <div className="flex items-baseline gap-1">
                <span className="font-bold text-2xl text-amber-400">
                  {formatPrice(product.price, product.currency).split(' ')[0]}
                </span>
                <span className="text-sm text-amber-200/70 font-medium">
                  {formatPrice(product.price, product.currency).split(' ')[1]}
                </span>
              </div>
              {product.productType === 'physical' && !isOutOfStock && (
                <span className="text-xs text-amber-200/60 font-medium">Free shipping</span>
              )}
            </div>
            
            {product.productType === 'physical' && (
              <Badge 
                variant={isOutOfStock ? "destructive" : "secondary"}
                className="bg-black/70 backdrop-blur-sm border border-amber-500/30 text-xs font-medium"
              >
                {isOutOfStock ? "Out of Stock" : `${product.stockLevel} in stock`}
              </Badge>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                size="default"
                variant={isOutOfStock ? "outline" : "default"}
                onClick={() => !isOutOfStock && onAddToCart && onAddToCart(product)}
                disabled={isOutOfStock || !onAddToCart}
                className={`w-full h-10 rounded-lg font-medium text-sm transition-all duration-300 ${
                  !isOutOfStock 
                    ? "bg-gradient-to-r from-amber-500 via-amber-600 to-amber-500 hover:from-amber-400 hover:via-amber-500 hover:to-amber-400 text-black shadow-lg hover:shadow-xl hover:shadow-amber-500/25" 
                    : "border-amber-500/50 text-amber-400 hover:bg-amber-500/10"
                }`}
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isOutOfStock ? "Sold Out" : "Add to Cart"}
              </Button>
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button 
                size="default"
                variant="outline" 
                asChild 
                className="h-10 w-10 rounded-lg border-amber-500/50 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200 hover:border-amber-400 transition-all duration-300"
                aria-label={`View ${product.name} details`}
              >
                <Link href={`/shop/${product.slug}`} aria-label={`View ${product.name} details`}>
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProductCard;