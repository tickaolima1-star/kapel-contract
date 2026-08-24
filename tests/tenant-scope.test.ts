import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const auth = {
  session: { user: { id: 'user_1', email: 'p@k.test', name: 'Patrick', role: 'ADMIN' } },
  organizationId: 'org_kapel',
  membershipId: 'membership_patrick',
  role: 'OWNER' as const,
};

const { clientFindFirst, clientCreate, clientDeleteMany, contractFindFirst, contractUpdateMany } = vi.hoisted(() => ({
  clientFindFirst: vi.fn(),
  clientCreate: vi.fn(),
  clientDeleteMany: vi.fn(),
  contractFindFirst: vi.fn(),
  contractUpdateMany: vi.fn(),
}));

vi.mock('@/lib/api-auth', () => ({
  withOrgContext: (handler: Function) => (request: NextRequest, context: unknown) =>
    handler(request, context, auth),
  withSession: (handler: Function) => (request: NextRequest, context: unknown) =>
    handler(request, context, auth.session),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    client: { findFirst: clientFindFirst, create: clientCreate, deleteMany: clientDeleteMany },
    contract: { findFirst: contractFindFirst, updateMany: contractUpdateMany },
  },
}));

import * as clientById from '@/app/api/clients/[id]/route';
import * as clients from '@/app/api/clients/route';
import * as contractById from '@/app/api/contracts/[id]/route';

describe('escopo organizacional de clientes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('busca um cliente por id dentro da organização autenticada', async () => {
    clientFindFirst.mockResolvedValue(null);
    const response = await clientById.GET(
      new NextRequest('http://localhost/api/clients/client_other'),
      { params: { id: 'client_other' } },
    );

    expect(response.status).toBe(404);
    expect(clientFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'client_other', organization_id: 'org_kapel' },
    }));
  });

  it('ignora organization_id enviado pelo cliente ao criar', async () => {
    clientCreate.mockResolvedValue({ id: 'client_1' });
    await clients.POST(
      new NextRequest('http://localhost/api/clients', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          legal_name: 'Cliente',
          document: '123',
          organization_id: 'org_other',
        }),
      }),
      {},
    );

    expect(clientCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ organization_id: 'org_kapel' }),
    }));
  });

  it('retorna 404 quando a exclusão escopada não encontra o cliente', async () => {
    clientDeleteMany.mockResolvedValue({ count: 0 });
    const response = await clientById.DELETE(
      new NextRequest('http://localhost/api/clients/client_other', { method: 'DELETE' }),
      { params: { id: 'client_other' } },
    );

    expect(response.status).toBe(404);
    expect(clientDeleteMany).toHaveBeenCalledWith({
      where: { id: 'client_other', organization_id: 'org_kapel' },
    });
  });

  it('atualiza contrato somente dentro da organização e retorna 404 para count zero', async () => {
    contractFindFirst.mockResolvedValue({
      id: 'contract_other',
      client_id: 'client_1',
      items: [],
      status: 'DRAFT',
      calculated_mrr: 0,
      calculated_total_one_time: 0,
    });
    contractUpdateMany.mockResolvedValue({ count: 0 });

    const response = await contractById.PUT(
      new NextRequest('http://localhost/api/contracts/contract_other', {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: '{}',
      }),
      { params: { id: 'contract_other' } },
    );

    expect(response.status).toBe(404);
    expect(contractUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'contract_other', organization_id: 'org_kapel' },
    }));
  });
});
