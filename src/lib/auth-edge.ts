import { jwtVerify } from 'jose';
import type { AuthSession } from './auth';
import { getJwtSecret } from './jwt-secret';

export async function verifyEdgeSessionToken(token: string): Promise<AuthSession | null> {
  try {
    const { payload } = await jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] });
    const user = payload.user;
    if (!user || typeof user !== 'object') return null;
    const record = user as Record<string, unknown>;
    if (!['id', 'email', 'name', 'role'].every((field) => typeof record[field] === 'string')) return null;
    return {
      user: {
        id: record.id as string,
        email: record.email as string,
        name: record.name as string,
        role: record.role as string,
      },
    };
  } catch {
    return null;
  }
}
