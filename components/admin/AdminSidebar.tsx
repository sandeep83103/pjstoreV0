'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Ticket,
  CreditCard,
  Users,
  Settings,
  Sparkles,
} from 'lucide-react';

const ADMIN_NAV = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Inventory & Stock', href: '/admin/inventory', icon: Package },
  { name: 'Orders & Shipments', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Discount Coupons', href: '/admin/coupons', icon: Ticket },
  { name: 'Payment Gateways', href: '/admin/payments', icon: CreditCard },
  { name: 'Customers', href: '/admin/customers', icon: Users },
  { name: 'Store Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-[var(--color-primary-dark)] text-white flex flex-col shrink-0 border-r border-[var(--color-accent-gold)]/20 min-h-screen">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
        <div className="p-1.5 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-accent-gold)] border border-[var(--color-accent-gold)]/30">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h2 className="font-display font-bold text-sm tracking-wide text-[var(--color-accent-light-gold)]">
            Parnika Admin
          </h2>
          <span className="text-[10px] text-white/50 uppercase tracking-widest">
            Merchant Console
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {ADMIN_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-[var(--color-accent-gold)] text-[var(--color-primary-dark)] shadow-sm'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      {/* Admin Footer */}
      <div className="p-4 border-t border-white/10 text-xs text-white/50">
        <p className="font-semibold text-white/70">Parnika Jewellers v0.1</p>
        <p className="text-[10px]">AWS Region: ap-south-1</p>
      </div>
    </aside>
  );
}
