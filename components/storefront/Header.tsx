'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Menu, X, ShoppingBag, User, Search, Heart, Package, Phone } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';

const NAV_LINKS = [
  { name: 'Collections', href: '/catalog' },
  { name: 'Necklaces', href: '/catalog?category=necklaces' },
  { name: 'Bangles', href: '/catalog?category=bangles' },
  { name: 'Earrings', href: '/catalog?category=earrings' },
  { name: 'The Craft', href: '/#craft' },
  { name: 'Reviews', href: '/#reviews' },
];

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      {/* 1. TOP ANNOUNCEMENT TICKER (Exact match to parnika-jewellers-store.html) */}
      <div className="ticker-bg text-xs py-2 px-4 text-[#D8C9B4] border-b border-gold flex items-center justify-between tracking-wider">
        <div className="hidden md:flex items-center space-x-6 text-[11px] sm:text-xs">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block mr-2 animate-ping" />
            100% Hallmarked 1-Gram Gold Plated Brass
          </span>
          <span>•</span>
          <span>Free Insured India Delivery on Orders &gt; ₹999</span>
          <span>•</span>
          <span>Dispatch within 24h</span>
        </div>
        <div className="w-full md:w-auto text-center md:text-right flex items-center justify-between md:justify-end space-x-4 text-[11px]">
          <span className="md:hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] inline-block mr-1" />
            Free Shipping &gt; ₹999
          </span>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <a
              href="https://wa.me/919876543210?text=Hello%20Parnika%20Jewellers,%20I%20have%20an%20enquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#FBE8A6] flex items-center transition"
            >
              <svg className="w-3.5 h-3.5 mr-1 text-[#25D366] fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              WhatsApp Support
            </a>
            <span>|</span>
            <a href="tel:+919876543210" className="hover:text-[#FBE8A6] transition hidden sm:inline">
              +91 98765 43210
            </a>
            <span className="hidden sm:inline">|</span>
            <span className="text-[#D4AF37] font-medium">Gold Rate: ₹6,840/g</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Sticky Glass Navigation) */}
      <header className="glass-nav sticky top-0 z-40 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Toggle menu"
                className="text-[#F5EFEB] hover:text-[#D4AF37] p-2 focus:outline-none"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo & Royal Crest */}
            <div className="flex-1 lg:flex-none text-center lg:text-left">
              <Link href="/" className="inline-block group">
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  {/* Royal Crest Icon */}
                  <div className="w-10 h-10 rounded-full border border-gold flex items-center justify-center bg-[#18130B] group-hover:border-[#FBE8A6] transition">
                    <svg className="w-6 h-6 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="rgba(212,175,55,0.2)" />
                      <circle cx="12" cy="12" r="3" fill="#D4AF37" />
                    </svg>
                  </div>
                  <div>
                    <span className="font-serif text-2xl lg:text-3xl font-bold tracking-widest gold-gradient block leading-none">
                      PARNIKA
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.28em] text-[#CBB99F] block mt-1">
                      1-Gram Gold Jewellers
                    </span>
                  </div>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden lg:flex items-center space-x-8 text-sm tracking-widest uppercase font-medium">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-[#F5EFEB] hover:text-[#D4AF37] transition duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Right Action Icons */}
            <div className="flex items-center space-x-3 sm:space-x-5">
              {/* Search input Desktop */}
              <div className="hidden md:flex items-center relative">
                <form onSubmit={handleSearch}>
                  <input
                    type="text"
                    placeholder="Search necklaces, jhumkas, harams..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#14110C] border border-gold text-xs rounded-full py-2 pl-9 pr-4 text-[#F5EFEB] placeholder-[#7E7363] focus:outline-none focus:border-[#D4AF37] w-56 lg:w-64 transition"
                  />
                  <Search className="w-4 h-4 text-[#D4AF37] absolute left-3 top-2.5 pointer-events-none" />
                </form>
              </div>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="p-2 text-[#F5EFEB] hover:text-[#D4AF37] transition relative"
                title="Wishlist"
              >
                <Heart className="w-5 h-5" />
              </Link>

              {/* Orders */}
              <Link
                href="/account/orders"
                className="p-2 text-[#F5EFEB] hover:text-[#D4AF37] transition hidden sm:inline-block"
                title="My Orders"
              >
                <Package className="w-5 h-5" />
              </Link>

              {/* Account / Login */}
              <Link
                href="/account/login"
                className="p-2 text-[#F5EFEB] hover:text-[#D4AF37] transition hidden sm:inline-block"
                title="Customer Login"
              >
                <User className="w-5 h-5" />
              </Link>

              {/* Cart Trigger Button */}
              <button
                type="button"
                onClick={openDrawer}
                className="p-2 text-[#F5EFEB] hover:text-[#D4AF37] transition relative flex items-center"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#AA7C11] text-[#080706] text-[11px] font-bold min-w-[20px] text-center shadow-md">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* CTA Button */}
              <Link
                href="/catalog"
                className="hidden sm:inline-block btn-gold text-xs px-4 py-2.5 rounded font-semibold"
              >
                Shop Collection
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex flex-col w-4/5 max-w-sm bg-[#110F0C] text-[#F5EFEB] shadow-2xl p-6 z-10 border-r border-gold">
            <div className="flex items-center justify-between pb-4 border-b border-gold">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-full border border-gold flex items-center justify-center bg-[#18130B]">
                  <span className="text-[#D4AF37] text-xs font-serif font-bold">PJ</span>
                </div>
                <span className="font-serif font-bold text-xl gold-gradient">PARNIKA</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-[#CBB99F] hover:text-[#D4AF37]"
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
                  className="w-full bg-[#1A1610] text-[#F5EFEB] text-sm rounded-lg pl-3 pr-9 py-2 border border-gold focus:outline-none"
                />
                <button type="submit" className="absolute right-2.5 top-2.5 text-[#D4AF37]">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto py-2">
              <p className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-2">
                Explore Categories
              </p>
              <ul className="space-y-3 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-1 text-[#F5EFEB] hover:text-[#D4AF37] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-6 border-t border-gold pt-4 space-y-3 text-sm">
                <p className="text-[11px] font-semibold text-[#D4AF37] uppercase tracking-wider mb-2">
                  Account &amp; Support
                </p>
                <Link
                  href="/account/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-[#F5EFEB] hover:text-[#D4AF37]"
                >
                  <Package className="w-4 h-4 text-[#D4AF37]" /> Track My Orders
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-[#F5EFEB] hover:text-[#D4AF37]"
                >
                  <Heart className="w-4 h-4 text-[#D4AF37]" /> My Wishlist
                </Link>
                <Link
                  href="/account/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-[#F5EFEB] hover:text-[#D4AF37]"
                >
                  <User className="w-4 h-4 text-[#D4AF37]" /> Customer Login / Register
                </Link>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 text-[#25D366] hover:text-emerald-300"
                >
                  <Phone className="w-4 h-4" /> WhatsApp Helpline
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-gold text-xs text-[#CBB99F]">
              <p>© 2026 Parnika Jewellers.</p>
              <p>Authentic 1-Gram Gold &amp; Fashion Craft.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
