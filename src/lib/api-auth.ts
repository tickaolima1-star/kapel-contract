import { NextRequest, NextResponse } from 'next/server';
import { AuthSession, AUTH_COOKIE_NAME, verifySessionToken } from './auth';

export function withSession<TContext>(
  handler: (request: NextRequest, context: TContext, session: AuthSession) => Promise<Response>,
): (request: NextRequest, context: TContext) => Promise<Response> {
  return async (request: NextRequest, context: TContext) => {
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    const session = verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    return handler(request, context, session);
  };
}
