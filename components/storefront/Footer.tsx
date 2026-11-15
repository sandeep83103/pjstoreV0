import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, Sparkles, MessageCircle, Phone, Mail, MapPin } from 'lucide-react';

export function Footer() {
  return (
    <footer id="contact" className="bg-[#050404] text-[#A89B88] border-t border-gold mt-auto">
      {/* Trust Badges Strip (Gold border & subtle glow) */}
      <div className="border-b border-gold bg-[#0A0806] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-4">
              <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center bg-[#18130B] text-[#D4AF37] shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#F5EFEB]">1-Gram Gold Plated Brass</h4>
                <p className="text-xs text-[#A89B88]">Authentic traditional temple finish and micron polish</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4">
              <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center bg-[#18130B] text-[#D4AF37] shrink-0">
                <Truck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#F5EFEB]">Free Insured India Delivery</h4>
                <p className="text-xs text-[#A89B88]">Dispatched within 24h on orders above ₹999</p>
              </div>
            </div>

            <div className="flex items-center justify-center sm:justify-start gap-4">
              <div className="w-12 h-12 rounded-full border border-gold flex items-center justify-center bg-[#18130B] text-[#D4AF37] shrink-0">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#F5EFEB]">Handcrafted Artistry</h4>
                <p className="text-xs text-[#A89B88]">Every set inspected with matching accessories</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand Col */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-gold flex items-center justify-center bg-[#18130B]">
                <svg className="w-6 h-6 text-[#D4AF37]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L15 8L21 9L16.5 14L18 20L12 17L6 20L7.5 14L3 9L9 8L12 2Z" fill="rgba(212,175,55,0.2)" />
                  <circle cx="12" cy="12" r="3" fill="#D4AF37" />
                </svg>
              </div>
              <div>
                <span className="font-serif text-2xl font-bold tracking-widest gold-gradient block leading-none">
                  PARNIKA
                </span>
                <span className="text-[9px] uppercase tracking-[0.28em] text-[#CBB99F] block mt-1">
                  1-Gram Gold Jewellers
                </span>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-[#A89B88]">
              Exquisite one-gram and fashion jewellery for every celebration. Bringing timeless temple elegance to your festive moments.
            </p>
            <div className="pt-2">
              <a
                href="https://wa.me/919876543210?text=Hello%20Parnika%20Jewellers,%20I%20have%20an%20enquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-[#25D366] text-xs font-semibold tracking-wider transition"
              >
                <MessageCircle className="w-4 h-4" /> WhatsApp Support
              </a>
            </div>
          </div>

          {/* Shop Links */}
          <div>
            <h4 className="font-serif text-base font-bold text-[#FBE8A6] uppercase tracking-wider mb-4">
              Shop Collections
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/catalog?category=necklaces" className="hover:text-[#FBE8A6] transition-colors">
                  Long Haram Sets
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=bridal-sets" className="hover:text-[#FBE8A6] transition-colors">
                  Bridal &amp; Temple Sets
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=one-gram-gold" className="hover:text-[#FBE8A6] transition-colors">
                  Ruby &amp; Emerald Kempu
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=earrings" className="hover:text-[#FBE8A6] transition-colors">
                  Antique Earrings &amp; Jhumkas
                </Link>
              </li>
              <li>
                <Link href="/catalog?category=bangles" className="hover:text-[#FBE8A6] transition-colors">
                  Royal Bangles &amp; Kadas
                </Link>
              </li>
            </ul>
          </div>

          {/* Help & Policies */}
          <div>
            <h4 className="font-serif text-base font-bold text-[#FBE8A6] uppercase tracking-wider mb-4">
              Customer Care
            </h4>
            <ul className="space-y-2.5 text-xs">
              <li>
                <Link href="/account/orders" className="hover:text-[#FBE8A6] transition-colors">
                  Track Your Order
                </Link>
              </li>
              <li>
                <Link href="/policies/shipping" className="hover:text-[#FBE8A6] transition-colors">
                  Shipping &amp; Delivery Policy
                </Link>
              </li>
              <li>
                <Link href="/policies/returns" className="hover:text-[#FBE8A6] transition-colors">
                  Returns &amp; Exchange (48h)
                </Link>
              </li>
              <li>
                <Link href="/policies/privacy" className="hover:text-[#FBE8A6] transition-colors">
                  Privacy Policy (DPDP Act 2023)
                </Link>
              </li>
              <li>
                <Link href="/policies/terms" className="hover:text-[#FBE8A6] transition-colors">
                  Terms of Service &amp; Care Guide
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h4 className="font-serif text-base font-bold text-[#FBE8A6] uppercase tracking-wider mb-4">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>+91 98765 43210 (Mon–Sat, 10am–7pm IST)</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>support@pjstore.com</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" />
                <span>Parnika Jewellers, Mumbai, Maharashtra 400001, India</span>
              </li>
              <li className="pt-2 text-[11px] text-[#A89B88]">
                GSTIN: 27AAAAA0000A1Z5 • HSN 7117 (Imitation Jewellery)
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 mt-12 border-t border-gold flex flex-col sm:flex-row items-center justify-between text-xs text-[#A89B88] gap-4">
          <p>© 2026 Parnika Jewellers. All rights reserved.</p>
          <p className="text-[11px]">Designed with temple craftsmanship &amp; modern security.</p>
        </div>
      </div>
    </footer>
  );
}
