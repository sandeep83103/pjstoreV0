'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Printer,
  MessageCircle,
  ExternalLink,
  Save,
  CreditCard,
  MapPin,
  Calendar,
  ShieldCheck,
  RefreshCw,
  X,
} from 'lucide-react';
import { Order, OrderStatus, AuditLog } from '@/lib/types';

const COURIER_OPTIONS = [
  'Delhivery',
  'Shiprocket',
  'Blue Dart',
  'India Post (Speed Post)',
  'DTDC',
  'Other / Local Courier',
];

const ORDER_LIFECYCLE_STEPS: OrderStatus[] = [
  'PLACED',
  'PAID',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
];

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Tracking form state
  const [courier, setCourier] = useState('Delhivery');
  const [trackingNumber, setTrackingNumber] = useState('');
  const [trackingUrl, setTrackingUrl] = useState('');

  // Packing slip modal state
  const [showPackingSlip, setShowPackingSlip] = useState(false);

  // WhatsApp share links
  const [whatsappOrderUrl, setWhatsappOrderUrl] = useState('');
  const [whatsappShippingUrl, setWhatsappShippingUrl] = useState('');

  const fetchOrderDetails = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const data = await res.json();
      if (data.success && data.data?.order) {
        const ord: Order = data.data.order;
        setOrder(ord);
        setAuditLogs(data.data.auditLogs || []);
        if (ord.tracking) {
          setCourier(ord.tracking.courier || 'Delhivery');
          setTrackingNumber(ord.tracking.trackingNumber || '');
          setTrackingUrl(ord.tracking.trackingUrl || '');
        }
        if (data.data.actions) {
          setWhatsappOrderUrl(data.data.actions.whatsappOrderUrl || '');
          setWhatsappShippingUrl(data.data.actions.whatsappShippingUrl || '');
        }
      } else {
        setErrorMsg(data.error?.message || 'Order not found');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to fetch order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = async (targetStatus: OrderStatus) => {
    if (!order) return;
    setUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Status update failed');
      }
      setSuccessMsg(`Order transitioned to ${targetStatus}`);
      await fetchOrderDetails();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleSaveTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    if (!trackingNumber.trim()) {
      setErrorMsg('Please enter a tracking or AWB number');
      return;
    }
    setUpdating(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${order.id}/tracking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courier,
          trackingNumber: trackingNumber.trim(),
          trackingUrl: trackingUrl.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || data.error || 'Tracking update failed');
      }
      setSuccessMsg('Tracking details saved and customer notified via email & WhatsApp!');
      await fetchOrderDetails();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-16 text-center text-gray-500">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-[var(--color-accent-gold)] mb-3" />
        <p className="text-sm font-medium">Loading Order Details...</p>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-lg font-bold text-gray-800">Order Not Found</h2>
        <p className="text-sm text-gray-500">{errorMsg || `No order found with ID ${orderId}`}</p>
        <Link
          href="/admin/orders"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--color-primary-base)] text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>
      </div>
    );
  }

  const currentStepIdx = ORDER_LIFECYCLE_STEPS.indexOf(order.orderStatus);

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 rounded-xl bg-white border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
            title="Back to Orders List"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold font-mono text-[var(--color-primary-dark)]">
                {order.orderNo}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
                {order.orderStatus}
              </span>
            </div>
            <p className="text-xs text-gray-500">
              Placed on {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        </div>

        {/* Top Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <a
            href={`/api/orders/${order.id}/invoice?download=true`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
          >
            <FileText className="w-4 h-4 text-emerald-700" />
            Download Tax Invoice (PDF)
          </a>

          <button
            onClick={() => setShowPackingSlip(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4 text-gray-700" />
            Print Packing Slip
          </button>

          {whatsappShippingUrl && (
            <a
              href={whatsappShippingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all"
              title="Send 1-Click WhatsApp Notification to Customer"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp Customer
            </a>
          )}
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg(null)} className="text-red-500 hover:text-red-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Order Fulfillment Pipeline Stepper */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500">
          Order Status Workflow
        </h2>

        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2 z-0" />
          {ORDER_LIFECYCLE_STEPS.map((step, idx) => {
            const isCompleted = currentStepIdx >= idx && order.orderStatus !== 'CANCELLED';
            const isCurrent = order.orderStatus === step;

            return (
              <div key={step} className="flex flex-col items-center relative z-10 bg-white px-2">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                    isCurrent
                      ? 'bg-[var(--color-primary-base)] text-[var(--color-accent-gold)] ring-4 ring-[var(--color-accent-gold)]/30'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-400 border border-gray-300'
                  }`}
                >
                  {isCompleted ? '✓' : idx + 1}
                </div>
                <span
                  className={`mt-2 text-[11px] font-semibold uppercase tracking-wider ${
                    isCurrent
                      ? 'text-[var(--color-primary-dark)] font-bold'
                      : isCompleted
                      ? 'text-emerald-800'
                      : 'text-gray-400'
                  }`}
                >
                  {step}
                </span>
              </div>
            );
          })}
        </div>

        {/* Quick Transition Action Bar */}
        <div className="pt-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <div className="text-xs text-gray-500">
            Current Status: <strong className="text-gray-900">{order.orderStatus}</strong>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {order.orderStatus === 'PLACED' && (
              <>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange('PAID')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                >
                  Mark as Paid
                </button>
                <button
                  disabled={updating}
                  onClick={() => handleStatusChange('PACKED')}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
                >
                  Mark as Packed
                </button>
              </>
            )}

            {order.orderStatus === 'PAID' && (
              <button
                disabled={updating}
                onClick={() => handleStatusChange('PACKED')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white shadow-sm"
              >
                Mark as Packed
              </button>
            )}

            {order.orderStatus === 'PACKED' && (
              <button
                disabled={updating}
                onClick={() => handleStatusChange('SHIPPED')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                Mark as Shipped
              </button>
            )}

            {order.orderStatus === 'SHIPPED' && (
              <button
                disabled={updating}
                onClick={() => handleStatusChange('DELIVERED')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
              >
                Mark as Delivered
              </button>
            )}

            {order.orderStatus !== 'CANCELLED' && order.orderStatus !== 'DELIVERED' && (
              <button
                disabled={updating}
                onClick={() => handleStatusChange('CANCELLED')}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Grid: Details + Shipping Form */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Pricing Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items Table */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">
                Ordered Items ({order.items.length})
              </h3>
              <span className="text-xs text-gray-500">
                HSN Code: <strong>7117</strong> (Imitation Jewellery)
              </span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.items.map((item, index) => (
                <div key={index} className="p-5 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gray-100 rounded-xl overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center text-gray-400">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                      <div className="text-xs text-gray-500 space-x-2 mt-0.5">
                        <span>SKU: <strong className="font-mono">{item.sku}</strong></span>
                        {item.variantName && <span>• {item.variantName}</span>}
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        ₹{item.price.toLocaleString('en-IN')} × {item.quantity} unit(s)
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="font-bold text-gray-900 text-sm">
                      ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Financial Totals */}
            <div className="p-5 bg-gray-50/70 border-t border-gray-100 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 text-xs">
                <span>Subtotal</span>
                <span>₹{order.subtotal.toLocaleString('en-IN')}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-red-700 text-xs">
                  <span>Coupon Discount ({order.couponCode || 'Promo'})</span>
                  <span>-₹{order.discount.toLocaleString('en-IN')}</span>
                </div>
              )}

              <div className="flex justify-between text-gray-600 text-xs">
                <span>Shipping Charges</span>
                <span>{order.shippingFee > 0 ? `₹${order.shippingFee.toLocaleString('en-IN')}` : 'FREE'}</span>
              </div>

              <div className="flex justify-between text-gray-500 text-[11px] pt-1">
                <span>GST Tax (3% HSN 7117 Included)</span>
                <span>
                  {order.shippingAddress.state.toLowerCase() === 'telangana' || order.shippingAddress.state.toLowerCase() === 'tg'
                    ? 'CGST (1.5%) + SGST (1.5%)'
                    : 'IGST (3.0%)'}
                </span>
              </div>

              <div className="flex justify-between text-base font-bold text-[var(--color-primary-dark)] pt-2 border-t border-gray-200">
                <span>Grand Total</span>
                <span>₹{order.total.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Customer & Shipping Address Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              Shipping &amp; Customer Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">Customer</span>
                <p className="font-bold text-gray-900">{order.shippingAddress.fullName}</p>
                <p className="text-gray-600">Phone: {order.shippingAddress.phone}</p>
                <p className="text-gray-500 text-xs">User ID: {order.userId}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-gray-400 font-semibold uppercase">Delivery Address</span>
                <p className="text-gray-700">
                  {order.shippingAddress.street}, {order.shippingAddress.city}
                </p>
                <p className="text-gray-700">
                  {order.shippingAddress.state} - <strong>{order.shippingAddress.pincode}</strong>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Courier & Tracking Dispatch Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <Truck className="w-4 h-4 text-blue-600" />
              Courier &amp; Tracking Management
            </h3>

            <form onSubmit={handleSaveTracking} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Courier Provider
                </label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                >
                  {COURIER_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Tracking / AWB Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. DEL-123456789"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Direct Tracking URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={trackingUrl}
                  onChange={(e) => setTrackingUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                />
                <span className="text-[11px] text-gray-400">
                  Auto-generates if left blank for major Indian couriers.
                </span>
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm transition-all"
              >
                <Save className="w-4 h-4 text-[var(--color-accent-gold)]" />
                {updating ? 'Saving & Notifying...' : 'Save Tracking & Dispatch'}
              </button>
            </form>

            {order.tracking?.trackingNumber && (
              <div className="pt-3 border-t border-gray-100 text-xs space-y-1">
                <div className="text-gray-500">Current Courier: <strong className="text-gray-900">{order.tracking.courier}</strong></div>
                <div className="text-gray-500">AWB: <strong className="font-mono text-gray-900">{order.tracking.trackingNumber}</strong></div>
                {order.tracking.trackingUrl && (
                  <a
                    href={order.tracking.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 hover:underline pt-1"
                  >
                    Open Live Tracking Portal <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Payment Card */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              Payment Information
            </h3>
            <div className="text-xs space-y-2 text-gray-600">
              <div className="flex justify-between">
                <span>Method</span>
                <strong className="text-gray-900 uppercase">{order.paymentMethod}</strong>
              </div>
              <div className="flex justify-between">
                <span>Payment Status</span>
                <strong className={order.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}>
                  {order.paymentStatus}
                </strong>
              </div>
              <div className="flex justify-between">
                <span>Amount</span>
                <strong className="text-gray-900">₹{order.total.toLocaleString('en-IN')}</strong>
              </div>
            </div>
          </div>

          {/* Audit Logs Trail */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600" />
              Audit Log Trail
            </h3>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-gray-400">No previous state changes recorded.</p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {auditLogs.map((log) => (
                  <div key={log.id} className="text-xs p-2 rounded-lg bg-gray-50 border border-gray-100">
                    <div className="flex items-center justify-between text-gray-600">
                      <span className="font-bold text-gray-800">{log.action}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 mt-0.5">By {log.actorEmail || 'System'}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Printable Packing Slip Modal */}
      {showPackingSlip && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="text-lg font-bold font-display text-[var(--color-primary-dark)]">
                  Warehouse Packing Slip
                </h3>
                <p className="text-xs text-gray-500">Order #{order.orderNo} • Parnika Jewellers Fulfillment</p>
              </div>
              <button
                onClick={() => setShowPackingSlip(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Content Block */}
            <div id="printable-packing-slip" className="border border-gray-300 p-6 rounded-xl space-y-4 text-sm bg-white">
              <div className="flex justify-between items-start border-b pb-4">
                <div>
                  <h2 className="text-xl font-bold font-display text-emerald-950">PARNIKA JEWELLERS</h2>
                  <p className="text-xs text-gray-500">Hyderabad, Telangana • Support: +91 98765 43210</p>
                  <p className="text-xs text-gray-700 mt-1">Order No: <strong className="font-mono">{order.orderNo}</strong></p>
                </div>
                <div className="text-right text-xs">
                  <p className="font-bold text-gray-900">DISPATCH MANIFEST</p>
                  <p className="text-gray-500">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                  <p className="text-emerald-700 font-semibold uppercase">{order.paymentMethod} ({order.paymentStatus})</p>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-xs space-y-1">
                <span className="font-bold text-gray-700 uppercase">Ship To:</span>
                <p className="font-bold text-gray-900">{order.shippingAddress.fullName} ({order.shippingAddress.phone})</p>
                <p className="text-gray-600">{order.shippingAddress.street}, {order.shippingAddress.city}</p>
                <p className="text-gray-600">{order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
              </div>

              {/* Checklist */}
              <div>
                <p className="text-xs font-bold uppercase text-gray-500 mb-2">Item Verification Checklist:</p>
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-gray-100 text-gray-700 font-semibold">
                      <th className="p-2 text-left">Check</th>
                      <th className="p-2 text-left">SKU / Code</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right">Qty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="p-2">
                          <input type="checkbox" className="w-4 h-4 rounded text-emerald-700" />
                        </td>
                        <td className="p-2 font-mono font-bold text-gray-800">{it.sku}</td>
                        <td className="p-2 text-gray-900">{it.name}</td>
                        <td className="p-2 text-right font-bold">{it.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="pt-4 border-t text-[11px] text-gray-400 flex justify-between">
                <span>Packed By: ___________________</span>
                <span>Inspected By: ___________________</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)]"
              >
                Print Slip Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
