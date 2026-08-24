# KAPEL Command Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Deliver a secure, robust multitenant foundation for the KAPEL Command dashboard on top of Next.js 14 and Prisma, separating projects from contracts and calculating daily priorities deterministically.

**Architecture:** Use Edge-safe JWT validation using `jose` inside the Middleware. Implement organization-scoping on all private APIs via `withOrgContext` server guards. Create operational schema tables (`Project`, `WorkItem`, etc.) with database `CHECK` constraints, a deterministic prioritization scoring engine (0-100), and a transactional central dashboard read-model.

**Tech Stack:** Next.js 14.2.5, React 18.3.1, TypeScript 5.5, Prisma 5.16, PostgreSQL, Vitest 1.6, jose, jsonwebtoken, bcryptjs, Tailwind CSS.

## Global Constraints

- Evolver local repository; do not write code outside the workspace or change the Contract module's commercial features.
- Keep `/dashboard` intact; the command dashboard lives in `/command`.
- organization_id and membership_id must be resolved exclusively on the server side using the Edge JWT session.
- All database mutation/read scopes must verify the organization context and role (OWNER, ADMIN, OPERATOR, VIEWER).
- Unauthenticated requests must return 401; unauthorised or cross-tenant reads on IDs must return 404 (not 403) to prevent resource enumeration.
- Prioritization scoring must be deterministic and pure; do not use external APIs or AI at this stage.
- Do not log sensitive variables, JWT secrets, passwords, or full raw payloads.

---

### Task 1: JWT Edge Security and API Guards

**Files:**
- Create: `src/lib/jwt-secret.ts`
- Create: `src/lib/auth-edge.ts`
- Create: `src/lib/api-auth.ts`
- Modify: `src/lib/auth.ts`
- Modify: `src/middleware.ts`
- Modify: `tests/security.test.ts`
- Create: `tests/api-auth.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `getJwtSecret(): Uint8Array`
- Produces: `verifyEdgeSessionToken(token: string): Promise<AuthSession | null>`
- Produces: `withSession<TContext>(handler: (req: NextRequest, ctx: TContext, session: AuthSession) => Promise<Response>): (req: NextRequest, ctx: TContext) => Promise<Response>`

- [ ] **Step 1: Write failing security and guard tests**

Modify `tests/security.test.ts` to add fail-closed tests:
```ts
// Append to tests/security.test.ts:
it('falha fechado quando JWT_SECRET nao existe', () => {
  const originalSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;
  expect(() => signSessionToken({ id: '1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' })).toThrow('JWT_SECRET é obrigatório');
  process.env.JWT_SECRET = originalSecret;
});

it('rejeita token assinado com outra chave', () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'chave-com-32-bytes-para-testes-01';
  const token = signSessionToken({ id: '1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' });
  process.env.JWT_SECRET = 'chave-com-32-bytes-para-testes-02';
  expect(verifySessionToken(token)).toBeNull();
  process.env.JWT_SECRET = originalSecret;
});
```

Create `tests/api-auth.test.ts`:
```ts
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
```

- [ ] **Step 2: Install `jose` and run tests to verify failures**

Run:
```powershell
npm install jose
npx vitest run tests/security.test.ts tests/api-auth.test.ts
```
Expected: FAIL because functions do not exist or JWT verification fallback is still active.

- [ ] **Step 3: Implement clean secret resolution and edge validator**

Create `src/lib/jwt-secret.ts`:
```ts
export function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET é obrigatório e deve ter ao menos 32 caracteres.');
  }
  return new TextEncoder().encode(value);
}
```

Create `src/lib/auth-edge.ts`:
```ts
import { jwtVerify } from 'jose';
import { getJwtSecret } from './jwt-secret';
import { AuthSession } from './auth';

export async function verifyEdgeSessionToken(token: string): Promise<AuthSession | null> {
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret, { algorithms: ['HS256'] });
    
    if (payload && payload.user && typeof payload.user === 'object') {
      const user = payload.user as Record<string, unknown>;
      if (
        typeof user.id === 'string' &&
        typeof user.email === 'string' &&
        typeof user.name === 'string' &&
        typeof user.role === 'string'
      ) {
        return {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
        };
      }
    }
    return null;
  } catch {
    return null;
  }
}
```

- [ ] **Step 4: Update Node-side `src/lib/auth.ts` and create API wrapper**

Modify `src/lib/auth.ts` to use `jsonwebtoken` strictly with `HS256` and the resolved `JWT_SECRET` string:
```ts
// Modify the JWT_SECRET read in src/lib/auth.ts:
import { getJwtSecret } from './jwt-secret';

function getJwtSecretString(): string {
  // convert Uint8Array back to string
  const val = process.env.JWT_SECRET;
  if (!val || val.length < 32) {
    throw new Error('JWT_SECRET é obrigatório e deve ter ao menos 32 caracteres.');
  }
  return val;
}

export function signSessionToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign({ user }, getJwtSecretString(), { algorithm: 'HS256', expiresIn: '7d' });
}

export function verifySessionToken(token: string): AuthSession | null {
  try {
    const decoded = jwt.verify(token, getJwtSecretString(), { algorithms: ['HS256'] }) as AuthSession;
    return decoded;
  } catch {
    return null;
  }
}
```

Create `src/lib/api-auth.ts`:
```ts
import { NextRequest, NextResponse } from 'next/server';
import { AuthSession, AUTH_COOKIE_NAME, verifySessionToken } from './auth';

