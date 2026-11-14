import React from 'react';
import Link from 'next/link';
import { productRepository, categoryRepository } from '@/lib/data';
import { formatINR, calculateDiscountPercent } from '@/lib/utils';
import { getCloudFrontAssetUrl } from '@/lib/aws/s3Client';
import {
  Package,
  PlusCircle,
  UploadCloud,
  Search,
  Filter,
  AlertTriangle,
  Edit,
  ExternalLink,
  CheckCircle,
  Archive,
  ArrowUpDown,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface AdminInventoryPageProps {
  searchParams: {
    search?: string;
    category?: string;
    stockStatus?: string; // 'low' | 'out' | 'in'
    status?: string;
  };
}

export default async function AdminInventoryPage({ searchParams }: AdminInventoryPageProps) {
  const search = searchParams.search || '';
  const category = searchParams.category || 'all';
  const stockStatus = searchParams.stockStatus || 'all';
  const status = (searchParams.status as any) || 'ALL';

  const filter: any = {
    status,
    searchQuery: search || undefined,
    categoryId: category !== 'all' ? category : undefined,
  };

  if (stockStatus === 'low') {
    filter.lowStockOnly = true;
  }

  const [categories, { items: rawProducts }] = await Promise.all([
    categoryRepository.list(),
    productRepository.list(filter, 150),
  ]);

  let products = rawProducts;
  if (stockStatus === 'out') {
    products = rawProducts.filter((p) => p.stock <= 0);
  } else if (stockStatus === 'in') {
    products = rawProducts.filter((p) => p.stock > 0);
  }

  const lowStockCount = rawProducts.filter((p) => p.stock <= p.lowStockAt).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold text-[var(--color-primary-dark)]">
            Inventory &amp; Catalog Management
          </h1>
          <p className="text-xs text-stone-500 mt-1">
            Track real-time stock balances, manage price margins, and update catalogue listings.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/admin/inventory/bulk"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-xs font-semibold text-stone-700 shadow-sm transition-colors"
          >
            <UploadCloud className="w-4 h-4 text-[var(--color-accent-gold)]" />
            <span>Bulk CSV Import</span>
          </Link>
          <Link
            href="/admin/inventory/new"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--color-primary-base)] hover:bg-[var(--color-primary-dark)] text-[var(--color-accent-light-gold)] text-xs font-semibold shadow-sm transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 bg-white rounded-2xl border border-stone-200 shadow-sm">
        <form method="GET" action="/admin/inventory" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <input
              type="text"
              name="search"
              defaultValue={search}
              placeholder="Search title, SKU, or DBI code..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none"
            />
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              name="category"
              defaultValue={category}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Level Filter */}
          <div>
            <select
              name="stockStatus"
              defaultValue={stockStatus}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-xl focus:border-[var(--color-accent-gold)] focus:outline-none bg-white"
            >
              <option value="all">All Stock Levels</option>
              <option value="low">Low Stock (≤ threshold)</option>
              <option value="out">Out of Stock (0 units)</option>
              <option value="in">In Stock (&gt; 0 units)</option>
            </select>
          </div>

          {/* Filter Submit Button */}
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-stone-800 hover:bg-black text-white text-xs font-semibold rounded-xl shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Filter
            </button>
            {(search || category !== 'all' || stockStatus !== 'all') && (
              <Link
                href="/admin/inventory"
                className="px-3 py-2 border border-stone-200 text-stone-600 hover:bg-stone-50 text-xs font-medium rounded-xl flex items-center justify-center"
              >
                Reset
              </Link>
            )}
          </div>
        </form>
      </div>

      {/* Low Stock Warning Banner if any items triggered */}
      {lowStockCount > 0 && stockStatus !== 'low' && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>{lowStockCount} items</strong> have reached or fallen below their low-stock threshold.
            </span>
          </div>
          <Link
            href="/admin/inventory?stockStatus=low"
            className="font-bold underline text-amber-800 hover:text-amber-950 ml-2"
          >
            View Low Stock Items &rarr;
          </Link>
        </div>
      )}

      {/* Inventory Data Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-stone-600">
            <thead className="bg-stone-50 border-b border-stone-200 text-[11px] font-bold uppercase tracking-wider text-stone-500">
              <tr>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-3">SKU / Code</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-3">Selling Price</th>
                <th className="py-3.5 px-3">Cost Price</th>
                <th className="py-3.5 px-3">Margin</th>
                <th className="py-3.5 px-3">Stock Count</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    <Package className="w-8 h-8 mx-auto mb-2 text-stone-300" />
                    No jewellery found matching current inventory filters.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLow = p.stock <= p.lowStockAt && p.stock > 0;
                  const isOut = p.stock <= 0;
                  const marginPercent =
                    p.price > 0 ? Math.round(((p.price - p.costPrice) / p.price) * 100) : 0;

                  const primaryImg = p.images[0] || 'brand/logo.png';
                  const imgUrl = primaryImg.startsWith('http')
                    ? primaryImg
                    : primaryImg.startsWith('brand/')
                    ? `/${primaryImg}`
                    : getCloudFrontAssetUrl(primaryImg);

                  return (
                    <tr key={p.id} className="hover:bg-stone-50/70 transition-colors">
                      {/* Product Thumbnail & Title */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-lg bg-[var(--color-surface-ivory)] border border-stone-200 overflow-hidden shrink-0">
                            <img
                              src={imgUrl}
                              alt={p.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/brand/logo.png';
                              }}
                            />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <Link
                              href={`/admin/inventory/${p.id}`}
                              className="font-bold text-stone-900 hover:text-[var(--color-accent-gold)] line-clamp-1 transition-colors"
                            >
                              {p.name}
                            </Link>
                            <span className="text-[10px] text-stone-400">
                              MRP: {formatINR(p.mrp)}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* SKU & Supplier Code */}
                      <td className="py-3.5 px-3">
                        <div className="flex flex-col">
                          <span className="font-mono font-semibold text-stone-900">{p.sku}</span>
                          <span className="text-[10px] text-stone-400 font-mono">
                            DBI: {p.supplierCode}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-stone-100 text-stone-700">
                          {p.categoryId.replace('cat-', '')}
                        </span>
                      </td>

                      {/* Selling Price */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-[var(--color-primary-base)]">
                          {formatINR(p.price)}
                        </span>
                      </td>

                      {/* Cost Price */}
                      <td className="py-3.5 px-3 text-stone-500 font-mono">
                        {formatINR(p.costPrice)}
                      </td>

                      {/* Gross Margin */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`font-semibold text-[11px] ${
                            marginPercent >= 40
                              ? 'text-emerald-700'
                              : marginPercent >= 20
                              ? 'text-amber-700'
                              : 'text-red-700'
                          }`}
                        >
                          {marginPercent}%
                        </span>
                      </td>

                      {/* Stock Count with Low Stock Badge */}
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`font-bold font-mono ${
                              isOut
                                ? 'text-red-600'
                                : isLow
                                ? 'text-amber-600'
                                : 'text-stone-900'
                            }`}
                          >
                            {p.stock}
                          </span>
                          {isOut ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-red-700">
                              Out
                            </span>
                          ) : isLow ? (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-red-100 text-[var(--color-ruby-alert)] flex items-center gap-0.5">
                              <AlertTriangle className="w-2.5 h-2.5" />
                              Low
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            p.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : p.status === 'DRAFT'
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-stone-100 text-stone-500'
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            title="View on Storefront"
                            className="p-1 rounded text-stone-400 hover:text-stone-700 transition-colors"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                          <Link
                            href={`/admin/inventory/${p.id}`}
                            title="Edit Product"
                            className="p-1.5 rounded-lg bg-stone-100 hover:bg-[var(--color-accent-gold)] hover:text-[var(--color-primary-dark)] text-stone-700 transition-colors"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
