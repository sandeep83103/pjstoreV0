import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Coupon } from '../../types';
import { ICouponRepository } from '../interfaces/ICouponRepository';
import { SEED_COUPONS } from '../seedData';

export class DynamoCouponRepository implements ICouponRepository {
  private tableName = getTableName('coupons');
  private memoryFallback: Map<string, Coupon> = new Map(
    SEED_COUPONS.map((c) => [c.code.toUpperCase(), { ...c }])
  );

  async findByCode(code: string): Promise<Coupon | null> {
    const upperCode = code.toUpperCase();
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { code: upperCode },
        })
      );
      if (res.Item) {
        return res.Item as Coupon;
      }
    } catch {
      // In offline / local fallback
    }
    return this.memoryFallback.get(upperCode) || null;
  }

  async listActive(): Promise<Coupon[]> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          FilterExpression: 'active = :act',
          ExpressionAttributeValues: { ':act': true },
        })
      );
      if (res.Items && res.Items.length > 0) {
        return res.Items as Coupon[];
      }
    } catch {
      // In offline / local fallback
    }

    const activeList: Coupon[] = [];
    for (const c of this.memoryFallback.values()) {
      if (c.active) {
        activeList.push(c);
      }
    }
    return activeList;
  }

  async listAll(): Promise<Coupon[]> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
        })
      );
      if (res.Items && res.Items.length > 0) {
        return res.Items as Coupon[];
      }
    } catch {
      // In offline / local fallback
    }
    return Array.from(this.memoryFallback.values());
  }

  async create(coupon: Coupon): Promise<Coupon> {
    const item: Coupon = {
      ...coupon,
      code: coupon.code.toUpperCase(),
    };

    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      );
    } catch {
      // In offline / local fallback
    }

    this.memoryFallback.set(item.code, item);
    return item;
  }

  async incrementUsageCountConditional(code: string): Promise<boolean> {
    const upperCode = code.toUpperCase();
    try {
      await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { code: upperCode },
          UpdateExpression: 'SET usedCount = usedCount + :inc',
          ConditionExpression: 'usedCount < usageLimit AND active = :true',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':true': true,
          },
        })
      );

      const mem = this.memoryFallback.get(upperCode);
      if (mem) {
        mem.usedCount = (mem.usedCount || 0) + 1;
      }
      return true;
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        return false;
      }
      // If offline/fallback, check memory
      const mem = this.memoryFallback.get(upperCode);
      if (mem) {
        if (mem.active && mem.usedCount < mem.usageLimit) {
          mem.usedCount = (mem.usedCount || 0) + 1;
          return true;
        }
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

    this.memoryFallback.set(updated.code, updated);
    return updated;
  }

  async delete(code: string): Promise<void> {
    const upperCode = code.toUpperCase();
    try {
      await docClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { code: upperCode },
        })
      );
    } catch {
      // In offline / local fallback
    }
    this.memoryFallback.delete(upperCode);
  }
}