export function withSession<TContext>(
  handler: (request: NextRequest, context: TContext, session: AuthSession) => Promise<Response>,
): (request: NextRequest, context: TContext) => Promise<Response> {
  return async (request: NextRequest, context: TContext) => {
    const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    const session = verifySessionToken(sessionCookie.value);
    if (!session) {
      return NextResponse.json({ error: 'Sessão inválida ou expirada.' }, { status: 401 });
    }
    return handler(request, context, session);
  };
}
```

- [ ] **Step 5: Protect Middleware and verify security tests**

Modify `src/middleware.ts` to await Edge verification for protected routes:
```ts
// Modify validation in src/middleware.ts:
import { verifyEdgeSessionToken } from './lib/auth-edge';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  
  let isValidSession = false;
  let session = null;
  if (sessionCookie?.value) {
    session = await verifyEdgeSessionToken(sessionCookie.value);
    isValidSession = !!session;
  }

  // add '/command' and '/operations' to protected routes
  const protectedRoutes = [
    '/dashboard',
    '/contracts',
    '/clients',
    '/services',
    '/templates',
    '/clauses',
    '/settings',
    '/upscaler',
    '/command',
    '/operations',
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (pathname === '/') {
    if (isValidSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  if (isProtected && !isValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (pathname === '/login' && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}
```

- [ ] **Step 6: Run verification and commit**

Run:
```powershell
$env:JWT_SECRET="chave-de-teste-muito-segura-com-32-caracteres"
npm test
```
Expected: All tests pass.

Commit:
```powershell
git add package.json package-lock.json src/lib/jwt-secret.ts src/lib/auth-edge.ts src/lib/api-auth.ts src/lib/auth.ts src/middleware.ts tests/security.test.ts tests/api-auth.test.ts
git commit -m "feat: add JWT Edge security validation and session API wrapper"
```

---

### Task 2: Tenant & Membership Database Schema & Migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/202608240001_organization_foundation/migration.sql`
- Modify: `prisma/seed.ts`
- Modify: `src/lib/api-auth.ts`
- Create: `tests/organization-migration.test.ts`
- Modify: `tests/api-auth.test.ts`

**Interfaces:**
- Produces Prisma models: `Organization`, `Membership`, enum `MembershipRole`
- Produces: `withOrgContext<TContext>(handler: (req: NextRequest, ctx: TContext, auth: OrgRequestContext) => Promise<Response>, allowedRoles?: MembershipRole[]): (req: NextRequest, ctx: TContext) => Promise<Response>`
- Types: `OrgRequestContext = { session: AuthSession; organizationId: string; membershipId: string; role: MembershipRole; }`

- [ ] **Step 1: Write SQL migration test**

Create `tests/organization-migration.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Tenant migration script structure', () => {
  it('valida os scripts SQL de migração organizacional', () => {
    const migrationPath = resolve(__dirname, '../prisma/migrations/202608240001_organization_foundation/migration.sql');
    const sql = readFileSync(migrationPath, 'utf8');

    expect(sql).toContain('CREATE TYPE "MembershipRole"');
    expect(sql).toContain('org_kapel');
    expect(sql).toContain('KAPEL');
    expect(sql).toContain('kapel');
    expect(sql.indexOf('UPDATE "Client"')).toBeLessThan(sql.indexOf('ALTER COLUMN "organization_id" SET NOT NULL'));
    expect(sql.indexOf('UPDATE "Contract"')).toBeLessThan(sql.lastIndexOf('ALTER COLUMN "organization_id" SET NOT NULL'));
  });
});
```

Extend `tests/api-auth.test.ts` to mock membership searches and test `withOrgContext`:
```ts
// Add imports and tests to tests/api-auth.test.ts:
import { withOrgContext } from '../src/lib/api-auth';
import { prisma } from '../src/lib/prisma';

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    membership: {
      findFirst: vi.fn(),
    },
  },
}));

describe('withOrgContext API Guard', () => {
  it('retorna 403 se o usuário não possui membership ativo na organização', async () => {
    vi.mocked(prisma.membership.findFirst).mockResolvedValue(null);
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
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:
```powershell
npx vitest run tests/organization-migration.test.ts
```
Expected: FAIL because migration folder or files do not exist.

- [ ] **Step 3: Define schema additions**

Add models to `prisma/schema.prisma`:
```prisma
enum MembershipRole {
  OWNER
  ADMIN
  OPERATOR
  VIEWER
}

model Organization {
  id          String       @id @default(cuid())
  name        String
  slug        String       @unique
  active      Boolean      @default(true)
  created_at  DateTime     @default(now())
  updated_at  DateTime     @updatedAt
  memberships Membership[]
  clients     Client[]
  contracts   Contract[]
}

model Membership {
  id              String         @id @default(cuid())
  organization_id String
  organization    Organization   @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  user_id         String
  user            User           @relation(fields: [user_id], references: [id], onDelete: Cascade)
  role            MembershipRole @default(OPERATOR)
  created_at      DateTime       @default(now())

  @@unique([organization_id, user_id])
  @@index([user_id])
}

// Add organization relations to Client and Contract:
// model Client { ... organization_id String; organization Organization @relation(fields: [organization_id], references: [id]) }
// model Contract { ... organization_id String; organization Organization @relation(fields: [organization_id], references: [id]) }
```

- [ ] **Step 4: Create migration SQL**

Create `prisma/migrations/202608240001_organization_foundation/migration.sql`:
```sql
-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATOR', 'VIEWER');

-- CreateTable Organization
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable Membership
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "role" "MembershipRole" NOT NULL DEFAULT 'OPERATOR',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- AddOrganizationId Columns
ALTER TABLE "Client" ADD COLUMN "organization_id" TEXT;
ALTER TABLE "Contract" ADD COLUMN "organization_id" TEXT;

-- CreateDefaultOrganization
INSERT INTO "Organization" ("id", "name", "slug", "active", "created_at", "updated_at")
VALUES ('org_kapel', 'KAPEL', 'kapel', true, NOW(), NOW());

-- BackfillLegacyRecords
UPDATE "Client" SET "organization_id" = 'org_kapel';
UPDATE "Contract" SET "organization_id" = 'org_kapel';

-- MakeOrganizationIdNotNull
ALTER TABLE "Client" ALTER COLUMN "organization_id" SET NOT NULL;
ALTER TABLE "Contract" ALTER COLUMN "organization_id" SET NOT NULL;

-- CreateIndexes
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");
CREATE INDEX "Membership_user_id_idx" ON "Membership"("user_id");
CREATE UNIQUE INDEX "Membership_organization_id_user_id_key" ON "Membership"("organization_id", "user_id");

-- AddForeignKeys
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Client" ADD CONSTRAINT "Client_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 5: Update seed script**

Modify `prisma/seed.ts` to ensure organizations and memberships are set:
```ts
// Modify prisma/seed.ts:
// Insert or update org_kapel:
await prisma.organization.upsert({
  where: { id: 'org_kapel' },
  update: {},
  create: {
    id: 'org_kapel',
    name: 'KAPEL',
    slug: 'kapel',
    active: true,
  },
});

// For any seed user (like Patrick), insert a Membership
await prisma.membership.upsert({
  where: { organization_id_user_id: { organization_id: 'org_kapel', user_id: patrick.id } },
  update: { role: 'OWNER' },
  create: {
    organization_id: 'org_kapel',
    user_id: patrick.id,
    role: 'OWNER',
  },
});
```

- [ ] **Step 6: Implement `withOrgContext` and verify tests**

Modify `src/lib/api-auth.ts`:
```ts
import { MembershipRole } from '@prisma/client';
import { prisma } from './prisma';

export type OrgRequestContext = {
  session: AuthSession;
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
};

export function withOrgContext<TContext>(
  handler: (request: NextRequest, context: TContext, auth: OrgRequestContext) => Promise<Response>,
  allowedRoles?: MembershipRole[],
): (request: NextRequest, context: TContext) => Promise<Response> {
  return withSession(async (request, context, session) => {
    const membership = await prisma.membership.findFirst({
      where: {
        user_id: session.user.id,
        organization: { active: true },
      },
      orderBy: { created_at: 'asc' },
    });

    if (!membership) {
      return NextResponse.json({ error: 'Acesso não autorizado para esta organização.' }, { status: 403 });
    }

    if (allowedRoles && !allowedRoles.includes(membership.role)) {
      return NextResponse.json({ error: 'Acesso não autorizado para esta organização.' }, { status: 403 });
    }

    return handler(request, context, {
      session,
      organizationId: membership.organization_id,
      membershipId: membership.id,
      role: membership.role,
    });
  });
}
```

Run format, validate, and test:
```powershell
npx prisma format
npx prisma validate
npx prisma generate
npx vitest run tests/organization-migration.test.ts tests/api-auth.test.ts
```
Expected: PASS.

- [ ] **Step 7: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations/202608240001_organization_foundation/migration.sql prisma/seed.ts src/lib/api-auth.ts tests/organization-migration.test.ts tests/api-auth.test.ts
git commit -m "feat: add multitenant organization and membership schema foundation"
```

---

### Task 3: Organization Scoping of Existing Private APIs

**Files:**
- Modify: `src/app/api/auth/change-password/route.ts`
- Modify: `src/app/api/categories/route.ts`
- Modify: `src/app/api/clients/route.ts`
- Modify: `src/app/api/clients/[id]/route.ts`
- Modify: `src/app/api/contracts/route.ts`
- Modify: `src/app/api/contracts/[id]/route.ts`
- Modify: `src/app/api/contracts/[id]/duplicate/route.ts`
- Modify: `src/app/api/contracts/[id]/sign-kapel/route.ts`
- Modify: `src/app/api/contracts/import/route.ts`
- Modify: `src/app/api/dashboard/route.ts`
- Modify: `src/app/api/services/route.ts`
- Modify: `src/app/api/services/[id]/route.ts`
- Modify: `src/app/api/settings/route.ts`
- Create: `tests/private-api-auth.test.ts`
- Create: `tests/tenant-scope.test.ts`

**Interfaces:**
- All endpoints must consume `withOrgContext` and restrict queries to `organization_id: auth.organizationId`.
- Return 404 on resources belonging to other organizations to prevent enumeration.

- [ ] **Step 1: Write private auth and tenant scoping tests**

Create `tests/private-api-auth.test.ts` to enforce session validation across all endpoints:
```ts
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('../src/lib/auth', () => ({
  verifySessionToken: vi.fn(() => null), // Session always invalid
}));

import * as changePassword from '../src/app/api/auth/change-password/route';
import * as categories from '../src/app/api/categories/route';
import * as clients from '../src/app/api/clients/route';

describe('Exhaustive Auth API validation', () => {
  it('rejeita requisições não autenticadas', async () => {
    const req = new NextRequest('http://localhost/api/categories');
    const res = await categories.GET(req, {});
    expect(res.status).toBe(401);
  });
});
```

Create `tests/tenant-scope.test.ts` to assert queries contain `organization_id`:
```ts
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockAuthContext = {
  session: { user: { id: 'usr_1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' } },
  organizationId: 'org_kapel',
  membershipId: 'membership_patrick',
  role: 'OWNER' as const,
};

const findFirstSpy = vi.fn();
const createSpy = vi.fn();
const deleteManySpy = vi.fn();

vi.mock('../src/lib/api-auth', () => ({
  withOrgContext: (handler: Function) => (req: NextRequest, ctx: any) => handler(req, ctx, mockAuthContext),
}));

vi.mock('../src/lib/prisma', () => ({
  prisma: {
    client: {
      findFirst: findFirstSpy,
      create: createSpy,
      deleteMany: deleteManySpy,
    },
  },
}));

import * as clients from '../src/app/api/clients/route';
import * as clientById from '../src/app/api/clients/[id]/route';

describe('Tenant validation controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filtra clientes por id da organizacao do context', async () => {
    findFirstSpy.mockResolvedValue(null);
    const res = await clientById.GET(new NextRequest('http://localhost/api/clients/123'), { params: { id: '123' } });
    expect(res.status).toBe(404);
    expect(findFirstSpy).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: '123', organization_id: 'org_kapel' },
    }));
  });
});
```

- [ ] **Step 2: Run tests to verify failures**

Run:
```powershell
npx vitest run tests/private-api-auth.test.ts tests/tenant-scope.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Refactor APIs to enforce organization context scoping**

