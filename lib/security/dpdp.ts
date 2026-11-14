import crypto from 'crypto';
import { userRepository, orderRepository, auditLogRepository } from '../data';
import { User } from '../types';

export interface DpdpErasureResult {
  success: boolean;
  userId?: string;
  phone?: string;
  redactedFields: string[];
  statutoryTaxRecordsRetained: number;
  auditLogId?: string;
  message: string;
}

export interface DpdpDataExport {
  user: Partial<User>;
  ordersCount: number;
  exportedAt: string;
  legalNotice: string;
}

/**
 * India Digital Personal Data Protection (DPDP) Act 2023 Compliance Engine
 * Handles customer personal data erasure requests while ensuring mandatory statutory
 * tax invoice compliance under Section 36 of the Indian CGST Act 2017.
 */
export async function processCustomerErasure(params: {
  phone?: string;
  userId?: string;
  requestedBy?: string;
  reason?: string;
}): Promise<DpdpErasureResult> {
  let targetUser: User | null = null;

  if (params.userId) {
    targetUser = await userRepository.findById(params.userId);
  } else if (params.phone) {
    targetUser = await userRepository.findByPhone(params.phone);
    if (!targetUser) {
      // Also try cleaning phone (e.g. without +91 or with +91)
      const clean = params.phone.replace(/\D/g, '');
      const last10 = clean.slice(-10);
      targetUser = await userRepository.findByPhone(last10);
      if (!targetUser) {
        targetUser = await userRepository.findByPhone(`+91${last10}`);
      }
    }
  }

  if (!targetUser) {
    return {
      success: false,
      redactedFields: [],
      statutoryTaxRecordsRetained: 0,
      message: 'No registered customer account found matching the provided identifier.',
    };
  }

  const userId = targetUser.id;
  const originalPhone = targetUser.phone;

  // Count existing orders for statutory tax notice
  let orderCount = 0;
  try {
    const orders = await orderRepository.listByUser(userId);
    orderCount = orders.length;
  } catch {
    // Non-blocking order query
  }

  // Scrub and redact all Personally Identifiable Information (PII)
  const redactedFields = ['name', 'phone', 'email', 'addresses', 'wishlist', 'passwordHash'];
  const anonymizedPhone = `REDACTED_${userId.slice(0, 8)}`;

  await userRepository.update(userId, {
    name: 'Customer [REDACTED DPDP]',
    phone: anonymizedPhone,
    email: undefined,
    passwordHash: undefined,
    addresses: [],
    wishlist: [],
    updatedAt: new Date().toISOString(),
  });

  // Record immutable regulatory audit trail in parnika_audit_logs
  const auditId = crypto.randomUUID();
  try {
    await auditLogRepository.record({
      id: auditId,
      entityType: 'user',
      entityId: userId,
      action: 'DPDP_DATA_ERASURE',
      actorEmail: params.requestedBy || 'dpdp-system@pjstore.com',
      staffEmail: params.requestedBy,
      timestamp: new Date().toISOString(),
      diff: {
        originalPhoneMasked: `******${originalPhone ? originalPhone.slice(-4) : 'XXXX'}`,
        reason: params.reason || 'Customer statutory erasure request under India DPDP Act 2023',
        redactedFields,
        statutoryOrdersPreserved: orderCount,
      },
    });
  } catch (err) {
    console.error('[DPDP] Failed to write audit log:', err);
  }

  return {
    success: true,
    userId,
    phone: anonymizedPhone,
    redactedFields,
    statutoryTaxRecordsRetained: orderCount,
    auditLogId: auditId,
    message: `Customer PII successfully scrubbed from active profile in compliance with India DPDP Act 2023. ${orderCount} order transaction(s) retained under Section 36 of CGST Act 2017 for statutory 6-year tax compliance.`,
  };
}

/**
 * DPDP Act Right to Access: Export structured customer data
 */
export async function exportCustomerData(userId: string): Promise<DpdpDataExport | null> {
  const user = await userRepository.findById(userId);
  if (!user) return null;

  let ordersCount = 0;
  try {
    const orders = await orderRepository.listByUser(userId);
    ordersCount = orders.length;
  } catch {
    // Non-blocking
  }

  const { passwordHash, ...safeUser } = user;

  return {
    user: safeUser,
    ordersCount,
    exportedAt: new Date().toISOString(),
    legalNotice:
      'This data export is provided in accordance with the Right to Access under India Digital Personal Data Protection Act 2023.',
  };
}
