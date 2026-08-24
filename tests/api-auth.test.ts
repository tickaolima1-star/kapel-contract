import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getSession, membershipFindFirst } = vi.hoisted(() => ({
  getSession: vi.fn(),
  membershipFindFirst: vi.fn(),
}));

vi.mock('../src/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('../src/lib/auth')>('../src/lib/auth');
  return { ...actual, getSession };
});

vi.mock('../src/lib/prisma', () => ({
  prisma: { membership: { findFirst: membershipFindFirst } },
}));

import { withOrgContext, withSession } from '../src/lib/api-auth';

const validSession = {
  user: {
    id: 'user_patrick',
    email: 'patrick@kapel.digital',
    name: 'Patrick Silva',
    role: 'ADMIN',
  },
};

describe('withSession', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('retorna 401 sem executar o handler quando a sessão é inválida', async () => {
    getSession.mockReturnValue(null);
    const handler = vi.fn();
    const guarded = withSession(handler);

    const response = await guarded(
      new NextRequest('http://localhost/api/private'),
      { params: { id: '1' } },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Sessão inválida ou expirada.' });
    expect(handler).not.toHaveBeenCalled();
  });

  it('entrega a sessão verificada ao handler', async () => {
    getSession.mockReturnValue(validSession);
    const response = new Response(JSON.stringify({ ok: true }), { status: 200 });
    const handler = vi.fn().mockResolvedValue(response);
    const guarded = withSession(handler);
    const request = new NextRequest('http://localhost/api/private');
    const routeContext = { params: { id: '1' } };

    await expect(guarded(request, routeContext)).resolves.toBe(response);
    expect(handler).toHaveBeenCalledWith(request, routeContext, validSession);
  });
});

describe('withOrgContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockReturnValue(validSession);
  });

  it('retorna 403 quando o usuário não possui membership ativa', async () => {
    membershipFindFirst.mockResolvedValue(null);
    const handler = vi.fn();
    const guarded = withOrgContext(handler);

    const response = await guarded(new NextRequest('http://localhost/api/private'), {});

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toEqual({
      error: 'Acesso não autorizado para esta organização.',
    });
    expect(handler).not.toHaveBeenCalled();
  });

  it('retorna 403 quando a função não é permitida', async () => {
    membershipFindFirst.mockResolvedValue({
      id: 'membership_patrick',
      organization_id: 'org_kapel',
      role: 'VIEWER',
    });
    const guarded = withOrgContext(vi.fn(), ['OWNER', 'ADMIN']);

    const response = await guarded(new NextRequest('http://localhost/api/private'), {});

    expect(response.status).toBe(403);
  });

  it('entrega contexto organizacional resolvido no servidor', async () => {
    membershipFindFirst.mockResolvedValue({
      id: 'membership_patrick',
      organization_id: 'org_kapel',
      role: 'OWNER',
    });
    const response = new Response(null, { status: 204 });
    const handler = vi.fn().mockResolvedValue(response);
    const guarded = withOrgContext(handler, ['OWNER']);
    const request = new NextRequest('http://localhost/api/private');
    const routeContext = { params: { id: '1' } };

    await expect(guarded(request, routeContext)).resolves.toBe(response);
    expect(handler).toHaveBeenCalledWith(request, routeContext, {
      session: validSession,
      organizationId: 'org_kapel',
      membershipId: 'membership_patrick',
      role: 'OWNER',
    });
  });
});
