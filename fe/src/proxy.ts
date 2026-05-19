import { NextRequest, NextResponse } from 'next/server';

const protectedRoutes = ['/', '/contacts', '/deals', '/activities', '/users'];
const authRoutes = ['/login', '/register'];

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const accessToken = request.cookies.get('accessToken')?.value;

  // Nếu đã login mà vào auth page
  if (authRoutes.includes(pathname) && accessToken) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Check protected route
  const isProtectedRoute = protectedRoutes.some(route => {
    if (route === '/') {
      return pathname === '/';
    }

    return pathname.startsWith(route);
  });

  // Chưa login mà vào protected route
  if (isProtectedRoute && !accessToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};