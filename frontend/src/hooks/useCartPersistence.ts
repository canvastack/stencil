import { useCallback } from 'react';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  type?: string;
  size?: string;
  material?: string;
}

interface CartData {
  version: string;
  tenantSlug: string | null;
  items: CartItem[];
  metadata: {
    createdAt: string;
    updatedAt: string;
    expiresAt: string;
  };
}

const STORAGE_KEY_PREFIX = 'canvastencil_cart';
const CART_VERSION = '1.0';
const CART_EXPIRY_DAYS = 30;

export const useCartPersistence = (tenantSlug: string | null = null) => {
  const storageKey = tenantSlug 
    ? `${STORAGE_KEY_PREFIX}_${tenantSlug}` 
    : STORAGE_KEY_PREFIX;

  const loadCart = useCallback((): CartItem[] => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (!stored) return [];

      const cartData: CartData = JSON.parse(stored);

      if (cartData.version !== CART_VERSION) {
        console.warn('Versi keranjang tidak cocok, keranjang direset');
        localStorage.removeItem(storageKey);
        return [];
      }

      const expiresAt = new Date(cartData.metadata.expiresAt);
      if (expiresAt < new Date()) {
        console.info('Keranjang kedaluwarsa, keranjang dikosongkan');
        localStorage.removeItem(storageKey);
        return [];
      }

      if (tenantSlug && cartData.tenantSlug !== tenantSlug) {
        console.warn('Tenant keranjang tidak cocok, keranjang direset');
        localStorage.removeItem(storageKey);
        return [];
      }

      if (!Array.isArray(cartData.items)) {
        throw new Error('Format items keranjang tidak valid');
      }

      if (cartData.items.length > 0) {
        toast.success('Keranjang dipulihkan', {
          description: `${cartData.items.length} produk dikembalikan`,
        });
      }

      return cartData.items;
    } catch (error) {
      console.error('Error memuat keranjang dari localStorage:', error);
      localStorage.removeItem(storageKey);
      toast.error('Gagal memulihkan keranjang', {
        description: 'Keranjang telah direset karena data tidak valid',
      });
      return [];
    }
  }, [storageKey, tenantSlug]);

  const saveCart = useCallback((items: CartItem[]): void => {
    try {
      const now = new Date();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + CART_EXPIRY_DAYS);

      let createdAt = now.toISOString();
      
      try {
        const existing = localStorage.getItem(storageKey);
        if (existing) {
          const existingData = JSON.parse(existing);
          if (existingData.metadata?.createdAt) {
            createdAt = existingData.metadata.createdAt;
          }
        }
      } catch {
        // Ignore errors, use current timestamp
      }

      const cartData: CartData = {
        version: CART_VERSION,
        tenantSlug,
        items,
        metadata: {
          createdAt: items.length > 0 ? createdAt : now.toISOString(),
          updatedAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
        },
      };

      const serialized = JSON.stringify(cartData);

      if (serialized.length > 5 * 1024 * 1024) {
        console.error('Data keranjang melebihi kuota localStorage');
        toast.error('Keranjang terlalu besar', {
          description: 'Hapus beberapa item untuk melanjutkan',
        });
        return;
      }

      localStorage.setItem(storageKey, serialized);
    } catch (error) {
      console.error('Error menyimpan keranjang ke localStorage:', error);
      toast.error('Gagal menyimpan keranjang', {
        description: 'Perubahan mungkin tidak tersimpan',
      });
    }
  }, [storageKey, tenantSlug]);

  const clearCart = useCallback((): void => {
    try {
      localStorage.removeItem(storageKey);
    } catch (error) {
      console.error('Error menghapus keranjang dari localStorage:', error);
    }
  }, [storageKey]);

  const syncFromStorage = useCallback((callback: (items: CartItem[]) => void): (() => void) => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === storageKey && e.newValue) {
        try {
          const cartData: CartData = JSON.parse(e.newValue);
          callback(cartData.items);
          
          toast.info('Keranjang disinkronkan', {
            description: 'Perubahan dari tab lain diterapkan',
          });
        } catch (error) {
          console.error('Error menyinkronkan keranjang dari storage event:', error);
        }
      } else if (e.key === storageKey && !e.newValue) {
        callback([]);
        toast.info('Keranjang dikosongkan', {
          description: 'Perubahan dari tab lain diterapkan',
        });
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [storageKey]);

  return {
    loadCart,
    saveCart,
    clearCart,
    syncFromStorage,
  };
};
