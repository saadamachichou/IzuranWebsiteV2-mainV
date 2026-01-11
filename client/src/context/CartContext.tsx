import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Product } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from './LanguageContext';

export interface CartItem extends Product {
  quantity: number;
}

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: number) => void;
  updateQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  reorderCart: (activeId: string, overId: string) => void;
  cartCount: number;
  cartTotal: number;
  cartCurrency: string;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  toggleCart: () => void;
};

export const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { toast } = useToast();
  const { t } = useLanguage();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartCurrency, setCartCurrency] = useState('$'); // Default currency

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem('izuran_cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart from localStorage:', error);
        localStorage.removeItem('izuran_cart');
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('izuran_cart', JSON.stringify(cart));
  }, [cart]);

  // Calculate total number of items in cart
  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  // Calculate total price
  const cartTotal = cart.reduce(
    (total, item) => total + parseFloat(item.price.toString()) * item.quantity,
    0
  );

  // Add a product to the cart
  const addToCart = (product: Product) => {
    setCart((prevCart) => {
      const existingItemIndex = prevCart.findIndex((item) => item.id === product.id);
      
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        const updatedCart = [...prevCart];
        updatedCart[existingItemIndex] = {
          ...updatedCart[existingItemIndex],
          quantity: updatedCart[existingItemIndex].quantity + 1,
        };
        return updatedCart;
      } else {
        // Add new item
        return [...prevCart, { ...product, quantity: 1 }];
      }
    });

    toast({
      title: t('Item added to cart'),
      description: product.name,
    });

    // Automatically open cart when item is added
    setIsCartOpen(true);
  };

  // Remove a product from the cart
  const removeFromCart = (productId: number) => {
    const removedItem = cart.find(item => item.id === productId);
    
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
    
    if (removedItem) {
      toast({
        title: t('Item removed from cart'),
        description: removedItem.name,
      });
    }
  };

  // Update quantity of a product in the cart
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity < 1) return;
    
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity } : item
      )
    );

    const updatedItem = cart.find(item => item.id === productId);
    if (updatedItem) {
      toast({
        title: t('Item quantity updated'),
        description: `${updatedItem.name}: ${quantity}`,
      });
    }
  };

  // Clear the cart
  const clearCart = () => {
    setCart([]);
    toast({
      title: t('Cart cleared'),
      description: t('All items have been removed from your cart'),
    });
  };

  // Reorder cart items
  const reorderCart = (activeId: string, overId: string) => {
    const activeIndex = cart.findIndex(item => item.id.toString() === activeId);
    const overIndex = cart.findIndex(item => item.id.toString() === overId);
    
    if (activeIndex === -1 || overIndex === -1) return;
    
    const newCart = [...cart];
    const [reorderedItem] = newCart.splice(activeIndex, 1);
    newCart.splice(overIndex, 0, reorderedItem);
    
    setCart(newCart);
  };

  // Toggle cart open/closed
  const toggleCart = () => {
    setIsCartOpen((prev) => !prev);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        reorderCart,
        cartCount,
        cartTotal,
        cartCurrency,
        isCartOpen,
        setIsCartOpen,
        toggleCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};