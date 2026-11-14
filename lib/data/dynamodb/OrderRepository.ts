import {
  GetCommand,
  PutCommand,
  UpdateCommand,
  QueryCommand,
  ScanCommand,
  TransactWriteCommand,
} from '@aws-sdk/lib-dynamodb';
import {
  ConditionalCheckFailedException,
  TransactionCanceledException,
} from '@aws-sdk/client-dynamodb';
import { docClient, getTableName } from '../../aws/dynamoClient';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import { IOrderRepository } from '../interfaces/IOrderRepository';
import { OutOfStockError, AppError } from '../../errors';

export class DynamoOrderRepository implements IOrderRepository {
  private tableName = getTableName('orders');
  private productsTable = getTableName('products');
  private couponsTable = getTableName('coupons');
  private memoryFallback: Map<string, Order> = new Map();

  async findById(id: string): Promise<Order | null> {
    try {
      const res = await docClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );
      if (res.Item) {
        return res.Item as Order;
      }
    } catch {
      // In offline / local fallback
    }
    return this.memoryFallback.get(id) || null;
  }

  async findByOrderNo(orderNo: string): Promise<Order | null> {
    try {
      const res = await docClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'orderNo-index',
          KeyConditionExpression: 'orderNo = :ono',
          ExpressionAttributeValues: { ':ono': orderNo },
          Limit: 1,
        })
      );
      if (res.Items?.[0]) {
        return res.Items[0] as Order;
      }
    } catch {
      // In offline / local fallback
    }

    for (const order of this.memoryFallback.values()) {
      if (order.orderNo === orderNo) {
        return order;
      }
    }
    return null;
  }

  async listByUser(userId: string, limit: number = 20): Promise<Order[]> {
    try {
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
      if (res.Items && res.Items.length > 0) {
        return res.Items as Order[];
      }
    } catch {
      // In offline / local fallback
    }

    const userOrders: Order[] = [];
    for (const order of this.memoryFallback.values()) {
      if (order.userId === userId) {
        userOrders.push(order);
      }
    }
    return userOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async listByStatus(status: OrderStatus, limit: number = 50): Promise<Order[]> {
    try {
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
      if (res.Items && res.Items.length > 0) {
        return res.Items as Order[];
      }
    } catch {
      // In offline / local fallback
    }

    const statusOrders: Order[] = [];
    for (const order of this.memoryFallback.values()) {
      if (order.orderStatus === status) {
        statusOrders.push(order);
      }
    }
    return statusOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  /**
   * Atomic Order Creation with Conditional Stock Deduction & Coupon Lock
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

    try {
      await docClient.send(
        new TransactWriteCommand({
          TransactItems: transactItems,
        })
      );
      this.memoryFallback.set(order.id, order);
      return order;
    } catch (error: any) {
      if (
        error?.name === 'TransactionCanceledException' ||
        error instanceof TransactionCanceledException ||
        error instanceof ConditionalCheckFailedException
      ) {
        const reasons = error.CancellationReasons || [];
        // reasons[0] is order check
        // reasons[1..order.items.length] are product stock checks
        const stockFailedIndex = reasons
          .slice(1, 1 + order.items.length)
          .findIndex((r: any) => r?.Code === 'ConditionalCheckFailed');
        if (stockFailedIndex > -1) {
          const failedItem = order.items[stockFailedIndex];
          throw new OutOfStockError(
            failedItem?.name || 'One or more items in your cart just sold out'
          );
        }
        if (
          order.couponCode &&
          reasons[1 + order.items.length]?.Code === 'ConditionalCheckFailed'
        ) {
          throw new AppError('COUPON_LIMIT_REACHED', 'Coupon limit reached.', 400);
        }
        throw new OutOfStockError('One or more items in your cart just sold out');
      }

      // Offline / Local Development Fallback
      // Enforce the exact same conditional invariants
      const { productRepository, couponRepository } = await import('../index');

      // 1. Verify all products have sufficient stock and are active
      for (const item of order.items) {
        const prod = await productRepository.findById(item.productId);
        if (!prod || prod.status !== 'ACTIVE' || prod.stock < item.quantity) {
          throw new OutOfStockError(
            prod?.name || 'One or more items in your cart just sold out'
          );
        }
      }

      // 2. Verify coupon usage limit
      if (order.couponCode) {
        const coupon = await couponRepository.findByCode(order.couponCode);
        if (!coupon || !coupon.active || coupon.usedCount >= coupon.usageLimit) {
          throw new AppError('COUPON_LIMIT_REACHED', 'Coupon limit reached.', 400);
        }
      }

      // 3. Atomically decrement stock
      for (const item of order.items) {
        const success = await productRepository.decrementStockConditional(
          item.productId,
          item.quantity
        );
        if (!success) {
          throw new OutOfStockError(
            item.name || 'One or more items in your cart just sold out'
          );
        }
      }

      // 4. Atomically increment coupon usage
      if (order.couponCode) {
        const success = await couponRepository.incrementUsageCountConditional(
          order.couponCode
        );
        if (!success) {
          throw new AppError('COUPON_LIMIT_REACHED', 'Coupon limit reached.', 400);
        }
      }

      // 5. Store order
      this.memoryFallback.set(order.id, order);
      return order;
    }
  }

  async updateStatus(
    id: string,
    orderStatus: OrderStatus,
    paymentStatus?: PaymentStatus
  ): Promise<Order> {
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

    try {
      const res = await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: updateExp,
          ExpressionAttributeValues: expValues,
          ReturnValues: 'ALL_NEW',
        })
      );
      if (res.Attributes) {
        const updated = res.Attributes as Order;
        this.memoryFallback.set(id, updated);
        return updated;
      }
    } catch {
      // In offline / local fallback
    }

    const existing = this.memoryFallback.get(id);
    if (!existing) {
      throw new Error(`Order '${id}' not found`);
    }
    const updated: Order = {
      ...existing,
      orderStatus,
      ...(paymentStatus ? { paymentStatus } : {}),
      updatedAt: now,
    };
    this.memoryFallback.set(id, updated);
    return updated;
  }

  async updateTracking(id: string, tracking: Order['tracking']): Promise<Order> {
    const now = new Date().toISOString();
    try {
      const res = await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: 'SET tracking = :tr, updatedAt = :now',
          ExpressionAttributeValues: {
            ':tr': tracking,
            ':now': now,
          },
          ReturnValues: 'ALL_NEW',
        })
      );
      if (res.Attributes) {
        const updated = res.Attributes as Order;
        this.memoryFallback.set(id, updated);
        return updated;
      }
    } catch {
      // In offline / local fallback
    }

    const existing = this.memoryFallback.get(id);
    if (!existing) {
      throw new Error(`Order '${id}' not found`);
    }
    const updated: Order = {
      ...existing,
      tracking,
      updatedAt: now,
    };
    this.memoryFallback.set(id, updated);
    return updated;
  }

  async listAll(limit: number = 50): Promise<Order[]> {
    try {
      const res = await docClient.send(
        new ScanCommand({
          TableName: this.tableName,
          Limit: limit,
        })
      );
      if (res.Items && res.Items.length > 0) {
        return (res.Items as Order[]).sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      }
    } catch {
      // In offline / local fallback
    }

    const allOrders = Array.from(this.memoryFallback.values());
    return allOrders
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async updateInvoiceKey(id: string, invoiceKey: string): Promise<Order> {
    const now = new Date().toISOString();
    try {
      const res = await docClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: 'SET invoiceKey = :ik, updatedAt = :now',
          ExpressionAttributeValues: {
            ':ik': invoiceKey,
            ':now': now,
          },
          ReturnValues: 'ALL_NEW',
        })
      );
      if (res.Attributes) {
        const updated = res.Attributes as Order;
        this.memoryFallback.set(id, updated);
        return updated;
      }
    } catch {
      // In offline / local fallback
    }

    const existing = this.memoryFallback.get(id);
    if (!existing) {
      throw new Error(`Order '${id}' not found`);
    }
    const updated: Order = {
      ...existing,
      invoiceKey,
      updatedAt: now,
    };
    this.memoryFallback.set(id, updated);
    return updated;
  }
}
