'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { EnrichedCartLineItem } from '@/app/api/cart/route';

interface CartContextValue {
  items: EnrichedCartLineItem[];
  itemCount: number;
  subtotal: number;
  discount: number;
  shippingFee: number;
  total: number;
  couponCode: string | null;
  couponMessage: string | null;
  isDrawerOpen: boolean;
  isLoading: boolean;
  stockAlerts: string[];
  addItem: (
    product: {
      id: string;
      name: string;
      price: number;
      mrp?: number;
      sku?: string;
      slug?: string;
      images?: string[];
      stock?: number;
    },
    quantity?: number,
    variantId?: string
  ) => Promise<void>;
  updateQuantity: (productId: string, quantity: number, variantId?: string) => Promise<void>;
  removeItem: (productId: string, variantId?: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<{ success: boolean; message?: string }>;
  removeCoupon: () => Promise<void>;
  openDrawer: () => void;
  closeDrawer: () => void;
  clearStockAlerts: () => void;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'pj_guest_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<EnrichedCartLineItem[]>([]);
  const [subtotal, setSubtotal] = useState(0);
  const [discount, setDiscount] = useState(0);
  const [shippingFee, setShippingFee] = useState(0);
  const [total, setTotal] = useState(0);
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [stockAlerts, setStockAlerts] = useState<string[]>([]);

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0);

