'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ShoppingCart,
  Search,
  Filter,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  ExternalLink,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Order, OrderStatus } from '@/lib/types';

const STATUS_TABS: Array<{ label: string; value: string }> = [
  { label: 'All Orders', value: 'ALL' },
  { label: 'Placed', value: 'PLACED' },
  { label: 'Paid', value: 'PAID' },
  { label: 'Packed', value: 'PACKED' },
  { label: 'Shipped', value: 'SHIPPED' },
  { label: 'Delivered', value: 'DELIVERED' },
  { label: 'Cancelled', value: 'CANCELLED' },
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    async function fetchOrders() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (statusFilter !== 'ALL') {
          queryParams.set('status', statusFilter);
        }
        if (searchQuery.trim()) {
          queryParams.set('search', searchQuery.trim());
        }

        const res = await fetch(`/api/admin/orders?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setOrders(data.data);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Failed to fetch admin orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    }

    fetchOrders();
  }, [statusFilter, searchQuery, refreshKey]);

  // Compute metrics from current orders
  const totalRevenue = orders.reduce((sum, o) => (o.orderStatus !== 'CANCELLED' ? sum + o.total : sum), 0);
  const pendingPacking = orders.filter((o) => o.orderStatus === 'PAID' || o.orderStatus === 'PLACED').length;
  const inTransit = orders.filter((o) => o.orderStatus === 'SHIPPED').length;
  const delivered = orders.filter((o) => o.orderStatus === 'DELIVERED').length;

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Delivered
          </span>
        );
      case 'SHIPPED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Truck className="w-3.5 h-3.5" />
            In Transit
          </span>
        );
      case 'PACKED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-300">
            <Package className="w-3.5 h-3.5" />
            Packed
          </span>
        );
      case 'PAID':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3.5 h-3.5" />
            Paid / Ready
          </span>
        );
      case 'PLACED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800 border border-yellow-300">
            <Clock className="w-3.5 h-3.5" />
            Placed
          </span>
        );
      case 'CANCELLED':
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800 border border-red-300">
            <AlertCircle className="w-3.5 h-3.5" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-300">
            {status}
          </span>
        );
    }
  };

  const getPaymentBadge = (order: Order) => {
    const isPaid = order.paymentStatus === 'PAID';
    const isCod = order.paymentMethod === 'cod';

    return (
      <div className="flex flex-col text-xs">
        <span className={`font-semibold ${isPaid ? 'text-emerald-700' : isCod ? 'text-blue-700' : 'text-amber-700'}`}>
          {isPaid ? '✓ PAID' : isCod ? 'COD Pending' : order.paymentStatus}
        </span>
        <span className="text-[11px] text-gray-500 uppercase tracking-wider">
          {order.paymentMethod}
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-[var(--color-primary-dark)]">
            Order Lifecycle &amp; Fulfillment
          </h1>
          <p className="text-sm text-gray-600">
            Manage customer orders, track courier dispatches, and download GST tax invoices.
          </p>
        </div>
        <button
          onClick={() => setRefreshKey((k) => k + 1)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 shadow-sm transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Orders
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>Total Orders</span>
            <ShoppingCart className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-[var(--color-primary-dark)]">
            {orders.length}
          </p>
          <span className="text-[11px] text-gray-500">Across current view</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>To Pack</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-amber-700">
            {pendingPacking}
          </p>
          <span className="text-[11px] text-amber-600">Awaiting shipment</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>In Transit</span>
            <Truck className="w-4 h-4 text-blue-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-blue-700">
            {inTransit}
          </p>
          <span className="text-[11px] text-blue-600">Dispatched with courier</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200/80 shadow-sm">
          <div className="flex items-center justify-between text-gray-500 text-xs font-medium uppercase tracking-wider">
            <span>Delivered / Done</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-700">
            {delivered}
          </p>
          <span className="text-[11px] text-emerald-600">Successfully fulfilled</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 space-y-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? 'bg-[var(--color-primary-base)] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by order number (e.g. PJ-2026), customer name, phone, or city..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
          />
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--color-accent-gold)] mb-2" />
            Loading orders from DynamoDB...
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center text-gray-500 text-sm">
            <ShoppingCart className="w-8 h-8 mx-auto text-gray-300 mb-2" />
            No orders match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-200 text-xs font-semibold text-gray-600 uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">Order No</th>
                  <th className="px-6 py-3.5">Date</th>
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Items</th>
                  <th className="px-6 py-3.5">Total</th>
                  <th className="px-6 py-3.5">Payment</th>
                  <th className="px-6 py-3.5">Fulfillment Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const dateStr = new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });

                  return (
                    <tr key={order.id} className="hover:bg-amber-50/30 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[var(--color-primary-dark)]">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="hover:underline hover:text-[var(--color-accent-gold)]"
                        >
                          {order.orderNo}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{dateStr}</td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{order.shippingAddress.fullName}</div>
                        <div className="text-xs text-gray-500">
                          {order.shippingAddress.phone} • {order.shippingAddress.city}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)
                        <div className="text-[11px] text-gray-400 truncate max-w-[150px]">
                          {order.items.map((i) => i.name).join(', ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 font-bold text-gray-900">
                        ₹{order.total.toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4">{getPaymentBadge(order)}</td>
                      <td className="px-6 py-4">{getStatusBadge(order.orderStatus)}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Inspect
                        </Link>
                        <a
                          href={`/api/orders/${order.id}/invoice?download=true`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-gray-300 text-gray-700 hover:bg-gray-100 transition-colors"
                          title="Download GST Invoice PDF"
                        >
                          <FileText className="w-3.5 h-3.5 text-gray-500" />
                        </a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
