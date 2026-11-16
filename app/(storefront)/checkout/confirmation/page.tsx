'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Package, ArrowRight, MessageCircle, MapPin, CreditCard, Clock } from 'lucide-react';
import { Order } from '@/lib/types';
import { formatINR } from '@/lib/utils';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNoParam = searchParams.get('orderNo');

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const idToFetch = orderId || orderNoParam;
      if (!idToFetch) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(idToFetch)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setOrder(json.data);
          }
        }
      } catch (err) {
        console.error('Failed to load order:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [orderId, orderNoParam]);

  const displayOrderNo = order?.orderNo || orderNoParam || 'PJ-ORD';

  const whatsAppSupportUrl = `https://wa.me/919677255036?text=${encodeURIComponent(
    `Hello Parnika Jewellers, I have placed Order ${displayOrderNo}. Please provide tracking and status updates.`
  )}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="bg-white rounded-3xl border border-stone-200/80 p-6 sm:p-10 shadow-lg text-center space-y-6">
        
        {/* Success Icon */}
        <div className="w-16 h-16 sm:w-20 sm:h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-sm">
          <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
        </div>

        {/* Title & Order Number */}
        <div className="space-y-2">
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-stone-900">
            Thank You! Your Order is Reserved
          </h1>
          <p className="text-sm text-stone-500">
            Order Reference Number:{' '}
            <span className="font-mono font-bold text-stone-900 bg-stone-100 px-2 py-0.5 rounded">
              {displayOrderNo}
            </span>
          </p>
        </div>

        {/* Notice Banner */}
        {order?.paymentMethod === 'cod' ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-900 text-xs sm:text-sm text-left flex items-start gap-3">
            <Package className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Cash on Delivery Confirmed</p>
              <p className="text-stone-600 mt-0.5">
                Your order has been placed successfully and is being packed. Please keep{' '}
                <span className="font-bold text-stone-900">{formatINR(order?.total || 0)}</span> ready in cash upon delivery.
              </p>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs sm:text-sm text-left flex items-start gap-3">
            <Clock className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Inventory Reserved for 15 Minutes</p>
              <p className="text-stone-600 mt-0.5">
                Your order is safely locked. Payment confirmation status will reflect immediately upon bank transfer verification.
              </p>
            </div>
          </div>
        )}

        {/* Order Details Card */}
        {order && (
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-200/70 text-left space-y-4 text-xs sm:text-sm">
            <div className="flex justify-between items-center pb-3 border-b border-stone-200">
              <span className="font-bold text-stone-700">Order Status:</span>
              <span className="px-2.5 py-1 bg-[var(--color-primary-base)] text-white font-semibold rounded-full text-xs">
                {order.orderStatus}
              </span>
            </div>

            {/* Address */}
            <div>
              <p className="font-bold text-stone-800 flex items-center gap-1.5 mb-1">
                <MapPin className="w-4 h-4 text-stone-500" /> Delivery Address
              </p>
              <p className="text-stone-600">
                {order.shippingAddress.fullName} • {order.shippingAddress.phone}
              </p>
              <p className="text-stone-500">
                {order.shippingAddress.street}, {order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}
              </p>
            </div>

            {/* Items */}
            <div className="pt-2 border-t border-stone-200 space-y-2">
              <p className="font-bold text-stone-800">Items Ordered ({order.items.length}):</p>
              <div className="space-y-1.5">
                {order.items.map((i, idx) => (
                  <div key={idx} className="flex justify-between text-stone-600">
                    <span>
                      {i.name} <span className="text-stone-400">× {i.quantity}</span>
                    </span>
                    <span className="font-semibold text-stone-900">{formatINR(i.price * i.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="pt-3 border-t border-stone-200 flex justify-between font-bold text-sm sm:text-base text-stone-900">
              <span>Total Paid / Payable:</span>
              <span className="text-[var(--color-primary-base)] font-extrabold">{formatINR(order.total)}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <a
            href={whatsAppSupportUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Get Updates on WhatsApp
          </a>

          <Link
            href="/catalog"
            className="w-full sm:w-auto py-3 px-6 rounded-xl bg-[var(--color-primary-base)] hover:bg-[var(--color-primary-dark)] text-[var(--color-accent-light-gold)] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-colors"
          >
            Continue Shopping
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}

export default function OrderConfirmationPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-3xl mx-auto px-4 py-20 text-center">
          <div className="w-10 h-10 border-4 border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-stone-500 font-medium">Securing and confirming your order details...</p>
        </div>
      }
    >
      <ConfirmationContent />
    </Suspense>
  );
}
