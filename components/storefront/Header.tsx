'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingBag, User, Search, MessageCircle, Heart, Package } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';

const CATEGORIES = [
  { name: 'All Jewellery', href: '/catalog' },
  { name: 'One Gram Gold', href: '/catalog/one-gram-gold' },
  { name: 'Necklaces & Chokers', href: '/catalog/necklaces' },
  { name: 'Earrings & Jhumkas', href: '/catalog/earrings' },
  { name: 'Bangles & Kadas', href: '/catalog/bangles' },
  { name: 'Rings', href: '/catalog/rings' },
  { name: 'Bridal Sets', href: '/catalog/bridal-sets' },
];

export function Header() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { itemCount, openDrawer } = useCart();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/catalog?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <>
      {/* Top Announcement Bar */}
      <div className="bg-[var(--color-primary-dark)] text-[var(--color-accent-light-gold)] py-1.5 px-4 text-xs font-medium text-center tracking-wide">
        ✨ Free Insured Shipping Across India on Orders Above ₹1,999 • One-Gram Gold Certified
      </div>

      {/* Main Header */}
      <header className="sticky top-0 z-40 bg-[var(--color-primary-base)] text-white shadow-md border-b border-[var(--color-accent-gold)]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20 gap-4">
            
            {/* Mobile Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                className="p-2 -ml-2 rounded-md text-[var(--color-accent-light-gold)] hover:bg-[var(--color-primary-dark)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                aria-label="Open Navigation Drawer"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo & Title */}
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 group">
                <div className="relative w-9 h-9 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-[var(--color-accent-gold)] shadow-sm bg-white">
                  <Image
                    src="/brand/logo.png"
                    alt="Parnika Jewellers Logo"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
                <div className="flex flex-col">
                  <span className="font-display text-lg sm:text-2xl font-bold tracking-tight text-[var(--color-accent-light-gold)] group-hover:text-[var(--color-accent-gold)] transition-colors">
                    Parnika Jewellers
                  </span>
                  <span className="text-[10px] sm:text-xs text-white/70 uppercase tracking-widest hidden sm:inline-block">
                    Fashion &amp; 1-Gram Gold
                  </span>
                </div>
              </Link>
            </div>

            {/* Desktop Search Bar */}
            <div className="hidden md:flex flex-1 max-w-md mx-4">
              <form onSubmit={handleSearch} className="relative w-full">
                <input
                  type="text"
                  placeholder="Search necklaces, earrings, bangles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--color-primary-dark)]/60 text-white placeholder-white/50 text-sm rounded-full pl-4 pr-10 py-2 border border-[var(--color-accent-gold)]/30 focus:outline-none focus:border-[var(--color-accent-gold)] focus:ring-1 focus:ring-[var(--color-accent-gold)]"
                />
                <button
                  type="submit"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--color-accent-light-gold)] hover:text-white"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              </form>
            </div>

            {/* Right Action Icons */}
            <div className="flex items-center gap-1 sm:gap-3">
              {/* WhatsApp Quick Enquiry */}
              <a
                href="https://wa.me/919876543210?text=Hello%20Parnika%20Jewellers,%20I%20would%20like%20to%20enquire%20about%20your%20jewellery."
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-full text-emerald-400 hover:text-emerald-300 hover:bg-[var(--color-primary-dark)] transition-colors"
                title="WhatsApp Enquiry"
                aria-label="WhatsApp Enquiry"
              >
                <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
              </a>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="p-2 rounded-full text-[var(--color-accent-light-gold)] hover:text-white hover:bg-[var(--color-primary-dark)] transition-colors"
                title="Saved Items / Wishlist"
                aria-label="Customer Wishlist"
              >
                <Heart className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>

              {/* Customer Account / Orders */}
              <Link
                href="/account/orders"
                className="p-2 rounded-full text-[var(--color-accent-light-gold)] hover:text-white hover:bg-[var(--color-primary-dark)] transition-colors"
                title="My Orders & Tracking"
                aria-label="Customer Orders"
              >
                <Package className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>

              <Link
                href="/account/login"
                className="p-2 rounded-full text-[var(--color-accent-light-gold)] hover:text-white hover:bg-[var(--color-primary-dark)] transition-colors hidden sm:inline-block"
                title="Account Login"
                aria-label="Customer Account Login"
              >
                <User className="w-5 h-5 sm:w-6 sm:h-6" />
              </Link>

              {/* Shopping Cart */}
              <button
                type="button"
                onClick={openDrawer}
                className="relative p-2 rounded-full text-[var(--color-accent-light-gold)] hover:text-white hover:bg-[var(--color-primary-dark)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-gold)]"
                title={`Shopping Cart (${itemCount} items)`}
                aria-label={`Shopping Cart with ${itemCount} items`}
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 bg-[var(--color-ruby-alert)] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Category Navigation Bar */}
        <nav className="hidden lg:block bg-[var(--color-primary-dark)] border-t border-[var(--color-accent-gold)]/10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex items-center justify-center space-x-8 py-2.5 text-xs font-medium uppercase tracking-wider text-white/90">
              {CATEGORIES.map((cat) => (
                <li key={cat.name}>
                  <Link
                    href={cat.href}
                    className="hover:text-[var(--color-accent-gold)] transition-colors pb-1 border-b-2 border-transparent hover:border-[var(--color-accent-gold)]"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Navigation Drawer & Backdrop */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Panel */}
          <div className="relative flex flex-col w-4/5 max-w-sm bg-[var(--color-primary-base)] text-white shadow-2xl p-6 z-10 border-r border-[var(--color-accent-gold)]/30">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[var(--color-accent-gold)]/20">
              <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 rounded-full overflow-hidden border border-[var(--color-accent-gold)] bg-white">
                  <Image src="/brand/logo.png" alt="Logo" fill className="object-cover" />
                </div>
                <span className="font-display font-bold text-lg text-[var(--color-accent-light-gold)]">
                  Parnika Jewellers
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-md text-white/70 hover:text-white"
                aria-label="Close Drawer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Mobile Search */}
            <form onSubmit={handleSearch} className="my-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search jewellery..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--color-primary-dark)] text-white text-sm rounded-lg pl-3 pr-9 py-2 border border-[var(--color-accent-gold)]/30"
                />
                <button type="submit" className="absolute right-2.5 top-2.5 text-[var(--color-accent-light-gold)]">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto py-2">
              <p className="text-[11px] font-semibold text-[var(--color-accent-gold)] uppercase tracking-wider mb-2">
                Categories
              </p>
              <ul className="space-y-3 text-sm">
                {CATEGORIES.map((cat) => (
                  <li key={cat.name}>
                    <Link
                      href={cat.href}
                      onClick={() => setIsDrawerOpen(false)}
                      className="block py-1 hover:text-[var(--color-accent-gold)] transition-colors"
                    >
                      {cat.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-6 border-t border-white/10 pt-4 space-y-3 text-sm">
                <p className="text-[11px] font-semibold text-[var(--color-accent-gold)] uppercase tracking-wider mb-2">
                  Account &amp; Orders
                </p>
                <Link
                  href="/account/orders"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 py-1 text-white hover:text-[var(--color-accent-gold)]"
                >
                  <Package className="w-4 h-4 text-[var(--color-accent-gold)]" /> Track My Orders
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 py-1 text-white hover:text-[var(--color-accent-gold)]"
                >
                  <Heart className="w-4 h-4 text-[var(--color-ruby-alert)]" /> My Wishlist
                </Link>
                <Link
                  href="/account/login"
                  onClick={() => setIsDrawerOpen(false)}
                  className="flex items-center gap-2 py-1 text-white hover:text-[var(--color-accent-gold)]"
                >
                  <User className="w-4 h-4" /> Customer Login / Register
                </Link>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 text-emerald-400 hover:text-emerald-300"
                >
                  <MessageCircle className="w-4 h-4" /> WhatsApp Support
                </a>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="pt-4 border-t border-white/10 text-xs text-white/60">
              <p>© 2026 Parnika Jewellers.</p>
              <p>Authentic Fashion &amp; 1-Gram Gold.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
