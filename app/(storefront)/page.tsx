import React from 'react';
import { productRepository } from '@/lib/data';
import { StorefrontHomePageClient } from '@/components/storefront/StorefrontHomePageClient';

export const revalidate = 60; // ISR cache for 60 seconds

export default async function StorefrontHomePage() {
  const { items: featuredProducts } = await productRepository.list(
    { status: 'ACTIVE', inStockOnly: true },
    8
  );

  return <StorefrontHomePageClient featuredProducts={featuredProducts} />;
}
