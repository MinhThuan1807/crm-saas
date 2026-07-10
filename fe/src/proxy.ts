import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/dashboard', '/pipeline', '/contacts', '/deals', '/activities', '/users', '/roles', '/audit-logs', '/settings'];
const authRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value

  // If user already logged in and try access auth page
  if (authRoutes.includes(pathname) && accessToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Check protected route
  const isProtectedRoute = protectedRoutes.some(route => {
    return pathname === route || pathname.startsWith(route + '/');
  });

  // if user haven't logged in and try access protected page
  if (isProtectedRoute && !accessToken && !refreshToken){
      return NextResponse.redirect(new URL('/login', request.url));
    }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};