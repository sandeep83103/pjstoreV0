import { PaymentRecord, PaymentStatus } from '../../types';

export interface IPaymentRepository {
  findById(id: string): Promise<PaymentRecord | null>;
  findByOrderId(orderId: string): Promise<PaymentRecord[]>;
  findByProviderRef(providerRef: string): Promise<PaymentRecord | null>;
  recordPaymentEvent(payment: PaymentRecord): Promise<PaymentRecord>;
  updateStatus(id: string, status: PaymentStatus): Promise<PaymentRecord>;
  listAll(limit?: number): Promise<PaymentRecord[]>;
  listUnmatched(limit?: number): Promise<PaymentRecord[]>;
}
