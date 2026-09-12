/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi } from '../api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);
const CART_STORAGE_KEY = 'velora_guest_cart';

const emptyCart = { id: null, userId: null, items: [], totalAmount: 0 };

function readGuestCart() {
  try {
    const raw = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '{"version":1,"items":[]}');
    if (!Array.isArray(raw.items)) return [];
    return raw.items.filter((item) => item?.productId && Number.isInteger(item.quantity) && item.quantity > 0);
  } catch {
    return [];
  }
}

function writeGuestCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({ version: 1, items }));
}

function localCart(items) {
  return {
    ...emptyCart,
    items: items.map((item) => ({
      id: `local-${item.productId}`,
      productId: item.productId,
      quantity: item.quantity,
      name: 'Product',
      price: 0,
      itemTotal: 0,
      image: null,
      is_active: true,
    })),
  };
}

export function CartProvider({ children }) {
  const { isAuthenticated, isBooting } = useAuth();
  const [guestItems, setGuestItems] = useState(readGuestCart);
  const [serverCart, setServerCart] = useState(emptyCart);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const loadServerCart = async () => {
    setIsLoading(true);
    try {
      const { data } = await cartApi.get();
      setServerCart(data.data);
      setError('');
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not load your cart.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isBooting) return;
    if (!isAuthenticated) {
      return;
    }

    const sync = async () => {
      setIsLoading(true);
      try {
        if (guestItems.length) {
          const { data } = await cartApi.sync(guestItems);
          setServerCart(data.data);
          setGuestItems([]);
          localStorage.removeItem(CART_STORAGE_KEY);
        } else {
          const { data } = await cartApi.get();
          setServerCart(data.data);
        }
        setError('');
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'We could not sync your cart. Your guest cart is preserved.');
        await loadServerCart();
      } finally {
        setIsLoading(false);
      }
    };

    sync();
  // Guest item changes stay local; this effect only owns the login transition.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, isBooting]);

  useEffect(() => {
    if (!isAuthenticated) {
      writeGuestCart(guestItems);
    }
  }, [guestItems, isAuthenticated]);

  const addItem = async (product, quantity = 1) => {
    setError('');
    if (!isAuthenticated) {
      setGuestItems((current) => {
        const existing = current.some((item) => item.productId === product.id);
        const nextItems = existing
          ? current.map((item) => item.productId === product.id ? { ...item, quantity: item.quantity + quantity } : item)
          : [...current, { productId: product.id, quantity }];
        return nextItems;
      });
      return;
    }

    try {
      const { data } = await cartApi.add({ productId: product.id, quantity });
      setServerCart(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not add that item.');
      throw requestError;
    }
  };

  const updateItem = async (itemId, quantity) => {
    setError('');
    if (!isAuthenticated) {
      setGuestItems((current) => current.map((item) => item.productId === itemId ? { ...item, quantity } : item));
      return;
    }
    try {
      const { data } = await cartApi.update(itemId, { quantity });
      setServerCart(data.data);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not update that quantity.');
      throw requestError;
    }
  };

  const removeItem = async (item) => {
    setError('');
    if (!isAuthenticated) {
      setGuestItems((current) => current.filter((entry) => entry.productId !== item.productId));
      return;
    }
    const { data } = await cartApi.remove(item.id);
    setServerCart(data.data);
  };

  const clear = async () => {
    setError('');
    if (!isAuthenticated) {
      setGuestItems([]);
      return;
    }
    const { data } = await cartApi.clear();
    setServerCart(data.data);
  };

  const cart = isAuthenticated ? serverCart : localCart(guestItems);
  const value = useMemo(() => ({
    cart,
    cartCount: cart.items.reduce((total, item) => total + item.quantity, 0),
    isLoading,
    error,
    addItem,
    updateItem,
    removeItem,
    clear,
    refresh: loadServerCart,
  // Cart actions are recreated only when their state inputs change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [cart, isLoading, error, isAuthenticated, guestItems]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used inside CartProvider');
  }
  return context;
}
