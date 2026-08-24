import { jwtVerify } from 'jose';
import { getJwtSecret } from './jwt-secret';
import { AuthSession } from './auth';

export async function verifyEdgeSessionToken(token: string): Promise<AuthSession | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    
    if (payload && payload.user && typeof payload.user === 'object') {
      const user = payload.user as Record<string, unknown>;
      if (
        typeof user.id === 'string' &&
        typeof user.email === 'string' &&
        typeof user.name === 'string' &&
        typeof user.role === 'string'
      ) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}
