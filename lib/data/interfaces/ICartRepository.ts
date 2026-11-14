import { Cart } from '../../types';

export interface ICartRepository {
  getCart(id: string): Promise<Cart | null>;
  saveCart(cart: Cart): Promise<Cart>;
  clearCart(id: string): Promise<void>;
}
