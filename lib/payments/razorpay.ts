import crypto from 'crypto';
import { Order, PaymentStatus } from '../types';
import {
  IPaymentProvider,
  PaymentSessionResult,
  WebhookVerificationResult,
  RefundResult,
} from './IPaymentProvider';

export class RazorpayPaymentAdapter implements IPaymentProvider {
  private keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_key';
  private keySecret = process.env.RAZORPAY_KEY_SECRET || process.env.YOUPI_WEBHOOK_SECRET || 'rzp_test_secret';

  async createPayment(order: Order): Promise<PaymentSessionResult> {
    const rzpOrderId = `order_${crypto.randomUUID().slice(0, 14).replace(/-/g, '')}`;
    const providerRef = `pay_${crypto.randomUUID().slice(0, 14).replace(/-/g, '')}`;

    return {
      sessionId: rzpOrderId,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.total,
      provider: 'razorpay',
      providerRef,
      paymentUrl: `https://checkout.razorpay.com/v1/checkout.js?order_id=${rzpOrderId}`,
      status: 'PENDING',
    };
  }

  async verifyWebhook(signature: string, rawBody: string): Promise<WebhookVerificationResult> {
    if (!signature || !rawBody) {
      return {
        isValid: false,
        orderId: '',
        providerRef: '',
        amount: 0,
        status: 'FAILED',
        rawPayload: {},
      };
    }

    try {
      const expectedSignature = crypto
        .createHmac('sha256', this.keySecret)
        .update(rawBody)
        .digest('hex');

      const sigBuffer = Buffer.from(signature, 'utf8');
      const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

      if (sigBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        return {
          isValid: false,
          orderId: '',
          providerRef: '',
          amount: 0,
          status: 'FAILED',
          rawPayload: {},
        };
      }

      const payload = JSON.parse(rawBody);
      const entity = payload.payload?.payment?.entity || payload;

      return {
        isValid: true,
        orderId: entity.notes?.orderId || payload.orderId || '',
        orderNo: entity.notes?.orderNo || payload.orderNo,
        providerRef: entity.id || payload.providerRef || `RZP-${Date.now()}`,
        amount: entity.amount ? Math.round(entity.amount / 100) : payload.amount || 0,
        status: 'PAID',
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
    return 'PAID';
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    return {
      refundId: `rfnd_${crypto.randomUUID().slice(0, 10)}`,
      paymentId,
      amount,
      status: 'PROCESSED',
    };
  }
}
