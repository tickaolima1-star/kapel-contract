# KAPEL Command Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar, dentro do KAPEL Contract, uma primeira fatia segura e utilizável do KAPEL Command que separa projetos operacionais de contratos e mostra as três melhores decisões do dia, receita em risco, bloqueios externos, delegações e itens fora do foco.

**Architecture:** A entrega preserva o módulo Contract e acrescenta os módulos Operations e Command na mesma aplicação Next.js. A autorização é resolvida no servidor a partir da sessão e da `Membership`, cada dado privado é escopado por `organization_id`, e um motor TypeScript puro calcula prioridades reproduzíveis antes de a API montar o read model do Command; a interface consome esse read model e reutiliza o shell visual existente.

**Tech Stack:** Next.js 14.2.5 App Router, React 18.3.1, TypeScript 5.5, Prisma 5.16/PostgreSQL, Tailwind CSS 3.4.4, Lucide React 0.400, JWT (`jsonwebtoken` no Node e `jose` no Edge), Vitest 1.6, Testing Library e jsdom.

**Spec:** `docs/superpowers/specs/2026-08-23-kapel-command-design.md`

## Global Constraints

- Evoluir o repositório existente; KAPEL Command é um módulo do mesmo app e `Contract` permanece funcional como módulo comercial/jurídico.
- Manter `/dashboard` intacto como dashboard comercial nesta entrega; adicionar `/command` e `/operations`, sem redirecionar a raiz para `/command` ainda.
- Usar Next.js 14.2.5, React 18.3.1, Prisma 5.16/PostgreSQL, Tailwind CSS 3.4.4 e Vitest 1.6 já adotados pelo repositório.
- Toda tabela nova de negócio deve conter `organization_id`; `Client` e `Contract` existentes também passam a ser escopados por organização.
- Resolver `organization_id`, `membership_id` e função exclusivamente no servidor; nunca aceitar escopo organizacional do body, query string ou headers do cliente.
- O middleware é apenas redirecionamento rápido. Toda API privada deve validar criptograficamente a sessão e, quando acessar dados, a organização e a função.
- O motor de prioridade é determinístico, puro, limitado a 0–100 e sempre expõe fatores e explicação; nenhuma IA participa desta entrega.
- Trabalho bloqueado por `CLIENT`, `PARTNER` ou `THIRD_PARTY` não entra nas três decisões como bloco de execução; somente o follow-up devido pode entrar.
- Financeiro completo, dívida, caixa, equipe completa, IA, ClickUp, Sheets/Adveronix, SaaS, billing e onboarding público não entram nesta entrega. “Receita em risco” usa `Project.monthly_value_at_risk`; delegação usa `Membership` e `WorkItem.assignee_membership_id`.
- Reutilizar `src/components/AdminLayout.tsx`, `src/components/Header.tsx`, `src/components/Sidebar.tsx`, as fontes Inter Tight/IBM Plex Mono de `src/app/layout.tsx`, os tokens escuros/verdes de `src/app/globals.css` e ícones Lucide. Não criar outra identidade visual.
- Cada controle novo precisa de rótulo acessível, foco visível, uso por teclado, contraste legível e layout funcional em 375 px e 1280 px.
- Mutação inválida retorna JSON legível no formato `{ error: string, fieldErrors?: Record<string, string> }`; o cliente preserva os valores preenchidos.
- Não registrar token, senha, corpo integral de importação ou campos operacionais sensíveis em logs.
- Cada tarefa segue teste falhando → implementação mínima → teste passando → commit. Não misturar refatorações não relacionadas.

## File Map

- `src/lib/jwt-secret.ts`: segredo JWT obrigatório compartilhado sem imports incompatíveis com Edge.
- `src/lib/auth.ts`: assinatura/verificação JWT no runtime Node e leitura de sessão.
- `src/lib/auth-edge.ts`: verificação HS256 compatível com Edge para o middleware.
- `src/lib/api-auth.ts`: wrappers `withSession` e `withOrgContext`, respostas 401/403 e matriz de função.
- `src/lib/validation.ts`: parsing pequeno e explícito dos payloads de Operations/Command, sem adicionar framework de validação.
- `prisma/schema.prisma` e migrações `202608230001_organization_foundation` / `202608230002_operations_foundation`: organização, escopo legado, Operations e histórico de ações do Command.
- `src/lib/operations.ts`: tipos de domínio e selects/includes Prisma compartilhados pelos endpoints operacionais.
- `src/lib/command/priority.ts`: pontuação pura e explicável.
- `src/lib/command/read-model.ts`: consultas escopadas e composição do `CommandResponse`.
- `src/app/api/projects/**`, `src/app/api/work-items/**`, `src/app/api/blockers/**`: API operacional.
- `src/app/api/command/route.ts`: leitura diária e registro das decisões do usuário.
- `src/app/operations/**`: entrada manual mínima para alimentar a central.
- `src/app/command/**` e `src/components/command/**`: central diária focada.
- `src/app/dashboard/page.tsx`: dashboard comercial monolítico existente, usado como alvo explícito de não regressão e não como base para copiar o novo módulo.
- `tests/**`: unidade, autorização, migração, API, componentes e não regressão.

---

### Task 1: Make JWT verification fail closed and provide reusable API guards

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `.env.production.example`
- Modify: `src/lib/auth.ts`
- Create: `src/lib/jwt-secret.ts`
- Create: `src/lib/auth-edge.ts`
- Create: `src/lib/api-auth.ts`
- Modify: `src/middleware.ts`
- Modify: `tests/security.test.ts`
- Create: `tests/api-auth.test.ts`
- Create: `vitest.config.ts`
- Create: `.eslintrc.json`

