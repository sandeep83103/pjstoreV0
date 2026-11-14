import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Product, ProductSummary } from '../../types';
import { IProductRepository, ProductFilter } from '../interfaces/IProductRepository';

export class DynamoProductRepository implements IProductRepository {
  private tableName = getTableName('products');

  async findById(id: string): Promise<Product | null> {
    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return (res.Item as Product) || null;
  }

  async findBySlug(slug: string): Promise<Product | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'slug-index',
        KeyConditionExpression: 'slug = :slug',
        ExpressionAttributeValues: { ':slug': slug },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as Product) || null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'sku-index',
        KeyConditionExpression: 'sku = :sku',
        ExpressionAttributeValues: { ':sku': sku },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as Product) || null;
  }

  async findBySupplierCode(supplierCode: string): Promise<Product[]> {
    const res = await docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'supplierCode = :sc',
        ExpressionAttributeValues: { ':sc': supplierCode },
      })
    );
    return (res.Items as Product[]) || [];
  }

  async list(filter?: ProductFilter, limit: number = 50): Promise<{ items: Product[]; nextCursor?: string }> {
    if (filter?.categoryId) {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'category-createdAt-index',
          KeyConditionExpression: 'categoryId = :cat',
          ExpressionAttributeValues: { ':cat': filter.categoryId },
          Limit: limit,
          ScanIndexForward: false, // Newest first
        })
      );
      return { items: (res.Items as Product[]) || [] };
    }

    const res = await docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      })
    );
    return { items: (res.Items as Product[]) || [] };
  }

  async listSummaries(filter?: ProductFilter, limit: number = 50): Promise<ProductSummary[]> {
    const { items } = await this.list(filter, limit);
    return items.map(({ costPrice, ...summary }) => summary);
  }

  async create(product: Product): Promise<Product> {
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: product,
      })
    );
    return product;
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

    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: updated,
      })
    );
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
      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }
      throw error;
    }
  }

  async restoreStock(productId: string, quantity: number): Promise<void> {
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
