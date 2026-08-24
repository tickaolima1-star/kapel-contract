import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { workItemFindFirst } = vi.hoisted(() => ({ workItemFindFirst: vi.fn() }));
vi.mock('@/lib/api-auth', () => ({
  withOrgContext: (handler: Function) => (request: NextRequest, context: unknown) => handler(request, context, {
    organizationId: 'org_kapel', membershipId: 'membership_patrick', role: 'OWNER',
    session: { user: { id: 'user_1', name: 'Patrick', email: 'p@k.test', role: 'ADMIN' } },
  }),
}));
vi.mock('@/lib/prisma', () => ({ prisma: { workItem: { findFirst: workItemFindFirst } } }));

import { POST } from '@/app/api/command/route';

describe('command actions API', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('rejects invalid defer without touching data', async () => {
    const response = await POST(new NextRequest('http://localhost/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workItemId: 'w1', action: 'DEFER', reason: '' }) }), {});
    expect(response.status).toBe(400);
    expect(workItemFindFirst).not.toHaveBeenCalled();
  });

  it('does not reveal a cross-tenant work item', async () => {
    workItemFindFirst.mockResolvedValue(null);
    const response = await POST(new NextRequest('http://localhost/api/command', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ workItemId: 'other', action: 'START' }) }), {});
    expect(response.status).toBe(404);
    expect(workItemFindFirst).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'other', organization_id: 'org_kapel' } }));
  });
});