**Interfaces:**
- Produces: `getJwtSecret(): Uint8Array`, `verifySessionToken(token: string): AuthSession | null`, `verifyEdgeSessionToken(token: string): Promise<AuthSession | null>`.
- Produces: `withSession<TContext>(handler)`.
- Error contract: missing/invalid session → `401 { error: 'Sessão inválida ou expirada.' }`.

- [ ] **Step 1: Add failing security and guard tests**

Extend `tests/security.test.ts` so each test sets and restores `process.env.JWT_SECRET`, then add these cases:

```ts
it('falha fechado quando JWT_SECRET não existe', () => {
  delete process.env.JWT_SECRET;
  expect(() => signSessionToken(user)).toThrow('JWT_SECRET é obrigatório');
});

it('rejeita token assinado com outra chave', () => {
  process.env.JWT_SECRET = 'chave-com-32-bytes-para-testes-01';
  const token = signSessionToken(user);
  process.env.JWT_SECRET = 'chave-com-32-bytes-para-testes-02';
  expect(verifySessionToken(token)).toBeNull();
});
```

In `tests/api-auth.test.ts`, mock `getSession` and assert that the handler is not called on 401 and receives the session on success:

```ts
expect(handler).toHaveBeenCalledWith(request, routeContext, validSession);
```

- [ ] **Step 2: Run the new tests and confirm the expected failure**

Run: `npm test -- tests/security.test.ts tests/api-auth.test.ts`

Expected: FAIL because the current fallback still signs without `JWT_SECRET` and `src/lib/api-auth.ts` / `src/lib/auth-edge.ts` do not exist.

- [ ] **Step 3: Add the minimal fail-closed implementation**

Add `jose` to dependencies and Testing Library/jsdom plus `eslint@8.57.0` and `eslint-config-next@14.2.5` to dev dependencies. Configure the `@` alias in `vitest.config.ts` with `fileURLToPath(new URL('./src', import.meta.url))` and keep the default environment `node`. Create `.eslintrc.json` with `{ "extends": "next/core-web-vitals" }` so `npm run lint` is non-interactive.

Use one dependency-free secret accessor in `src/lib/jwt-secret.ts` so Edge code never imports `cookies`, `bcryptjs` or `jsonwebtoken`:

```ts
export function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    throw new Error('JWT_SECRET é obrigatório e deve ter ao menos 32 caracteres.');
  }
  return new TextEncoder().encode(value);
}
```

Keep `jsonwebtoken` for Node signing/verifying by converting the bytes back to a string; explicitly set `algorithm: 'HS256'` when signing and `algorithms: ['HS256']` when verifying. In `src/lib/auth-edge.ts`, import only `jose`, `AuthSession` as a type and `getJwtSecret`, use `jwtVerify(token, getJwtSecret(), { algorithms: ['HS256'] })`, and validate that the payload contains `user.id`, `user.email`, `user.name` and `user.role` as strings.

Implement the session wrapper with this signature:

```ts
export function withSession<TContext>(
  handler: (request: NextRequest, context: TContext, session: AuthSession) => Promise<Response>,
): (request: NextRequest, context: TContext) => Promise<Response>;
```

Change `src/middleware.ts` to await `verifyEdgeSessionToken`, add `/command` and `/operations` to protected UI routes, and retain `/dashboard` as the root redirect target. Add `JWT_SECRET=` plus a comment requiring at least 32 random characters to `.env.production.example`.

- [ ] **Step 4: Run focused verification**

Run: `npm install && npm test -- tests/security.test.ts tests/api-auth.test.ts`

Expected: both files PASS; a token with another secret and a malformed token produce `null`; the wrappers return exact 401/403 payloads.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json .env.production.example .eslintrc.json vitest.config.ts src/lib/jwt-secret.ts src/lib/auth.ts src/lib/auth-edge.ts src/lib/api-auth.ts src/middleware.ts tests/security.test.ts tests/api-auth.test.ts
git commit -m "fix: enforce verified sessions for private APIs"
```

---

### Task 2: Add organization and membership foundation with a safe legacy-data migration

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/202608230001_organization_foundation/migration.sql`
- Modify: `prisma/seed.ts`
- Create: `tests/organization-migration.test.ts`
- Modify: `src/lib/api-auth.ts`
- Modify: `tests/api-auth.test.ts`

**Interfaces:**
- Produces Prisma models `Organization`, `Membership` and enum `MembershipRole`.
- Extends `User` with `memberships`, `Client` with required `organization_id`, and `Contract` with required `organization_id`.
- Stable bootstrap identifiers: organization `org_kapel`, slug `kapel`; Patrick membership `membership_patrick` with role `OWNER`.
- Produces: `withOrgContext<TContext>(handler, allowedRoles?)`; `OrgRequestContext = { session, organizationId, membershipId, role }`.
- Error contract: missing/inactive membership or disallowed role → `403 { error: 'Acesso não autorizado para esta organização.' }`.

- [ ] **Step 1: Write a migration contract test before changing the schema**

Create a test that reads the SQL file and asserts ordering and invariants rather than connecting to production:

```ts
const sql = readFileSync(migrationPath, 'utf8');
expect(sql).toContain('CREATE TYPE "MembershipRole"');
expect(sql).toContain("'org_kapel', 'KAPEL', 'kapel'");
expect(sql.indexOf('UPDATE "Client"')).toBeLessThan(sql.indexOf('ALTER COLUMN "organization_id" SET NOT NULL'));
expect(sql.indexOf('UPDATE "Contract"')).toBeLessThan(sql.lastIndexOf('ALTER COLUMN "organization_id" SET NOT NULL'));
expect(sql).toContain('FOREIGN KEY ("organization_id") REFERENCES "Organization"("id")');
```

Extend `tests/api-auth.test.ts` to mock Prisma membership lookup and assert that a valid session without an active membership returns 403, a disallowed role returns 403, and the handler receives this exact context on success:

