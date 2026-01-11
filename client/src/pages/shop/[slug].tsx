import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import { ShoppingCart, Music, Package, Star, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { Product } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/context/CartContext";
import { useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/hooks/use-toast";

export default function ProductPage() {
  const { slug } = useParams();
  const { t } = useLanguage();
  const { toast } = useToast();
  const { addToCart } = useCart();

  const { data: product, isLoading, error } = useQuery<Product>({
    queryKey: [`/api/products/${slug}`],
  });

  const handleAddToCart = () => {
    if (product) {
      addToCart(product);
      toast({
        title: t('Added to cart'),
        description: `${product.name} has been added to your cart.`,
      });
    }
  };

  // Format price with proper currency symbol
  const formatPrice = (price: string | number, currency: string = 'MAD') => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
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
      default:
        symbol = 'MAD';
        break;
    }
    
    const formattedPrice = numericPrice.toFixed(2);
    return ['USD', 'EUR', 'GBP'].includes(currency) 
      ? `${symbol}${formattedPrice}`
      : `${formattedPrice} ${symbol}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="h-96 bg-gray-700 rounded-lg"></div>
              <div className="space-y-4">
                <div className="h-8 bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-700 rounded w-1/2"></div>
                <div className="h-6 bg-gray-700 rounded w-1/4"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded"></div>
                  <div className="h-4 bg-gray-700 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen pt-24 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4">Product Not Found</h1>
            <p className="text-gray-400 mb-8">The product you're looking for doesn't exist.</p>
            <Link href="/shop">
              <Button variant="outline" className="bg-amber-500 hover:bg-amber-400 text-black border-amber-500">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shop
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.productType === 'physical' && product.stockLevel === 0;

  return (
    <>
      <Helmet>
        <title>{product.name} - Izuran Shop</title>
        <meta name="description" content={product.description} />
      </Helmet>

      <div className="min-h-screen pt-24 pb-16 bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Back Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link href="/shop">
              <Button variant="outline" className="text-amber-400 border-amber-500 hover:bg-amber-500/10">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shop
              </Button>
            </Link>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Product Image */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="relative">
                <img
                  src={product.imageUrl}
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg shadow-2xl"
                />
                <div className="absolute top-4 left-4">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {product.productType === 'digital' ? (
                      <>
                        <Music className="h-3 w-3" />
                        Digital
                      </>
                    ) : (
                      <>
                        <Package className="h-3 w-3" />
                        Physical
                      </>
                    )}
                  </Badge>
                </div>
              </div>
            </motion.div>

            {/* Product Details */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <Badge variant="outline" className="mb-2 text-amber-400 border-amber-500">
                  {product.category}
                </Badge>
                {product.artistName && (
                  <p className="text-amber-400 text-sm mb-2">by {product.artistName}</p>
                )}
                <h1 className="text-4xl font-bold text-yellow-50 mb-4 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{product.name}</h1>
                <div className="text-3xl font-bold text-amber-400 mb-6">
                  {formatPrice(product.price, product.currency)}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-white mb-2">Description</h3>
                <p className="text-sm md:text-base text-yellow-50 leading-relaxed drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>{product.description}</p>
              </div>

              {product.productType === 'physical' && (
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Availability</h3>
                  <p className="text-sm md:text-base text-yellow-50 drop-shadow" style={{ fontFamily: 'Tahoma, Geneva, Verdana, sans-serif' }}>
                    {isOutOfStock ? 'Out of stock' : `${product.stockLevel} in stock`}
                  </p>
                </div>
              )}

              <div className="space-y-4">
                <Button
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`w-full ${
                    !isOutOfStock
                      ? "bg-amber-500 hover:bg-amber-400 text-black"
                      : "bg-gray-600 text-gray-400 cursor-not-allowed"
                  }`}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}