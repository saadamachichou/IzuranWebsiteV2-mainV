import { useEffect, useState } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import PayPalButton from "@/components/paypal/PayPalButton";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Loader2, Plus, Minus, X, ShoppingCart, Truck, CreditCard, ArrowLeft, Home } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import ParticleField from "@/components/ui/particle-field";

// Helper function to convert price to number
const parsePrice = (price: any): number => {
  if (typeof price === 'number') {
    return price;
  }
  return parseFloat(String(price)) || 0;
};

export default function CheckoutPage() {
  const { cart, cartTotal, cartCount, cartCurrency, clearCart, updateQuantity, removeFromCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "cmi" | "cod" | null>(null);
  
  // COD form fields
  const [codForm, setCodForm] = useState({
    customerName: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.username || '',
    customerPhone: '',
    shippingAddress: '',
    notes: ''
  });
  
  // Set user email in window object for PayPal component to access
  useEffect(() => {
    if (user && user.email) {
      (window as any).userEmail = user.email;
    }
  }, [user]);

  useEffect(() => {
    // If cart is empty, redirect to shop
    if (cartCount === 0) {
      setLocation("/shop");
    }
  }, [cartCount, setLocation]);

  const handlePaymentSuccess = async (data: any) => {
    console.log("Payment successful:", data);
    setIsProcessing(false);
    
    // Show success toast
    toast({
      title: "Payment Successful",
      description: "Thank you for your purchase!",
    });
    
    let orderId: string | number | null = null;
    
    // If we have a valid PayPal order ID, try to save the cart items to the database
    if (data && data.id) {
      try {
        // Try to find the order by PayPal ID first
        const orderResponse = await fetch(`/api/orders/details?orderId=${data.id}`);
        const orderData = await orderResponse.json();
        
        if (orderData && orderData.order && orderData.order.id) {
          console.log(`Found order in database: ${orderData.order.id}`);
          orderId = orderData.order.id;
          
          // If there are no items yet, add them from the cart
          if (!orderData.items || orderData.items.length === 0) {
            console.log(`Saving cart items to order: ${orderId}`);
            
            // Create order items from cart
            await fetch(`/api/orders/${orderId}/items`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                cartItems: cart,
              }),
            });
          }
        }
      } catch (error) {
        console.error('Error saving cart items:', error);
        // Continue with redirection even if saving items fails
      }
      
      // Clear the cart after successful purchase
      clearCart();
      
      // First redirect to confirmation page to show order details
      setLocation(`/confirmation?orderId=${data.id}&redirect=orders`);
    } else {
      // Fallback if we don't have an order ID
      clearCart();
      
      toast({
        title: "Order Complete",
        description: "Your order has been processed successfully.",
      });
      setLocation("/shop");
    }
  };

  const handlePaymentError = (error: any) => {
    console.error("Payment error:", error);
    setIsProcessing(false);
    
    toast({
      title: "Payment Failed",
      description: "There was an error processing your payment. Please try again.",
      variant: "destructive",
    });
  };

  const handlePaymentCancel = () => {
    setIsProcessing(false);
    toast({
      title: "Payment Cancelled",
      description: "Your payment was cancelled. Your cart items are still saved.",
    });
  };

  const handleCodOrder = async () => {
    if (!codForm.customerName || !codForm.customerPhone || !codForm.shippingAddress) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields for Cash on Delivery.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const response = await fetch('/api/orders/cod', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cartItems: cart,
          customerName: codForm.customerName,
          customerPhone: codForm.customerPhone,
          shippingAddress: codForm.shippingAddress,
          notes: codForm.notes
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create COD order');
      }

      const result = await response.json();
      
      toast({
        title: "Order Placed Successfully",
        description: "Your Cash on Delivery order has been placed. We'll contact you for delivery details.",
      });
      
      clearCart();
      setLocation(`/confirmation?orderId=${result.order.id}&type=cod`);
      
    } catch (error) {
      console.error('COD order error:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div className="relative min-h-screen bg-black">
        <div className="absolute inset-0 z-0 opacity-20">
          <ParticleField />
        </div>
        <div className="relative z-10 pt-24 pb-16">
          <div className="container max-w-4xl mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl text-center">
                <CardHeader>
                  <div className="mx-auto w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mb-4 border border-amber-500/30">
                    <ShoppingCart className="w-8 h-8 text-amber-400" />
                  </div>
                  <CardTitle className="text-2xl text-amber-300">Your cart is empty</CardTitle>
                  <CardDescription className="text-lg text-amber-200/60">
                    Add some items to your cart before checking out.
                  </CardDescription>
                </CardHeader>
                <CardFooter className="justify-center">
                  <Button 
                    onClick={() => setLocation("/shop")}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-black">
      {/* Particle field background animation */}
      <div className="absolute inset-0 z-0 opacity-20">
        <ParticleField />
      </div>
      
      <div className="relative z-10 pt-24 pb-16">
        <div className="container max-w-7xl mx-auto px-4">
          {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <button onClick={() => setLocation("/shop")}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Back to Shop
                  </button>
                </Button>
                <Button variant="outline" asChild className="border-amber-500/30 text-amber-300 hover:bg-amber-500/10">
                  <button onClick={() => setLocation('/')}>
                    <Home className="mr-2 h-4 w-4" />
                    Return to Website
                  </button>
                </Button>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-amber-500/20 rounded-lg border border-amber-500/30">
                <ShoppingCart className="w-8 h-8 text-amber-400" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-amber-300 to-yellow-500 bg-clip-text text-transparent tracking-tight">
                  Checkout
                </h1>
                <p className="text-amber-200/60 mt-2">
                  Review your order and complete your purchase
                </p>
              </div>
            </div>
          </motion.div>
          
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            {/* Cart Summary */}
            <motion.div 
              className="lg:col-span-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="bg-black/40 border-b border-amber-500/20">
                  <CardTitle className="text-amber-300">Order Summary</CardTitle>
                  <CardDescription className="text-amber-200/60">
                    You have {cartCount} item{cartCount !== 1 ? "s" : ""} in your cart
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex gap-4 p-4 border border-amber-500/20 rounded-lg bg-black/40">
                        {/* Product Image */}
                        <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md border border-amber-500/30">
                          <img
                            src={item.imageUrl || '/placeholder.svg'}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder.svg';
                            }}
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex-1">
                              <h3 className="text-lg font-semibold text-amber-200">
                                <Link href={`/shop/${item.slug}`} className="hover:underline hover:text-amber-400">
                                  {item.name}
                                </Link>
                              </h3>
                              <p className="text-sm text-amber-200/60 mt-1 line-clamp-2">
                                {item.description}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFromCart(item.id)}
                              className="text-amber-200/60 hover:text-red-400 hover:bg-red-500/10 ml-4 transition-colors"
                              aria-label="Remove item"
                            >
                              <X className="h-5 w-5" />
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            {/* Quantity Controls */}
                            <div className="flex items-center space-x-3">
                              <span className="text-sm text-amber-200/60">Qty:</span>
                              <div className="flex items-center border border-amber-500/30 rounded-md bg-black/40">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 rounded-none hover:bg-amber-600/20 hover:text-amber-400 text-amber-200/60 transition-colors"
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-12 text-center text-sm font-medium text-amber-300">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 rounded-none hover:bg-amber-600/20 hover:text-amber-400 text-amber-200/60 transition-colors"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="text-right">
                              <p className="text-lg font-semibold text-amber-300">
                                {cartCurrency} {(parsePrice(item.price) * item.quantity).toFixed(2)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="text-sm text-amber-200/40">
                                  {cartCurrency} {parsePrice(item.price).toFixed(2)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="mt-6 space-y-2 text-amber-200/60">
                    <div className="flex justify-between">
                      <span>Subtotal</span>
                      <span>{cartCurrency} {parsePrice(cartTotal).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <Separator className="bg-amber-500/20" />
                    <div className="flex justify-between font-bold text-amber-300">
                      <span>Total</span>
                      <span>{cartCurrency} {parsePrice(cartTotal).toFixed(2)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
            
            {/* Payment Methods */}
            <motion.div 
              className="lg:col-span-2"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Card className="bg-black/60 border-amber-500/20 backdrop-blur-xl">
                <CardHeader className="bg-black/40 border-b border-amber-500/20">
                  <CardTitle className="text-amber-300">Payment Method</CardTitle>
                  <CardDescription className="text-amber-200/60">
                    Select your preferred payment method
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-4">
                    <Button
                      variant={paymentMethod === "paypal" ? "default" : "outline"}
                      className={`w-full justify-start transition-all ${
                        paymentMethod === "paypal" 
                          ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" 
                          : "border-amber-500/30 hover:border-amber-400 hover:bg-amber-600/10 text-amber-200/60"
                      }`}
                      onClick={() => setPaymentMethod("paypal")}
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span className="mr-2">PayPal</span>
                      <span className="text-xs text-amber-200/40 ml-auto">International</span>
                    </Button>
                    
                    <Button
                      variant={paymentMethod === "cod" ? "default" : "outline"}
                      className={`w-full justify-start transition-all ${
                        paymentMethod === "cod" 
                          ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" 
                          : "border-amber-500/30 hover:border-amber-400 hover:bg-amber-600/10 text-amber-200/60"
                      }`}
                      onClick={() => setPaymentMethod("cod")}
                    >
                      <Truck className="mr-2 h-4 w-4" />
                      <span className="mr-2">Cash on Delivery</span>
                    </Button>
                    
                    <Button
                      variant={paymentMethod === "cmi" ? "default" : "outline"}
                      className={`w-full justify-start transition-all ${
                        paymentMethod === "cmi" 
                          ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" 
                          : "border-amber-500/30 hover:border-amber-400 hover:bg-amber-600/10 text-amber-200/40"
                      }`}
                      onClick={() => setPaymentMethod("cmi")}
                      disabled
                    >
                      <CreditCard className="mr-2 h-4 w-4" />
                      <span className="mr-2">CMI (Coming Soon)</span>
                      <span className="text-xs text-amber-200/40 ml-auto">Morocco Only</span>
                    </Button>
                  </div>
                  
                  {isProcessing && (
                    <div className="bg-black/40 p-4 rounded-md flex items-center justify-center border border-amber-500/30">
                      <Loader2 className="h-6 w-6 animate-spin mr-2 text-amber-400" />
                      <span className="text-amber-300">Processing payment...</span>
                    </div>
                  )}
                  
                  {paymentMethod === "paypal" && !isProcessing && (
                    <div className="pt-8">
                      <PayPalButton
                        amount={parsePrice(cartTotal).toFixed(2)}
                        currency="USD"
                        intent="CAPTURE"
                        onSuccess={handlePaymentSuccess}
                        onError={handlePaymentError}
                        onCancel={handlePaymentCancel}
                        cartItems={cart}
                      />
                    </div>
                  )}
                  
                  {paymentMethod === "cod" && !isProcessing && (
                    <div className="pt-8 space-y-4">
                      <div className="bg-black/40 p-4 rounded-md border border-amber-500/30">
                        <div className="flex items-center mb-2">
                          <Truck className="h-5 w-5 text-amber-400 mr-2" />
                          <h3 className="font-medium text-amber-300">Cash on Delivery</h3>
                        </div>
                        <p className="text-sm text-amber-200/60">
                          Pay in cash when your order is delivered to your address. Our delivery team will contact you to arrange delivery.
                        </p>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="customerName" className="text-amber-300">Full Name *</Label>
                          <Input
                            id="customerName"
                            value={codForm.customerName}
                            onChange={(e) => setCodForm(prev => ({ ...prev, customerName: e.target.value }))}
                            placeholder="Enter your full name"
                            required
                            className="border-amber-500/30 focus:border-amber-400 focus:ring-amber-400 bg-black/40 text-amber-200 placeholder:text-amber-200/40"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="customerPhone" className="text-amber-300">Phone Number *</Label>
                          <Input
                            id="customerPhone"
                            value={codForm.customerPhone}
                            onChange={(e) => setCodForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                            placeholder="Enter your phone number"
                            required
                            className="border-amber-500/30 focus:border-amber-400 focus:ring-amber-400 bg-black/40 text-amber-200 placeholder:text-amber-200/40"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="shippingAddress" className="text-amber-300">Delivery Address *</Label>
                          <Textarea
                            id="shippingAddress"
                            value={codForm.shippingAddress}
                            onChange={(e) => setCodForm(prev => ({ ...prev, shippingAddress: e.target.value }))}
                            placeholder="Enter your complete delivery address including city, postal code"
                            rows={3}
                            required
                            className="border-amber-500/30 focus:border-amber-400 focus:ring-amber-400 bg-black/40 text-amber-200 placeholder:text-amber-200/40"
                          />
                        </div>
                        
                        <div>
                          <Label htmlFor="notes" className="text-amber-300">Additional Notes (Optional)</Label>
                          <Textarea
                            id="notes"
                            value={codForm.notes}
                            onChange={(e) => setCodForm(prev => ({ ...prev, notes: e.target.value }))}
                            placeholder="Any special delivery instructions..."
                            rows={2}
                            className="border-amber-500/30 focus:border-amber-400 focus:ring-amber-400 bg-black/40 text-amber-200 placeholder:text-amber-200/40"
                          />
                        </div>
                        
                        <Button
                          onClick={handleCodOrder}
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white py-6 text-lg"
                          disabled={!codForm.customerName || !codForm.customerPhone || !codForm.shippingAddress}
                        >
                          <Truck className="mr-2 h-4 w-4" />
                          Place COD Order
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="flex justify-between">
                  <Button 
                    variant="outline" 
                    onClick={() => setLocation("/shop")}
                    className="border-amber-500/30 hover:border-amber-400 hover:bg-amber-600/10 hover:text-amber-300 text-amber-200/60"
                  >
                    Continue Shopping
                  </Button>
                </CardFooter>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}