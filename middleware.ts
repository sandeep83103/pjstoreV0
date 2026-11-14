import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, COOKIE_NAMES } from './lib/auth/jwt';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect Admin Routes (/admin/* and /api/admin/*)
  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isAdminApi = pathname.startsWith('/api/admin') && !pathname.startsWith('/api/admin/auth/login');

  if (isAdminPage || isAdminApi) {
    const adminToken = request.cookies.get(COOKIE_NAMES.ADMIN)?.value;
    const customerToken = request.cookies.get(COOKIE_NAMES.CUSTOMER)?.value;

    // Check if customer is attempting to access admin route
    if (!adminToken && customerToken) {
      const customerPayload = await verifyToken(customerToken);
      if (customerPayload && customerPayload.role === 'customer') {
        if (isAdminApi) {
          return NextResponse.json(
            { success: false, error: { code: 'FORBIDDEN', message: 'Access denied: Customer account cannot access administrative endpoints.' } },
            { status: 403 }
          );
        }
        // For customer browsing to /admin, return 403 Forbidden page or message
        return new NextResponse('Access Denied: Customer accounts are not permitted in the Admin Portal.', {
          status: 403,
          headers: { 'Content-Type': 'text/plain' },
        });
      }
    }

    // No admin token present
    if (!adminToken) {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Administrative authentication required.' } },
          { status: 401 }
        );
      }
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Verify admin token
    const payload = await verifyToken(adminToken);
    if (!payload || (payload.role !== 'admin' && payload.role !== 'staff')) {
      if (isAdminApi) {
        return NextResponse.json(
          { success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid or expired administrative session.' } },
          { status: 401 }
        );
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