```ts
expect(handler).toHaveBeenCalledWith(request, routeContext, {
  session: validSession,
  organizationId: 'org_kapel',
  membershipId: 'membership_patrick',
  role: 'OWNER',
});
```

- [ ] **Step 2: Run the migration test and confirm it fails**

Run: `npm test -- tests/organization-migration.test.ts`

Expected: FAIL because the migration file does not exist.

- [ ] **Step 3: Define the schema and concrete migration**

Add these Prisma definitions (using the repository's snake_case field convention):

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
```

The migration must: create enum/tables; insert `org_kapel`; add nullable `organization_id` to `Client` and `Contract`; set both to `org_kapel`; make both columns required; create indexes and foreign keys. Do not derive organization from request data. Update `prisma/seed.ts` to upsert the organization first, upsert Patrick, then upsert `membership_patrick`, and run scoped `updateMany` for any legacy rows whose organization is not `org_kapel`.

Add these interfaces to `src/lib/api-auth.ts` and implement the organization wrapper on top of `withSession`:

```ts
export type MembershipRole = 'OWNER' | 'ADMIN' | 'OPERATOR' | 'VIEWER';
export type OrgRequestContext = {
  session: AuthSession;
  organizationId: string;
  membershipId: string;
  role: MembershipRole;
};

export function withOrgContext<TContext>(
  handler: (request: NextRequest, context: TContext, auth: OrgRequestContext) => Promise<Response>,
  allowedRoles?: MembershipRole[],
): (request: NextRequest, context: TContext) => Promise<Response>;
```

`withOrgContext` queries `membership.findFirst({ where: { user_id: session.user.id, organization: { active: true } }, orderBy: { created_at: 'asc' } })`; choosing the first active membership is the internal-first rule until an explicit organization switcher exists.

- [ ] **Step 4: Verify schema and migration contract**

Run: `npx prisma format && npx prisma validate && npx prisma generate && npm test -- tests/organization-migration.test.ts tests/api-auth.test.ts`

Expected: Prisma reports a valid schema and the migration contract test PASSes.

- [ ] **Step 5: Verify against a disposable PostgreSQL database**

Run with `DATABASE_URL` and `DIRECT_URL` pointing to an empty disposable PostgreSQL database: `npx prisma migrate deploy && npx prisma db seed`

Expected: migration and seed exit 0; exactly one `kapel` organization and one `(org_kapel, Patrick)` membership exist; all pre-existing clients/contracts have `organization_id = 'org_kapel'`.

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/202608230001_organization_foundation/migration.sql prisma/seed.ts src/lib/api-auth.ts tests/organization-migration.test.ts tests/api-auth.test.ts
git commit -m "feat: add organization membership foundation"
```

---

### Task 3: Protect and organization-scope every existing private API

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
- Modify: `src/app/api/projects/import-sheet/route.ts`
- Modify: `src/app/api/services/route.ts`
- Modify: `src/app/api/services/[id]/route.ts`
- Modify: `src/app/api/settings/route.ts`
- Create: `tests/private-api-auth.test.ts`
- Create: `tests/tenant-scope.test.ts`

**Interfaces:**
- Consumes: `withSession` from Task 1, `withOrgContext` and `OrgRequestContext` from Task 2, and required `organization_id` fields from Task 2.
- Produces: all private handlers return 401 before touching Prisma without a valid session and use server-resolved `auth.organizationId` for every Client/Contract read/write.
- Explicitly public and unchanged: `POST /api/auth/login`, `POST /api/auth/logout`, `/api/contracts/public/sign/[token]`, `/api/contracts/public/verify/[hash]`.

- [ ] **Step 1: Add an exhaustive behavioral authentication test**

In `tests/private-api-auth.test.ts`, mock `@/lib/auth` to return `null`, import every exported verb listed above, invoke each handler with a minimal `NextRequest`, and assert status 401 plus no Prisma calls. Represent every route/verb as a named table entry so omission is visible in review:

```ts
const cases = [
  ['POST /api/auth/change-password', changePassword.POST],
  ['GET /api/categories', categories.GET],
  ['GET /api/dashboard', dashboard.GET],
  ['GET /api/clients', clients.GET],
  ['POST /api/clients', clients.POST],
  ['GET /api/clients/[id]', clientById.GET],
  ['PUT /api/clients/[id]', clientById.PUT],
  ['DELETE /api/clients/[id]', clientById.DELETE],
  ['GET /api/contracts', contracts.GET],
  ['POST /api/contracts', contracts.POST],
  ['GET /api/contracts/[id]', contractById.GET],
  ['PUT /api/contracts/[id]', contractById.PUT],
  ['DELETE /api/contracts/[id]', contractById.DELETE],
  ['POST /api/contracts/[id]/duplicate', duplicateContract.POST],
  ['POST /api/contracts/[id]/sign-kapel', signKapel.POST],
  ['POST /api/contracts/import', importContract.POST],
  ['POST /api/projects/import-sheet', importSheet.POST],
  ['GET /api/services', services.GET],
  ['POST /api/services', services.POST],
  ['PUT /api/services/[id]', serviceById.PUT],
  ['DELETE /api/services/[id]', serviceById.DELETE],
  ['GET /api/settings', settings.GET],
  ['PUT /api/settings', settings.PUT],
] as const;
```

The completed table must contain every exported handler from all 14 private route files in this task; the four explicitly public routes must not appear.

- [ ] **Step 2: Add cross-tenant tests for legacy entities**

In `tests/tenant-scope.test.ts`, mock a valid `org_kapel` context and assert:

```ts
expect(prisma.client.findFirst).toHaveBeenCalledWith(expect.objectContaining({
  where: expect.objectContaining({ id: 'client_other', organization_id: 'org_kapel' }),
}));
expect(prisma.contract.updateMany).toHaveBeenCalledWith(expect.objectContaining({
  where: { id: 'contract_other', organization_id: 'org_kapel' },
}));
```

Also assert a zero-count `updateMany`/`deleteMany` produces 404 and that create payloads overwrite any submitted `organization_id` with `auth.organizationId`.

- [ ] **Step 3: Run both test files and confirm failure**

Run: `npm test -- tests/private-api-auth.test.ts tests/tenant-scope.test.ts`

Expected: FAIL because current handlers call Prisma without guards or tenant predicates.

- [ ] **Step 4: Wrap and scope all private handlers**

Export handlers through the guards:

```ts
export const GET = withOrgContext(async (req, route, auth) => {
  return NextResponse.json(await prisma.client.findMany({
    where: { organization_id: auth.organizationId, ...safeFilters },
  }));
});
```

For ID reads, use `findFirst({ where: { id, organization_id } })`; for ID updates/deletes, use `updateMany`/`deleteMany` with both keys and fetch the updated record afterward. Add `organization_id: auth.organizationId` to all Client/Contract creates and duplicates. The dashboard must scope its three parallel queries. Import routes must require `OWNER`, `ADMIN` or `OPERATOR`, limit uploads to 5 MiB, accept only `.csv`, `.xlsx`, `.xls`, `.docx` and `.pdf` according to each route's purpose, and run writes in a Prisma transaction so a rejected batch does not partially persist.

Use `withSession` only for change-password. Use `withOrgContext` for every other private route. Write actions on services and settings require `OWNER` or `ADMIN`; categories, services and settings remain global in this internal-first slice, but access is still authenticated and role-gated.

- [ ] **Step 5: Run focused and existing regression tests**

Run: `npm test -- tests/private-api-auth.test.ts tests/tenant-scope.test.ts tests/security.test.ts tests/importer.test.ts tests/signature.test.ts`

Expected: all files PASS; public signing and verification tests remain green.

- [ ] **Step 6: Commit**

```bash
git add src/app/api tests/private-api-auth.test.ts tests/tenant-scope.test.ts
git commit -m "fix: scope private APIs to authenticated organizations"
```

---

### Task 4: Add the operational data model and command action history

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/202608230002_operations_foundation/migration.sql`
- Create: `tests/operations-schema.test.ts`

**Interfaces:**
- Produces: Prisma enums `ProjectStatus`, `ProjectHealth`, `ProjectSource`, `UpdateConfidence`, `WorkItemType`, `WorkItemStatus`, `BlockerParty`, `BlockerStatus`, `CommandActionType`.
- Produces: models `Project`, `ProjectUpdate`, `WorkItem`, `OperationalBlocker`, `CommandAction` with organization-safe relations and indexes.

- [ ] **Step 1: Add a failing schema contract test**

Read `prisma/schema.prisma` and assert the exact required models, enum members, relations and indexes. Include these invariants:

```ts
expect(schema).toMatch(/model Project[\s\S]*organization_id String/);
expect(schema).toMatch(/model ProjectUpdate[\s\S]*next_action String/);
expect(schema).toMatch(/model WorkItem[\s\S]*estimated_minutes Int\?/);
expect(schema).toMatch(/model OperationalBlocker[\s\S]*follow_up_at DateTime\?/);
expect(schema).toContain('@@unique([organization_id, external_source, external_id])');
```

- [ ] **Step 2: Run the schema test and confirm it fails**

Run: `npm test -- tests/operations-schema.test.ts`

Expected: FAIL because the operational models do not exist.

- [ ] **Step 3: Add exact operational models**

Add the operational relations `projects`, `work_items`, `blockers`, `project_updates` and `command_actions` to `Organization`; add owner/update/assignee/action back-relations to `Membership`; and add `projects Project[]` to both `Client` and `Contract`. Then implement the spec fields with typed enums. Use these additional integrity fields needed by the first slice:

```prisma
enum ProjectStatus { PLANNING ACTIVE BLOCKED ON_HOLD COMPLETED CANCELLED }
enum ProjectHealth { HEALTHY ATTENTION CRITICAL }
enum ProjectSource { MANUAL SPREADSHEET CLICKUP OTHER }
enum UpdateConfidence { CONFIRMED ESTIMATED }
enum WorkItemType { ACTION FOLLOW_UP REVIEW DECISION }
enum WorkItemStatus { OPEN DOING DONE BLOCKED CANCELLED }
enum BlockerParty { KAPEL CLIENT PARTNER THIRD_PARTY }
enum BlockerStatus { OPEN RESOLVED WAIVED }
enum CommandActionType { START COMPLETE DEFER DELEGATE }
```

```prisma
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

  @@index([organization_id, status, health])
  @@index([organization_id, deadline])
  @@unique([organization_id, source, external_id])
}
```

Define the remaining operational models exactly:

```prisma
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

  @@index([organization_id, status, due_at])
  @@unique([organization_id, external_source, external_id])
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
  follow_up_at       DateTime?
  created_at         DateTime      @default(now())
  resolved_at        DateTime?

  @@index([organization_id, status, follow_up_at])
  @@index([organization_id, project_id])
}
```

Use matching named back-relations in `Membership`: `owned_projects @relation("ProjectOwner")`, `authored_updates @relation("UpdateAuthor")`, `assigned_work_items @relation("WorkItemAssignee")` and `command_actions @relation("CommandActor")`.

Add a small immutable action ledger:

```prisma
model CommandAction {
  id                  String            @id @default(cuid())
  organization_id     String
  organization        Organization      @relation(fields: [organization_id], references: [id], onDelete: Cascade)
  work_item_id         String
  work_item            WorkItem          @relation(fields: [work_item_id], references: [id], onDelete: Cascade)
  actor_membership_id  String
  actor                Membership        @relation("CommandActor", fields: [actor_membership_id], references: [id])
  action               CommandActionType
  previous_status      WorkItemStatus
  resulting_status     WorkItemStatus
  reason               String?
  created_at           DateTime           @default(now())

  @@index([organization_id, created_at])
}
```

Create the operations tables and enums in `prisma/migrations/202608230002_operations_foundation/migration.sql`. Add database `CHECK` constraints for `strategic_value` and `mental_load` between 1 and 5, `weekly_hours_estimate >= 0`, `monthly_value_at_risk >= 0`, and `estimated_minutes > 0` when present.

- [ ] **Step 4: Validate schema and SQL contract**

Run: `npx prisma format && npx prisma validate && npm test -- tests/operations-schema.test.ts tests/organization-migration.test.ts`

Expected: schema validation and both tests PASS.

- [ ] **Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/202608230002_operations_foundation/migration.sql tests/operations-schema.test.ts
git commit -m "feat: add operations and command data models"
```

