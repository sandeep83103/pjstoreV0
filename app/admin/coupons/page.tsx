'use client';

import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Trash2,
  Tag,
  Percent,
  TrendingUp,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { Coupon } from '@/lib/types';
import { formatINR } from '@/lib/utils';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New Coupon Form
  const [code, setCode] = useState('');
  const [type, setType] = useState<'FLAT' | 'PERCENTAGE'>('FLAT');
  const [value, setValue] = useState<number>(500);
  const [minCart, setMinCart] = useState<number>(2000);
  const [maxDiscount, setMaxDiscount] = useState<number>(500);
  const [usageLimit, setUsageLimit] = useState<number>(100);
  const [perUserLimit, setPerUserLimit] = useState<number>(1);
  const [validDays, setValidDays] = useState<number>(90);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchCoupons = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/admin/coupons');
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setCoupons(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch coupons:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!code.trim()) {
      setFormError('Coupon code is required.');
      return;
    }

    try {
      setIsSubmitting(true);
      const now = new Date();
      const validTo = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000).toISOString();

      const payload = {
        code: code.trim().toUpperCase(),
        type,
        value,
        minCart,
        maxDiscount: type === 'PERCENTAGE' ? maxDiscount : undefined,
        usageLimit,
        perUserLimit,
        validFrom: now.toISOString(),
        validTo,
        active: true,
      };

      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        setFormError(json.error?.message || 'Failed to create coupon.');
        setIsSubmitting(false);
        return;
      }

      setIsModalOpen(false);
      setCode('');
      await fetchCoupons();
    } catch (err: any) {
      setFormError(err.message || 'An error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (c: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${c.code}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !c.active }),
      });
      if (res.ok) {
        await fetchCoupons();
      }
    } catch (err) {
      console.error('Failed to toggle coupon active state:', err);
    }
  };

  const handleDelete = async (couponCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon ${couponCode}?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${couponCode}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        await fetchCoupons();
      }
    } catch (err) {
      console.error('Failed to delete coupon:', err);
    }
  };

  const filteredCoupons = coupons.filter((c) =>
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-stone-900">
            Discount Coupons &amp; Promotions
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1">
            Manage customer promotional campaigns, minimum cart value thresholds, and redemption caps.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-xs sm:text-sm font-semibold hover:bg-[var(--color-primary-dark)] shadow-md transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create New Coupon
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <Ticket className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Total Coupons</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">{coupons.length}</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Active Campaigns</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">
              {coupons.filter((c) => c.active).length}
            </p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-700 rounded-xl">
            <Tag className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-stone-500 font-medium">Total Redemptions</p>
            <p className="text-xl font-bold text-stone-900 mt-0.5">
              {coupons.reduce((acc, c) => acc + (c.usedCount || 0), 0)}
            </p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200/80 shadow-sm">
        <div className="relative max-w-md">
          <input
            type="text"
            placeholder="Search coupons by code (e.g. FESTIVE500)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-stone-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:border-[var(--color-primary-base)]"
          />
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Coupons Table */}
      <div className="bg-white rounded-2xl border border-stone-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-stone-50 text-[11px] font-bold text-stone-600 uppercase tracking-wider border-b border-stone-200">
                <th className="py-3.5 px-4 sm:px-6">Coupon Code</th>
                <th className="py-3.5 px-4">Discount</th>
                <th className="py-3.5 px-4">Min. Cart Value</th>
                <th className="py-3.5 px-4">Usage / Limit</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Validity</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-xs sm:text-sm">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    Loading coupons...
                  </td>
                </tr>
              ) : filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-stone-400">
                    No coupons found. Click &quot;Create New Coupon&quot; to add one.
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((c) => {
                  const usagePct = Math.round(((c.usedCount || 0) / c.usageLimit) * 100);
                  const isExpired = new Date(c.validTo) < new Date();

                  return (
                    <tr key={c.code} className="hover:bg-stone-50/60 transition-colors">
                      <td className="py-4 px-4 sm:px-6 font-mono font-bold text-[var(--color-primary-base)]">
                        {c.code}
                      </td>
                      <td className="py-4 px-4 font-semibold text-stone-900">
                        {c.type === 'FLAT' ? (
                          formatINR(c.value)
                        ) : (
                          <span>
                            {c.value}% off{' '}
                            {c.maxDiscount ? (
                              <span className="text-xs text-stone-400">
                                (Max {formatINR(c.maxDiscount)})
                              </span>
                            ) : null}
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-stone-700 font-medium">
                        {formatINR(c.minCart)}
                      </td>
                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="font-semibold text-stone-800">
                            {c.usedCount} / {c.usageLimit}
                          </span>
                          <div className="w-24 bg-stone-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-[var(--color-accent-gold)] h-full rounded-full"
                              style={{ width: `${Math.min(100, usagePct)}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        {isExpired ? (
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-600 font-semibold rounded text-[11px]">
                            Expired
                          </span>
                        ) : c.active ? (
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-semibold rounded text-[11px]">
                            Active
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 bg-stone-100 text-stone-500 font-semibold rounded text-[11px]">
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-xs text-stone-500">
                        {new Date(c.validTo).toLocaleDateString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </td>
                      <td className="py-4 px-4 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => handleToggleActive(c)}
                          className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition-colors ${
                            c.active
                              ? 'border-stone-200 text-stone-600 hover:bg-stone-100'
                              : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {c.active ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.code)}
                          className="text-stone-400 hover:text-[var(--color-ruby-alert)] p-1 transition-colors"
                          title="Delete coupon"
                        >
                          <Trash2 className="w-4 h-4 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Create New Coupon */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-display text-lg font-bold text-stone-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-[var(--color-primary-base)]" />
                Create New Discount Coupon
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-red-50 text-[var(--color-ruby-alert)] text-xs rounded-xl font-medium">
                {formError}
              </div>
            )}

            <form onSubmit={handleCreateCoupon} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Coupon Code (UPPERCASE) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. DIWALI1000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full uppercase font-mono px-3 py-2 border border-stone-300 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Discount Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none text-xs"
                  >
                    <option value="FLAT">Flat ₹ Amount</option>
                    <option value="PERCENTAGE">Percentage (%)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    {type === 'FLAT' ? 'Flat Discount (₹) *' : 'Discount Percentage (%) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={value}
                    onChange={(e) => setValue(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">
                    Min. Cart Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={minCart}
                    onChange={(e) => setMinCart(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                {type === 'PERCENTAGE' && (
                  <div>
                    <label className="block font-semibold text-stone-700 mb-1">
                      Max Discount Cap (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={maxDiscount}
                      onChange={(e) => setMaxDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none text-xs"
                    />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Global Limit *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Per User Limit *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={perUserLimit}
                    onChange={(e) => setPerUserLimit(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Validity (Days) *</label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={validDays}
                    onChange={(e) => setValidDays(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-stone-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-stone-200 text-stone-600 hover:bg-stone-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] font-bold hover:bg-[var(--color-primary-dark)] transition-colors shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Creating...' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
