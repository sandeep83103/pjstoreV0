import React from 'react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { CartProvider } from '@/app/context/CartContext';
import { CartDrawer } from '@/components/storefront/CartDrawer';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CartProvider>
      <div className="flex flex-col min-h-screen bg-[#080706] text-[#F5EFEB] selection:bg-[#D4AF37] selection:text-[#080706]">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </div>
    </CartProvider>
  );
}
