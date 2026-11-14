import {
  GetCommand,
  PutCommand,
  DeleteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Cart } from '../../types';
import { ICartRepository } from '../interfaces/ICartRepository';

export class DynamoCartRepository implements ICartRepository {
  private tableName = getTableName('carts');
  private memoryFallback: Map<string, Cart> = new Map();

  async getCart(id: string): Promise<Cart | null> {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
      if (res.Item) {
        return res.Item as Cart;
      }
    } catch {
      // In offline / local fallback
    }

    return this.memoryFallback.get(id) || null;
  }

  async saveCart(cart: Cart): Promise<Cart> {
    const updated: Cart = {
      ...cart,
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
      // In offline / local fallback
    }

    this.memoryFallback.set(cart.id, updated);
    return updated;
  }

  async clearCart(id: string): Promise<void> {
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
    } catch {
      // In offline / local fallback
    }

    this.memoryFallback.delete(id);
  }
}
