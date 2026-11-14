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

  async get<T>(key: string): Promise<T | null> {
    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { key },
      })
    );
    return res.Item ? (res.Item.value as T) : null;
  }

  async set<T>(key: string, value: T): Promise<Setting> {
    const item: Setting = {
      key,
      value,
      updatedAt: new Date().toISOString(),
    };
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: item,
      })
    );
    return item;
  }

  async listAll(): Promise<Record<string, unknown>> {
    const res = await docClient.send(
      new ScanCommand({
        TableName: this.tableName,
      })
    );
    const settings: Record<string, unknown> = {};
    for (const item of (res.Items as Setting[]) || []) {
      settings[item.key] = item.value;
    }
    return settings;
  }
}

export class DynamoAuditLogRepository implements IAuditLogRepository {
  private tableName = getTableName('audit_logs');

  async record(log: AuditLog): Promise<void> {
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: log,
      })
    );
  }

  async listByEntity(entityId: string, limit: number = 50): Promise<AuditLog[]> {
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
    return (res.Items as AuditLog[]) || [];
  }

  async listRecent(limit: number = 100): Promise<AuditLog[]> {
    const res = await docClient.send(
      new ScanCommand({
        TableName: this.tableName,
        Limit: limit,
      })
    );
    const logs = (res.Items as AuditLog[]) || [];
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
}
