import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { IOrderRepository } from '../interfaces/IOrderRepository';

export class DynamoOrderRepository implements IOrderRepository {
  private tableName = getTableName('orders');
  private productsTable = getTableName('products');
  private couponsTable = getTableName('coupons');

  async findById(id: string): Promise<Order | null> {
    const res = await docClient.send(
      new GetCommand({
        TableName: this.tableName,
        Key: { id },
      })
    );
    return (res.Item as Order) || null;
  }

  async findByOrderNo(orderNo: string): Promise<Order | null> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'orderNo-index',
        KeyConditionExpression: 'orderNo = :ono',
        ExpressionAttributeValues: { ':ono': orderNo },
        Limit: 1,
      })
    );
    return (res.Items?.[0] as Order) || null;
  }

  async listByUser(userId: string, limit: number = 20): Promise<Order[]> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'userId-createdAt-index',
        KeyConditionExpression: 'userId = :uid',
        ExpressionAttributeValues: { ':uid': userId },
        ScanIndexForward: false,
        Limit: limit,
      })
    );
    return (res.Items as Order[]) || [];
  }

  async listByStatus(status: OrderStatus, limit: number = 50): Promise<Order[]> {
    const res = await docClient.send(
      new QueryCommand({
        TableName: this.tableName,
        IndexName: 'orderStatus-createdAt-index',
        KeyConditionExpression: 'orderStatus = :st',
        ExpressionAttributeValues: { ':st': status },
        ScanIndexForward: false,
        Limit: limit,
      })
    );
    return (res.Items as Order[]) || [];
  }

  /**
   * Atomic Order Creation with Conditional Stock Deduction & Coupon lock
   */
  async createOrderWithLock(order: Order): Promise<Order> {
    const now = new Date().toISOString();
    const transactItems: Array<any> = [
      // 1. Put the new Order record
      {
        Put: {
          TableName: this.tableName,
          Item: order,
          ConditionExpression: 'attribute_not_exists(id)',
        },
      },
    ];

    // 2. Conditional Stock Deduction for each item
    for (const item of order.items) {
      transactItems.push({
        Update: {
          TableName: this.productsTable,
          Key: { id: item.productId },
          UpdateExpression: 'SET stock = stock - :qty, updatedAt = :now',
          ConditionExpression: 'stock >= :qty AND #status = :activeStatus',
          ExpressionAttributeNames: {
            '#status': 'status',
          },
          ExpressionAttributeValues: {
            ':qty': item.quantity,
            ':activeStatus': 'ACTIVE',
            ':now': now,
          },
        },
      });
    }

    // 3. Conditional Coupon Usage Increment if applied
    if (order.couponCode) {
      transactItems.push({
        Update: {
          TableName: this.couponsTable,
          Key: { code: order.couponCode.toUpperCase() },
          UpdateExpression: 'SET usedCount = usedCount + :inc',
          ConditionExpression: 'usedCount < usageLimit AND active = :true',
          ExpressionAttributeValues: {
            ':inc': 1,
            ':true': true,
          },
        },
      });
    }

    await docClient.send(
      new TransactWriteCommand({
        TransactItems: transactItems,
      })
    );

    return order;
  }

  async updateStatus(id: string, orderStatus: OrderStatus, paymentStatus?: PaymentStatus): Promise<Order> {
    const now = new Date().toISOString();
    let updateExp = 'SET orderStatus = :os, updatedAt = :now';
    const expValues: Record<string, unknown> = {
      ':os': orderStatus,
      ':now': now,
    };

    if (paymentStatus) {
      updateExp += ', paymentStatus = :ps';
      expValues[':ps'] = paymentStatus;
    }

    const res = await docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: updateExp,
        ExpressionAttributeValues: expValues,
        ReturnValues: 'ALL_NEW',
      })
    );

    return res.Attributes as Order;
  }

  async updateTracking(id: string, tracking: Order['tracking']): Promise<Order> {
    const res = await docClient.send(
      new UpdateCommand({
        TableName: this.tableName,
        Key: { id },
        UpdateExpression: 'SET tracking = :tr, updatedAt = :now',
        ExpressionAttributeValues: {
          ':tr': tracking,
          ':now': new Date().toISOString(),
        },
        ReturnValues: 'ALL_NEW',
      })
    );
    return res.Attributes as Order;
  }
}
