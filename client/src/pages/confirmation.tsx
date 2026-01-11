import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Loader2, Check, ArrowLeft, ArrowDownToLine } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { getQueryFn } from '@/lib/queryClient';
import IzuranLogo from '@/assets/IzuranLogo';
import ParticleField from '@/components/ui/particle-field';
import FloatingSymbols from '@/components/ui/floating-symbols';
import { Order, OrderItem, Product } from '@shared/schema';

// Extend OrderItem to include the product relationship
interface OrderItemWithProduct extends OrderItem {
  product?: Product;
}

interface OrderDetails {
  order: Order;
  items: OrderItemWithProduct[];
}

export default function ConfirmationPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [orderId, setOrderId] = useState<string | null>(null);

  // Parse URL parameters
  const [redirectTo, setRedirectTo] = useState<string | null>(null);
  const [shouldRedirect, setShouldRedirect] = useState(false);
  const [countdown, setCountdown] = useState(5);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('orderId');
    const redirect = params.get('redirect');
    setOrderId(id);
    if (redirect) {
      setRedirectTo(redirect);
    }
  }, []);
  
  const {
    data: orderDetails,
    isLoading,
    error
  } = useQuery<OrderDetails>({
    queryKey: ['/api/orders/details', orderId],
    queryFn: getQueryFn({
      params: { orderId }
    }),
    enabled: !!orderId,
  });
  
  // Handle the redirection when the redirect flag is set
  useEffect(() => {
    if (shouldRedirect && redirectTo) {
      setLocation(`/${redirectTo}`);
    }
  }, [shouldRedirect, redirectTo, setLocation]);
  
  // Handle the countdown timer and set the redirect flag when done
  useEffect(() => {
    // Only start the countdown if we have an order and a redirect path
    if (redirectTo && orderDetails && !shouldRedirect) {
      // Set a countdown timer that ticks every second
      const timer = setInterval(() => {
        setCountdown(prev => {
          // When we reach 0, clear the interval and set the redirect flag
          if (prev <= 1) {
            clearInterval(timer);
            setShouldRedirect(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000); // 1 second interval
      
      return () => clearInterval(timer);
    }
  }, [redirectTo, orderDetails, shouldRedirect]);

  // Show error toast if the API call fails
  useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load order details',
        description: 'Please try again or contact customer support.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Handle going back to the shop
  const handleBackToShop = () => {
    setLocation('/shop');
  };

  // Format currency
  const formatPrice = (price: number | string, currency = 'USD') => {
    const numericPrice = typeof price === 'string' ? parseFloat(price) : price;
    
    if (isNaN(numericPrice)) return '0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numericPrice);
  };

  // Show loader while fetching data
  if (isLoading || !orderId) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="mb-8">
          <IzuranLogo size="lg" showText={true} />
        </div>
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <h2 className="text-2xl font-bold">Loading your order details...</h2>
          <p className="text-muted-foreground mt-2">Please wait while we retrieve your purchase information.</p>
        </div>
      </div>
    );
  }

  // Show error state if order not found
  if (!orderDetails) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background">
        <div className="mb-8">
          <IzuranLogo size="lg" showText={true} />
        </div>
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle className="text-2xl">Order Not Found</CardTitle>
            <CardDescription>We couldn't find your order details.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Please check your email for order confirmation or contact customer support.</p>
          </CardContent>
          <CardFooter>
            <Button onClick={handleBackToShop}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Shop
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const { order, items } = orderDetails;
  
  // Format order date
  const orderDate = order.createdAt 
    ? new Date(order.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'N/A';

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-gray-900 to-black overflow-hidden text-amber-50">
      <ParticleField />
      <FloatingSymbols />
      <main className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="mb-8">
          <IzuranLogo size="lg" showText={true} color="amber" />
        </div>
        
        <Card className="w-full max-w-3xl backdrop-blur-md bg-black/40 border-amber-500/20 shadow-lg">
          <CardHeader className="bg-amber-900/20 border-b border-amber-500/20">
            <div className="flex items-center mb-2">
              <div className="h-8 w-8 rounded-full bg-amber-600 flex items-center justify-center mr-3">
                <Check className="h-5 w-5 text-white" />
              </div>
              <CardTitle className="text-2xl text-amber-200">Order Confirmed!</CardTitle>
            </div>
            <CardDescription className="space-y-1 text-amber-300">
              <div>Thank you for your purchase. A confirmation email has been sent to <span className="text-amber-100 font-medium">{order.customerEmail}</span>.</div>
              {redirectTo === 'orders' && countdown > 0 && (
                <div className="text-amber-400 mt-2">
                  Redirecting to your order history in {countdown} second{countdown !== 1 ? 's' : ''}...
                </div>
              )}
            </CardDescription>
          </CardHeader>
          
          <CardContent className="pt-6">
            <div className="grid gap-6">
              {/* Order Summary Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-300">Order Summary</h3>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-amber-400">Order Number:</div>
                  <div className="font-medium text-amber-100">{order.id}</div>
                  
                  <div className="text-amber-400">Order Date:</div>
                  <div className="font-medium text-amber-100">{orderDate}</div>
                  
                  <div className="text-amber-400">Payment Method:</div>
                  <div className="font-medium capitalize text-amber-100">{order.paymentMethod}</div>
                  
                  <div className="text-amber-400">Payment Status:</div>
                  <div className="font-medium capitalize text-amber-100">{order.paymentStatus || 'Completed'}</div>
                  
                  <div className="text-amber-400">Transaction ID:</div>
                  <div className="font-medium text-amber-100">{order.paymentId || 'N/A'}</div>
                </div>
              </div>
              
              <Separator className="bg-amber-500/20" />
              
              {/* Items Section */}
              <div>
                <h3 className="text-lg font-semibold mb-2 text-amber-300">Items Purchased</h3>
                <div className="space-y-4">
                  {items.length > 0 ? (
                    items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 text-amber-100">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          {item.product?.imageUrl ? (
                            <img 
                              src={item.product.imageUrl} 
                              alt={item.product.name || 'Product'} 
                              className="w-16 h-16 object-cover rounded-lg border border-amber-500/20"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-16 h-16 bg-amber-900/20 border border-amber-500/20 rounded-lg flex items-center justify-center">
                              <span className="text-amber-400 text-xs">No Image</span>
                            </div>
                          )}
                        </div>
                        
                        {/* Product Details */}
                        <div className="flex-1">
                          <div className="font-medium">{item.product?.name || 'Product'}</div>
                          <div className="text-sm text-amber-300">
                            Quantity: {item.quantity}
                          </div>
                        </div>
                        
                        {/* Price */}
                        <div className="font-medium">
                          {formatPrice(item.price, order.currency)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-amber-300">No items in this order.</p>
                  )}
                </div>
              </div>
              
              <Separator className="bg-amber-500/20" />
              
              {/* Total Section */}
              <div className="flex justify-between items-center">
                <div className="font-semibold text-lg text-amber-200">Total</div>
                <div className="font-bold text-xl text-amber-50">
                  {formatPrice(order.total, order.currency)}
                </div>
              </div>
              
              {/* Digital Products Section - Show if applicable */}
              {items.some(item => item.product && item.product.productType === 'digital') && (
                <div className="bg-amber-900/10 p-4 rounded-lg mt-2 border border-amber-500/20">
                  <h3 className="font-semibold mb-2 text-amber-200">Digital Items</h3>
                  <p className="text-amber-300 text-sm mb-4">
                    Your digital products are available for download:
                  </p>
                  <div className="space-y-2">
                    {items
                      .filter(item => item.product && item.product.productType === 'digital')
                      .map((item) => (
                        <Button 
                          key={item.id} 
                          variant="outline" 
                          className="w-full justify-between text-amber-50 border-amber-500/30 hover:bg-amber-500/20 hover:text-amber-50"
                          onClick={() => window.open(item.product?.digitalFileUrl, '_blank')}
                        >
                          <span>{item.product?.name}</span>
                          <ArrowDownToLine className="h-4 w-4 ml-2" />
                        </Button>
                      ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-end gap-2 pt-6">
            <Button 
              variant="outline" 
              onClick={handleBackToShop}
              className="border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Continue Shopping
            </Button>
            <Button 
              onClick={() => setLocation('/orders')}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              View Order History
            </Button>
            {redirectTo === 'orders' && (
              <Button
                variant="secondary"
                onClick={() => setLocation('/profile')}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                View Your Account
              </Button>
            )}
          </CardFooter>
        </Card>
      </main>
    </div>
  );
}