Wrap all route handlers inside `withOrgContext` (or `withSession` for `/change-password`). Update database operations. Examples:

Modify `src/app/api/clients/route.ts`:
```ts
import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const GET = withOrgContext(async (request, context, auth) => {
  const clients = await prisma.client.findMany({
    where: { organization_id: auth.organizationId },
  });
  return NextResponse.json(clients);
});

export const POST = withOrgContext(async (request, context, auth) => {
  const body = await request.json();
  const client = await prisma.client.create({
    data: {
      ...body,
      organization_id: auth.organizationId,
    },
  });
  return NextResponse.json(client);
});
```

Modify `src/app/api/clients/[id]/route.ts`:
```ts
import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const GET = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  const client = await prisma.client.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!client) {
    return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
  }
  return NextResponse.json(client);
});

export const PUT = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  const body = await request.json();
  const existing = await prisma.client.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
  }
  const updated = await prisma.client.update({
    where: { id: params.id },
    data: { ...body, organization_id: auth.organizationId },
  });
  return NextResponse.json(updated);
});

export const DELETE = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  const existing = await prisma.client.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Cliente não encontrado.' }, { status: 404 });
  }
  await prisma.client.delete({
    where: { id: params.id },
  });
  return NextResponse.json({ success: true });
});
```

Apply similar wraps to all contract endpoints, category, dashboard, service, and settings routes.

- [ ] **Step 4: Run focused tests and verify they pass**

Run:
```powershell
npx vitest run tests/private-api-auth.test.ts tests/tenant-scope.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/app/api/ tests/private-api-auth.test.ts tests/tenant-scope.test.ts
git commit -m "feat: enforce server-scoped multi-tenancy on all existing contract APIs"
```

---

### Task 4: Operational Data Schema, Migrations, and APIs

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/202608240002_operations_foundation/migration.sql`
- Create: `src/lib/validation.ts`
- Create: `src/lib/operations.ts`
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/projects/[id]/updates/route.ts`
- Create: `src/app/api/work-items/route.ts`
- Create: `src/app/api/work-items/[id]/route.ts`
- Create: `src/app/api/blockers/route.ts`
- Create: `src/app/api/blockers/[id]/route.ts`
- Create: `tests/operations-schema.test.ts`
- Create: `tests/operations-api.test.ts`

**Interfaces:**
- Produces operational models and endpoints.
- Role gates: OPERATOR and above can mutate; VIEWER can only GET. OWNER/ADMIN required for project cancellation and waiving blockers.

- [ ] **Step 1: Write operational schema and api validation tests**

Create `tests/operations-schema.test.ts`:
```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('Operational Schema Integrity', () => {
  it('valida a presença de tabelas operacionais e CHECK constraints', () => {
    const schema = readFileSync(resolve(__dirname, '../prisma/schema.prisma'), 'utf8');
    expect(schema).toContain('model Project');
    expect(schema).toContain('model ProjectUpdate');
    expect(schema).toContain('model WorkItem');
    expect(schema).toContain('model OperationalBlocker');
    expect(schema).toContain('model CommandAction');

    const migration = readFileSync(resolve(__dirname, '../prisma/migrations/202608240002_operations_foundation/migration.sql'), 'utf8');
    expect(migration).toContain('CHECK ("strategic_value" BETWEEN 1 AND 5)');
    expect(migration).toContain('CHECK ("mental_load" BETWEEN 1 AND 5)');
  });
});
```

