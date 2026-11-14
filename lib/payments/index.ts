import { IPaymentProvider } from './IPaymentProvider';
import { YouPiPaymentAdapter } from './youpi';
import { RazorpayPaymentAdapter } from './razorpay';
import { CashOnDeliveryAdapter } from './cod';
import { env } from '../env';

export * from './IPaymentProvider';
export * from './youpi';
export * from './razorpay';
export * from './cod';

export function getPaymentProvider(providerName?: string): IPaymentProvider {
  const selected = (providerName || process.env.PAYMENT_PROVIDER || env.PAYMENT_PROVIDER || 'youpi').toLowerCase();

  switch (selected) {
    case 'razorpay':
      return new RazorpayPaymentAdapter();
    case 'cod':
      return new CashOnDeliveryAdapter();
    case 'youpi':
    default:
      return new YouPiPaymentAdapter();
  }
}
