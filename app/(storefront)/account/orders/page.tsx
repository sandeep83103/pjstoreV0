'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ArrowRight,
  RotateCcw,
  Search,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { useCart } from '@/app/context/CartContext';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [guestOrderNo, setGuestOrderNo] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestError, setGuestError] = useState<string | null>(null);
  const [guestLoading, setGuestLoading] = useState(false);
  const { addItem, openDrawer } = useCart();

  useEffect(() => {
    async function loadCustomerOrders() {
      try {
        setLoading(true);
        const res = await fetch('/api/orders/mine');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCustomerOrders();
  }, []);

  const handleGuestLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestOrderNo.trim() && !guestPhone.trim()) {
      setGuestError('Please enter an order number or phone number');
      return;
    }

    setGuestLoading(true);
    setGuestError(null);

    try {
      if (guestOrderNo.trim()) {
        const res = await fetch(`/api/orders/${encodeURIComponent(guestOrderNo.trim())}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrders([data.data]);
          return;
        }
      }

      if (guestPhone.trim()) {
        const res = await fetch(`/api/orders/mine?phone=${encodeURIComponent(guestPhone.trim())}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setOrders(data.data);
          return;
        }
      }

      setGuestError('No orders found matching the provided order number or phone.');
    } catch (err: any) {
      setGuestError(err.message || 'Lookup failed');
    } finally {
      setGuestLoading(false);
    }
  };

  const handleReorder = (order: Order) => {
    order.items.forEach((item) => {
      addItem(
        {
          id: item.productId,
          name: item.name,
          price: item.price,
          sku: item.sku,
        },
        item.quantity
      );
    });
    openDrawer();
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Truck className="w-3.5 h-3.5" />
            In Transit / Shipped
          </span>
        );
      case 'PACKED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Package className="w-3.5 h-3.5" />
            Packed
          </span>
        );
      case 'PAID':
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Order Confirmed
          </span>
        );
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-[var(--color-primary-base)] font-semibold">My Orders</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-primary-dark)]">
            Order History &amp; Tracking
          </h1>
          <p className="text-sm text-gray-600">
            Track your handcrafted one-gram gold jewellery shipments and download GST tax invoices.
          </p>
        </div>

        {/* Guest Tracking Form Banner (when not logged in or wanting quick lookup) */}
        <div className="bg-white rounded-2xl p-6 border border-[var(--color-accent-gold)]/30 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-primary-dark)] flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--color-accent-gold)]" />
              Quick Order Search / Guest Tracking
            </h2>
            <Link
              href="/account/login"
              className="text-xs font-semibold text-[var(--color-accent-gold)] hover:underline"
            >
              Sign In to Your Account &rarr;
            </Link>
          </div>

          <form onSubmit={handleGuestLookup} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="Order Number (e.g. PJ-2026-0001)"
              value={guestOrderNo}
              onChange={(e) => setGuestOrderNo(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
            />
            <input
              type="tel"
              placeholder="Or Phone Number (10 digits)"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="px-4 py-2.5 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
            />
            <button
              type="submit"
              disabled={guestLoading}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm"
            >
              {guestLoading ? 'Searching...' : 'Find My Order'}
            </button>
          </form>

          {guestError && (
            <p className="text-xs text-red-600 font-medium">{guestError}</p>
          )}
        </div>

        {/* Orders Listing */}
        {loading ? (
          <div className="p-16 text-center text-gray-500 text-sm">
            <Clock className="w-8 h-8 animate-spin mx-auto text-[var(--color-accent-gold)] mb-3" />
            Loading your orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-sm space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 text-[var(--color-primary-base)] mx-auto flex items-center justify-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No Orders Placed Yet</h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto">
              You haven&apos;t placed any orders yet. Explore our handcrafted collection of necklaces, earrings, and bangles.
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm transition-all"
            >
              Browse Jewellery Catalog &rarr;
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const formattedDate = new Date(order.createdAt).toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-gray-200/80 hover:border-[var(--color-accent-gold)]/50 shadow-sm transition-all overflow-hidden"
                >
                  {/* Order Card Top Bar */}
                  <div className="bg-gray-50/80 p-4 sm:px-6 flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 text-xs">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div>
                        <span className="text-gray-400 uppercase tracking-wider text-[10px] block">Order Placed</span>
                        <strong className="text-gray-800">{formattedDate}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 uppercase tracking-wider text-[10px] block">Order No</span>
                        <strong className="font-mono text-[var(--color-primary-dark)]">{order.orderNo}</strong>
                      </div>
                      <div>
                        <span className="text-gray-400 uppercase tracking-wider text-[10px] block">Total Amount</span>
                        <strong className="text-gray-900 font-bold">₹{order.total.toLocaleString('en-IN')}</strong>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(order.orderStatus)}
                    </div>
                  </div>

                  {/* Order Items Snapshot Body */}
                  <div className="p-4 sm:p-6 space-y-4">
                    <div className="divide-y divide-gray-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center text-gray-400 border border-gray-200">
                              <Package className="w-5 h-5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-gray-900 text-xs sm:text-sm">{item.name}</h4>
                              <p className="text-[11px] text-gray-500">
                                Qty: {item.quantity} • ₹{item.price.toLocaleString('en-IN')} each
                              </p>
                            </div>
                          </div>
                          <span className="font-bold text-xs sm:text-sm text-gray-900">
                            ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Card Actions Footer */}
                    <div className="pt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs text-gray-500">
                        Ship to: <strong>{order.shippingAddress.fullName}</strong> ({order.shippingAddress.city})
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/account/orders/${order.orderNo}`}
                          className="inline-flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          Track Package
                        </Link>

                        <a
                          href={`/api/orders/${order.id}/invoice?download=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-gray-300 hover:bg-gray-50 text-gray-700 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                          Invoice (PDF)
                        </a>

                        <button
                          onClick={() => handleReorder(order)}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold border border-[var(--color-accent-gold)]/40 hover:bg-amber-50 text-[var(--color-primary-dark)] transition-colors"
                          title="Add these items back to your shopping cart"
                        >
                          <RotateCcw className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                          Buy Again
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
