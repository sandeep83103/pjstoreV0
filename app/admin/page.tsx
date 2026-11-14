import React from 'react';
import Link from 'next/link';
import {
  TrendingUp,
  Package,
  ShoppingCart,
  AlertTriangle,
  PlusCircle,
  CreditCard,
  ArrowUpRight,
} from 'lucide-react';

export default function AdminDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)]">
            Store Overview
          </h1>
          <p className="text-xs text-[var(--color-text-muted)] mt-1">
            Real-time performance, inventory levels, and order queues.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/inventory/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-xs font-semibold hover:bg-[var(--color-primary-dark)] transition-colors shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Today's Sales */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Today’s Revenue
            </span>
            <div className="p-2 rounded-lg bg-emerald-50 text-emerald-700">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)] mt-3">
            ₹0
          </p>
          <p className="text-[11px] text-emerald-600 mt-2 font-medium">
            0 completed online &amp; COD orders
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Pending Orders
            </span>
            <div className="p-2 rounded-lg bg-blue-50 text-blue-700">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)] mt-3">
            0
          </p>
          <p className="text-[11px] text-gray-500 mt-2">
            Ready for packing &amp; dispatch
          </p>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Low Stock Warnings
            </span>
            <div className="p-2 rounded-lg bg-amber-50 text-amber-700">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-ruby-alert)] mt-3">
            0
          </p>
          <p className="text-[11px] text-gray-500 mt-2">
            Items at or below threshold
          </p>
        </div>

        {/* Active Products */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wider">
              Catalog Items
            </span>
            <div className="p-2 rounded-lg bg-purple-50 text-purple-700">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)] mt-3">
            3
          </p>
          <p className="text-[11px] text-purple-600 mt-2 font-medium">
            Seeded one-gram gold designs
          </p>
        </div>
      </div>

      {/* Quick Launchpad & Gateways */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inventory Actions */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="font-display font-bold text-base text-[var(--color-primary-dark)] mb-4">
            Inventory &amp; Catalogue Quick Links
          </h3>
          <div className="space-y-3">
            <Link
              href="/admin/inventory"
              className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-[var(--color-accent-gold)] hover:bg-gray-50 transition-all text-xs font-semibold text-gray-700"
            >
              <span>View Product Inventory &amp; Stock Levels</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>
            <Link
              href="/admin/inventory/bulk"
              className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-[var(--color-accent-gold)] hover:bg-gray-50 transition-all text-xs font-semibold text-gray-700"
            >
              <span>Bulk Upload Products via CSV</span>
              <ArrowUpRight className="w-4 h-4 text-gray-400" />
            </Link>
          </div>
        </div>

        {/* Payment Gateways Status */}
        <div className="bg-white p-6 rounded-2xl border border-[var(--color-border)] shadow-sm">
          <h3 className="font-display font-bold text-base text-[var(--color-primary-dark)] mb-4">
            Gateway &amp; Security Integration
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-[var(--color-primary-base)]" />
                <span className="font-semibold text-gray-800">Primary Gateway: YOUPI PG V2</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Configured
              </span>
            </div>

            <div className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
              <div className="flex items-center gap-2.5">
                <CreditCard className="w-4 h-4 text-gray-500" />
                <span className="font-semibold text-gray-800">Licensed Backup: Razorpay</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-gray-200 text-gray-700 font-bold text-[10px]">
                Adapter Ready
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
