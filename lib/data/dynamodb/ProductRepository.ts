import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
  BatchWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Product, ProductSummary } from '../../types';
import { IProductRepository, ProductFilter } from '../interfaces/IProductRepository';
import { SEED_PRODUCTS, SEED_CATEGORIES } from '../seedData';

export class DynamoProductRepository implements IProductRepository {
  private tableName = getTableName('products');
  private memoryFallback: Map<string, Product> = new Map(
    SEED_PRODUCTS.map((p) => [p.id, p])
  );

  async findById(id: string): Promise<Product | null> {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
      if (res.Item) return res.Item as Product;
    } catch {
      // In offline/local mode fallback
    }
    return this.memoryFallback.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'slug-index',
          KeyConditionExpression: 'slug = :slug',
          ExpressionAttributeValues: { ':slug': slug },
          Limit: 1,
        })
      );
      if (res.Items?.[0]) return res.Items[0] as Product;
    } catch {
      // In offline/local mode fallback
    }

    for (const prod of this.memoryFallback.values()) {
      if (prod.slug === slug) return prod;
    }
    return null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'sku-index',
          KeyConditionExpression: 'sku = :sku',
          ExpressionAttributeValues: { ':sku': sku },
          Limit: 1,
        })
      );
      if (res.Items?.[0]) return res.Items[0] as Product;
    } catch {
      // In offline/local mode fallback
    }

    for (const prod of this.memoryFallback.values()) {
      if (prod.sku.toLowerCase() === sku.toLowerCase()) return prod;
    }
    return null;
  }

  async findBySupplierCode(supplierCode: string): Promise<Product[]> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          FilterExpression: 'supplierCode = :sc',
          ExpressionAttributeValues: { ':sc': supplierCode },
        })
      );
      if (res.Items && res.Items.length > 0) return res.Items as Product[];
    } catch {
      // In offline/local mode fallback
    }

    const matches: Product[] = [];
    for (const prod of this.memoryFallback.values()) {
      if (prod.supplierCode.toLowerCase() === supplierCode.toLowerCase()) {
        matches.push(prod);
      }
    }
    return matches;
  }

  async list(
    filter?: ProductFilter,
    limit: number = 50
  ): Promise<{ items: Product[]; nextCursor?: string }> {
    let allItems: Product[] = [];

    try {
      if (filter?.categoryId && !filter.categoryId.startsWith('slug:')) {
        const res = await docClient.send(
          new QueryCommand({
            TableName: this.tableName,
            IndexName: 'category-createdAt-index',
            KeyConditionExpression: 'categoryId = :cat',
            ExpressionAttributeValues: { ':cat': filter.categoryId },
            Limit: limit,
            ScanIndexForward: false,
          })
        );
        allItems = (res.Items as Product[]) || [];
      } else {
        const res = await docClient.send(
          new ScanCommand({
            TableName: this.tableName,
            Limit: limit,
          })
        );
        allItems = (res.Items as Product[]) || [];
      }
    } catch {
      // Fallback to in-memory items
    }

    if (allItems.length === 0) {
      allItems = Array.from(this.memoryFallback.values());
    }

    // Resolve category identifier (slug or id)
    let targetCategoryIds: string[] = [];
    const catQuery = filter?.categorySlug || filter?.categoryId;
    if (catQuery && catQuery !== 'all') {
      const matchedCat = SEED_CATEGORIES.find(
        (c) => c.slug === catQuery || c.id === catQuery
      );
      if (matchedCat) {
        targetCategoryIds.push(matchedCat.id);
        const childCats = SEED_CATEGORIES.filter((c) => c.parentId === matchedCat.id);
        targetCategoryIds.push(...childCats.map((c) => c.id));
      } else {
        targetCategoryIds.push(catQuery);
      }
    }

    // Apply comprehensive multi-attribute filtering
    let filtered = allItems.filter((item) => {
      // Status filter: if 'ALL', do not filter by status
      if (filter?.status && filter.status !== 'ALL') {
        if (item.status !== filter.status) return false;
      }

      // Category filter
      if (targetCategoryIds.length > 0) {
        const matchesCategory =
          targetCategoryIds.includes(item.categoryId) ||
          (catQuery && item.tags.includes(catQuery));
        if (!matchesCategory) return false;
      }

      // Price filter (Whole INR)
      if (filter?.minPrice !== undefined && item.price < filter.minPrice) {
        return false;
      }
      if (filter?.maxPrice !== undefined && item.price > filter.maxPrice) {
        return false;
      }

      // In-stock filter
      if (filter?.inStockOnly && item.stock <= 0) {
        return false;
      }

      // Low stock only filter
      if (filter?.lowStockOnly && item.stock > item.lowStockAt) {
        return false;
      }

      // Search Query (matches Title/Name, Description, SKU, or SupplierCode)
      if (filter?.searchQuery) {
        const q = filter.searchQuery.toLowerCase().trim();
        const inName = item.name.toLowerCase().includes(q);
        const inDesc = item.description.toLowerCase().includes(q);
        const inSku = item.sku.toLowerCase().includes(q);
        const inSupplier = item.supplierCode.toLowerCase().includes(q);
        const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
        if (!inName && !inDesc && !inSku && !inSupplier && !inTags) {
          return false;
        }
      }

      // Finish filter
      if (filter?.finish) {
        const f = filter.finish.toLowerCase();
        const specFinish = (item.specs['Finish'] || '').toLowerCase();
        const tagMatch = item.tags.some((t) => t.toLowerCase().includes(f));
        if (!specFinish.includes(f) && !tagMatch) return false;
      }

      // Occasion filter
      if (filter?.occasion) {
        const o = filter.occasion.toLowerCase();
        const specOccasion = (item.specs['Occasion'] || '').toLowerCase();
        const tagMatch = item.tags.some((t) => t.toLowerCase().includes(o));
        if (!specOccasion.includes(o) && !tagMatch) return false;
      }

      // Material / Base Metal filter
      if (filter?.material) {
        const m = filter.material.toLowerCase();
        const specMetal = (item.specs['Base Metal'] || item.specs['Material'] || '').toLowerCase();
        const tagMatch = item.tags.some((t) => t.toLowerCase().includes(m));
        if (!specMetal.includes(m) && !tagMatch) return false;
      }

      return true;
    });

    // Apply sorting
    if (filter?.sort) {
      switch (filter.sort) {
        case 'price_asc':
          filtered.sort((a, b) => a.price - b.price);
          break;
        case 'price_desc':
          filtered.sort((a, b) => b.price - a.price);
          break;
        case 'newest':
          filtered.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          break;
        case 'bestseller':
          filtered.sort((a, b) => {
            const aBest = a.tags.includes('bestseller') ? 1 : 0;
            const bBest = b.tags.includes('bestseller') ? 1 : 0;
            if (bBest !== aBest) return bBest - aBest;
            return b.stock - a.stock;
          });
          break;
      }
    }

    return { items: filtered.slice(0, limit) };
  }

  async listSummaries(filter?: ProductFilter, limit: number = 50): Promise<ProductSummary[]> {
    const { items } = await this.list(filter, limit);
    return items.map(({ costPrice, ...summary }) => summary);
  }

  async create(product: Product): Promise<Product> {
    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: product,
        })
      );
    } catch {
      // Offline fallback
    }

    this.memoryFallback.set(product.id, product);
    return product;
  }

  async batchCreate(products: Product[]): Promise<{ inserted: number; failed: number }> {
    let inserted = 0;
    let failed = 0;

    // Chunk into groups of 25 for DynamoDB BatchWriteItem
    const chunkSize = 25;
    for (let i = 0; i < products.length; i += chunkSize) {
      const chunk = products.slice(i, i + chunkSize);
      try {
        await docClient.send(
          new BatchWriteCommand({
            RequestItems: {
              [this.tableName]: chunk.map((prod) => ({
                PutRequest: {
                  Item: prod,
                },
              })),
            },
          })
        );
        inserted += chunk.length;
      } catch {
        // In local/offline fallback, insert into in-memory store
        inserted += chunk.length;
      }

      for (const prod of chunk) {
        this.memoryFallback.set(prod.id, prod);
      }
    }

    return { inserted, failed };
  }

  async update(id: string, updates: Partial<Product>): Promise<Product> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Product with id '${id}' not found`);
    }

    const updated = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: updated,
        })
      );
    } catch {
      // In offline/local mode fallback
    }

    this.memoryFallback.set(id, updated);
    return updated;
  }

  async decrementStockConditional(productId: string, quantity: number): Promise<boolean> {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id: productId },
          UpdateExpression: 'SET stock = stock - :qty, updatedAt = :now',
          ConditionExpression: 'stock >= :qty AND #status = :activeStatus',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':qty': quantity,
            ':activeStatus': 'ACTIVE',
            ':now': new Date().toISOString(),
          },
        })
      );
      const inMem = this.memoryFallback.get(productId);
      if (inMem) inMem.stock -= quantity;
      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }
      // If offline/fallback
      const item = this.memoryFallback.get(productId);
      if (item && item.stock >= quantity && item.status === 'ACTIVE') {
        item.stock -= quantity;
        item.updatedAt = new Date().toISOString();
        return true;
      }
      return false;
    }
  }

  async restoreStock(productId: string, quantity: number): Promise<void> {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id: productId },
          UpdateExpression: 'SET stock = stock + :qty, updatedAt = :now',
          ExpressionAttributeValues: {
            ':qty': quantity,
            ':now': new Date().toISOString(),
          },
        })
      );
    } catch {
      // Offline fallback
    }

    const inMem = this.memoryFallback.get(productId);
    if (inMem) {
      inMem.stock += quantity;
      inMem.updatedAt = new Date().toISOString();
    }
  }

  async delete(id: string): Promise<void> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
    } catch {
      // Offline fallback
    }
    this.memoryFallback.delete(id);
  }
}
