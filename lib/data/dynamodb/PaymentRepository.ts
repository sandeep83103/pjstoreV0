import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { PaymentRecord, PaymentStatus } from '../../types';
import { IPaymentRepository } from '../interfaces/IPaymentRepository';

export class DynamoPaymentRepository implements IPaymentRepository {
  private tableName = getTableName('payments');
  private memoryFallback: Map<string, PaymentRecord> = new Map();

  async findById(id: string): Promise<PaymentRecord | null> {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
      if (res.Item) {
        return res.Item as PaymentRecord;
      }
    } catch {
      // Offline fallback
    }
    return this.memoryFallback.get(id) || null;
  }

  async findByOrderId(orderId: string): Promise<PaymentRecord[]> {
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'orderId-index',
          KeyConditionExpression: 'orderId = :oid',
          ExpressionAttributeValues: { ':oid': orderId },
        })
      );
      if (res.Items && res.Items.length > 0) {
        return res.Items as PaymentRecord[];
      }
    } catch {
      // Offline fallback
    }

    const matches: PaymentRecord[] = [];
    for (const p of this.memoryFallback.values()) {
      if (p.orderId === orderId) {
        matches.push(p);
      }
    }
    return matches;
  }

  async findByProviderRef(providerRef: string): Promise<PaymentRecord | null> {
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'providerRef-index',
          KeyConditionExpression: 'providerRef = :pref',
          ExpressionAttributeValues: { ':pref': providerRef },
          Limit: 1,
        })
      );
      if (res.Items?.[0]) {
        return res.Items[0] as PaymentRecord;
      }
    } catch {
      // Offline fallback
    }

    for (const p of this.memoryFallback.values()) {
      if (p.providerRef === providerRef) {
        return p;
      }
    }
    return null;
  }

  async recordPaymentEvent(payment: PaymentRecord): Promise<PaymentRecord> {
    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: payment,
        })
      );
    } catch {
      // Offline fallback
    }

    this.memoryFallback.set(payment.id, payment);
    return payment;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<PaymentRecord> {
    try {
      const res = await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: 'SET #st = :status',
          ExpressionAttributeNames: {
            '#st': 'status',
          },
          ExpressionAttributeValues: {
            ':status': status,
          },
          ReturnValues: 'ALL_NEW',
        })
      );
      if (res.Attributes) {
        const updated = res.Attributes as PaymentRecord;
        this.memoryFallback.set(id, updated);
        return updated;
      }
    } catch {
      // Offline fallback
    }

    const existing = this.memoryFallback.get(id);
    if (!existing) {
      throw new Error(`PaymentRecord with ID '${id}' not found`);
    }
    const updated: PaymentRecord = {
      ...existing,
      status,
    };
    this.memoryFallback.set(id, updated);
    return updated;
  }

  async listAll(limit: number = 50): Promise<PaymentRecord[]> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          Limit: limit,
        })
      );
      if (res.Items && res.Items.length > 0) {
        return res.Items as PaymentRecord[];
      }
    } catch {
      // Offline fallback
    }

    return Array.from(this.memoryFallback.values())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async listUnmatched(limit: number = 50): Promise<PaymentRecord[]> {
    const all = await this.listAll(limit * 2);
    return all
      .filter((p) => p.orderId === 'unmatched' || p.orderId === '' || p.status === 'PARTIALLY_PAID_HOLD')
      .slice(0, limit);
  }
}
