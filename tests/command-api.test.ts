import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuth = {
  session: { user: { id: 'usr_1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' } },
  organizationId: 'org_kapel',
  membershipId: 'membership_patrick',
  role: 'OWNER' as const,
};

vi.mock('../src/lib/api-auth', () => ({
  withOrgContext: (handler: Function) => (req: NextRequest, ctx: any) => handler(req, ctx, mockAuth),
}));

const mockWorkItems: any[] = [];
const mockProjects: any[] = [];
const mockBlockers: any[] = [];

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    workItem: {
      findMany: vi.fn(() => Promise.resolve(mockWorkItems)),
    },
    project: {
      findMany: vi.fn(() => Promise.resolve(mockProjects)),
    },
    operationalBlocker: {
      findMany: vi.fn(() => Promise.resolve(mockBlockers)),
    },
  },
}));

import * as commandRoute from '../src/app/api/command/route';

describe('Command API', () => {
  it('deve retornar o modelo de leitura diário estruturado', async () => {
    const req = new NextRequest('http://localhost/api/command');
    const res = await commandRoute.GET(req, {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('decisions');
    expect(body).toHaveProperty('revenueAtRisk');
    expect(body).toHaveProperty('externalBlockers');
    expect(body).toHaveProperty('delegations');
    expect(body).toHaveProperty('notNow');
  });
});
