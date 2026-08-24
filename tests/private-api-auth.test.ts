import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../src/lib/auth', () => ({
  verifySessionToken: vi.fn(() => null), // Session always invalid
  AUTH_COOKIE_NAME: 'kapel_session',
}));

import * as changePassword from '../src/app/api/auth/change-password/route';
import * as categories from '../src/app/api/categories/route';
import * as dashboard from '../src/app/api/dashboard/route';
import * as clients from '../src/app/api/clients/route';
import * as clientById from '../src/app/api/clients/[id]/route';
import * as contracts from '../src/app/api/contracts/route';
import * as contractById from '../src/app/api/contracts/[id]/route';
import * as duplicateContract from '../src/app/api/contracts/[id]/duplicate/route';
import * as signKapel from '../src/app/api/contracts/[id]/sign-kapel/route';
import * as importContract from '../src/app/api/contracts/import/route';
import * as services from '../src/app/api/services/route';
import * as serviceById from '../src/app/api/services/[id]/route';
import * as settings from '../src/app/api/settings/route';

describe('Exhaustive Auth API validation', () => {
  const req = () => new NextRequest('http://localhost/api/test');
  const params = { params: { id: 'test-id' } };

  const cases = [
    ['POST /api/auth/change-password', changePassword.POST, {}],
    ['GET /api/categories', categories.GET, {}],
    ['GET /api/dashboard', dashboard.GET, {}],
    ['GET /api/clients', clients.GET, {}],
    ['POST /api/clients', clients.POST, {}],
    ['GET /api/clients/[id]', clientById.GET, params],
    ['PUT /api/clients/[id]', clientById.PUT, params],
    ['DELETE /api/clients/[id]', clientById.DELETE, params],
    ['GET /api/contracts', contracts.GET, {}],
    ['POST /api/contracts', contracts.POST, {}],
    ['GET /api/contracts/[id]', contractById.GET, params],
    ['PUT /api/contracts/[id]', contractById.PUT, params],
    ['DELETE /api/contracts/[id]', contractById.DELETE, params],
    ['POST /api/contracts/[id]/duplicate', duplicateContract.POST, params],
    ['POST /api/contracts/[id]/sign-kapel', signKapel.POST, params],
    ['POST /api/contracts/import', importContract.POST, {}],
    ['GET /api/services', services.GET, {}],
    ['POST /api/services', services.POST, {}],
    ['PUT /api/services/[id]', serviceById.PUT, params],
    ['DELETE /api/services/[id]', serviceById.DELETE, params],
    ['GET /api/settings', settings.GET, {}],
    ['PUT /api/settings', settings.PUT, {}],
  ] as const;

  for (const [name, handler, ctx] of cases) {
    it(`rejeita requisições não autenticadas em ${name}`, async () => {
      const res = await (handler as Function)(req(), ctx);
      expect(res.status).toBe(401);
    });
  }
});