---

### Task 5: Build tenant-safe Operations APIs

**Files:**
- Create: `src/lib/validation.ts`
- Create: `src/lib/operations.ts`
- Create: `src/app/api/projects/route.ts`
- Create: `src/app/api/projects/[id]/route.ts`
- Create: `src/app/api/projects/[id]/updates/route.ts`
- Create: `src/app/api/work-items/route.ts`
- Create: `src/app/api/work-items/[id]/route.ts`
- Create: `src/app/api/blockers/route.ts`
- Create: `src/app/api/blockers/[id]/route.ts`
- Create: `tests/operations-api.test.ts`

**Interfaces:**
- Consumes: `withOrgContext`, Prisma operational models.
- Produces: `ProjectSummary`, `ProjectDetail`, `CreateProjectInput`, `CreateProjectUpdateInput`, `CreateWorkItemInput`, `CreateBlockerInput` types in `src/lib/operations.ts`.
- Roles: `VIEWER` can GET; `OWNER`, `ADMIN`, `OPERATOR` can create/update; only `OWNER`/`ADMIN` can cancel a project or waive a blocker.

- [ ] **Step 1: Write failing API tests for the complete first-slice flow**

Cover: list scoped projects; reject a contracting client from another organization; create a project; update project health/owner; create an update and atomically set `Project.last_update_at`; create/complete/delegate a work item; create/resolve a blocker; reject assignee/author/project IDs from another organization; return field errors for invalid enums, values outside 1–5 and non-positive estimates.

