import { Product, ProductSummary } from '../../types';

export interface ProductFilter {
  categoryId?: string;
  minPrice?: number;
  maxPrice?: number;
  inStockOnly?: boolean;
  status?: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
  searchQuery?: string;
}

export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findBySupplierCode(supplierCode: string): Promise<Product[]>;
  list(filter?: ProductFilter, limit?: number, cursor?: string): Promise<{ items: Product[]; nextCursor?: string }>;
  listSummaries(filter?: ProductFilter, limit?: number): Promise<ProductSummary[]>;
  create(product: Product): Promise<Product>;
  update(id: string, updates: Partial<Product>): Promise<Product>;
  decrementStockConditional(productId: string, quantity: number): Promise<boolean>;
  restoreStock(productId: string, quantity: number): Promise<void>;
  delete(id: string): Promise<void>;
}