  // Sync state with server API
  const syncWithServer = useCallback(
    async (
      itemsToSync: Array<{ productId: string; variantId?: string; quantity: number }>,
      couponToSync?: string | null,
      merge = false
    ) => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: itemsToSync,
            couponCode: couponToSync || undefined,
            merge,
          }),
        });

        if (!res.ok) {
          throw new Error('Failed to synchronize cart with server.');
        }

        const json = await res.json();
        if (json.success && json.data) {
          const {
            items: serverItems,
            subtotal: serverSubtotal,
            discount: serverDiscount,
            shippingFee: serverShipping,
            total: serverTotal,
            couponCode: serverCoupon,
            couponMessage: serverMsg,
            adjustedItems,
            removedItems,
          } = json.data;

          setItems(serverItems || []);
          setSubtotal(serverSubtotal || 0);
          setDiscount(serverDiscount || 0);
          setShippingFee(serverShipping || 0);
          setTotal(serverTotal || 0);
          setCouponCode(serverCoupon || null);
          setCouponMessage(serverMsg || null);

          // Handle Alerts
          const alerts: string[] = [];
          if (adjustedItems && adjustedItems.length > 0) {
            for (const adj of adjustedItems) {
              alerts.push(
                `Item '${adj.name}' quantity adjusted to ${adj.adjustedQty} (available stock).`
              );
            }
          }
          if (removedItems && removedItems.length > 0) {
            for (const rem of removedItems) {
              alerts.push(`Item '${rem.name}' is no longer available and was removed.`);
            }
          }

          if (alerts.length > 0) {
            setStockAlerts((prev) => [...prev, ...alerts]);
          }

          // Update LocalStorage
          try {
            const rawStoredItems = (serverItems || []).map((i: EnrichedCartLineItem) => ({
              productId: i.productId,
              variantId: i.variantId,
              quantity: i.quantity,
              addedPrice: i.price,
            }));
            localStorage.setItem(
              LOCAL_STORAGE_KEY,
              JSON.stringify({
                items: rawStoredItems,
                couponCode: serverCoupon || undefined,
              })
            );
          } catch {
            // LocalStorage write error handling
          }
        }
      } catch (err) {
        console.error('Cart sync error:', err);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Initial Load & Auth Sync
  useEffect(() => {
    let localItems: Array<{ productId: string; variantId?: string; quantity: number }> = [];
    let localCoupon: string | undefined = undefined;

    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed.items)) {
          localItems = parsed.items;
        }
        localCoupon = parsed.couponCode;
      }
    } catch {
      // LocalStorage read error
    }

    // Always sync with server (with merge=true to combine guest items with user cart if logged in)
    syncWithServer(localItems, localCoupon, true);

    const handleExternalUpdate = () => {
      try {
        const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed.items)) {
            syncWithServer(parsed.items, parsed.couponCode);
          }
        }
      } catch {
        // Fallback
      }
    };

    window.addEventListener('cart_updated', handleExternalUpdate);
    return () => window.removeEventListener('cart_updated', handleExternalUpdate);
  }, [syncWithServer]);

  // Actions
  const addItem = async (
    product: {
      id: string;
      name: string;
      price: number;
      mrp?: number;
      sku?: string;
      slug?: string;
      images?: string[];
      stock?: number;
    },
    quantity: number = 1,
    variantId?: string
  ) => {
    const existingIndex = items.findIndex(
      (i) => i.productId === product.id && i.variantId === variantId
    );

    let updatedList = [...items];
    if (existingIndex > -1) {
      const existing = updatedList[existingIndex];
      if (existing) {
        const newQty = existing.quantity + quantity;
        updatedList[existingIndex] = {
          ...existing,
          quantity: newQty,
        };
      }
    } else {
      updatedList.push({
        productId: product.id,
        variantId,
        quantity,
        price: product.price,
        mrp: product.mrp || product.price,
        name: product.name,
        sku: product.sku || '',
        slug: product.slug || '',
        imageKey: product.images?.[0] || '',
        stock: product.stock ?? 99,
        available: true,
      });
    }

    await syncWithServer(
      updatedList.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      couponCode
    );

    setIsDrawerOpen(true);
  };

  const updateQuantity = async (productId: string, quantity: number, variantId?: string) => {
    if (quantity <= 0) {
      await removeItem(productId, variantId);
      return;
    }

    const updatedList = items.map((item) => {
      if (item.productId === productId && item.variantId === variantId) {
        return { ...item, quantity };
      }
      return item;
    });

    await syncWithServer(
      updatedList.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      couponCode
    );
  };

  const removeItem = async (productId: string, variantId?: string) => {
    const updatedList = items.filter(
      (item) => !(item.productId === productId && item.variantId === variantId)
    );

    await syncWithServer(
      updatedList.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      couponCode
    );
  };

  const clearCart = async () => {
    setItems([]);
    setSubtotal(0);
    setDiscount(0);
    setShippingFee(0);
    setTotal(0);
    setCouponCode(null);
    setCouponMessage(null);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch {
      // LocalStorage error
    }
    await syncWithServer([]);
  };

  const applyCoupon = async (code: string) => {
    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      return { success: false, message: 'Please enter a valid coupon code.' };
    }

    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          cartSubtotal: subtotal,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        const errorMsg = json.error?.message || 'Invalid coupon code.';
        return { success: false, message: errorMsg };
      }

      setCouponCode(cleanCode);
      setCouponMessage(null);

      // Re-sync with the applied coupon
      await syncWithServer(
        items.map((i) => ({
          productId: i.productId,
          variantId: i.variantId,
          quantity: i.quantity,
        })),
        cleanCode
      );

      return { success: true };
    } catch {
      return { success: false, message: 'Failed to apply coupon. Please try again.' };
    }
  };

  const removeCoupon = async () => {
    setCouponCode(null);
    setCouponMessage(null);
    await syncWithServer(
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      null
    );
  };

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const clearStockAlerts = () => setStockAlerts([]);
  const refreshCart = () =>
    syncWithServer(
      items.map((i) => ({
        productId: i.productId,
        variantId: i.variantId,
        quantity: i.quantity,
      })),
      couponCode
    );

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        discount,
        shippingFee,
        total,
        couponCode,
        couponMessage,
        isDrawerOpen,
        isLoading,
        stockAlerts,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        applyCoupon,
        removeCoupon,
        openDrawer,
        closeDrawer,
        clearStockAlerts,
        refreshCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