Use this representative assertion for every relation lookup:

```ts
expect(prisma.membership.findFirst).toHaveBeenCalledWith({
  where: { id: assigneeId, organization_id: 'org_kapel' },
  select: { id: true },
});
```

- [ ] **Step 2: Run the API tests and confirm failure**

Run: `npm test -- tests/operations-api.test.ts`

Expected: FAIL because the operational endpoints and validation functions do not exist.

- [ ] **Step 3: Implement explicit parsers and domain types**

`src/lib/validation.ts` must export `readRequiredString`, `readOptionalString`, `readEnum`, `readNumberInRange` and `readOptionalDate`. Each returns a discriminated result `{ ok: true, value } | { ok: false, message }`; dates accept ISO-8601 strings only and are rejected when invalid.

Define the create-project body exactly:

```ts
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
  externalId?: string;
  externalUrl?: string;
  initialWorkItem?: {
    title: string;
    assigneeMembershipId?: string;
    dueAt?: string;
    estimatedMinutes?: number;
  };
};
```

Never spread request bodies into Prisma. Build an allowlisted data object and attach `organization_id: auth.organizationId` explicitly.

- [ ] **Step 4: Implement scoped handlers and transactions**

Use `findFirst` with `organization_id` for all reads. Validate client, contract, owner, assignee and project relations before writes. `POST /api/projects` must create the project and optional `initialWorkItem` in one transaction. `POST /api/projects/[id]/updates` must transactionally create the update, create a WorkItem for `next_action` with `nextActionAssigneeMembershipId`, `nextActionDueAt` and `nextActionEstimatedMinutes`, set the project's `last_update_at` to the update timestamp, update health/status when those optional fields are supplied, and create an `OperationalBlocker` when the body includes a non-empty blocker with `blockerResponsibleParty`.

`PATCH /api/work-items/[id]` accepts only:

```ts
type WorkItemPatch = {
  status?: WorkItemStatus;
  assigneeMembershipId?: string | null;
  dueAt?: string | null;
  estimatedMinutes?: number | null;
};
```

When status becomes `DONE`, set `completed_at = new Date()`; when leaving `DONE`, clear it. Return 404 for a missing or cross-tenant record, never 403 that reveals its existence.

- [ ] **Step 5: Run focused verification**

Run: `npm test -- tests/operations-api.test.ts tests/api-auth.test.ts tests/tenant-scope.test.ts`

Expected: all tests PASS, including cross-organization relation rejection and transaction assertions.

- [ ] **Step 6: Commit**

```bash
git add src/lib/validation.ts src/lib/operations.ts src/app/api/projects src/app/api/work-items src/app/api/blockers tests/operations-api.test.ts
git commit -m "feat: add tenant safe operations APIs"
```

---

### Task 6: Implement the deterministic and explainable priority engine

**Files:**
- Create: `src/lib/command/priority.ts`
- Create: `tests/priority.test.ts`

**Interfaces:**
- Produces: `scoreWorkItem(input: PriorityInput, now: Date): PriorityResult`.
- Produces: `rankCommandItems(inputs: PriorityInput[], now: Date): RankedCommandItem[]`.
- `PriorityResult = { score: number; executable: boolean; factors: PriorityFactors; explanation: string[] }`.

- [ ] **Step 1: Write failing table-driven scoring tests**

Define fixed UTC dates and cover every factor boundary, deterministic tie-breaking, stale updates, third-party blocking, due follow-ups, delegation and the 0–100 clamp. Use this exact factor shape:

