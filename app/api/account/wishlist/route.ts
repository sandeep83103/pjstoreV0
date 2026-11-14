import { NextRequest, NextResponse } from 'next/server';
import { userRepository, productRepository } from '@/lib/data';
import { getCustomerFromRequest, getCurrentCustomer } from '@/lib/auth/session';
import { handleApiError, UnauthorizedError, ValidationError, NotFoundError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const customer = (await getCustomerFromRequest(req)) || (await getCurrentCustomer());
    if (!customer) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const user = await userRepository.findById(customer.userId);
    if (!user) {
      return NextResponse.json({
        success: true,
        data: [],
      });
    }

    const wishlistIds = user.wishlist || [];
    const products = await Promise.all(
      wishlistIds.map((id) => productRepository.findById(id))
    );

    // Filter out nulls/deleted products
    const validProducts = products.filter((p): p is NonNullable<typeof p> => p !== null);

    return NextResponse.json({
      success: true,
      data: validProducts,
      wishlistIds,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(req: NextRequest) {
  try {
    const customer = (await getCustomerFromRequest(req)) || (await getCurrentCustomer());
    if (!customer) {
      throw new UnauthorizedError('Please log in to add items to your wishlist.');
    }

    const body = await req.json();
    const productId = body.productId;
    if (!productId) {
      throw new ValidationError('Product ID is required');
    }

    const product = await productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Product', productId);
    }

    const user = await userRepository.findById(customer.userId);
    if (!user) {
      throw new NotFoundError('User', customer.userId);
    }

    const currentWishlist = new Set(user.wishlist || []);
    let action: 'added' | 'removed' = 'added';

    if (currentWishlist.has(productId)) {
      currentWishlist.delete(productId);
      action = 'removed';
    } else {
      currentWishlist.add(productId);
      action = 'added';
    }

    const updatedList = Array.from(currentWishlist);
    await userRepository.update(user.id, { wishlist: updatedList });

    return NextResponse.json({
      success: true,
      action,
      productId,
      wishlist: updatedList,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const customer = (await getCustomerFromRequest(req)) || (await getCurrentCustomer());
    if (!customer) {
      throw new UnauthorizedError('Please log in to manage your wishlist.');
    }

    const url = new URL(req.url);
    const productId = url.searchParams.get('productId');
    if (!productId) {
      throw new ValidationError('Product ID query parameter is required');
    }

    const user = await userRepository.findById(customer.userId);
    if (!user) {
      throw new NotFoundError('User', customer.userId);
    }

    const updatedList = (user.wishlist || []).filter((id) => id !== productId);
    await userRepository.update(user.id, { wishlist: updatedList });

    return NextResponse.json({
      success: true,
      message: 'Item removed from wishlist',
      wishlist: updatedList,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
