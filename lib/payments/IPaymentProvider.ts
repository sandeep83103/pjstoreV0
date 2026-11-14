import { Order, PaymentStatus } from '../types';

export interface PaymentSessionResult {
  sessionId: string;
  orderId: string;
  orderNo: string;
  amount: number; // in whole INR
  provider: 'youpi' | 'razorpay' | 'cod';
  qrString?: string;
  paymentUrl?: string;
  providerRef?: string;
  expiresAt?: string;
  status: PaymentStatus;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  orderId: string;
  orderNo?: string;
  providerRef: string;
  amount: number;
  status: PaymentStatus;
  rawPayload: Record<string, unknown>;
}

export interface RefundResult {
  refundId: string;
  paymentId: string;
  amount: number;
  status: 'PENDING' | 'PROCESSED' | 'FAILED';
}

export interface IPaymentProvider {
  createPayment(order: Order): Promise<PaymentSessionResult>;
  verifyWebhook(signature: string, rawBody: string): Promise<WebhookVerificationResult>;
  getPaymentStatus(providerRef: string): Promise<PaymentStatus>;
  refund(paymentId: string, amount: number): Promise<RefundResult>;
}
