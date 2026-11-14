import { Order, OrderStatus, PaymentStatus } from '../../types';

export interface IOrderRepository {
  findById(id: string): Promise<Order | null>;
  findByOrderNo(orderNo: string): Promise<Order | null>;
  listByUser(userId: string, limit?: number): Promise<Order[]>;
  listByStatus(status: OrderStatus, limit?: number): Promise<Order[]>;
  listAll(limit?: number): Promise<Order[]>;
  createOrderWithLock(order: Order): Promise<Order>;
  updateStatus(id: string, orderStatus: OrderStatus, paymentStatus?: PaymentStatus): Promise<Order>;
  updateTracking(id: string, tracking: Order['tracking']): Promise<Order>;
  updateInvoiceKey(id: string, invoiceKey: string): Promise<Order>;
}
