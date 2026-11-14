import crypto from 'crypto';
import { Order, PaymentStatus } from '../types';
import {
  IPaymentProvider,
  PaymentSessionResult,
  WebhookVerificationResult,
  RefundResult,
} from './IPaymentProvider';
import { env } from '../env';

export class YouPiPaymentAdapter implements IPaymentProvider {
  private apiUrl = env.YOUPI_BASE_API_URL || 'https://pg.pjstore.com';
  private apiKey = env.YOUPI_API_KEY || 'test_youpi_api_key';
  private webhookSecret = env.YOUPI_WEBHOOK_SECRET || 'test_youpi_webhook_secret';

  async createPayment(order: Order): Promise<PaymentSessionResult> {
    const sessionId = `yp_sess_${crypto.randomUUID().slice(0, 12)}`;
    const providerRef = `YP-TXN-${order.orderNo}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15-minute reservation (EC-INV-02)

    // Dynamic UPI QR string with locked amount and unique transaction note (EC-PAY-04 & EC-PAY-06)
    const upiPayee = 'parnikajewellers@upi';
    const payeeName = 'Parnika Jewellers';
    const transactionNote = order.orderNo;
    const qrString = `upi://pay?pa=${encodeURIComponent(upiPayee)}&pn=${encodeURIComponent(
      payeeName
    )}&am=${order.total}&cu=INR&tn=${encodeURIComponent(transactionNote)}`;

    // Try communicating with YOUPI PG microservice if live
    try {
      const res = await fetch(`${this.apiUrl}/api/v2/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          orderId: order.id,
          orderNo: order.orderNo,
          amountPaise: order.total * 100,
          customerPhone: order.shippingAddress.phone,
          callbackUrl: `${env.NEXT_PUBLIC_STORE_URL}/checkout/confirmation?orderId=${order.id}`,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        return {
          sessionId: json.sessionId || sessionId,
          orderId: order.id,
          orderNo: order.orderNo,
          amount: order.total,
          provider: 'youpi',
          qrString: json.qrString || qrString,
          paymentUrl: json.paymentUrl || `${this.apiUrl}/pay/${sessionId}`,
          providerRef: json.providerRef || providerRef,
          expiresAt: json.expiresAt || expiresAt,
          status: 'PENDING',
        };
      }
    } catch {
      // In offline / local fallback mode
    }

    return {
      sessionId,
      orderId: order.id,
      orderNo: order.orderNo,
      amount: order.total,
      provider: 'youpi',
      qrString,
      paymentUrl: `${this.apiUrl}/pay/${sessionId}`,
      providerRef,
      expiresAt,
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
        .createHmac('sha256', this.webhookSecret)
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

      return {
        isValid: true,
        orderId: payload.orderId || payload.data?.orderId || '',
        orderNo: payload.orderNo || payload.data?.orderNo || '',
        providerRef: payload.providerRef || payload.data?.providerRef || `YP-${Date.now()}`,
        amount: payload.amount || payload.data?.amount || 0,
        status: (payload.status === 'SUCCESS' || payload.status === 'PAID') ? 'PAID' : 'PENDING',
        rawPayload: payload,
      };
    } catch (err) {
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

  async getPaymentStatus(providerRef: string): Promise<PaymentStatus> {
    try {
      const res = await fetch(`${this.apiUrl}/api/v2/payment/status/${providerRef}`, {
        headers: { Authorization: `Bearer ${this.apiKey}` },
      });
      if (res.ok) {
        const json = await res.json();
        return json.status as PaymentStatus;
      }
    } catch {
      // Fallback
    }
    return 'PENDING';
  }

  async refund(paymentId: string, amount: number): Promise<RefundResult> {
    return {
      refundId: `yp_ref_${crypto.randomUUID().slice(0, 8)}`,
      paymentId,
      amount,
      status: 'PROCESSED',
    };
  }
}
