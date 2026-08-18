import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const AUTH_COOKIE_NAME = 'kapel_session';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  
  // Validação leve de formato JWT no Edge Runtime (3 partes base64)
  const isValidSession = !!sessionCookie?.value && sessionCookie.value.split('.').length === 3;

  const protectedRoutes = [
    '/dashboard',
    '/contracts',
    '/clients',
    '/services',
    '/templates',
    '/clauses',
    '/settings',
    '/upscaler',
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // Redireciona raiz / para /dashboard ou /login
  if (pathname === '/') {
    if (isValidSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redireciona para login se rota protegida sem sessão válida
  if (isProtected && !isValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se já autenticado e tentando acessar login, manda para dashboard
  if (pathname === '/login' && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
