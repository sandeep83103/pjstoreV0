import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Coupon } from '../../types';
import { ICouponRepository } from '../interfaces/ICouponRepository';

export class DynamoCouponRepository implements ICouponRepository {
  private tableName = getTableName('coupons');

  async findByCode(code: string): Promise<Coupon | null> {
    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { code: code.toUpperCase() },
      })
    );
    return (res.Item as Coupon) || null;
  }

  async listActive(): Promise<Coupon[]> {
    const res = await docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        FilterExpression: 'active = :act',
        ExpressionAttributeValues: { ':act': true },
      })
    );
    return (res.Items as Coupon[]) || [];
  }

  async create(coupon: Coupon): Promise<Coupon> {
    const item: Coupon = {
      ...coupon,
      code: coupon.code.toUpperCase(),
    };
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
    return item;
  }

  async incrementUsageCountConditional(code: string): Promise<boolean> {
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { code: code.toUpperCase() },
          UpdateExpression: 'SET usedCount = usedCount + :inc',
          ConditionExpression: 'usedCount < usageLimit AND active = :true',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':true': true,
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

  async update(code: string, updates: Partial<Coupon>): Promise<Coupon> {
    const existing = await this.findByCode(code);
    if (!existing) {
      throw new Error(`Coupon '${code}' not found`);
    }

    const updated: Coupon = {
      ...existing,
      ...updates,
      code: existing.code,
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
