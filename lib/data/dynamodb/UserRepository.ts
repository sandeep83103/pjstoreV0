import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { User } from '../../types';
import { IUserRepository } from '../interfaces/IUserRepository';

export class DynamoUserRepository implements IUserRepository {
  private tableName = getTableName('users');
  private memoryFallback: Map<string, User> = new Map();

  async findById(id: string): Promise<User | null> {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
      if (res.Item) return res.Item as User;
    } catch {
      // Offline fallback
    }
    return this.memoryFallback.get(id) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const cleanEmail = email.toLowerCase();
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': cleanEmail },
          Limit: 1,
        })
      );
      if (res.Items?.[0]) return res.Items[0] as User;
    } catch {
      // Offline fallback
    }

    for (const u of this.memoryFallback.values()) {
      if (u.email?.toLowerCase() === cleanEmail) return u;
    }
    return null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'phone-index',
          KeyConditionExpression: 'phone = :phone',
          ExpressionAttributeValues: { ':phone': phone },
          Limit: 1,
        })
      );
      if (res.Items?.[0]) return res.Items[0] as User;
    } catch {
      // Offline fallback
    }

    for (const u of this.memoryFallback.values()) {
      if (u.phone === phone) return u;
    }
    return null;
  }

  async create(user: User): Promise<User> {
    const item: User = {
      ...user,
      email: user.email ? user.email.toLowerCase() : undefined,
    };
    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      );
    } catch {
      // Offline fallback
    }
    this.memoryFallback.set(item.id, item);
    return item;
  }

  async update(id: string, updates: Partial<User>): Promise<User> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`User with id '${id}' not found`);
    }

    const updated: User = {
      ...existing,
      ...updates,
      email: 'email' in updates ? (updates.email ? updates.email.toLowerCase() : undefined) : existing.email,
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
      // Offline fallback
    }
    this.memoryFallback.set(id, updated);
    return updated;
  }
}
