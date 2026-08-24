import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { withSession } from '../src/lib/api-auth';

vi.mock('../src/lib/auth', () => ({
  verifySessionToken: vi.fn((token) => {
    if (token === 'valid-token') {
      return { user: { id: 'usr_1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' } };
    }
    return null;
  }),
  AUTH_COOKIE_NAME: 'kapel_session',
}));

describe('withSession API Wrapper', () => {
  it('retorna 401 para token ausente ou invalido', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK'));
    const wrapped = withSession(handler);
    const req = new NextRequest('http://localhost/api/test');
    
    const res = await wrapped(req, {});
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe('Sessão inválida ou expirada.');
    expect(handler).not.toHaveBeenCalled();
  });

  it('chama o handler quando o token e valido', async () => {
    const handler = vi.fn().mockResolvedValue(new Response('OK'));
    const wrapped = withSession(handler);
    const req = new NextRequest('http://localhost/api/test', {
      headers: { cookie: 'kapel_session=valid-token' },
    });
    
    const res = await wrapped(req, {});
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalled();
  });
});
