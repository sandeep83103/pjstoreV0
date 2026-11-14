import { DynamoProductRepository } from './dynamodb/ProductRepository';
import { DynamoCategoryRepository } from './dynamodb/CategoryRepository';
import { DynamoOrderRepository } from './dynamodb/OrderRepository';
import { DynamoUserRepository } from './dynamodb/UserRepository';
import { DynamoCouponRepository } from './dynamodb/CouponRepository';
import { DynamoPaymentRepository } from './dynamodb/PaymentRepository';
import { DynamoSettingRepository, DynamoAuditLogRepository } from './dynamodb/SettingAndAuditRepository';
import { DynamoCartRepository } from './dynamodb/CartRepository';

// Export Repository Singletons
export const productRepository = new DynamoProductRepository();
export const categoryRepository = new DynamoCategoryRepository();
export const orderRepository = new DynamoOrderRepository();
export const userRepository = new DynamoUserRepository();
export const couponRepository = new DynamoCouponRepository();
export const paymentRepository = new DynamoPaymentRepository();
export const settingRepository = new DynamoSettingRepository();
export const auditLogRepository = new DynamoAuditLogRepository();
export const cartRepository = new DynamoCartRepository();

// Export Interfaces
export * from './interfaces/IProductRepository';
export * from './interfaces/ICategoryRepository';
export * from './interfaces/IOrderRepository';
export * from './interfaces/IUserRepository';
export * from './interfaces/ICouponRepository';
export * from './interfaces/IPaymentRepository';
export * from './interfaces/ISettingAndAuditRepository';
export * from './interfaces/ICartRepository';
