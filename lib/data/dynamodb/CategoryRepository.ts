import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Category } from '../../types';
import { ICategoryRepository } from '../interfaces/ICategoryRepository';
import { SEED_CATEGORIES } from '../seedData';

export class DynamoCategoryRepository implements ICategoryRepository {
  private tableName = getTableName('categories');
  private memoryFallback: Map<string, Category> = new Map(
    SEED_CATEGORIES.map((c) => [c.id, c])
  );

  async findById(id: string): Promise<Category | null> {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
      if (res.Item) return res.Item as Category;
    } catch {
      // Fallback to in-memory seed cache if DynamoDB is unreachable
    }
    return this.memoryFallback.get(id) || null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
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
      if (res.Items?.[0]) return res.Items[0] as Category;
    } catch {
      // Fallback to in-memory seed cache
    }

    for (const cat of this.memoryFallback.values()) {
      if (cat.slug === slug) return cat;
    }
    return null;
  }

  async list(): Promise<Category[]> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
        })
      );
      const items = (res.Items as Category[]) || [];
      if (items.length > 0) {
        return items.sort((a, b) => a.sortOrder - b.sortOrder);
      }
    } catch {
      // Fallback to in-memory seed cache
    }
    return Array.from(this.memoryFallback.values()).sort(
      (a, b) => a.sortOrder - b.sortOrder
    );
  }

  async create(category: Category): Promise<Category> {
    const now = new Date().toISOString();
    const item: Category = {
      ...category,
      createdAt: category.createdAt || now,
      updatedAt: now,
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      );
    } catch {
      // In local offline fallback mode, persist to memory cache
    }

    this.memoryFallback.set(item.id, item);
    return item;
  }

  async update(id: string, updates: Partial<Category>): Promise<Category> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Category with id '${id}' not found`);
    }

    const updated: Category = {
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
      // In local offline fallback mode
    }

    this.memoryFallback.set(id, updated);
    return updated;
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
      // In local offline fallback mode
    }
    this.memoryFallback.delete(id);
  }
}
