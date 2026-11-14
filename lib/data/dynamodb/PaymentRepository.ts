import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { PaymentRecord, PaymentStatus } from '../../types';
import { IPaymentRepository } from '../interfaces/IPaymentRepository';

export class DynamoPaymentRepository implements IPaymentRepository {
  private tableName = getTableName('payments');

  async findById(id: string): Promise<PaymentRecord | null> {
    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return (res.Item as PaymentRecord) || null;
  }

  async findByOrderId(orderId: string): Promise<PaymentRecord[]> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'orderId-index',
        KeyConditionExpression: 'orderId = :oid',
        ExpressionAttributeValues: { ':oid': orderId },
      })
    );
    return (res.Items as PaymentRecord[]) || [];
  }

  async findByProviderRef(providerRef: string): Promise<PaymentRecord | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'providerRef-index',
        KeyConditionExpression: 'providerRef = :pref',
        ExpressionAttributeValues: { ':pref': providerRef },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as PaymentRecord) || null;
  }

  async recordPaymentEvent(payment: PaymentRecord): Promise<PaymentRecord> {
    await docClient.send(
      new PutCommand({
        TableName: this.tableName,
        Item: payment,
      })
    );
    return payment;
  }

  async updateStatus(id: string, status: PaymentStatus): Promise<PaymentRecord> {
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
    return res.Attributes as PaymentRecord;
  }
}
