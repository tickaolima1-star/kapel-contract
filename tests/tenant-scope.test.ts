import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuthContext = {
  session: { user: { id: 'usr_1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' } },
  organizationId: 'org_kapel',
  membershipId: 'membership_patrick',
  role: 'OWNER' as const,
};

const findFirstSpy = vi.fn();
const createSpy = vi.fn();
const updateSpy = vi.fn();
const deleteSpy = vi.fn();
const findManySpy = vi.fn();

vi.mock('../src/lib/api-auth', () => ({
  withOrgContext: (handler: Function) => (req: NextRequest, ctx: any) => handler(req, ctx, mockAuthContext),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    client: {
      findFirst: (...args: any[]) => findFirstSpy(...args),
      findMany: (...args: any[]) => findManySpy(...args),
      create: (...args: any[]) => createSpy(...args),
      update: (...args: any[]) => updateSpy(...args),
      delete: (...args: any[]) => deleteSpy(...args),
    },
    contract: {
      findFirst: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    serviceCategory: {
      findMany: vi.fn(),
    },
    service: {
      findMany: vi.fn(),
    },
    companySettings: {
      findFirst: vi.fn(),
    },
  },
}));

import * as clients from '../src/app/api/clients/route';
import * as clientById from '../src/app/api/clients/[id]/route';

describe('Tenant validation controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filtra clientes por id da organizacao do context no GET', async () => {
    findManySpy.mockResolvedValue([]);
    const res = await clients.GET(new NextRequest('http://localhost/api/clients'), {});
    expect(res.status).toBe(200);
    expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({
      where: { organization_id: 'org_kapel' },
    }));
  });

  it('filtra clientes por id da organizacao do context no GET/[id]', async () => {
    findFirstSpy.mockResolvedValue(null);
    const res = await clientById.GET(new NextRequest('http://localhost/api/clients/client_other'), { params: { id: 'client_other' } });
    expect(res.status).toBe(404);
    expect(findFirstSpy).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'client_other', organization_id: 'org_kapel' },
    }));
  });

  it('obriga a organizacao a ser a do context na criacao de cliente', async () => {
    createSpy.mockResolvedValue({ id: 'client_1' });
    const res = await clients.POST(
      new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          legal_name: 'Cliente Teste',
          document: '123',
          organization_id: 'org_malicious_attacker_forged',
        }),
      }),
      {}
    );
    expect(res.status).toBe(201);
    expect(createSpy).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organization_id: 'org_kapel' }),
    }));
  });

  it('retorna 404 ao tentar atualizar cliente de outra organizacao', async () => {
    findFirstSpy.mockResolvedValue(null);
    const res = await clientById.PUT(
      new NextRequest('http://localhost/api/clients/client_other', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ legal_name: 'Cliente Modificado' }),
      }),
      { params: { id: 'client_other' } }
    );
    expect(res.status).toBe(404);
    expect(findFirstSpy).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'client_other', organization_id: 'org_kapel' },
    }));
    expect(updateSpy).not.toHaveBeenCalled();
  });
});
export { findFirstSpy };