Create `tests/operations-api.test.ts`:
```ts
import { describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';

// Mock auth context
const mockAuth = {
  session: { user: { id: 'usr_1', email: 'p@k.digital', name: 'Patrick', role: 'ADMIN' } },
  organizationId: 'org_kapel',
  membershipId: 'membership_patrick',
  role: 'OWNER' as const,
};

vi.mock('../src/lib/api-auth', () => ({
  withOrgContext: (handler: Function) => (req: NextRequest, ctx: any) => handler(req, ctx, mockAuth),
}));

import * as projectsRoute from '../src/app/api/projects/route';

describe('Operations API endpoints', () => {
  it('retorna lista vazia de projetos quando não há projetos no tenant', async () => {
    const req = new NextRequest('http://localhost/api/projects');
    const res = await projectsRoute.GET(req, {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(Array.isArray(body)).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify failures**

Run:
```powershell
npx vitest run tests/operations-schema.test.ts tests/operations-api.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Define schema additions**

Add operational models to `prisma/schema.prisma` (and their back-relations in `Membership` and `Organization`):
```prisma
enum ProjectStatus {
  PLANNING
  ACTIVE
  BLOCKED
  ON_HOLD
  COMPLETED
  CANCELLED
}

enum ProjectHealth {
  HEALTHY
  ATTENTION
  CRITICAL
}

enum ProjectSource {
  MANUAL
  SPREADSHEET
  CLICKUP
  OTHER
}

enum UpdateConfidence {
  CONFIRMED
  ESTIMATED
}

enum WorkItemType {
  ACTION
  FOLLOW_UP
  REVIEW
  DECISION
}

enum WorkItemStatus {
  OPEN
  DOING
  DONE
  BLOCKED
  CANCELLED
}

enum BlockerParty {
  KAPEL
  CLIENT
  PARTNER
  THIRD_PARTY
}

enum BlockerStatus {
  OPEN
  RESOLVED
  WAIVED
}

enum CommandActionType {
  START
  COMPLETE
  DEFER
  DELEGATE
}

model Project {
  id                    String        @id @default(cuid())
  organization_id       String
  organization          Organization  @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  contracting_client_id String
  contracting_client    Client        @relation(fields: [contracting_client_id], references: [id])
  contract_id           String?
  contract              Contract?     @relation(fields: [contract_id], references: [id], onDelete: SetNull)
  name                  String
  end_client_name       String?
  objective             String
  status                ProjectStatus @default(PLANNING)
  health                ProjectHealth @default(HEALTHY)
  owner_membership_id   String
  owner                 Membership    @relation("ProjectOwner", fields: [owner_membership_id], references: [id])
  deadline              DateTime?
  weekly_hours_estimate Float         @default(0)
  monthly_value_at_risk Decimal       @default(0) @db.Decimal(12, 2)
  strategic_value       Int           @default(3)
  mental_load           Int           @default(3)
  source                ProjectSource @default(MANUAL)
  external_id           String?
  external_url          String?
  last_update_at        DateTime?
  created_at            DateTime      @default(now())
  updated_at            DateTime      @updatedAt
  updates               ProjectUpdate[]
  work_items            WorkItem[]
  blockers              OperationalBlocker[]

  @@unique([organization_id, source, external_id])
  @@index([organization_id, status, health])
  @@index([organization_id, deadline])
}

model ProjectUpdate {
  id                   String           @id @default(cuid())
  organization_id      String
  organization         Organization     @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  project_id           String
  project              Project          @relation(fields: [project_id], references: [id], onDelete: Cascade)
  author_membership_id String
  author               Membership       @relation("UpdateAuthor", fields: [author_membership_id], references: [id])
  summary              String
  next_action          String
  blocker              String?
  metric_label         String?
  metric_value         String?
  confidence           UpdateConfidence @default(CONFIRMED)
  created_at           DateTime         @default(now())

  @@index([organization_id, project_id, created_at])
}

model WorkItem {
  id                     String         @id @default(cuid())
  organization_id        String
  organization           Organization   @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  project_id             String
  project                Project        @relation(fields: [project_id], references: [id], onDelete: Cascade)
  assignee_membership_id String?
  assignee               Membership?    @relation("WorkItemAssignee", fields: [assignee_membership_id], references: [id])
  title                  String
  type                   WorkItemType   @default(ACTION)
  status                 WorkItemStatus @default(OPEN)
  due_at                 DateTime?
  estimated_minutes      Int?
  external_source        String?
  external_id            String?
  completed_at           DateTime?
  created_at             DateTime       @default(now())
  updated_at             DateTime       @updatedAt
  command_actions        CommandAction[]

  @@unique([organization_id, external_source, external_id])
  @@index([organization_id, status, due_at])
}

model OperationalBlocker {
  id                String        @id @default(cuid())
  organization_id   String
  organization      Organization  @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  project_id        String
  project           Project       @relation(fields: [project_id], references: [id], onDelete: Cascade)
  description       String
  responsible_party BlockerParty
  blocks_delivery   Boolean       @default(true)
  status            BlockerStatus @default(OPEN)
  follow_up_at      DateTime?
  created_at        DateTime      @default(now())
  resolved_at       DateTime?

  @@index([organization_id, status, follow_up_at])
  @@index([organization_id, project_id])
}

model CommandAction {
  id                  String            @id @default(cuid())
  organization_id     String
  organization        Organization      @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  work_item_id        String
  work_item           WorkItem          @relation(fields: [work_item_id], references: [id], onDelete: Cascade)
  actor_membership_id String
  actor               Membership        @relation("CommandActor", fields: [actor_membership_id], references: [id])
  action              CommandActionType
  previous_status     WorkItemStatus
  resulting_status    WorkItemStatus
  reason              String?
  created_at          DateTime          @default(now())

  @@index([organization_id, created_at])
}
```
Update relations on `Membership` model to support back references:
```prisma
// model Membership { ...
//   owned_projects      Project[]            @relation("ProjectOwner")
//   authored_updates    ProjectUpdate[]      @relation("UpdateAuthor")
//   assigned_work_items WorkItem[]           @relation("WorkItemAssignee")
//   command_actions     CommandAction[]      @relation("CommandActor")
// }
```

- [ ] **Step 4: Create migration SQL**

