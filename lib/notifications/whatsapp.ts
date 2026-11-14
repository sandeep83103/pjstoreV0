import { Order } from '../types';
import { env } from '../env';

/**
 * Standardize Indian phone numbers to international E.164 without '+' or spaces (e.g. '919876543210').
 */
export function cleanIndianPhone(phone: string): string {
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) {
    return `91${digits}`;
  }
  if (digits.startsWith('0') && digits.length === 11) {
    return `91${digits.slice(1)}`;
  }
  return digits;
}

/**
 * Automatically resolve courier live tracking URL based on known Indian courier services.
 */
export function resolveCourierTrackingUrl(
  courier?: string,
  trackingNumber?: string,
  customUrl?: string
): string {
  if (customUrl && customUrl.trim()) {
    return customUrl.trim();
  }
  if (!trackingNumber || !trackingNumber.trim()) {
    return `${env.NEXT_PUBLIC_STORE_URL}/account/orders`;
  }

  const cleanNum = trackingNumber.trim();
  const c = (courier || '').toLowerCase();

  if (c.includes('delhivery')) {
    return `https://www.delhivery.com/track/package/${cleanNum}`;
  }
  if (c.includes('shiprocket')) {
    return `https://shiprocket.co/tracking/${cleanNum}`;
  }
  if (c.includes('blue') || c.includes('bluedart')) {
    return `https://www.bluedart.com/tracking?trackFor=0&trackNo=${cleanNum}`;
  }
  if (c.includes('post') || c.includes('speed')) {
    return `https://www.indiapost.gov.in/_layouts/15/dpt.cept.tracking/trackconsignment.aspx`;
  }
  if (c.includes('dtdc')) {
    return `https://www.dtdc.in/tracking/tracking_results.asp?trkid=${cleanNum}`;
  }

  return `https://www.google.com/search?q=track+${encodeURIComponent(cleanNum)}`;
}

/**
 * Generate 1-Click WhatsApp web link for the store owner to notify the customer about order confirmation.
 */
export function generateOrderWhatsAppShareUrl(order: Order): string {
  const cleanPhone = cleanIndianPhone(order.shippingAddress.phone);
  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);

  const message = [
    `✨ *Parnika Jewellers — Order Confirmed!* ✨`,
    ``,
    `Namaste *${order.shippingAddress.fullName}*,`,
    `Thank you for shopping with us! Your order *#${order.orderNo}* has been confirmed.`,
    ``,
    `*Order Summary:*`,
    `• Items: ${totalItems} piece(s)`,
    `• Total Amount: ₹${order.total.toLocaleString('en-IN')}`,
    `• Payment: ${order.paymentMethod.toUpperCase()} (${order.paymentStatus})`,
    ``,
    `We are preparing your handcrafted jewellery with utmost care. You will receive tracking details once dispatched!`,
    ``,
    `View order online: ${env.NEXT_PUBLIC_STORE_URL}/account/orders/${order.orderNo}`,
    ``,
    `_Parnika Jewellers — Fashion & 1-Gram Gold Certified_`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generate 1-Click WhatsApp web link for shipping dispatch update with live tracking link.
 */
export function generateShippingWhatsAppShareUrl(order: Order): string {
  const cleanPhone = cleanIndianPhone(order.shippingAddress.phone);
  const tracking = order.tracking || {};
  const courier = tracking.courier || 'Express Insured Delivery';
  const trackingNumber = tracking.trackingNumber || 'Available shortly';
  const trackingUrl = resolveCourierTrackingUrl(courier, trackingNumber, tracking.trackingUrl);

  const message = [
    `📦 *Parnika Jewellers — Your Order Has Shipped!* 🚚`,
    ``,
    `Namaste *${order.shippingAddress.fullName}*,`,
    `Great news! Your jewellery order *#${order.orderNo}* has been dispatched.`,
    ``,
    `*Tracking Details:*`,
    `• Courier: ${courier}`,
    `• Tracking / AWB No: ${trackingNumber}`,
    `• Live Tracking: ${trackingUrl}`,
    ``,
    `*Delivery Address:*`,
    `${order.shippingAddress.fullName}`,
    `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`,
    ``,
    `Thank you for choosing Parnika Jewellers. Feel free to reply to this message if you have any questions!`,
    ``,
    `_Parnika Jewellers — Fashion & 1-Gram Gold Certified_`,
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}

/**
 * Dispatch automated WhatsApp message via Meta Cloud API or return 1-click fallback link.
 */
export async function sendOrderConfirmationWhatsApp(order: Order): Promise<{
  success: boolean;
  messageId?: string;
  shareUrl: string;
}> {
  const shareUrl = generateOrderWhatsAppShareUrl(order);
  const cleanPhone = cleanIndianPhone(order.shippingAddress.phone);

  // If WhatsApp Cloud API credentials are provided, invoke Cloud API
  if (env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: {
              body: `Namaste ${order.shippingAddress.fullName}! Your Parnika Jewellers order #${order.orderNo} is confirmed. Total: ₹${order.total}.`,
            },
          }),
        }
      );
      const data = await res.json();
      return {
        success: res.ok,
        messageId: data?.messages?.[0]?.id || `wa-mock-${Date.now()}`,
        shareUrl,
      };
    } catch (err) {
      console.error('WhatsApp Cloud API dispatch error:', err);
    }
  }

  // Graceful fallback for local/test mode and 1-click merchant action
  console.log(`💬 [WhatsApp Dispatch] Order confirmation prepared for ${cleanPhone}. Fallback share link generated.`);
  return {
    success: true,
    messageId: `wa-link-${Date.now()}`,
    shareUrl,
  };
}

/**
 * Dispatch automated WhatsApp shipping update or return 1-click fallback link.
 */
export async function sendShippingUpdateWhatsApp(order: Order): Promise<{
  success: boolean;
  messageId?: string;
  shareUrl: string;
}> {
  const shareUrl = generateShippingWhatsAppShareUrl(order);
  const cleanPhone = cleanIndianPhone(order.shippingAddress.phone);

  if (env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/v18.0/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: cleanPhone,
            type: 'text',
            text: {
              body: `Namaste ${order.shippingAddress.fullName}! Your order #${order.orderNo} has shipped via ${order.tracking?.courier || 'courier'}. Tracking: ${order.tracking?.trackingNumber}.`,
            },
          }),
        }
      );
      const data = await res.json();
      return {
        success: res.ok,
        messageId: data?.messages?.[0]?.id || `wa-ship-${Date.now()}`,
        shareUrl,
      };
    } catch (err) {
      console.error('WhatsApp Cloud API shipping dispatch error:', err);
    }
  }

  console.log(`💬 [WhatsApp Dispatch] Shipping update prepared for ${cleanPhone}. Fallback share link generated.`);
  return {
    success: true,
    messageId: `wa-ship-link-${Date.now()}`,
    shareUrl,
  };
}
