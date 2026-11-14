import { z } from 'zod';

// ==========================================
// 1. PRODUCT & VARIANT
// ==========================================
export const ProductVariantSchema = z.object({
  id: z.string(),
  name: z.string(), // e.g. "Size 2.4", "Matte Finish"
  sku: z.string(),
  priceModifier: z.number().int().default(0),
  stock: z.number().int().min(0),
});

export const ProductSchema = z.object({
  id: z.string().uuid(),
  sku: z.string().min(3).max(32),
  supplierCode: z.string().min(2).max(64), // e.g. "DBI-102"
  name: z.string().min(3).max(180),
  slug: z.string().min(3).max(180),
  categoryId: z.string().min(1),
  tags: z.array(z.string()).default([]),
  description: z.string().min(10),
  specs: z.record(z.string(), z.string()).default({}),
  price: z.number().int().positive(),     // Integer whole INR
  mrp: z.number().int().positive(),
  costPrice: z.number().int().positive(), // Admin only
  stock: z.number().int().min(0),
  lowStockAt: z.number().int().default(5),
  images: z.array(z.string()).min(1),     // S3 keys
  variants: z.array(ProductVariantSchema).default([]),
  status: z.enum(['DRAFT', 'ACTIVE', 'ARCHIVED']).default('ACTIVE'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Product = z.infer<typeof ProductSchema>;
export type ProductSummary = Omit<Product, 'costPrice'>;
export type ProductVariant = z.infer<typeof ProductVariantSchema>;

// ==========================================
// 2. CATEGORY
// ==========================================
export const CategorySchema = z.object({
  id: z.string(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100),
  parentId: z.string().nullable().default(null),
  imageKey: z.string().optional(),
  sortOrder: z.number().int().default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type Category = z.infer<typeof CategorySchema>;

// ==========================================
// 3. USER & ADDRESS
// ==========================================
export const AddressSchema = z.object({
  id: z.string().uuid(),
  fullName: z.string().min(2),
  phone: z.string().min(10),
  street: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6),
  isDefault: z.boolean().default(false),
});

export const UserSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().min(10),
  passwordHash: z.string().optional(),
  role: z.enum(['customer', 'admin', 'staff']).default('customer'),
  addresses: z.array(AddressSchema).default([]),
  wishlist: z.array(z.string()).default([]), // Array of product IDs
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Address = z.infer<typeof AddressSchema>;
export type User = z.infer<typeof UserSchema>;

// ==========================================
// 4. CART & LINE ITEM
// ==========================================
export const CartItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().optional(),
  quantity: z.number().int().positive(),
  addedPrice: z.number().int().positive(),
});

export const CartSchema = z.object({
  id: z.string(), // userId or guest sessionId
  items: z.array(CartItemSchema).default([]),
  couponCode: z.string().optional(),
  updatedAt: z.string().datetime(),
});

export type CartItem = z.infer<typeof CartItemSchema>;
export type Cart = z.infer<typeof CartSchema>;

// ==========================================
// 5. ORDER & ORDER ITEM
// ==========================================
export const OrderItemSnapshotSchema = z.object({
  productId: z.string().uuid(),
  sku: z.string(),
  name: z.string(),
  price: z.number().int().positive(),
  quantity: z.number().int().positive(),
  imageKey: z.string(),
  variantName: z.string().optional(),
});

export const OrderTrackingSchema = z.object({
  courier: z.string().optional(),
  trackingNumber: z.string().optional(),
  trackingUrl: z.string().url().optional(),
  shippedAt: z.string().datetime().optional(),
  deliveredAt: z.string().datetime().optional(),
});

export const OrderStatusEnum = z.enum([
  'PENDING_PAYMENT',
  'PLACED',
  'PAID',
  'PACKED',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export const PaymentStatusEnum = z.enum([
  'PENDING',
  'PENDING_COD',
  'PAID',
  'FAILED',
  'REFUNDED',
  'PARTIALLY_PAID_HOLD',
]);

export const OrderSchema = z.object({
  id: z.string().uuid(),
  orderNo: z.string(), // e.g. PJ-2026-0001
  userId: z.string(),
  items: z.array(OrderItemSnapshotSchema).min(1),
  shippingAddress: AddressSchema,
  subtotal: z.number().int().min(0),
  discount: z.number().int().min(0).default(0),
  shippingFee: z.number().int().min(0).default(0),
  tax: z.number().int().min(0).default(0),
  total: z.number().int().positive(),
  couponCode: z.string().optional(),
  paymentMethod: z.enum(['youpi', 'razorpay', 'cod']),
  paymentStatus: PaymentStatusEnum,
  orderStatus: OrderStatusEnum,
  tracking: OrderTrackingSchema.optional(),
  invoiceKey: z.string().optional(), // S3 key
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Order = z.infer<typeof OrderSchema>;
export type OrderItemSnapshot = z.infer<typeof OrderItemSnapshotSchema>;
export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;

// ==========================================
// 6. PAYMENT RECORD
// ==========================================
export const PaymentRecordSchema = z.object({
  id: z.string().uuid(),
  orderId: z.string().uuid(),
  provider: z.string(), // 'youpi' | 'razorpay' | 'cod'
  providerRef: z.string(),
  amount: z.number().int().positive(),
  status: PaymentStatusEnum,
  rawWebhook: z.record(z.string(), z.unknown()).optional(),
  verifiedAt: z.string().datetime(),
  createdAt: z.string().datetime(),
});

export type PaymentRecord = z.infer<typeof PaymentRecordSchema>;

// ==========================================
// 7. COUPON
// ==========================================
export const CouponSchema = z.object({
  code: z.string().min(3).max(30).toUpperCase(),
  type: z.enum(['PERCENTAGE', 'FLAT']),
  value: z.number().int().positive(),
  minCart: z.number().int().default(0),
  maxDiscount: z.number().int().optional(),
  usageLimit: z.number().int().default(100),
  perUserLimit: z.number().int().default(1),
  usedCount: z.number().int().default(0),
  validFrom: z.string().datetime(),
  validTo: z.string().datetime(),
  scope: z.enum(['ALL', 'CATEGORY', 'PRODUCT']).default('ALL'),
  active: z.boolean().default(true),
});

export type Coupon = z.infer<typeof CouponSchema>;

// ==========================================
// 8. SETTING & AUDIT LOG
// ==========================================
export const SettingSchema = z.object({
  key: z.string(),
  value: z.unknown(),
  updatedAt: z.string().datetime(),
});

export type Setting = z.infer<typeof SettingSchema>;

export const AuditLogSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(), // 'product' | 'order' | 'coupon' | 'setting'
  entityId: z.string(),
  action: z.string(),     // 'CREATE' | 'UPDATE' | 'DELETE' | 'STATUS_CHANGE'
  diff: z.record(z.string(), z.unknown()).optional(),
  actorEmail: z.string(),
  timestamp: z.string().datetime(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;
