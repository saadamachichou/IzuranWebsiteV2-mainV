import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart as CartIcon, X, Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useLanguage } from '@/context/LanguageContext';
import { Link } from 'wouter';

export default function ShoppingCart() {
  const {
    cart,
    cartCount,
    cartTotal,
    cartCurrency,
    isCartOpen,
    setIsCartOpen,
    toggleCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  
  const { t } = useLanguage();



  // Close cart when clicking outside
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setIsCartOpen(false);
    }
  };

  // Prevent body scroll when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isCartOpen]);

  return (
    <>
      {/* Cart Button */}
      <Button
        variant="ghost"
        size="icon"
        aria-label={t('Shopping Cart')}
        className="cart-toggle-button relative text-amber-200 hover:text-amber-400 hover:bg-amber-500/20"
        onClick={toggleCart}
      >
        <CartIcon className="h-5 w-5" />
        {cartCount > 0 && (
          <span className="cart-count-badge absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
            {cartCount}
          </span>
        )}
      </Button>
      {/* Cart Drawer */}
      <AnimatePresence>
        {isCartOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleBackdropClick}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99998]"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-black shadow-xl border-l border-amber-700 z-[99999]"
            >
              <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-amber-700 bg-black">
                  <h2 className="text-lg font-semibold text-amber-400">{t('Your Cart')} ({cartCount})</h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsCartOpen(false)}
                    aria-label={t('Close Cart')}
                    className="text-amber-400 hover:text-amber-300"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Cart Content */}
                <div className="flex-1 overflow-y-auto bg-black">
                  {cart.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
                      <CartIcon className="h-16 w-16 text-gray-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">{t('Your cart is empty')}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
                        {t('Looks like you haven\'t added any products to your cart yet.')}
                      </p>
                      <Button 
                        className="bg-amber-500 hover:bg-amber-600 text-black font-medium" 
                        onClick={() => setIsCartOpen(false)}
                        asChild
                      >
                        <Link href="/shop">{t('Browse Products')}</Link>
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      {cart.map((item) => (
                        <div key={item.id} className="flex gap-3 p-3 border border-amber-700 rounded-lg bg-black hover:shadow-md transition-all duration-200">
                          {/* Product Image */}
                          <div className="w-20 h-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-300 bg-gray-100 dark:bg-gray-700">
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
                              <div className="flex-1 pr-2">
                                <h3 className="text-sm font-semibold leading-tight text-gray-900 dark:text-white">
                                  <Link href={`/shop/${item.slug}`} className="hover:underline hover:text-amber-600 transition-colors">
                                    {item.name}
                                  </Link>
                                </h3>
                                <div className="mt-1 flex items-center gap-2">
                                  <span className="text-xs px-2 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 rounded-full">
                                    {item.category}
                                  </span>
                                  {item.productType && (
                                    <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                      {item.productType}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeFromCart(item.id)}
                                className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-8 h-8 p-0 flex-shrink-0 transition-colors"
                                aria-label="Remove item"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            {item.description && (
                              <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2 leading-relaxed">
                                {item.description.length > 80 ? `${item.description.substring(0, 80)}...` : item.description}
                              </p>
                            )}
                            
                            <div className="flex items-center justify-between">
                              {/* Quantity Controls */}
                              <div className="flex items-center border border-amber-200 dark:border-amber-800 rounded-md bg-amber-50 dark:bg-amber-900/20">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 rounded-none hover:bg-amber-200 dark:hover:bg-amber-800/40 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                                  onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                                  aria-label="Decrease quantity"
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-10 text-center text-sm font-medium text-amber-800 dark:text-amber-200">{item.quantity}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="w-8 h-8 rounded-none hover:bg-amber-200 dark:hover:bg-amber-800/40 hover:text-amber-800 dark:hover:text-amber-200 transition-colors"
                                  onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                  aria-label="Increase quantity"
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>

                              {/* Price */}
                              <div className="text-right">
                                <p className="text-base font-bold text-gray-900 dark:text-white">
                                  {cartCurrency} {(parseFloat(item.price.toString()) * item.quantity).toFixed(2)}
                                </p>
                                {item.quantity > 1 && (
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {cartCurrency} {parseFloat(item.price.toString()).toFixed(2)} each
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Cart Footer */}
                {cart.length > 0 && (
                  <div className="border-t border-white p-4 bg-[#000000]">
                    {/* Order Summary */}
                    <div className="space-y-3 mb-4">
                      <h3 className="text-sm font-semibold text-white uppercase tracking-wide">
                        {t('Order Summary')}
                      </h3>
                      
                      {/* Product List */}
                      <div className="space-y-2 max-h-32 overflow-y-auto">
                        {cart.map((item) => (
                          <div key={item.id} className="flex items-center gap-2 p-2 bg-gray-800/30 rounded-md border border-white">
                            <div className="w-8 h-8 flex-shrink-0 overflow-hidden rounded border bg-gray-100 dark:bg-gray-700">
                              <img
                                src={item.imageUrl || '/placeholder.svg'}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.currentTarget.src = '/placeholder.svg';
                                }}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-white truncate">
                                {item.name}
                              </p>
                              <p className="text-xs text-white">
                                {item.quantity}x {cartCurrency} {parseFloat(item.price.toString()).toFixed(2)}
                              </p>
                            </div>
                            <span className="text-xs font-semibold text-white">
                              {cartCurrency} {(parseFloat(item.price.toString()) * item.quantity).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-white">
                            {t('Subtotal')} ({cartCount} {cartCount === 1 ? 'item' : 'items'})
                          </span>
                          <span className="font-medium text-white">
                            {cartCurrency} {cartTotal.toFixed(2)}
                          </span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{t('Shipping')}</span>
                          <span className="font-medium text-white">{t('Free')}</span>
                        </div>
                        
                        <div className="flex justify-between text-sm">
                          <span className="text-white">{t('Tax')}</span>
                          <span className="font-medium text-white">{t('Included')}</span>
                        </div>
                      </div>
                      
                      <div className="border-t border-white pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-lg font-bold text-white">{t('Total')}</span>
                          <div className="text-right">
                            <span className="text-xl font-bold text-white">
                              {cartCurrency} {cartTotal.toFixed(2)}
                            </span>
                            <p className="text-xs text-white">
                              {cartCount} {cartCount === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button 
                        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-200" 
                        asChild
                      >
                        <Link href="/checkout">
                          <ShoppingBag className="mr-2 h-5 w-5" />
                          {t('Proceed to Checkout')}
                        </Link>
                      </Button>
                      
                      <div className="flex gap-2">
                        <Button 
                          variant="outline"
                          className="flex-1 border-amber-300 text-amber-700 hover:bg-amber-100 dark:border-amber-700 dark:text-amber-300 dark:hover:bg-amber-900/20 transition-colors" 
                          asChild
                        >
                          <Link href="/shop">
                            {t('Continue Shopping')}
                          </Link>
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="icon"
                          onClick={clearCart}
                          title={t('Clear Cart')}
                          className="w-10 h-10 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    
                    <p className="text-xs text-white text-center mt-3">
                      {t('Shipping and taxes calculated at checkout.')}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}