import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { useCartPersistence, CartItem as PersistedCartItem } from '@/hooks/useCartPersistence';

export type CartItem = PersistedCartItem;

interface CartContextType {
  items: CartItem[];
  addToCart: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const tenantSlug: string | null = null;

  const { loadCart, saveCart, clearCart: clearPersistedCart, syncFromStorage } = useCartPersistence(tenantSlug);

  const [items, setItems] = useState<CartItem[]>(() => loadCart());

  useEffect(() => {
    saveCart(items);
  }, [items, saveCart]);

  useEffect(() => {
    const unsubscribe = syncFromStorage((newItems) => {
      // Only update if items actually changed (prevent infinite loop)
      setItems((currentItems) => {
        const hasChanged = JSON.stringify(currentItems) !== JSON.stringify(newItems);
        return hasChanged ? newItems : currentItems;
      });
    });
    return unsubscribe;
  }, [syncFromStorage]);

  const addToCart = (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => {
    setItems((prev) => {
      const existingItem = prev.find((i) => i.id === item.id);
      
      if (existingItem) {
        toast.success('Jumlah produk diperbarui di keranjang');
        return prev.map((i) =>
          i.id === item.id
            ? { ...i, quantity: i.quantity + (item.quantity || 1) }
            : i
        );
      }
      
      toast.success('Produk ditambahkan ke keranjang');
      return [...prev, { ...item, quantity: item.quantity || 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.success('Produk dihapus dari keranjang');
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity } : item
      )
    );
  };

  const clearCart = () => {
    setItems([]);
    clearPersistedCart();
    toast.success('Keranjang dikosongkan');
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        getTotalItems,
        getTotalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};
