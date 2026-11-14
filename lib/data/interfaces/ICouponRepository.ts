import { Coupon } from '../../types';

export interface ICouponRepository {
  findByCode(code: string): Promise<Coupon | null>;
  listActive(): Promise<Coupon[]>;
  listAll(): Promise<Coupon[]>;
  create(coupon: Coupon): Promise<Coupon>;
  incrementUsageCountConditional(code: string): Promise<boolean>;
  update(code: string, updates: Partial<Coupon>): Promise<Coupon>;
  delete(code: string): Promise<void>;
}