```ts
type PriorityFactors = {
  deadline: number;           // 0..25
  financialImpact: number;    // 0..25
  unblockImpact: number;      // 0..20
  strategicValue: number;     // 3, 6, 9, 12 or 15
  founderNeed: number;        // 0 or 10
  effortEfficiency: number;   // 0..5
  staleConfidencePenalty: number; // 0 or -5
};
```

Critical assertions:

```ts
expect(scoreWorkItem(thirdPartyBlockedExecution, now)).toMatchObject({ score: 0, executable: false });
expect(scoreWorkItem(dueExternalFollowUp, now).executable).toBe(true);
expect(rankCommandItems(tied, now).map(x => x.id)).toEqual(['earlier-due', 'older-created']);
expect(scoreWorkItem(maximum, now).score).toBe(100);
```

- [ ] **Step 2: Run the priority tests and confirm failure**

Run: `npm test -- tests/priority.test.ts`

Expected: FAIL because the engine does not exist.

- [ ] **Step 3: Implement the exact scoring rules**

Use pure functions and no Prisma imports:

```ts
deadline = overdue ? 25 : daysUntilDue <= 1 ? 22 : daysUntilDue <= 3 ? 17 : daysUntilDue <= 7 ? 10 : 0;
financialImpact = risk >= 10000 ? 25 : risk >= 5000 ? 20 : risk >= 2000 ? 14 : risk > 0 ? 7 : 0;
unblockImpact = dueFollowUp && blocksDelivery ? 20 : openProjectBlockers > 0 && type === 'DECISION' ? 12 : 0;
strategicValue = projectStrategicValue * 3;
founderNeed = assigneeIsCurrentOwner && projectOwnerIsCurrentOwner ? 10 : 0;
effortEfficiency = minutes <= 15 ? 5 : minutes <= 30 ? 4 : minutes <= 60 ? 3 : minutes <= 120 ? 2 : 1;
staleConfidencePenalty = daysSinceProjectUpdate > 7 ? -5 : 0;
```

An OPEN/DOING item is non-executable when its project has a delivery-blocking OPEN blocker owned by `CLIENT`, `PARTNER` or `THIRD_PARTY`, unless the item type is `FOLLOW_UP` and the blocker's `follow_up_at <= now`. Items assigned to another membership are excluded from the founder ranking and returned as delegations. Sort executable items by score descending, then `due_at` ascending with null last, then `created_at` ascending, then `id` ascending. Explanation strings name each non-zero factor in Portuguese and include the numeric contribution.

- [ ] **Step 4: Run focused tests**

Run: `npm test -- tests/priority.test.ts`

Expected: all scoring, exclusion, clamp and stable-sort cases PASS.

- [ ] **Step 5: Commit**

```bash
git add src/lib/command/priority.ts tests/priority.test.ts
git commit -m "feat: add deterministic command priority engine"
```

---

### Task 7: Build the Command read model and API

**Files:**
- Create: `src/lib/command/read-model.ts`
- Create: `src/app/api/command/route.ts`
- Create: `tests/command-api.test.ts`

**Interfaces:**
- Consumes: `rankCommandItems`, `OrgRequestContext`, Prisma models.
- Produces: `getCommandReadModel(auth: OrgRequestContext, now: Date): Promise<CommandResponse>`.
- Produces: authenticated `GET /api/command` and `POST /api/command`.

- [ ] **Step 1: Write failing read-model and mutation tests**

Seed mocked rows spanning two organizations and assert the response includes only `org_kapel`, exactly the top three executable founder items, unique projects in revenue risk, due external follow-ups, items assigned to someone else under delegations, and blocked/low-score items under not-now. Assert an empty organization returns arrays rather than 404.

Define and assert this public API contract:

```ts
export type CommandResponse = {
  generatedAt: string;
  decisions: CommandDecision[]; // maximum 3
  revenueAtRisk: RevenueRisk[];
  externalBlockers: CommandBlocker[];
  delegations: CommandDelegation[];
  notNow: NotNowItem[];
  staleProjects: Array<{ projectId: string; projectName: string; daysWithoutUpdate: number }>;
  memberships: Array<{ id: string; name: string; role: MembershipRole }>;
};

export type CommandDecision = {
  workItemId: string;
  title: string;
  projectId: string;
  projectName: string;
  score: number;
  factors: PriorityFactors;
  explanation: string[];
  dueAt: string | null;
  estimatedMinutes: number | null;
};
```

- [ ] **Step 2: Run tests and confirm failure**

Run: `npm test -- tests/command-api.test.ts`

Expected: FAIL because the read model and API route do not exist.

- [ ] **Step 3: Implement one scoped query graph and response mapping**

Query OPEN/DOING/BLOCKED work items by `organization_id`, including project owner, project blockers and assignee. Query active/blocked projects with positive `monthly_value_at_risk`. Never accept an organization ID from `GET` parameters. Convert Prisma `Decimal` to number at the response boundary.

Revenue risk includes `ATTENTION`/`CRITICAL` projects, overdue work, or delivery-blocking blockers; each row carries `amount` and one deterministic reason. External blockers include only OPEN `CLIENT`/`PARTNER`/`THIRD_PARTY` blockers and expose follow-up date. `notNow` must include a reason code: `EXTERNAL_BLOCK`, `DELEGATED`, `LOWER_PRIORITY` or `STALE_NEEDS_UPDATE`.

- [ ] **Step 4: Implement Command actions transactionally**

`POST /api/command` accepts:

```ts
type CommandActionInput =
  | { workItemId: string; action: 'START' | 'COMPLETE'; reason?: string }
  | { workItemId: string; action: 'DEFER'; deferUntil: string; reason: string }
  | { workItemId: string; action: 'DELEGATE'; assigneeMembershipId: string; reason?: string };
```

