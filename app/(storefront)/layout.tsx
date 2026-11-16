import React from 'react';
import { Header } from '@/components/storefront/Header';
import { Footer } from '@/components/storefront/Footer';
import { CartProvider } from '@/app/context/CartContext';
import { CartDrawer } from '@/components/storefront/CartDrawer';
import { getStorefrontContent } from '@/lib/content/storefront';
import { StorefrontContentProvider } from '@/app/context/StorefrontContentContext';
import { VisualEditorToolbar } from '@/components/storefront/VisualEditorToolbar';

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const initialContent = await getStorefrontContent();

  return (
    <StorefrontContentProvider initialContent={initialContent}>
      <CartProvider>
        <div className="flex flex-col min-h-screen bg-[#080706] text-[#F5EFEB] selection:bg-[#D4AF37] selection:text-[#080706] overflow-x-hidden w-full">
          <Header />
          <main className="flex-1 w-full">{children}</main>
          <Footer />
          <CartDrawer />
          <VisualEditorToolbar />
        </div>
      </CartProvider>
    </StorefrontContentProvider>
  );
}
