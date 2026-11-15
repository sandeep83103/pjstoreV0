'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Menu, X, ShoppingBag, User, Search, Heart, Package, Phone } from 'lucide-react';
import { useCart } from '@/app/context/CartContext';

const NAV_LINKS = [
  { name: 'Collections', href: '/catalog' },
  { name: 'Long Haram', href: '/catalog?category=long-haram' },
  { name: 'Bridal & Temple', href: '/catalog?category=bridal-temple' },
  { name: 'Ruby & Emerald', href: '/catalog?category=ruby-emerald' },
  { name: 'Floral & Layered', href: '/catalog?category=floral-layered' },
  { name: 'The Craft', href: '/#craft' },
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
      {/* 1. TOP ANNOUNCEMENT TICKER (From parnika-jewellers-store.html) */}
      <div className="bg-[#D4AF5A] text-[#2E0A0F] text-xs font-semibold py-2 px-4 flex items-center justify-between tracking-wider uppercase border-b border-[#8A6A22]">
        <div className="hidden md:flex items-center space-x-6 text-[11px] sm:text-xs">
          <span className="flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E0A0F] inline-block mr-2 animate-ping" />
            100% Hallmarked 1-Gram Gold Plated Brass
          </span>
          <span>•</span>
          <span>Free Insured India Delivery on Orders &gt; ₹999</span>
          <span>•</span>
          <span>Dispatch within 24h</span>
        </div>
        <div className="w-full md:w-auto text-center md:text-right flex items-center justify-between md:justify-end space-x-4 text-[11px]">
          <span className="md:hidden">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2E0A0F] inline-block mr-1" />
            Free Shipping &gt; ₹999
          </span>
          <div className="flex items-center space-x-3 sm:space-x-4">
            <a
              href="https://wa.me/919876543210?text=Hello%20Parnika%20Jewellers,%20I%20have%20an%20enquiry"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline flex items-center transition"
            >
              <svg className="w-3.5 h-3.5 mr-1 text-[#064e3b] fill-current" viewBox="0 0 24 24">
                <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
              </svg>
              WhatsApp Support
            </a>
            <span>|</span>
            <a href="tel:+919876543210" className="hover:underline transition hidden sm:inline">
              +91 98765 43210
            </a>
            <span className="hidden sm:inline">|</span>
            <span className="font-bold">Gold Rate: ₹6,840/g</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN HEADER (Sticky Damask Glass Navigation) */}
      <header className="glass-nav sticky top-0 z-40 transition-all border-b-2 border-[#D4AF5A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Mobile Hamburger Button */}
            <div className="flex items-center lg:hidden">
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label="Toggle menu"
                className="text-[#F7F0DE] hover:text-[#E9D08A] p-2 focus:outline-none"
              >
                <Menu className="w-6 h-6" />
              </button>
            </div>

            {/* Brand Logo & Royal Crest */}
            <div className="flex-1 lg:flex-none text-center lg:text-left">
              <Link href="/" className="inline-block group">
                <div className="flex items-center justify-center lg:justify-start space-x-3">
                  {/* Brand Crest Image */}
                  <div className="relative w-12 h-12 rounded-full border-2 border-[#D4AF5A] overflow-hidden bg-[#2E0A0F] group-hover:border-[#E9D08A] transition shadow-md shrink-0">
                    <Image
                      src="/brand/crest.jpg"
                      alt="Parnika Jewellers Crest Logo"
                      fill
                      className="object-cover"
                      priority
                    />
                  </div>
                  <div>
                    <span className="font-serif text-2xl lg:text-3xl font-bold tracking-widest text-[#E9D08A] block leading-none">
                      PARNIKA
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.28em] text-[#E4D7C0] block mt-1">
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
                  className="text-[#F7F0DE] hover:text-[#E9D08A] transition duration-200"
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
                    placeholder="Search harams, chokers, jhumkas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#1F070B] border border-[#8A6A22] text-xs rounded-full py-2 pl-9 pr-4 text-[#F7F0DE] placeholder-[#A89B88] focus:outline-none focus:border-[#D4AF5A] w-56 lg:w-64 transition"
                  />
                  <Search className="w-4 h-4 text-[#D4AF5A] absolute left-3 top-2.5 pointer-events-none" />
                </form>
              </div>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="w-10 h-10 rounded-full border border-[#D4AF5A] flex items-center justify-center text-[#F7F0DE] hover:text-[#E9D08A] hover:bg-[#D4AF5A]/10 transition relative"
                title="Wishlist"
              >
                <Heart className="w-4 h-4" />
              </Link>

              {/* Orders */}
              <Link
                href="/account/orders"
                className="w-10 h-10 rounded-full border border-[#D4AF5A] items-center justify-center text-[#F7F0DE] hover:text-[#E9D08A] hover:bg-[#D4AF5A]/10 transition hidden sm:flex"
                title="My Orders"
              >
                <Package className="w-4 h-4" />
              </Link>

              {/* Cart Trigger Button */}
              <button
                type="button"
                onClick={openDrawer}
                className="h-10 px-3 rounded-full border border-[#D4AF5A] flex items-center justify-center text-[#F7F0DE] hover:text-[#E9D08A] hover:bg-[#D4AF5A]/10 transition relative"
                title="Shopping Cart"
              >
                <ShoppingBag className="w-4 h-4" />
                {itemCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 rounded-full bg-[#D4AF5A] text-[#2E0A0F] text-[11px] font-bold min-w-[18px] text-center shadow-md">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* CTA Button */}
              <Link
                href="/catalog"
                className="hidden sm:inline-block btn-gold text-xs px-5 py-2.5 rounded font-semibold"
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
          <div className="relative flex flex-col w-4/5 max-w-sm bg-[#2E0A0F] text-[#F7F0DE] shadow-2xl p-6 z-10 border-r-2 border-[#D4AF5A]">
            <div className="flex items-center justify-between pb-4 border-b border-[#8A6A22]">
              <div className="flex items-center space-x-2">
                <div className="relative w-8 h-8 rounded-full border border-[#D4AF5A] overflow-hidden">
                  <Image src="/brand/crest.jpg" alt="Logo" fill className="object-cover" />
                </div>
                <span className="font-serif font-bold text-xl text-[#E9D08A]">PARNIKA</span>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-md text-[#E4D7C0] hover:text-[#D4AF5A]"
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
                  className="w-full bg-[#1F070B] text-[#F7F0DE] text-sm rounded-lg pl-3 pr-9 py-2 border border-[#8A6A22] focus:outline-none"
                />
                <button type="submit" className="absolute right-2.5 top-2.5 text-[#D4AF5A]">
                  <Search className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* Mobile Nav Links */}
            <div className="flex-1 overflow-y-auto py-2">
              <p className="text-[11px] font-semibold text-[#D4AF5A] uppercase tracking-wider mb-2">
                Explore Categories
              </p>
              <ul className="space-y-3 text-sm">
                {NAV_LINKS.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="block py-1 text-[#F7F0DE] hover:text-[#E9D08A] transition-colors"
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              <div className="my-6 border-t border-[#8A6A22] pt-4 space-y-3 text-sm">
                <p className="text-[11px] font-semibold text-[#D4AF5A] uppercase tracking-wider mb-2">
                  Account &amp; Support
                </p>
                <Link
                  href="/account/orders"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-[#F7F0DE] hover:text-[#E9D08A]"
                >
                  <Package className="w-4 h-4 text-[#D4AF5A]" /> Track My Orders
                </Link>
                <Link
                  href="/account/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-[#F7F0DE] hover:text-[#E9D08A]"
                >
                  <Heart className="w-4 h-4 text-[#D4AF5A]" /> My Wishlist
                </Link>
                <Link
                  href="/account/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 py-1 text-[#F7F0DE] hover:text-[#E9D08A]"
                >
                  <User className="w-4 h-4 text-[#D4AF5A]" /> Customer Login / Register
                </Link>
                <a
                  href="https://wa.me/919876543210"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 py-1 text-[#25D366] hover:underline"
                >
                  <Phone className="w-4 h-4" /> WhatsApp Helpline
                </a>
              </div>
            </div>

            <div className="pt-4 border-t border-[#8A6A22] text-xs text-[#E4D7C0]">
              <p>© 2026 Parnika Jewellers.</p>
              <p>Authentic 1-Gram Gold &amp; Fashion Craft.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
