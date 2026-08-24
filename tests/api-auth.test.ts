import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { withSession, withOrgContext } from '../src/lib/api-auth';

const findFirstMock = vi.fn();
vi.mock('../src/lib/prisma', () => ({
  prisma: {
    membership: {
      findFirst: (...args: any[]) => findFirstMock(...args),
    },
  },
}));

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

describe('withOrgContext API Guard', () => {
  it('retorna 403 se o usuário não possui membership ativo na organização', async () => {
    findFirstMock.mockResolvedValue(null);
    const handler = vi.fn().mockResolvedValue(new Response('OK'));
    const wrapped = withOrgContext(handler);
    const req = new NextRequest('http://localhost/api/test', {
      headers: { cookie: 'kapel_session=valid-token' },
    });

    const res = await wrapped(req, {});
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Acesso não autorizado para esta organização.');
    expect(handler).not.toHaveBeenCalled();
  });

  it('chama o handler e injeta o context organizacional quando o membership é ativo', async () => {
    findFirstMock.mockResolvedValue({
      id: 'membership_patrick',
      organization_id: 'org_kapel',
      user_id: 'usr_1',
      role: 'OWNER',
    });
    const handler = vi.fn().mockResolvedValue(new Response('OK'));
    const wrapped = withOrgContext(handler);
    const req = new NextRequest('http://localhost/api/test', {
      headers: { cookie: 'kapel_session=valid-token' },
    });

    const res = await wrapped(req, {});
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledWith(
      expect.any(NextRequest),
      expect.any(Object),
      {
        session: { user: { id: 'usr_1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' } },
        organizationId: 'org_kapel',
        membershipId: 'membership_patrick',
        role: 'OWNER',
      }
    );
  });
});
export { findFirstMock };