Create `prisma/migrations/202608240002_operations_foundation/migration.sql`:
```sql
-- CreateEnum enums
CREATE TYPE "ProjectStatus" AS ENUM ('PLANNING', 'ACTIVE', 'BLOCKED', 'ON_HOLD', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ProjectHealth" AS ENUM ('HEALTHY', 'ATTENTION', 'CRITICAL');
CREATE TYPE "ProjectSource" AS ENUM ('MANUAL', 'SPREADSHEET', 'CLICKUP', 'OTHER');
CREATE TYPE "UpdateConfidence" AS ENUM ('CONFIRMED', 'ESTIMATED');
CREATE TYPE "WorkItemType" AS ENUM ('ACTION', 'FOLLOW_UP', 'REVIEW', 'DECISION');
CREATE TYPE "WorkItemStatus" AS ENUM ('OPEN', 'DOING', 'DONE', 'BLOCKED', 'CANCELLED');
CREATE TYPE "BlockerParty" AS ENUM ('KAPEL', 'CLIENT', 'PARTNER', 'THIRD_PARTY');
CREATE TYPE "BlockerStatus" AS ENUM ('OPEN', 'RESOLVED', 'WAIVED');
CREATE TYPE "CommandActionType" AS ENUM ('START', 'COMPLETE', 'DEFER', 'DELEGATE');

-- CreateTable Project
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "contracting_client_id" TEXT NOT NULL,
    "contract_id" TEXT,
    "name" TEXT NOT NULL,
    "end_client_name" TEXT,
    "objective" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNING',
    "health" "ProjectHealth" NOT NULL DEFAULT 'HEALTHY',
    "owner_membership_id" TEXT NOT NULL,
    "deadline" TIMESTAMP(3),
    "weekly_hours_estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "monthly_value_at_risk" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "strategic_value" INTEGER NOT NULL DEFAULT 3,
    "mental_load" INTEGER NOT NULL DEFAULT 3,
    "source" "ProjectSource" NOT NULL DEFAULT 'MANUAL',
    "external_id" TEXT,
    "external_url" TEXT,
    "last_update_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Project_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "check_strategic_value" CHECK ("strategic_value" BETWEEN 1 AND 5),
    CONSTRAINT "check_mental_load" CHECK ("mental_load" BETWEEN 1 AND 5)
);

-- CreateTable ProjectUpdate
CREATE TABLE "ProjectUpdate" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "author_membership_id" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "next_action" TEXT NOT NULL,
    "blocker" TEXT,
    "metric_label" TEXT,
    "metric_value" TEXT,
    "confidence" "UpdateConfidence" NOT NULL DEFAULT 'CONFIRMED',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable WorkItem
CREATE TABLE "WorkItem" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "assignee_membership_id" TEXT,
    "title" TEXT NOT NULL,
    "type" "WorkItemType" NOT NULL DEFAULT 'ACTION',
    "status" "WorkItemStatus" NOT NULL DEFAULT 'OPEN',
    "due_at" TIMESTAMP(3),
    "estimated_minutes" INTEGER,
    "external_source" TEXT,
    "external_id" TEXT,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "WorkItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable OperationalBlocker
CREATE TABLE "OperationalBlocker" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "responsible_party" "BlockerParty" NOT NULL,
    "blocks_delivery" BOOLEAN NOT NULL DEFAULT true,
    "status" "BlockerStatus" NOT NULL DEFAULT 'OPEN',
    "follow_up_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolved_at" TIMESTAMP(3),
    CONSTRAINT "OperationalBlocker_pkey" PRIMARY KEY ("id")
);

-- CreateTable CommandAction
CREATE TABLE "CommandAction" (
    "id" TEXT NOT NULL,
    "organization_id" TEXT NOT NULL,
    "work_item_id" TEXT NOT NULL,
    "actor_membership_id" TEXT NOT NULL,
    "action" "CommandActionType" NOT NULL,
    "previous_status" "WorkItemStatus" NOT NULL,
    "resulting_status" "WorkItemStatus" NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CommandAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndexes
CREATE UNIQUE INDEX "Project_organization_id_source_external_id_key" ON "Project"("organization_id", "source", "external_id");
CREATE INDEX "Project_organization_id_status_health_idx" ON "Project"("organization_id", "status", "health");
CREATE INDEX "Project_organization_id_deadline_idx" ON "Project"("organization_id", "deadline");

CREATE INDEX "ProjectUpdate_organization_id_project_id_created_at_idx" ON "ProjectUpdate"("organization_id", "project_id", "created_at");

CREATE UNIQUE INDEX "WorkItem_organization_id_external_source_external_id_key" ON "WorkItem"("organization_id", "external_source", "external_id");
CREATE INDEX "WorkItem_organization_id_status_due_at_idx" ON "WorkItem"("organization_id", "status", "due_at");

CREATE INDEX "OperationalBlocker_organization_id_status_follow_up_at_idx" ON "OperationalBlocker"("organization_id", "status", "follow_up_at");
CREATE INDEX "OperationalBlocker_organization_id_project_id_idx" ON "OperationalBlocker"("organization_id", "project_id");

CREATE INDEX "CommandAction_organization_id_created_at_idx" ON "CommandAction"("organization_id", "created_at");

-- AddForeignKeys
ALTER TABLE "Project" ADD CONSTRAINT "Project_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_contracting_client_id_fkey" FOREIGN KEY ("contracting_client_id") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_contract_id_fkey" FOREIGN KEY ("contract_id") REFERENCES "Contract"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Project" ADD CONSTRAINT "Project_owner_membership_id_fkey" FOREIGN KEY ("owner_membership_id") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProjectUpdate" ADD CONSTRAINT "ProjectUpdate_author_membership_id_fkey" FOREIGN KEY ("author_membership_id") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkItem" ADD CONSTRAINT "WorkItem_assignee_membership_id_fkey" FOREIGN KEY ("assignee_membership_id") REFERENCES "Membership"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "OperationalBlocker" ADD CONSTRAINT "OperationalBlocker_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OperationalBlocker" ADD CONSTRAINT "OperationalBlocker_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CommandAction" ADD CONSTRAINT "CommandAction_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommandAction" ADD CONSTRAINT "CommandAction_work_item_id_fkey" FOREIGN KEY ("work_item_id") REFERENCES "WorkItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CommandAction" ADD CONSTRAINT "CommandAction_actor_membership_id_fkey" FOREIGN KEY ("actor_membership_id") REFERENCES "Membership"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
```

- [ ] **Step 5: Write validation and operation types**

Create `src/lib/validation.ts`:
```ts
export function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Campo ${fieldName} é obrigatório.`);
  }
  return value;
}

