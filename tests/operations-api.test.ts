import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

let mockRole = 'ADMIN';

const mockAuth = {
  session: { user: { id: 'usr_1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' } },
  organizationId: 'org_kapel',
  membershipId: 'membership_patrick',
  get role() { return mockRole; },
};

vi.mock('../src/lib/api-auth', () => ({
  withOrgContext: (handler: Function) => (req: NextRequest, ctx: any) => handler(req, ctx, mockAuth),
}));

const findManySpy = vi.fn();
const createSpy = vi.fn();
const updateSpy = vi.fn();
const findFirstSpy = vi.fn();

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    project: {
      findMany: (...args: any[]) => findManySpy(...args),
      create: (...args: any[]) => createSpy(...args),
      findFirst: (...args: any[]) => findFirstSpy(...args),
      update: (...args: any[]) => updateSpy(...args),
    },
    workItem: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    operationalBlocker: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

import * as projectsRoute from '../src/app/api/projects/route';

describe('Operations API Endpoints', () => {
  beforeEach(() => {
    mockRole = 'ADMIN';
    vi.clearAllMocks();
  });

  it('retorna lista de projetos da organizacao no GET', async () => {
    findManySpy.mockResolvedValue([{ id: 'p1', name: 'Projeto Teste' }]);
    const res = await projectsRoute.GET(new NextRequest('http://localhost/api/projects'), {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual([{ id: 'p1', name: 'Projeto Teste' }]);
    expect(findManySpy).toHaveBeenCalledWith(expect.objectContaining({
      where: { organization_id: 'org_kapel' },
    }));
  });

  it('rejeita criacao de projeto para VIEWER', async () => {
    mockRole = 'VIEWER';
    const res = await projectsRoute.POST(
      new NextRequest('http://localhost/api/projects', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: 'Projeto Teste', objective: 'Obj' }),
      }),
      {}
    );
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.error).toBe('Acesso negado.');
    expect(createSpy).not.toHaveBeenCalled();
  });
});
