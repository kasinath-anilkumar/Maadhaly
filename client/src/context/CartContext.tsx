import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { cartAPI } from '@/services/api';
import type { Product, CartItem } from '@/types';

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  cartTotal: number;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const savedCart = cartAPI.getCart();
    setCartItems(savedCart);
  }, []);

  const addToCart = (product: Product, quantity: number = 1) => {
    const updatedCart = cartAPI.addToCart(product, quantity);
    setCartItems(updatedCart);
  };

  const removeFromCart = (productId: string) => {
    const updatedCart = cartAPI.removeFromCart(productId);
    setCartItems(updatedCart);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    const updatedCart = cartAPI.updateQuantity(productId, quantity);
    setCartItems(updatedCart);
  };

  const clearCart = () => {
    cartAPI.clearCart();
    setCartItems([]);
  };

  const isInCart = (productId: string) => {
    return cartItems.some((item) => item.product._id === productId);
  };

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        cartItems,
        cartCount,
        cartTotal,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