export function readNumberInRange(value: unknown, min: number, max: number, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Campo ${fieldName} deve ser um número entre ${min} e ${max}.`);
  }
  return num;
}
```

Create `src/lib/operations.ts`:
```ts
import { ProjectStatus, ProjectHealth, ProjectSource } from '@prisma/client';

export type CreateProjectInput = {
  contractingClientId: string;
  contractId?: string;
  name: string;
  endClientName?: string;
  objective: string;
  status: ProjectStatus;
  health: ProjectHealth;
  ownerMembershipId: string;
  deadline?: string;
  weeklyHoursEstimate: number;
  monthlyValueAtRisk: number;
  strategicValue: number;
  mentalLoad: number;
  source: ProjectSource;
  initialWorkItem?: {
    title: string;
    assigneeMembershipId?: string;
    dueAt?: string;
    estimatedMinutes?: number;
  };
};
```

- [ ] **Step 6: Implement Projects API**

Create `src/app/api/projects/route.ts`:
```ts
import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { readRequiredString, readNumberInRange } from '@/lib/validation';

export const GET = withOrgContext(async (request, context, auth) => {
  const projects = await prisma.project.findMany({
    where: { organization_id: auth.organizationId },
    orderBy: { created_at: 'desc' },
  });
  return NextResponse.json(projects);
});

export const POST = withOrgContext(async (request, context, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const name = readRequiredString(body.name, 'name');
    const objective = readRequiredString(body.objective, 'objective');
    const strategicValue = readNumberInRange(body.strategicValue, 1, 5, 'strategicValue');
    const mentalLoad = readNumberInRange(body.mentalLoad, 1, 5, 'mentalLoad');

    const result = await prisma.$transaction(async (tx) => {
      const project = await tx.project.create({
        data: {
          organization_id: auth.organizationId,
          contracting_client_id: body.contractingClientId,
          contract_id: body.contractId,
          name,
          end_client_name: body.endClientName,
          objective,
          status: body.status || 'PLANNING',
          health: body.health || 'HEALTHY',
          owner_membership_id: body.ownerMembershipId,
          deadline: body.deadline ? new Date(body.deadline) : null,
          weekly_hours_estimate: Number(body.weeklyHoursEstimate || 0),
          monthly_value_at_risk: Number(body.monthlyValueAtRisk || 0),
          strategic_value: strategicValue,
          mental_load: mentalLoad,
          source: body.source || 'MANUAL',
        },
      });

      if (body.initialWorkItem && body.initialWorkItem.title) {
        await tx.workItem.create({
          data: {
            organization_id: auth.organizationId,
            project_id: project.id,
            title: body.initialWorkItem.title,
            assignee_membership_id: body.initialWorkItem.assigneeMembershipId || null,
            due_at: body.initialWorkItem.dueAt ? new Date(body.initialWorkItem.dueAt) : null,
            estimated_minutes: body.initialWorkItem.estimatedMinutes || null,
            status: 'OPEN',
          },
        });
      }

      return project;
    });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
```

Create project check-in route `src/app/api/projects/[id]/updates/route.ts`:
```ts
import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { readRequiredString } from '@/lib/validation';

export const POST = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const summary = readRequiredString(body.summary, 'summary');
    const nextAction = readRequiredString(body.nextAction, 'nextAction');

    const project = await prisma.project.findFirst({
      where: { id: params.id, organization_id: auth.organizationId },
    });
    if (!project) {
      return NextResponse.json({ error: 'Projeto não encontrado.' }, { status: 404 });
    }

    const update = await prisma.$transaction(async (tx) => {
      const pUpdate = await tx.projectUpdate.create({
        data: {
          organization_id: auth.organizationId,
          project_id: project.id,
          author_membership_id: auth.membershipId,
          summary,
          next_action: nextAction,
          blocker: body.blocker || null,
          confidence: body.confidence || 'CONFIRMED',
        },
      });

      await tx.project.update({
        where: { id: project.id },
        data: {
          last_update_at: new Date(),
          health: body.health || project.health,
          status: body.status || project.status,
        },
      });

      if (nextAction) {
        await tx.workItem.create({
          data: {
            organization_id: auth.organizationId,
            project_id: project.id,
            title: nextAction,
            status: 'OPEN',
            assignee_membership_id: body.nextActionAssignee || null,
          },
        });
      }

      if (body.blocker) {
        await tx.operationalBlocker.create({
          data: {
            organization_id: auth.organizationId,
            project_id: project.id,
            description: body.blocker,
            responsible_party: body.blockerResponsibleParty || 'CLIENT',
            blocks_delivery: true,
            status: 'OPEN',
          },
        });
      }

      return pUpdate;
    });

    return NextResponse.json(update);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
```

Create route `src/app/api/work-items/[id]/route.ts`:
```ts
import { withOrgContext } from '@/lib/api-auth';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const PATCH = withOrgContext(async (request, { params }: { params: { id: string } }, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  const existing = await prisma.workItem.findFirst({
    where: { id: params.id, organization_id: auth.organizationId },
  });
  if (!existing) {
    return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
  }

  const body = await request.json();
  const data: any = {};
  if (body.status) {
    data.status = body.status;
    if (body.status === 'DONE') {
      data.completed_at = new Date();
    } else {
      data.completed_at = null;
    }
  }

  const updated = await prisma.workItem.update({
    where: { id: params.id },
    data,
  });

  return NextResponse.json(updated);
});
```

- [ ] **Step 4: Run focused verification**

Run:
```powershell
npx prisma generate
npx vitest run tests/operations-schema.test.ts tests/operations-api.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add prisma/schema.prisma prisma/migrations/202608240002_operations_foundation/migration.sql src/lib/validation.ts src/lib/operations.ts src/app/api/projects src/app/api/work-items tests/operations-schema.test.ts tests/operations-api.test.ts
git commit -m "feat: add operational tables and project check-in APIs with transactions"
```

---

### Task 5: Deterministic Priority Engine

**Files:**
- Create: `src/lib/command/priority.ts`
- Create: `tests/priority.test.ts`

**Interfaces:**
- Produces: `scoreWorkItem(input: PriorityInput, now: Date): PriorityResult`
- Produces: `rankCommandItems(inputs: PriorityInput[], now: Date): RankedCommandItem[]`

- [ ] **Step 1: Write priority engine unit tests**

Create `tests/priority.test.ts`:
```ts
import { describe, expect, it } from 'vitest';
import { scoreWorkItem, rankCommandItems, PriorityInput } from '../src/lib/command/priority';

describe('Deterministic Prioritization Engine', () => {
  const now = new Date('2026-08-24T09:00:00Z');

  it('retorna score 0 se o projeto estiver bloqueado por terceiros', () => {
    const item: PriorityInput = {
      id: 'task_1',
      title: 'Action Item',
      type: 'ACTION',
      created_at: new Date(),
      project: {
        id: 'proj_1',
        name: 'Projeto 1',
        strategic_value: 3,
        owner_membership_id: 'membership_patrick',
        last_update_at: new Date(),
        monthly_value_at_risk: 0,
        blockers: [{
          id: 'b_1',
          status: 'OPEN',
          responsible_party: 'CLIENT',
          blocks_delivery: true,
          follow_up_at: null,
        }],
      },
      assignee_membership_id: 'membership_patrick',
      due_at: null,
      estimated_minutes: 30,
    };

    const res = scoreWorkItem(item, now);
    expect(res.score).toBe(0);
    expect(res.executable).toBe(false);
  });

  it('aplica pontuações para tarefas com vencimento e valor estratégico', () => {
    const item: PriorityInput = {
      id: 'task_2',
      title: 'Decisão Importante',
      type: 'DECISION',
      created_at: new Date(),
      project: {
        id: 'proj_2',
        name: 'Projeto 2',
        strategic_value: 5,
        owner_membership_id: 'membership_patrick',
        last_update_at: new Date(),
        monthly_value_at_risk: 6000,
        blockers: [],
      },
      assignee_membership_id: 'membership_patrick',
      due_at: new Date('2026-08-24T18:00:00Z'),
      estimated_minutes: 10,
    };

    const res = scoreWorkItem(item, now);
    expect(res.score).toBeGreaterThan(50);
    expect(res.executable).toBe(true);
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:
```powershell
npx vitest run tests/priority.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement mathematical prioritisation logic**

Create `src/lib/command/priority.ts`:
```ts
export type PriorityInput = {
  id: string;
  title: string;
  type: 'ACTION' | 'FOLLOW_UP' | 'REVIEW' | 'DECISION';
  created_at: Date;
  project: {
    id: string;
    name: string;
    strategic_value: number;
    owner_membership_id: string;
    last_update_at: Date | null;
    monthly_value_at_risk: number;
    blockers: Array<{
      id: string;
      status: 'OPEN' | 'RESOLVED' | 'WAIVED';
      responsible_party: 'KAPEL' | 'CLIENT' | 'PARTNER' | 'THIRD_PARTY';
      blocks_delivery: boolean;
      follow_up_at: Date | null;
    }>;
  };
  assignee_membership_id: string | null;
  due_at: Date | null;
  estimated_minutes: number | null;
};

export type PriorityResult = {
  score: number;
  executable: boolean;
  factors: {
    deadline: number;
    financialImpact: number;
    unblockImpact: number;
    strategicValue: number;
    founderNeed: number;
    effortEfficiency: number;
    staleConfidencePenalty: number;
  };
  explanation: string[];
};

export function scoreWorkItem(item: PriorityInput, now: Date): PriorityResult {
  const explanation: string[] = [];
  
  // 1. Check external blockers
  const externalBlocker = item.project.blockers.find(
    (b) => b.status === 'OPEN' && b.blocks_delivery && b.responsible_party !== 'KAPEL'
  );

  let executable = true;
  if (externalBlocker) {
    const isOverdueFollowUp = item.type === 'FOLLOW_UP' && externalBlocker.follow_up_at && externalBlocker.follow_up_at <= now;
    if (!isOverdueFollowUp) {
      executable = false;
    }
  }

  if (!executable) {
    return {
      score: 0,
      executable: false,
      factors: { deadline: 0, financialImpact: 0, unblockImpact: 0, strategicValue: 0, founderNeed: 0, effortEfficiency: 0, staleConfidencePenalty: 0 },
      explanation: ['Bloqueado por terceiros.'],
    };
  }

  // 2. Calculations
  // Deadline
  let deadline = 0;
  if (item.due_at) {
    const diff = item.due_at.getTime() - now.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days < 0) {
      deadline = 25;
      explanation.push('Atrasado: +25');
    } else if (days <= 1) {
      deadline = 22;
      explanation.push('Vence hoje/amanhã: +22');
    } else if (days <= 3) {
      deadline = 17;
      explanation.push('Vence em até 3 dias: +17');
    } else if (days <= 7) {
      deadline = 10;
      explanation.push('Vence em até 7 dias: +10');
    }
  }

  // Financial Impact
  let financialImpact = 0;
  const risk = item.project.monthly_value_at_risk;
  if (risk >= 10000) {
    financialImpact = 25;
    explanation.push('Impacto financeiro crítico: +25');
  } else if (risk >= 5000) {
    financialImpact = 20;
    explanation.push('Impacto financeiro alto: +20');
  } else if (risk >= 2000) {
    financialImpact = 14;
    explanation.push('Impacto financeiro médio: +14');
  } else if (risk > 0) {
    financialImpact = 7;
    explanation.push('Impacto financeiro baixo: +7');
  }

  // Unblock Impact
  let unblockImpact = 0;
  const hasKapelBlocker = item.project.blockers.some((b) => b.status === 'OPEN' && b.responsible_party === 'KAPEL');
  if (item.type === 'FOLLOW_UP' && externalBlocker) {
    unblockImpact = 20;
    explanation.push('Follow-up de bloqueio ativo: +20');
  } else if (hasKapelBlocker && item.type === 'DECISION') {
    unblockImpact = 12;
    explanation.push('Decisão necessária para desbloqueio: +12');
  }

  // Strategic Value
  const strategicValue = item.project.strategic_value * 3;
  if (strategicValue > 0) {
    explanation.push(`Valor estratégico do projeto: +${strategicValue}`);
  }

  // Founder Need
  let founderNeed = 0;
  if (item.assignee_membership_id === item.project.owner_membership_id) {
    founderNeed = 10;
    explanation.push('Necessidade do fundador responsável: +10');
  }

  // Effort Efficiency
  let effortEfficiency = 0;
  const minutes = item.estimated_minutes || 60;
  if (minutes <= 15) {
    effortEfficiency = 5;
    explanation.push('Rápida execução (<15 min): +5');
  } else if (minutes <= 30) {
    effortEfficiency = 4;
  } else if (minutes <= 60) {
    effortEfficiency = 3;
  } else if (minutes <= 120) {
    effortEfficiency = 2;
  } else {
    effortEfficiency = 1;
  }

  // Stale confidence penalty
  let staleConfidencePenalty = 0;
  if (item.project.last_update_at) {
    const diff = now.getTime() - item.project.last_update_at.getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    if (days > 7) {
      staleConfidencePenalty = -5;
      explanation.push('Projeto sem atualização há 7+ dias: -5');
    }
  }

  const rawScore = deadline + financialImpact + unblockImpact + strategicValue + founderNeed + effortEfficiency + staleConfidencePenalty;
  const score = Math.max(0, Math.min(100, rawScore));

  return {
    score,
    executable,
    factors: {
      deadline,
      financialImpact,
      unblockImpact,
      strategicValue,
      founderNeed,
      effortEfficiency,
      staleConfidencePenalty,
    },
    explanation,
  };
}

export type RankedCommandItem = {
  id: string;
  title: string;
  score: number;
  project_id: string;
  project_name: string;
  explanation: string[];
  due_at: Date | null;
  estimated_minutes: number | null;
};

export function rankCommandItems(inputs: PriorityInput[], now: Date): RankedCommandItem[] {
  const scored = inputs
    .map((item) => {
      const res = scoreWorkItem(item, now);
      return { item, res };
    })
    .filter((x) => x.res.executable && x.res.score > 0);

  scored.sort((a, b) => {
    if (b.res.score !== a.res.score) {
      return b.res.score - a.res.score;
    }
    const dueA = a.item.due_at ? a.item.due_at.getTime() : Infinity;
    const dueB = b.item.due_at ? b.item.due_at.getTime() : Infinity;
    if (dueA !== dueB) {
      return dueA - dueB;
    }
    return a.item.created_at.getTime() - b.item.created_at.getTime();
  });

  return scored.map(({ item, res }) => ({
    id: item.id,
    title: item.title,
    score: res.score,
    project_id: item.project.id,
    project_name: item.project.name,
    explanation: res.explanation,
    due_at: item.due_at,
    estimated_minutes: item.estimated_minutes,
  }));
}
```

- [ ] **Step 4: Run tests and verify they pass**

Run:
```powershell
npx vitest run tests/priority.test.ts
```
Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add src/lib/command/priority.ts tests/priority.test.ts
git commit -m "feat: add deterministic priority ranking engine"
```

---

### Task 6: Command Read-Model and APIs

**Files:**
- Create: `src/lib/command/read-model.ts`
- Create: `src/app/api/command/route.ts`
- Create: `tests/command-api.test.ts`

**Interfaces:**
- Produces: `getCommandReadModel(auth: OrgRequestContext, now: Date): Promise<CommandResponse>`
- GET `/api/command` and POST `/api/command` routes.

- [ ] **Step 1: Write Command API test**

Create `tests/command-api.test.ts`:
```ts
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

import * as commandRoute from '../src/app/api/command/route';

describe('Command API', () => {
  it('deve retornar o modelo de leitura diário estruturado', async () => {
    const req = new NextRequest('http://localhost/api/command');
    const res = await commandRoute.GET(req, {});
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty('decisions');
    expect(body).toHaveProperty('revenueAtRisk');
  });
});
```

- [ ] **Step 2: Run test and verify it fails**

Run:
```powershell
npx vitest run tests/command-api.test.ts
```
Expected: FAIL.

- [ ] **Step 3: Implement read model mapper**

Create `src/lib/command/read-model.ts`:
```ts
import { prisma } from '../prisma';
import { OrgRequestContext } from '../api-auth';
import { rankCommandItems, PriorityInput } from './priority';

export async function getCommandReadModel(auth: OrgRequestContext, now: Date) {
  // Query all active work items and projects in organization
  const openItems = await prisma.workItem.findMany({
    where: {
      organization_id: auth.organizationId,
      status: { in: ['OPEN', 'DOING'] },
    },
    include: {
      project: {
        include: {
          blockers: {
            where: { status: 'OPEN' },
          },
        },
      },
    },
  });

  const priorityInputs: PriorityInput[] = openItems.map((item) => ({
    id: item.id,
    title: item.title,
    type: item.type as any,
    created_at: item.created_at,
    project: {
      id: item.project.id,
      name: item.project.name,
      strategic_value: item.project.strategic_value,
      owner_membership_id: item.project.owner_membership_id,
      last_update_at: item.project.last_update_at,
      monthly_value_at_risk: Number(item.project.monthly_value_at_risk),
      blockers: item.project.blockers.map((b) => ({
        id: b.id,
        status: b.status as any,
        responsible_party: b.responsible_party as any,
        blocks_delivery: b.blocks_delivery,
        follow_up_at: b.follow_up_at,
      })),
    },
    assignee_membership_id: item.assignee_membership_id,
    due_at: item.due_at,
    estimated_minutes: item.estimated_minutes,
  }));

  const ranked = rankCommandItems(priorityInputs, now);
  const founderRanked = ranked.filter((x) => {
    const item = openItems.find((o) => o.id === x.id);
    return item?.assignee_membership_id === auth.membershipId;
  });

  // Extract top 3 decisions
  const decisions = founderRanked.slice(0, 3);

  // Revenue risk
  const riskProjects = await prisma.project.findMany({
    where: {
      organization_id: auth.organizationId,
      health: { in: ['ATTENTION', 'CRITICAL'] },
      monthly_value_at_risk: { gt: 0 },
    },
  });

  const revenueAtRisk = riskProjects.map((p) => ({
    projectId: p.id,
    projectName: p.name,
    amount: Number(p.monthly_value_at_risk),
    reason: p.health === 'CRITICAL' ? 'Saúde crítica' : 'Atenção necessária',
  }));

  // Blockers
  const openBlockers = await prisma.operationalBlocker.findMany({
    where: {
      organization_id: auth.organizationId,
      status: 'OPEN',
      responsible_party: { in: ['CLIENT', 'PARTNER', 'THIRD_PARTY'] },
    },
    include: { project: true },
  });

  const externalBlockers = openBlockers.map((b) => ({
    id: b.id,
    projectName: b.project.name,
    description: b.description,
    responsibleParty: b.responsible_party,
    followUpAt: b.follow_up_at,
  }));

  // Delegations
  const delegations = openItems
    .filter((o) => o.assignee_membership_id && o.assignee_membership_id !== auth.membershipId)
    .map((o) => ({
      id: o.id,
      title: o.title,
      projectName: o.project.name,
      assigneeMembershipId: o.assignee_membership_id,
    }));

  return {
    generatedAt: now.toISOString(),
    decisions,
    revenueAtRisk,
    externalBlockers,
    delegations,
    notNow: ranked.slice(3),
  };
}
```

- [ ] **Step 4: Implement Route APIs**

Create `src/app/api/command/route.ts`:
```ts
import { withOrgContext } from '@/lib/api-auth';
import { getCommandReadModel } from '@/lib/command/read-model';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { readRequiredString } from '@/lib/validation';

export const GET = withOrgContext(async (request, context, auth) => {
  const model = await getCommandReadModel(auth, new Date());
  return NextResponse.json(model);
});

export const POST = withOrgContext(async (request, context, auth) => {
  if (auth.role === 'VIEWER') {
    return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 });
  }
  try {
    const body = await request.json();
    const workItemId = readRequiredString(body.workItemId, 'workItemId');
    const action = readRequiredString(body.action, 'action'); // START, COMPLETE, DEFER, DELEGATE

    const item = await prisma.workItem.findFirst({
      where: { id: workItemId, organization_id: auth.organizationId },
    });
    if (!item) {
      return NextResponse.json({ error: 'Item não encontrado.' }, { status: 404 });
    }

    const previousStatus = item.status;
    let resultingStatus = item.status;

    if (action === 'COMPLETE') {
      resultingStatus = 'DONE';
    } else if (action === 'DEFER') {
      resultingStatus = 'OPEN';
    }

    const log = await prisma.$transaction(async (tx) => {
      const updatedItem = await tx.workItem.update({
        where: { id: item.id },
        data: {
          status: resultingStatus,
          completed_at: resultingStatus === 'DONE' ? new Date() : null,
        },
      });

      return await tx.commandAction.create({
        data: {
          organization_id: auth.organizationId,
          work_item_id: item.id,
          actor_membership_id: auth.membershipId,
          action: action as any,
          previous_status: previousStatus,
          resulting_status: resultingStatus,
          reason: body.reason || null,
        },
      });
    });

    return NextResponse.json(log);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
});
```

- [ ] **Step 5: Run tests and verify they pass**

Run:
```powershell
npx vitest run tests/command-api.test.ts
```
Expected: PASS.

- [ ] **Step 6: Commit**

```powershell
git add src/lib/command/read-model.ts src/app/api/command/route.ts tests/command-api.test.ts
git commit -m "feat: implement Command central daily read-model API and decision ledger"
```

---

### Task 7: Full Repository Verification and Type Checking

- [ ] **Step 1: Run typechecks**
Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 2: Run all unit and integration tests**
Run: `npm test`
Expected: PASS (All 33 + new tests).

- [ ] **Step 3: Run production build**
Run: `npm run build`
Expected: PASS.
