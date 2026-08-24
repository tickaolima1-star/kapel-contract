import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

const { getSession, databaseTouched } = vi.hoisted(() => ({
  getSession: vi.fn(),
  databaseTouched: vi.fn(() => {
    throw new Error('private API touched the database before authentication');
  }),
}));

vi.mock('@/lib/auth', async () => {
  const actual = await vi.importActual<typeof import('@/lib/auth')>('@/lib/auth');
  return { ...actual, getSession };
});

const model = new Proxy({}, { get: () => databaseTouched });
vi.mock('@/lib/prisma', () => ({
  prisma: new Proxy({}, { get: () => model }),
}));

import * as changePassword from '@/app/api/auth/change-password/route';
import * as categories from '@/app/api/categories/route';
import * as clients from '@/app/api/clients/route';
import * as clientById from '@/app/api/clients/[id]/route';
import * as contracts from '@/app/api/contracts/route';
import * as contractById from '@/app/api/contracts/[id]/route';
import * as duplicateContract from '@/app/api/contracts/[id]/duplicate/route';
import * as signKapel from '@/app/api/contracts/[id]/sign-kapel/route';
import * as importContract from '@/app/api/contracts/import/route';
import * as dashboard from '@/app/api/dashboard/route';
import * as importSheet from '@/app/api/projects/import-sheet/route';
import * as services from '@/app/api/services/route';
import * as serviceById from '@/app/api/services/[id]/route';
import * as settings from '@/app/api/settings/route';
import * as projects from '@/app/api/projects/route';
import * as projectById from '@/app/api/projects/[id]/route';
import * as projectUpdates from '@/app/api/projects/[id]/updates/route';
import * as workItems from '@/app/api/work-items/route';
import * as workItemById from '@/app/api/work-items/[id]/route';
import * as blockers from '@/app/api/blockers/route';
import * as blockerById from '@/app/api/blockers/[id]/route';
import * as command from '@/app/api/command/route';

type Handler = (request: NextRequest, context: { params: { id: string } }) => Promise<Response>;

const cases: Array<[string, Handler, string]> = [
  ['POST /api/auth/change-password', changePassword.POST as Handler, 'POST'],
  ['GET /api/categories', categories.GET as Handler, 'GET'],
  ['GET /api/dashboard', dashboard.GET as Handler, 'GET'],
  ['GET /api/clients', clients.GET as Handler, 'GET'],
  ['POST /api/clients', clients.POST as Handler, 'POST'],
  ['GET /api/clients/[id]', clientById.GET as Handler, 'GET'],
  ['PUT /api/clients/[id]', clientById.PUT as Handler, 'PUT'],
  ['DELETE /api/clients/[id]', clientById.DELETE as Handler, 'DELETE'],
  ['GET /api/contracts', contracts.GET as Handler, 'GET'],
  ['POST /api/contracts', contracts.POST as Handler, 'POST'],
  ['GET /api/contracts/[id]', contractById.GET as Handler, 'GET'],
  ['PUT /api/contracts/[id]', contractById.PUT as Handler, 'PUT'],
  ['DELETE /api/contracts/[id]', contractById.DELETE as Handler, 'DELETE'],
  ['POST /api/contracts/[id]/duplicate', duplicateContract.POST as Handler, 'POST'],
  ['POST /api/contracts/[id]/sign-kapel', signKapel.POST as Handler, 'POST'],
  ['POST /api/contracts/import', importContract.POST as Handler, 'POST'],
  ['POST /api/projects/import-sheet', importSheet.POST as Handler, 'POST'],
  ['GET /api/services', services.GET as Handler, 'GET'],
  ['POST /api/services', services.POST as Handler, 'POST'],
  ['PUT /api/services/[id]', serviceById.PUT as Handler, 'PUT'],
  ['DELETE /api/services/[id]', serviceById.DELETE as Handler, 'DELETE'],
  ['GET /api/settings', settings.GET as Handler, 'GET'],
  ['PUT /api/settings', settings.PUT as Handler, 'PUT'],
  ['GET /api/projects', projects.GET as Handler, 'GET'],
  ['POST /api/projects', projects.POST as Handler, 'POST'],
  ['GET /api/projects/[id]', projectById.GET as Handler, 'GET'],
  ['PATCH /api/projects/[id]', projectById.PATCH as Handler, 'PATCH'],
  ['POST /api/projects/[id]/updates', projectUpdates.POST as Handler, 'POST'],
  ['GET /api/work-items', workItems.GET as Handler, 'GET'],
  ['POST /api/work-items', workItems.POST as Handler, 'POST'],
  ['PATCH /api/work-items/[id]', workItemById.PATCH as Handler, 'PATCH'],
  ['GET /api/blockers', blockers.GET as Handler, 'GET'],
  ['POST /api/blockers', blockers.POST as Handler, 'POST'],
  ['PATCH /api/blockers/[id]', blockerById.PATCH as Handler, 'PATCH'],
  ['GET /api/command', command.GET as Handler, 'GET'],
  ['POST /api/command', command.POST as Handler, 'POST'],
];

describe('autenticação de APIs privadas', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSession.mockReturnValue(null);
  });

  it.each(cases)('%s retorna 401 antes de acessar dados', async (_name, handler, method) => {
    const request = new NextRequest('http://localhost/api/private', {
      method,
      headers: { 'content-type': 'application/json' },
      body: ['POST', 'PUT', 'PATCH'].includes(method) ? '{}' : undefined,
    });

    const response = await handler(request, { params: { id: 'record_1' } });

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: 'Sessão inválida ou expirada.' });
    expect(databaseTouched).not.toHaveBeenCalled();
  });
});
