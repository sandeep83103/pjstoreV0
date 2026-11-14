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

  async findById(id: string): Promise<User | null> {
    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return (res.Item as User) || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'email-index',
        KeyConditionExpression: 'email = :email',
        ExpressionAttributeValues: { ':email': email.toLowerCase() },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as User) || null;
  }

  async findByPhone(phone: string): Promise<User | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'phone-index',
        KeyConditionExpression: 'phone = :phone',
        ExpressionAttributeValues: { ':phone': phone },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as User) || null;
  }

  async create(user: User): Promise<User> {
    const item: User = {
      ...user,
      email: user.email ? user.email.toLowerCase() : undefined,
    };
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
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
      email: updates.email ? updates.email.toLowerCase() : existing.email,
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
}