Resolve the work item and any assignee within `auth.organizationId`. In one transaction, map START→DOING, COMPLETE→DONE, DEFER→OPEN plus new `due_at`, and DELEGATE→OPEN plus new assignee; then create `CommandAction` with previous/resulting status and actor. Return the updated work item. VIEWER receives 403. Invalid mutation returns 400 without a ledger row.

- [ ] **Step 5: Run focused tests**

Run: `npm test -- tests/command-api.test.ts tests/priority.test.ts tests/operations-api.test.ts`

Expected: all PASS; response ordering is stable and action + audit ledger are one transaction.

- [ ] **Step 6: Commit**

```bash
git add src/lib/command/read-model.ts src/app/api/command/route.ts tests/command-api.test.ts
git commit -m "feat: expose command daily decisions API"
```

---

### Task 8: Add a minimal Operations screen for fast manual input

**Files:**
- Create: `src/app/operations/page.tsx`
- Create: `src/components/operations/ProjectForm.tsx`
- Create: `src/components/operations/ProjectList.tsx`
- Create: `src/components/operations/QuickUpdateForm.tsx`
- Create: `tests/operations-ui.test.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: project, update, work-item and blocker APIs from Task 5.
- Produces: `/operations`, accessible from Sidebar as `Operations` with Lucide `ListChecks`.
- UX target: creating a project plus first action requires one form submission; adding a check-in requires summary, next action, responsible person, deadline, optional blocker and metric.

- [ ] **Step 1: Write failing component tests**

Use `// @vitest-environment jsdom`, Testing Library and mocked `fetch`. Assert that the page renders within `AdminLayout`, keeps entered text after a 400 response, submits numbers as numbers, shows field-level API messages, supports Enter/Space on controls, and renders a useful empty state.

```tsx
expect(screen.getByRole('heading', { name: /operations/i })).toBeVisible();
expect(screen.getByLabelText('Próxima ação')).toBeRequired();
expect(screen.getByRole('button', { name: 'Salvar check-in' })).toBeEnabled();
```

- [ ] **Step 2: Run UI tests and confirm failure**

Run: `npm test -- tests/operations-ui.test.tsx`

Expected: FAIL because the route and components do not exist.

- [ ] **Step 3: Implement the focused Operations UI**

Compose `AdminLayout` + `Header`, use existing `.card-custom`, `.btn-custom`, `.btn-custom-primary` classes and the repository color tokens. `ProjectForm` sends one `POST /api/projects` containing `initialWorkItem` from required fields `initialActionTitle`, `initialActionDueAt` and `initialActionMinutes`; the API transaction guarantees that project and first action either persist together or both fail. On error, keep every field and render the returned message.

`QuickUpdateForm` posts update data and, when a blocker is supplied, its responsible party and follow-up date. On success, prepend the update, refresh the project summary and reset only successfully persisted fields. Do not implement spreadsheet import in this slice.

Add `Operations` beneath `Command` in Sidebar. Keep `Dashboard` and all Contract navigation entries present.

- [ ] **Step 4: Run component and API tests**

Run: `npm test -- tests/operations-ui.test.tsx tests/operations-api.test.ts`

Expected: both PASS; the form preserves values on errors and updates the list on success.

- [ ] **Step 5: Commit**

```bash
git add src/app/operations src/components/operations src/components/Sidebar.tsx tests/operations-ui.test.tsx
git commit -m "feat: add fast operations capture screen"
```

---

### Task 9: Build the KAPEL Command daily interface in the existing design system

