import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, Sparkles, MessageCircle, Phone, Mail } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-[var(--color-primary-dark)] text-white/80 border-t border-[var(--color-accent-gold)]/20 mt-auto">
      {/* Trust Badges Strip */}
      <div className="border-b border-white/10 bg-[var(--color-primary-base)] py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2.5 rounded-full bg-[var(--color-primary-dark)] text-[var(--color-accent-gold)]">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">One-Gram Gold Certified</h4>
                <p className="text-xs text-white/60">High-micron gold plating with authentic finish</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2.5 rounded-full bg-[var(--color-primary-dark)] text-[var(--color-accent-gold)]">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Safe &amp; Insured Shipping</h4>
                <p className="text-xs text-white/60">Delivered across India with live tracking</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-3">
              <div className="p-2.5 rounded-full bg-[var(--color-primary-dark)] text-[var(--color-accent-gold)]">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-white">Curated Craftsmanship</h4>
                <p className="text-xs text-white/60">Traditional temple and modern festive jewellery</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Col */}
          <div className="space-y-3">
            <h3 className="font-display text-xl font-bold text-[var(--color-accent-light-gold)]">
              Parnika Jewellers
            </h3>
            <p className="text-xs leading-relaxed text-white/70">
              Your trusted destination for imitation and premium 1-gram gold jewellery. Handcrafted elegance designed to make every occasion memorable.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/919876543210"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-800/80 hover:bg-emerald-700 text-emerald-200 text-xs font-medium transition-colors"
              >
                <MessageCircle className="w-4 h-4" /> Chat on WhatsApp
              </a>
            </div>
          </div>

          {/* Quick Categories */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-gold)] mb-3">
              Categories
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/catalog?category=cat-one-gram" className="hover:text-white transition-colors">
                  One Gram Gold Collection
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=cat-necklaces" className="hover:text-white transition-colors">
                  Necklaces &amp; Haars
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=cat-earrings" className="hover:text-white transition-colors">
                  Temple Earrings &amp; Jhumkas
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=cat-bangles" className="hover:text-white transition-colors">
                  Royal Bangles &amp; Kadas
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=cat-bridal" className="hover:text-white transition-colors">
                  Complete Bridal Sets
                </Link>
              </li>
            </ul>
          </div>

          {/* Customer Care & Policies */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-gold)] mb-3">
              Customer Policies
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/shipping" className="hover:text-white transition-colors">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/returns" className="hover:text-white transition-colors">
                  Returns &amp; Replacement
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy (DPDP Act)
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition-colors">
                  About Parnika Jewellers
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[var(--color-accent-gold)] mb-3">
              Store Contact
            </h4>
            <ul className="space-y-2 text-xs text-white/70">
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[var(--color-accent-gold)]" />
                <span>care@pjstore.com</span>
              </li>
              <li className="mt-2 text-[11px] leading-tight text-white/50">
                GSTIN: 36ABCDE1234F1Z5 • HSN Code: 7117 (Imitation Jewellery)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-white/50 gap-4">
          <p>© {new Date().getFullYear()} Parnika Jewellers. All rights reserved.</p>
          <p className="text-[11px]">Designed with pride • High-Performance Luxury Jewellery Store</p>
        </div>
      </div>
    </footer>
  );
}
