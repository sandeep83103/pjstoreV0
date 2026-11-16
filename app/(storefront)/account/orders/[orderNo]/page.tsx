'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  MessageCircle,
  RotateCcw,
  MapPin,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';
import { useCart } from '@/app/context/CartContext';
import { calculateGst } from '@/lib/invoices/generator';
import { resolveCourierTrackingUrl } from '@/lib/notifications/whatsapp';

const TRACKING_STEPS = [
  { key: 'PLACED', label: 'Order Placed', desc: 'Received & Verified' },
  { key: 'PAID', label: 'Payment Confirmed', desc: 'Securely Processed' },
  { key: 'PACKED', label: 'Packed & Ready', desc: 'Handcrafted Packaging' },
  { key: 'SHIPPED', label: 'Dispatched', desc: 'Handed to Courier' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Package Received' },
];

export default function OrderTrackingDetailPage() {
  const params = useParams();
  const orderNo = params.orderNo as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const { addItem, openDrawer } = useCart();

  useEffect(() => {
    async function fetchOrder() {
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`/api/orders/${encodeURIComponent(orderNo)}`);
        const data = await res.json();
        if (data.success && data.data) {
          setOrder(data.data);
        } else {
          setErrorMsg(data.error?.message || 'Order not found');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load order');
      } finally {
        setLoading(false);
      }
    }

    if (orderNo) {
      fetchOrder();
    }
  }, [orderNo]);

  const handleReorder = () => {
    if (!order) return;
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

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FCFBF7] py-16 text-center text-gray-500">
        <Clock className="w-8 h-8 animate-spin mx-auto text-[var(--color-accent-gold)] mb-3" />
        <p className="text-sm font-medium">Tracking your order...</p>
      </div>
    );
  }

  if (!order || errorMsg) {
    return (
      <div className="min-h-screen bg-[#FCFBF7] py-16 px-4">
        <div className="max-w-md mx-auto text-center bg-white p-8 rounded-2xl border border-gray-200 shadow-sm space-y-4">
          <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
          <h2 className="text-xl font-bold text-gray-900">Order Not Found</h2>
          <p className="text-sm text-gray-500">
            {errorMsg || `We could not find order ${orderNo}. Please check your order reference number.`}
          </p>
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary-base)] text-white"
          >
            <ArrowLeft className="w-4 h-4" /> Back to My Orders
          </Link>
        </div>
      </div>
    );
  }

  // Calculate current stage index
  const stepKeys = TRACKING_STEPS.map((s) => s.key);
  const currentStepIdx = stepKeys.indexOf(order.orderStatus);

  // Compute GST breakdown for customer view
  const tax = calculateGst(order);

  // Resolve tracking link
  const trackingNumber = order.tracking?.trackingNumber;
  const courier = order.tracking?.courier;
  const trackingUrl = resolveCourierTrackingUrl(courier, trackingNumber, order.tracking?.trackingUrl);

  const whatsappSupportUrl = `https://wa.me/919677255036?text=${encodeURIComponent(
    `Hello Parnika Jewellers, I would like to enquire about my Order #${order.orderNo}.`
  )}`;

  return (
    <div className="min-h-screen bg-[#FCFBF7] py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center justify-between">
          <Link
            href="/account/orders"
            className="inline-flex items-center gap-2 text-xs font-semibold text-gray-600 hover:text-[var(--color-primary-dark)]"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Orders
          </Link>
          <div className="flex items-center gap-2">
            <a
              href={`/api/orders/${order.id}/invoice?download=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-700" />
              Download GST Invoice (PDF)
            </a>
          </div>
        </div>

        {/* Order Header Card */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-[var(--color-primary-dark)]">
                {order.orderNo}
              </h1>
              <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleReorder}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold border border-[var(--color-accent-gold)] text-[var(--color-primary-dark)] hover:bg-amber-50 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
              Re-Order Items
            </button>
          </div>
        </div>

        {/* Visual Progress Tracker Stepper (EVAL-P6-03) */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--color-primary-dark)]">
            Shipment Progress
          </h2>

          <div className="relative">
            {/* Timeline Bar */}
            <div className="hidden sm:block absolute top-4 left-6 right-6 h-1 bg-gray-200 z-0" />

            <div className="grid grid-cols-1 sm:grid-cols-5 gap-6 sm:gap-2 relative z-10">
              {TRACKING_STEPS.map((step, idx) => {
                const isPassed = currentStepIdx >= idx && order.orderStatus !== 'CANCELLED';
                const isCurrent = order.orderStatus === step.key;

                return (
                  <div key={step.key} className="flex sm:flex-col items-center gap-3 sm:gap-1 text-left sm:text-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 transition-all ${
                        isCurrent
                          ? 'bg-[var(--color-primary-base)] text-[var(--color-accent-gold)] ring-4 ring-[var(--color-accent-gold)]/30'
                          : isPassed
                          ? 'bg-emerald-600 text-white'
                          : 'bg-white text-gray-400 border-2 border-gray-300'
                      }`}
                    >
                      {isPassed ? '✓' : idx + 1}
                    </div>
                    <div>
                      <h4
                        className={`text-xs font-bold ${
                          isCurrent
                            ? 'text-[var(--color-primary-dark)] font-bold'
                            : isPassed
                            ? 'text-gray-900'
                            : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </h4>
                      <p className="text-[10px] text-gray-500 hidden sm:block">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Courier Dispatch Live Info Box */}
          {trackingNumber ? (
            <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-blue-900 flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-blue-700" />
                  Dispatched via <strong>{courier || 'Express Courier'}</strong>
                </div>
                <div className="text-blue-800">
                  Tracking Number (AWB): <strong className="font-mono">{trackingNumber}</strong>
                </div>
              </div>

              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-700 text-white hover:bg-blue-800 shadow-sm transition-colors self-start sm:self-auto"
              >
                Track on {courier || 'Courier'} Portal <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-xs text-amber-800 flex items-center gap-2">
              <Clock className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Your jewellery is being packaged with utmost care. A live courier tracking link will appear here once dispatched!
              </span>
            </div>
          )}
        </div>

        {/* Order Details & Addresses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Order Items (2 Cols) */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-primary-dark)]">
              Items Ordered ({order.items.length})
            </h3>

            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-gray-400 border border-gray-200 shrink-0">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                      <p className="text-xs text-gray-500">
                        SKU: <strong className="font-mono">{item.sku}</strong> • Qty: {item.quantity}
                      </p>
                      <p className="text-xs text-gray-600">
                        ₹{item.price.toLocaleString('en-IN')} each
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-gray-900 text-sm">
                    ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>

            {/* Price Breakdown */}
            <div className="pt-4 border-t border-gray-100 space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-700">
                  <span>Coupon Discount ({order.couponCode || 'Promo'})</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Shipping Charges</span>
                <span>{order.shippingFee > 0 ? `₹${order.shippingFee.toLocaleString('en-IN')}` : 'FREE'}</span>
              </div>
              <div className="flex justify-between text-gray-500 pt-1">
                <span>GST Tax (3% HSN 7117 Included)</span>
                <span>
                  {tax.isIntraState
                    ? `CGST (1.5%): ₹${tax.cgstAmount} | SGST (1.5%): ₹${tax.sgstAmount}`
                    : `IGST (3.0%): ₹${tax.igstAmount}`}
                </span>
              </div>
              <div className="flex justify-between text-base font-bold text-[var(--color-primary-dark)] pt-3 border-t border-gray-200">
                <span>Total Amount Paid</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Delivery & Assistance Card */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-[var(--color-primary-dark)] flex items-center gap-2">
                <MapPin className="w-4 h-4 text-emerald-600" />
                Delivery Address
              </h3>
              <div className="text-xs text-gray-600 space-y-1">
                <p className="font-bold text-gray-900 text-sm">{order.shippingAddress.fullName}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                <p className="pt-1">Phone: <strong className="text-gray-900">{order.shippingAddress.phone}</strong></p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-3">
              <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Parnika Guarantee
              </h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Every piece is covered by our 1-Gram Gold micro-plating warranty and tamper-evident insured delivery.
              </p>
              <a
                href={whatsappSupportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
                Need Help? Chat on WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
