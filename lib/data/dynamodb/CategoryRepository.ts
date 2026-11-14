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

export class DynamoCategoryRepository implements ICategoryRepository {
  private tableName = getTableName('categories');

  async findById(id: string): Promise<Category | null> {
    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return (res.Item as Category) || null;
  }

  async findBySlug(slug: string): Promise<Category | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': slug },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as Category) || null;
  }

  async list(): Promise<Category[]> {
    const res = await docClient.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    const items = (res.Items as Category[]) || [];
    return items.sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async create(category: Category): Promise<Category> {
    const now = new Date().toISOString();
    const item: Category = {
      ...category,
      createdAt: category.createdAt || now,
      updatedAt: now,
    };
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
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

    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: updated,
      })
    );
    return updated;
  }

  async delete(id: string): Promise<void> {
    await docClient.send(
      new DeleteCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
  }
}
