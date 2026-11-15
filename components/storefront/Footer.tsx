import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="ftr tex-dd border-t-2 border-[#D4AF5A] text-[#E2D3C4] px-6 sm:px-12 py-16 sm:py-20">
      <div className="ftr-in max-w-[1280px] mx-auto flex flex-col gap-10">
        <div className="cols flex flex-wrap gap-12 justify-between">
          {/* Column 1: Brand Logo & Description */}
          <div className="col first flex-[1_1_260px] min-w-[240px] flex flex-col gap-4">
            <div className="relative h-20 w-36 overflow-hidden">
              <Image
                src="/brand/emblem.webp"
                alt="Parnika Jewellers logo"
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-sm leading-relaxed text-[#E2D3C4] max-w-[300px]">
              Exquisite one-gram and fashion jewellery for every celebration.
            </p>
            <div className="text-xs text-[#D4AF5A] font-medium">
              GSTIN: 27AAAAA0000A1Z5 • HSN 7117
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="col flex-[1_1_160px] min-w-[140px] flex flex-col gap-2.5">
            <h3 className="font-serif text-xl font-bold text-[#E9D08A] uppercase tracking-wider mb-2">
              Shop
            </h3>
            <Link href="/catalog?category=long-haram" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Long Haram Sets
            </Link>
            <Link href="/catalog?category=bridal-temple" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Bridal &amp; Temple
            </Link>
            <Link href="/catalog?category=ruby-emerald" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Ruby &amp; Emerald
            </Link>
            <Link href="/catalog?category=floral-layered" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Floral &amp; Layered
            </Link>
          </div>

          {/* Column 3: Help */}
          <div className="col flex-[1_1_160px] min-w-[140px] flex flex-col gap-2.5">
            <h3 className="font-serif text-xl font-bold text-[#E9D08A] uppercase tracking-wider mb-2">
              Help
            </h3>
            <Link href="/policies/shipping" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Shipping Policy
            </Link>
            <Link href="/policies/returns" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Returns &amp; Exchange (48h)
            </Link>
            <Link href="/policies/terms" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Jewellery Care Guide
            </Link>
            <Link href="/policies/privacy" className="text-sm text-[#F7F0DE] hover:text-[#E9D08A] transition">
              Privacy Policy (DPDP Act 2023)
            </Link>
          </div>

          {/* Column 4: Contact */}
          <div className="col flex-[1_1_220px] min-w-[180px] flex flex-col gap-3">
            <h3 className="font-serif text-xl font-bold text-[#E9D08A] uppercase tracking-wider mb-2">
              Contact
            </h3>
            <div className="text-sm text-[#E2D3C4] flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#D4AF5A] shrink-0" />
              <a href="tel:+919876543210" className="hover:text-[#E9D08A] transition">
                +91 98765 43210
              </a>
            </div>
            <div className="text-sm text-[#E2D3C4] flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#D4AF37] shrink-0" />
              <a href="mailto:support@parnikajewellers.com" className="hover:text-[#E9D08A] transition">
                support@parnikajewellers.com
              </a>
            </div>
            <div className="text-sm text-[#E2D3C4] flex items-start gap-2">
              <MapPin className="w-4 h-4 text-[#D4AF5A] shrink-0 mt-0.5" />
              <span>Parnika Jewellers, Mumbai, Maharashtra 400001, India</span>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="copy border-t border-[#8A6A22] pt-6 text-center text-xs text-[#D8C7B8]">
          &copy; 2026 Parnika Jewellers. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
