import {
  GetCommand,
  PutCommand,
  ScanCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Setting, AuditLog } from '../../types';
import { ISettingRepository, IAuditLogRepository } from '../interfaces/ISettingAndAuditRepository';

export class DynamoSettingRepository implements ISettingRepository {
  private tableName = getTableName('settings');
  private memoryFallback: Map<string, Setting> = new Map();

  async get<T>(key: string): Promise<T | null> {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { key },
        })
      );
      if (res.Item) return res.Item.value as T;
    } catch {
      // Offline fallback
    }
    const inMem = this.memoryFallback.get(key);
    return inMem ? (inMem.value as T) : null;
  }

  async set<T>(key: string, value: T): Promise<Setting> {
    const item: Setting = {
      key,
      value,
      updatedAt: new Date().toISOString(),
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
    this.memoryFallback.set(key, item);
    return item;
  }

  async listAll(): Promise<Record<string, unknown>> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
        })
      );
      const settings: Record<string, unknown> = {};
      for (const item of (res.Items as Setting[]) || []) {
        settings[item.key] = item.value;
      }
      if (Object.keys(settings).length > 0) return settings;
    } catch {
      // Offline fallback
    }
    const settings: Record<string, unknown> = {};
    for (const item of this.memoryFallback.values()) {
      settings[item.key] = item.value;
    }
    return settings;
  }
}

export class DynamoAuditLogRepository implements IAuditLogRepository {
  private tableName = getTableName('audit_logs');
  private memoryFallback: AuditLog[] = [];

  async record(log: AuditLog): Promise<void> {
    try {
      await docClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: log,
        })
      );
    } catch {
      // Offline fallback
    }
    this.memoryFallback.unshift(log);
  }

  async listByEntity(entityId: string, limit: number = 50): Promise<AuditLog[]> {
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'entityId-timestamp-index',
          KeyConditionExpression: 'entityId = :eid',
          ExpressionAttributeValues: { ':eid': entityId },
          ScanIndexForward: false,
          Limit: limit,
        })
      );
      if (res.Items && res.Items.length > 0) return res.Items as AuditLog[];
    } catch {
      // Offline fallback
    }
    return this.memoryFallback
      .filter((l) => l.entityId === entityId)
      .slice(0, limit);
  }

  async listRecent(limit: number = 100): Promise<AuditLog[]> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          Limit: limit,
        })
      );
      const logs = (res.Items as AuditLog[]) || [];
      if (logs.length > 0) {
        return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
      }
    } catch {
      // Offline fallback
    }
    return this.memoryFallback
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);
  }
}
