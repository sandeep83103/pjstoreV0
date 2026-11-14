import React from 'react';
import Link from 'next/link';
import { productRepository, categoryRepository } from '@/lib/data';
import { ProductFilter } from '@/lib/data/interfaces/IProductRepository';
import { ProductCard } from '@/components/storefront/ProductCard';
import { CatalogFilters } from '@/components/storefront/CatalogFilters';
import { Sparkles, ChevronRight, PackageSearch } from 'lucide-react';

export const dynamic = 'force-dynamic';

interface CatalogPageProps {
  searchParams: {
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    inStock?: string;
    search?: string;
    sort?: string;
    finish?: string;
    occasion?: string;
    material?: string;
  };
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const categoryParam = searchParams.category;
  const minPrice = searchParams.minPrice ? Number(searchParams.minPrice) : undefined;
  const maxPrice = searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined;
  const inStockOnly = searchParams.inStock === 'true' || searchParams.inStock === '1';
  const searchQuery = searchParams.search;
  const sort = (searchParams.sort as ProductFilter['sort']) || 'newest';
  const finish = searchParams.finish;
  const occasion = searchParams.occasion;
  const material = searchParams.material;

  const [categories, { items: products }] = await Promise.all([
    categoryRepository.list(),
    productRepository.list(
      {
        categoryId: categoryParam,
        categorySlug: categoryParam,
        minPrice,
        maxPrice,
        inStockOnly,
        searchQuery,
        sort,
        finish,
        occasion,
        material,
        status: 'ACTIVE',
      },
      60
    ),
  ]);

  const selectedCategory = categoryParam
    ? categories.find((c) => c.slug === categoryParam || c.id === categoryParam)
    : null;

  const pageTitle = selectedCategory
    ? selectedCategory.name
    : searchQuery
    ? `Search Results for "${searchQuery}"`
    : 'All Jewellery Collections';

  const pageDescription = selectedCategory
    ? `Explore our signature collection of ${selectedCategory.name.toLowerCase()} handcrafted in 1-gram gold and traditional temple finishes.`
    : 'Browse exquisite one-gram gold jewellery, antique temple sets, jhumkas, chokers, and bangles.';

  return (
    <div className="min-h-screen bg-[var(--color-surface-ivory)]/40 pb-16">
      {/* Category Hero / Header */}
      <div className="bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-primary-dark)] text-white py-10 sm:py-14 border-b border-[var(--color-accent-gold)]/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-[var(--color-accent-light-gold)]/70 mb-4" aria-label="Breadcrumb">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/catalog" className="hover:text-white transition-colors">
              Catalog
            </Link>
            {selectedCategory && (
              <>
                <ChevronRight className="w-3.5 h-3.5" />
                <span className="text-white font-medium">{selectedCategory.name}</span>
              </>
            )}
          </nav>

          <h1 className="font-display text-2xl sm:text-4xl font-bold tracking-tight text-white flex items-center gap-3">
            <span>{pageTitle}</span>
            <Sparkles className="w-5 h-5 text-[var(--color-accent-gold)] shrink-0" />
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-white/80 max-w-2xl font-light">
            {pageDescription}
          </p>
        </div>
      </div>

      {/* Main Catalog Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <CatalogFilters categories={categories} totalProducts={products.length} />

          {/* Product Grid Area */}
          <main className="flex-1 w-full">
            {products.length === 0 ? (
              <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center my-6 shadow-sm">
                <div className="p-4 rounded-full bg-amber-50 text-[var(--color-accent-gold)] inline-flex mb-4">
                  <PackageSearch className="w-8 h-8" />
                </div>
                <h3 className="font-display text-lg font-bold text-[var(--color-primary-dark)]">
                  No Jewellery Found
                </h3>
                <p className="text-xs text-stone-500 mt-2 max-w-md mx-auto">
                  We couldn’t find any pieces matching your chosen filter criteria. Try adjusting your price range or clearing filters to discover more items.
                </p>
                <div className="mt-6">
                  <Link
                    href="/catalog"
                    className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-[var(--color-primary-base)] text-[var(--color-accent-light-gold)] text-xs font-semibold hover:bg-[var(--color-primary-dark)] transition-all shadow"
                  >
                    Reset All Filters
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
