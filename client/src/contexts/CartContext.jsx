/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { cartApi, catalogApi } from '../api';
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

function buildLocalCart(items, stockMap = {}) {
  let totalAmount = 0;
  const mapped = items.map((item) => {
    const price = Number(item.price) || 0;
    const itemTotal = price * item.quantity;
    totalAmount += itemTotal;
    const liveStock = stockMap[item.productId] ?? item.stock_quantity ?? 10;

    return {
      id: item.id || `local-${item.productId}`,
      productId: item.productId,
      quantity: item.quantity,
      name: item.name || 'Product',
      price,
      itemTotal,
      image: item.image || null,
      is_active: item.is_active ?? true,
      stock_quantity: liveStock,
    };
  });

  return {
    ...emptyCart,
    items: mapped,
    totalAmount,
  };
}

export function CartProvider({ children }) {
  const { isAuthenticated, isBooting } = useAuth();
  const [guestItems, setGuestItems] = useState(readGuestCart);
  const [serverCart, setServerCart] = useState(emptyCart);
  const [stockMap, setStockMap] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const refreshStocks = async () => {
    try {
      const { data } = await catalogApi.products({ limit: 100 });
      const map = {};
      if (Array.isArray(data.data)) {
        data.data.forEach((p) => {
          map[p.id] = p.stock_quantity;
        });
      }
      setStockMap(map);
      return map;
    } catch {
      return {};
    }
  };

  useEffect(() => {
    catalogApi.products({ limit: 100 })
      .then(({ data }) => {
        const map = {};
        if (Array.isArray(data.data)) {
          data.data.forEach((p) => {
            map[p.id] = p.stock_quantity;
          });
        }
        setStockMap(map);
      })
      .catch(() => {});
  }, []);

  const loadServerCart = async () => {
    setIsLoading(true);
    try {
      const [{ data: cartData }] = await Promise.all([
        cartApi.get(),
        refreshStocks(),
      ]);
      setServerCart(cartData.data);
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
          const payload = guestItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
          }));
          const { data } = await cartApi.sync(payload);
          setServerCart(data.data);
          setGuestItems([]);
          localStorage.removeItem(CART_STORAGE_KEY);
        } else {
          const { data } = await cartApi.get();
          setServerCart(data.data);
        }
        await refreshStocks();
        setError('');
      } catch (requestError) {
        setError(requestError.response?.data?.error || 'We could not sync your cart. Your guest cart is preserved.');
        await loadServerCart();
      } finally {
        setIsLoading(false);
      }
    };

    sync();
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
        const existing = current.find((item) => item.productId === product.id);
        if (existing) {
          return current.map((item) =>
            item.productId === product.id
              ? {
                  ...item,
                  quantity: item.quantity + quantity,
                  name: product.name || item.name,
                  price: Number(product.price ?? item.price),
                  image: product.images?.[0] || item.image,
                  stock_quantity: product.stock_quantity ?? item.stock_quantity,
                }
              : item
          );
        }
        return [
          ...current,
          {
            productId: product.id,
            quantity,
            name: product.name,
            price: Number(product.price),
            image: product.images?.[0] || null,
            stock_quantity: product.stock_quantity ?? 10,
            is_active: product.is_active ?? true,
          },
        ];
      });
      return;
    }

    try {
      const { data } = await cartApi.add({ productId: product.id, quantity });
      setServerCart(data.data);
      await refreshStocks();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'We could not add that item.');
      await loadServerCart();
      throw requestError;
    }
  };

  const removeItem = async (item) => {
    setError('');
    if (!isAuthenticated) {
      setGuestItems((current) => current.filter((entry) => entry.productId !== item.productId));
      return;
    }
    try {
      const { data } = await cartApi.remove(item.id);
      setServerCart(data.data);
      await refreshStocks();
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Could not remove item.');
      await loadServerCart();
    }
  };

  const updateItem = async (itemId, quantity, itemObj) => {
    setError('');
    if (quantity <= 0) {
      await removeItem(itemObj || { id: itemId, productId: itemId });
      return;
    }

    if (!isAuthenticated) {
      setGuestItems((current) =>
        current.map((item) => (item.productId === itemId ? { ...item, quantity } : item))
      );
      return;
    }

    try {
      const { data } = await cartApi.update(itemId, { quantity });
      setServerCart(data.data);
      await refreshStocks();
    } catch (requestError) {
      const errMsg = requestError.response?.data?.error || 'We could not update that quantity.';
      setError(errMsg);
      await loadServerCart();
      throw requestError;
    }
  };

  const clear = async () => {
    setError('');
    if (!isAuthenticated) {
      setGuestItems([]);
      localStorage.removeItem(CART_STORAGE_KEY);
      return;
    }
    const { data } = await cartApi.clear();
    setServerCart(data.data);
  };

  const cart = useMemo(() => {
    if (!isAuthenticated) {
      return buildLocalCart(guestItems, stockMap);
    }
    return {
      ...serverCart,
      items: serverCart.items.map((item) => ({
        ...item,
        stock_quantity: stockMap[item.productId] ?? 10,
      })),
    };
  }, [isAuthenticated, guestItems, serverCart, stockMap]);

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
    refreshStocks,
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
