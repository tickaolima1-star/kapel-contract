import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const AUTH_COOKIE_NAME = 'kapel_session';
const JWT_SECRET = process.env.JWT_SECRET || 'kapel-super-secret-jwt-key-2026-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !password) return false;
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): AuthSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSession;
    return decoded;
  } catch {
    return null;
  }
}

export function getSession(): AuthSession | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

export function setSessionCookie(user: { id: string; email: string; name: string; role: string }) {
  const cookieStore = cookies();
  const token = signSessionToken(user);
  cookieStore.set(AUTH_COOKIE_NAME, token, {
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