**Files:**
- Create: `src/app/command/page.tsx`
- Create: `src/components/command/DecisionCard.tsx`
- Create: `src/components/command/CommandSection.tsx`
- Create: `src/components/command/CommandEmptyState.tsx`
- Create: `src/components/command/CommandSkeleton.tsx`
- Create: `src/components/command/CommandErrorState.tsx`
- Create: `src/lib/command/types.ts`
- Create: `tests/command-ui.test.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Consumes: `CommandResponse`, `GET /api/command`, `POST /api/command`.
- Produces: `/command` showing three decisions, total revenue in risk, external blockers, delegations, not-now items and stale-project prompts.
- Action buttons: `Começar`, `Concluir`, `Adiar`, `Delegar`; successful actions refresh the command response.

- [ ] **Step 1: Write failing Command page tests**

Mock the API with exactly three decisions plus each secondary section. Assert heading order, visible score/explanation factors, formatted BRL, accessible action buttons, loading/error/empty states, and no fourth decision. Assert error retry calls GET again and action failures keep the card and selection visible.

```tsx
expect(screen.getAllByTestId('command-decision')).toHaveLength(3);
expect(screen.getByText('R$ 11.000,00')).toBeVisible();
expect(screen.getByRole('heading', { name: 'O que não fazer agora' })).toBeVisible();
expect(screen.getByRole('button', { name: /tentar novamente/i })).toBeVisible();
```

- [ ] **Step 2: Run UI tests and confirm failure**

Run: `npm test -- tests/command-ui.test.tsx`

Expected: FAIL because the Command route and components do not exist.

- [ ] **Step 3: Implement the read-only states and visual hierarchy**

Use `AdminLayout` and `Header` with title `Command` and subtitle `A melhor próxima hora do seu dia`. Place decisions first in a responsive one-column/three-column grid. Each card shows rank, project, action, score, time estimate, deadline and expandable factor list. Secondary sections follow in this order: `Receita em risco`, `Bloqueios externos`, `Delegar`, `O que não fazer agora`, `Projetos sem atualização`.

Use current KAPEL classes/colors only: `bg-[#050505]`, `bg-[#0A0A0A]`, `bg-[#121312]`, borders `rgba(242,242,237,0.1)`, greens `#1C2E24/#335943/#44755A`, white `#F2F2ED`, muted `#AEB4AE/#8E948E`, `font-display`, `font-mono`, existing radii and Lucide icons. Do not add gradients, colors or typography outside current tokens.

- [ ] **Step 4: Implement action controls without optimistic data loss**

POST the Task 7 union payload. Disable only the active card while saving. For defer, require an ISO date and non-empty reason. For delegate, require one membership from `CommandResponse.memberships`. On failure, show the server message next to the control and retain selected date/assignee/reason. On success, refetch GET.

Add `Command` as the first Sidebar nav item with Lucide `Gauge`, while leaving the KAPEL brand link and root behavior pointed to `/dashboard` in this delivery.

- [ ] **Step 5: Verify desktop/mobile component behavior**

Run: `npm test -- tests/command-ui.test.tsx tests/operations-ui.test.tsx`

Expected: PASS for data, empty, loading, error and action states; test queries find all controls by accessible name.

Run manually with `npm run dev`, inspect `/command` at 375×812 and 1280×800, and use Tab/Shift+Tab/Enter/Escape through every interactive control.

Expected: no horizontal overflow; decisions remain first; focus is always visible; overlays close with Escape; no text truncates critical action/reason content.

- [ ] **Step 6: Commit**

```bash
git add src/app/command src/components/command src/lib/command/types.ts src/components/Sidebar.tsx tests/command-ui.test.tsx
git commit -m "feat: add kapel command daily interface"
```

---

### Task 10: Run the security, migration, regression and production gates

**Files:**
- Create: `tests/contract-regression.test.ts`
- Create: `docs/kapel-command-foundation-runbook.md`
- Modify only if a gate exposes a defect: files introduced or explicitly modified in Tasks 1–9.

**Interfaces:**
- Consumes all earlier tasks.
- Produces a repeatable deployment order and evidence that Contract, signing and the commercial dashboard remain functional.

- [ ] **Step 1: Add a failing non-regression route test**

Cover authenticated dashboard data, contract create/read/update, native signature token flow and public hash verification with the Task 2 organization fields present. Assert `/dashboard` still renders the commercial title and `/command` is separate.

- [ ] **Step 2: Run the new regression test before completing its fixtures**

Run: `npm test -- tests/contract-regression.test.ts`

Expected: FAIL until fixtures include `organization_id` and authenticated organization context, proving the test detects the migration boundary.

- [ ] **Step 3: Complete fixtures and write the deployment runbook**

Document this exact order in `docs/kapel-command-foundation-runbook.md`:

```text
1. Configure JWT_SECRET with at least 32 random characters.
2. Back up PostgreSQL.
3. Run npx prisma migrate deploy.
4. Run npx prisma db seed to ensure KAPEL organization/membership.
5. Run npm test and npm run build.
6. Deploy the Next.js application.
7. Verify unauthenticated private APIs return 401.
8. Verify /dashboard, contract creation, native signing, /operations and /command.
9. Roll back the application build if smoke checks fail; restore the database backup only if migration rollback is required.
```

Include curl examples for unauthenticated `GET /api/dashboard`, `GET /api/projects`, `GET /api/command` expecting 401, and authenticated smoke-check response shapes without including a real cookie/token.

- [ ] **Step 4: Run the full automated suite**

Run: `npm test`

Expected: every existing and new Vitest test PASSes; no existing clause, financial, importer, political, security, signature or upscaler test regresses.

- [ ] **Step 5: Validate Prisma and production build**

Run: `npx prisma format && git diff --exit-code -- prisma/schema.prisma && npx prisma validate && npx tsc --noEmit && npm run lint && npm run build`

Expected: all commands exit 0; Next.js lists `/command`, `/operations`, `/api/command`, project/update/work-item/blocker routes; no missing `JWT_SECRET` error occurs during build because the secret accessor is evaluated only when signing/verifying a request.

- [ ] **Step 6: Perform disposable-database migration and tenant-isolation smoke checks**

With a disposable PostgreSQL database containing a copy of representative legacy Client/Contract rows, run: `npx prisma migrate deploy && npx prisma db seed`.

Expected: all legacy rows are assigned to `org_kapel`; the migration is idempotently marked applied; an authenticated `org_kapel` user cannot read/update records inserted for a second test organization; a VIEWER cannot mutate; an OPERATOR can update Operations but cannot alter settings/categories/services.

- [ ] **Step 7: Commit**

```bash
git add tests/contract-regression.test.ts docs/kapel-command-foundation-runbook.md
git commit -m "test: verify kapel command foundation release"
```

---

## Definition of Done

- `JWT_SECRET` has no fallback; forged, malformed, expired and wrong-secret tokens fail.
- Every private API has a cryptographic session guard; every Client/Contract/Operations query is tenant-scoped server-side.
- Existing data is assigned to the KAPEL organization through a tested PostgreSQL migration; Patrick has an OWNER membership through idempotent seed logic.
- `Project`, `ProjectUpdate`, `WorkItem` and `OperationalBlocker` exist with typed states, validated relations and organization indexes.
- The deterministic engine returns stable 0–100 scores with visible factor contributions and excludes third-party-blocked execution.
- `/operations` allows Patrick to capture a project, next action, check-in and blocker without touching contracts.
- `/command` shows no more than three decisions first, then revenue risk, external blockers, delegation, not-now and stale-data prompts, and records start/complete/defer/delegate actions.
- `/dashboard`, contracts, native signing and public verification continue working.
- `npm test`, Prisma validation, lint, production build and disposable PostgreSQL migration all pass before deployment.

## Explicit Phase Boundary

This plan deliberately stops after the secure Operations + deterministic Command foundation. `CashFlowEntry`, `Debt`, `TeamProfile`, CSV/XLSX operational import, ClickUp/Sheets/Adveronix integrations, AI daily brief, SaaS tenancy UI, billing and public onboarding remain governed by the design spec and require their own executable plans after this slice is validated in daily KAPEL use.

