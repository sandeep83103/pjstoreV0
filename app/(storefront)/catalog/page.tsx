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
    : 'Browse exquisite one-gram gold jewellery, antique temple sets, long harams, jhumkas, and bridal sets.';

  return (
    <div className="min-h-screen bg-[#F7F0DE] text-[#2B1316] pb-20">
      {/* Category Hero Banner (Maroon Damask from parnika-jewellers-store.html) */}
      <div className="tex-m text-[#F7F0DE] py-12 sm:py-16 border-b-2 border-[#D4AF5A]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-1.5 text-xs text-[#E9D08A] mb-4" aria-label="Breadcrumb">
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

          <div className="flex items-center justify-between">
            <div>
              <div className="eyebrow text-xs tracking-[0.25em] uppercase text-[#E9D08A] font-semibold mb-1">
                Parnika Signature
              </div>
              <h1 className="font-serif text-3xl sm:text-5xl font-bold tracking-tight text-[#F7F0DE] flex items-center gap-3">
                <span>{pageTitle}</span>
                <Sparkles className="w-5 h-5 text-[#D4AF5A] shrink-0" />
              </h1>
              <p className="mt-2 text-sm text-[#E4D7C0] max-w-2xl font-light">
                {pageDescription}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Catalog Workspace */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Sidebar Filters */}
          <CatalogFilters categories={categories} totalProducts={products.length} />

          {/* Product Grid Area */}
          <main className="flex-1 w-full">
            {products.length === 0 ? (
              <div className="bg-white rounded-sm border border-[#E6D7B4] border-t-4 border-t-[#7A262D] p-12 text-center my-6 shadow-sm">
                <div className="p-4 rounded-full bg-[#F7F0DE] text-[#D4AF5A] inline-flex mb-4 border border-[#D4AF5A]">
                  <PackageSearch className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-[#4A1118]">
                  No Jewellery Found
                </h3>
                <p className="text-xs text-[#5E4A4C] mt-2 max-w-md mx-auto">
                  We couldn’t find any pieces matching your chosen filter criteria. Try adjusting your price range or clearing filters to discover more items.
                </p>
                <div className="mt-6">
                  <Link
                    href="/catalog"
                    className="inline-flex items-center justify-center px-6 py-2.5 bg-[#7A262D] text-[#F7F0DE] hover:bg-[#2E0A0F] hover:text-[#E9D08A] text-xs font-semibold uppercase tracking-wider transition shadow"
                  >
                    Reset All Filters
                  </Link>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-6">
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
