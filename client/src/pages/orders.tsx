import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQueryFn } from '@/lib/queryClient';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  CardFooter 
} from '@/components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Package, ChevronRight, ShoppingBag, Trash2 } from 'lucide-react';
import ParticleField from '@/components/ui/particle-field';
import FloatingSymbols from '@/components/ui/floating-symbols';
import { Order } from '@shared/schema';

// Type for orders with nested items and products
interface OrderWithItems extends Order {
  items: Array<{
    id: number;
    quantity: number;
    price: string;
    product: {
      id: number;
      name: string;
      imageUrl?: string;
      productType: 'physical' | 'digital';
    }
  }>
}

export default function OrdersPage() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  // Fetch user's order history
  const { 
    data: orders, 
    isLoading: ordersLoading, 
    error, 
    refetch: refetchOrders 
  } = useQuery<OrderWithItems[]>({
    queryKey: ['/api/orders/history'],
    queryFn: getQueryFn(),
    enabled: !!user, // Only fetch if user is logged in
  });
  
  // Show error toast if the API call fails
  React.useEffect(() => {
    if (error) {
      toast({
        title: 'Failed to load orders',
        description: 'Please try again or contact customer support.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);
  
  // If authentication is still loading, show loading state
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  // If user is not logged in, redirect to login page
  if (!user && !authLoading) {
    setLocation('/auth');
    return null;
  }
  
  // Format date to local string
  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  // Get status badge variant based on order status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Pending</Badge>;
      case 'paid':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Paid</Badge>;
      case 'shipped':
        return <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20">Shipped</Badge>;
      case 'delivered':
        return <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Delivered</Badge>;
      case 'cancelled':
        return <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/20">Cancelled</Badge>;
      case 'refunded':
        return <Badge variant="outline" className="bg-purple-500/10 text-purple-500 border-purple-500/20">Refunded</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Format currency
  const formatCurrency = (amount: string | number, currency: string = 'USD') => {
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    
    if (isNaN(numericAmount)) return '$0.00';
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(numericAmount);
  };
  
  // Handle view order details
  const handleViewOrderDetails = (orderId: string) => {
    setLocation(`/confirmation?orderId=${orderId}`);
  };
  
  // Handle delete order
  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete order');
      }

      toast({
        title: 'Order Deleted',
        description: 'The order has been successfully deleted.',
      });
      refetchOrders(); // Refetch orders to update the list
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'Failed to delete order.',
      });
    }
  };
  
  return (
    <div className="relative min-h-screen bg-black overflow-hidden text-amber-50">
      <main className="relative z-10 container max-w-4xl mx-auto py-12 px-4">
        <h1 className="text-3xl font-bold mb-6 text-amber-300">Order History</h1>
        
        {ordersLoading ? (
          <div className="flex items-center justify-center py-12 text-amber-100">
            <Loader2 className="h-8 w-8 animate-spin text-amber-400 mr-2" />
            <span>Loading your orders...</span>
          </div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => (
              <Card key={order.id} className="backdrop-blur-md bg-black/40 border-amber-500/20 overflow-hidden shadow-lg">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <CardTitle className="text-xl flex items-center text-amber-200">
                        <Package className="h-5 w-5 mr-2 opacity-70 text-amber-400" />
                        Order #{order.paypalOrderId || order.id}
                      </CardTitle>
                      <CardDescription className="text-amber-300/80">
                        Placed on {formatDate(order.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {getStatusBadge(order.status)}
                      <span className="text-lg font-medium text-amber-50">{formatCurrency(order.total, order.currency)}</span>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  <div className="mt-3">
                    <h4 className="text-sm font-medium mb-2 text-amber-300">Items in this order:</h4>
                    <div className="space-y-3">
                      {order.items && order.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border border-amber-500/20 rounded-lg bg-black/20">
                          {/* Product Image */}
                          <div className="w-16 h-16 flex-shrink-0 overflow-hidden rounded-md border border-amber-500/30">
                            <img
                              src={item.product.imageUrl || '/placeholder.svg'}
                              alt={item.product.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder.svg';
                              }}
                            />
                          </div>
                          
                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-amber-100 truncate">{item.product.name}</h4>
                            <p className="text-sm text-amber-200/60">Quantity: x{item.quantity}</p>
                          </div>
                          
                          {/* Price */}
                          <div className="text-right">
                            <p className="font-medium text-amber-50">{formatCurrency(item.price)}</p>
                          </div>
                        </div>
                      ))}
                      {order.items && order.items.length > 3 && (
                        <div className="text-center text-amber-300/70 py-2">
                          +{order.items.length - 3} more items
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                
                <CardFooter className="flex justify-between items-center pt-2">
                  <div>
                    <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-200">
                      {order.paymentMethod || 'Unknown'}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    {user?.role === 'admin' && (
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={() => handleDeleteOrder(order.id.toString())}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="border-amber-500/30 hover:bg-amber-500/20 text-amber-50 hover:text-amber-50"
                      onClick={() => handleViewOrderDetails(order.paypalOrderId || order.id.toString())}
                    >
                      View Details <ChevronRight className="ml-1 h-4 w-4 text-amber-300" />
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="backdrop-blur-md bg-black/40 border-amber-500/20 mt-8 shadow-lg">
            <CardContent className="flex flex-col items-center justify-center py-12 text-amber-100">
              <ShoppingBag className="h-12 w-12 text-amber-400 mb-4" />
              <h3 className="text-xl font-medium mb-2 text-amber-200">No orders yet</h3>
              <p className="text-amber-300/80 text-center mb-6">
                You haven't made any orders yet. Start shopping to see your orders here.
              </p>
              <Button onClick={() => setLocation('/shop')} className="bg-amber-600 hover:bg-amber-700 text-white">
                Browse Shop
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}