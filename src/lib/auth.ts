import { cookies } from 'next/headers';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const AUTH_COOKIE_NAME = 'kapel_session';

export function getSession(): AuthSession | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    const session = JSON.parse(decodeURIComponent(sessionCookie.value));
    return session as AuthSession;
  } catch {
    return null;
  }
}

export function setSessionCookie(user: { id: string; email: string; name: string; role: string }) {
  const cookieStore = cookies();
  const sessionData = JSON.stringify({ user });
  cookieStore.set(AUTH_COOKIE_NAME, encodeURIComponent(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
