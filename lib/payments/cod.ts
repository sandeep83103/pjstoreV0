import crypto from 'crypto';
import { Order, PaymentStatus } from '../types';
import {
  IPaymentProvider,
  PaymentSessionResult,
  WebhookVerificationResult,
  RefundResult,
} from './IPaymentProvider';

export class CashOnDeliveryAdapter implements IPaymentProvider {
  async createPayment(order: Order): Promise<PaymentSessionResult> {
    if (order.total > 10000) {
      throw new Error('Cash on Delivery is limited to orders up to ₹10,000.');
    }

    const sessionId = `cod_sess_${crypto.randomUUID().slice(0, 10)}`;
    const providerRef = `COD-${order.orderNo}`;

    return {
      sessionId,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.total,
      provider: 'cod',
      providerRef,
      status: 'PENDING_COD',
    };
  }

  async verifyWebhook(_signature: string, rawBody: string): Promise<WebhookVerificationResult> {
    try {
      const payload = rawBody ? JSON.parse(rawBody) : {};
      return {
        isValid: true,
        orderId: payload.orderId || '',
        orderNo: payload.orderNo,
        providerRef: payload.providerRef || `COD-${Date.now()}`,
        amount: payload.amount || 0,
        status: 'PENDING_COD',
        rawPayload: payload,
      };
    } catch {
      return {
        isValid: false,
        orderId: '',
        providerRef: '',
        amount: 0,
        status: 'FAILED',
        rawPayload: {},
      };
    }
  }

  async getPaymentStatus(_providerRef: string): Promise<PaymentStatus> {
    return 'PENDING_COD';
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    return {
      refundId: `cod_ref_${crypto.randomUUID().slice(0, 8)}`,
      paymentId,
      amount,
      status: 'PROCESSED',
    };
  }
}
