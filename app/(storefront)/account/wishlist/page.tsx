'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Heart,
  ShoppingBag,
  Trash2,
  Package,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { Product } from '@/lib/types';
import { useCart } from '@/app/context/CartContext';

export default function WishlistPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { addItem, openDrawer } = useCart();

  useEffect(() => {
    async function fetchWishlist() {
      try {
        setLoading(true);
        const res = await fetch('/api/account/wishlist');
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setProducts(data.data);
        }
      } catch (err) {
        console.error('Failed to load wishlist:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchWishlist();
  }, []);

  const handleRemove = async (productId: string) => {
    try {
      setActionLoading(productId);
      const res = await fetch(`/api/account/wishlist?productId=${encodeURIComponent(productId)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
    } catch (err) {
      console.error('Failed to remove from wishlist:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddToCart = (product: Product) => {
    addItem(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        sku: product.sku,
        slug: product.slug,
        images: product.images,
        stock: product.stock,
      },
      1
    );
    openDrawer();
  };

  return (
    <div className="min-h-screen bg-[#FCFBF7] py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Breadcrumbs & Title */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Link href="/" className="hover:underline">Home</Link>
            <span>/</span>
            <span className="text-[var(--color-primary-base)] font-semibold">My Wishlist</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-[var(--color-primary-dark)] flex items-center gap-2">
              <Heart className="w-6 h-6 text-[var(--color-ruby-alert)] fill-current" />
              Saved Items ({products.length})
            </h1>
            <Link
              href="/catalog"
              className="text-xs font-semibold text-[var(--color-primary-base)] hover:underline"
            >
              Continue Shopping &rarr;
            </Link>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-16 text-center text-gray-500 text-sm">
            <Clock className="w-8 h-8 animate-spin mx-auto text-[var(--color-accent-gold)] mb-3" />
            Loading your saved jewellery...
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200/80 shadow-sm space-y-4 max-w-lg mx-auto">
            <div className="w-16 h-16 rounded-full bg-red-50 text-[var(--color-ruby-alert)] mx-auto flex items-center justify-center">
              <Heart className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">Your Wishlist is Empty</h3>
            <p className="text-sm text-gray-500">
              Save your favorite necklaces, earrings, and bangles here to easily buy them later or share with family!
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)] shadow-sm transition-all"
            >
              Explore Catalog &rarr;
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => {
              const inStock = product.stock > 0;

              return (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl border border-gray-200/80 hover:border-[var(--color-accent-gold)]/60 shadow-sm transition-all overflow-hidden flex flex-col justify-between"
                >
                  {/* Image Container */}
                  <div className="relative aspect-square bg-gray-50 flex items-center justify-center border-b border-gray-100 overflow-hidden group">
                    <div className="text-gray-300">
                      <Sparkles className="w-12 h-12 text-amber-200" />
                    </div>
                    {/* Stock Status Badge */}
                    <div className="absolute top-3 left-3 z-10">
                      {inStock ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          In Stock
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800 border border-red-300">
                          Out of Stock
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleRemove(product.id)}
                      disabled={actionLoading === product.id}
                      className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/90 text-gray-400 hover:text-red-600 hover:bg-white shadow-sm transition-all"
                      title="Remove from Wishlist"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <Link
                        href={`/product/${product.slug}`}
                        className="font-bold text-sm text-gray-900 hover:text-[var(--color-primary-base)] transition-colors line-clamp-2"
                      >
                        {product.name}
                      </Link>
                      <p className="text-[11px] text-gray-400 mt-1 font-mono">
                        SKU: {product.sku}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-baseline gap-2">
                      <span className="text-base font-bold text-gray-900">
                        ₹{product.price.toLocaleString('en-IN')}
                      </span>
                      {product.mrp > product.price && (
                        <span className="text-xs text-gray-400 line-through">
                          ₹{product.mrp.toLocaleString('en-IN')}
                        </span>
                      )}
                    </div>

                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={!inStock}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-sm ${
                        inStock
                          ? 'bg-[var(--color-primary-base)] text-white hover:bg-[var(--color-primary-dark)]'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                      {inStock ? 'Move to Cart' : 'Sold Out'}
                    </button>
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
