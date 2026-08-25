# KAPEL Security & JWT/Bcrypt Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement maximum enterprise security in KAPEL Contract System by removing backdoor passwords, introducing bcryptjs password hashing, JWT HMAC-SHA256 session signatures, strict Next.js middleware route protection, and a UI form in `/settings` for password changes.

**Architecture:** Bcryptjs password hashing, signed JWT HttpOnly cookies with `jose`/`jsonwebtoken`, Next.js Middleware route enforcement, and password change API endpoint connected to Prisma/Supabase.

**Tech Stack:** Next.js 14, TypeScript, bcryptjs, jsonwebtoken / jose, Prisma, Tailwind CSS, Vitest.

## Global Constraints

- 100% removal of test passwords (e.g. `password === 'admin'`).
- All stored user passwords must use salted Bcrypt hashes (`$2a$10$...`).
- All session cookies must be signed and validated via `JWT_SECRET`.
- Full protection of `/dashboard`, `/contracts`, `/clients`, `/services`, `/templates`, `/clauses`, `/settings`, `/upscaler`.

---

### Task 1: Security & JWT/Bcrypt Library Helpers (TDD)

**Files:**
- Modify: `src/lib/auth.ts`
- Test: `tests/security.test.ts`

**Interfaces:**
- Consumes: `bcryptjs`, `jsonwebtoken`
- Produces:
  - `hashPassword(password: string): Promise<string>`
  - `verifyPassword(password: string, hash: string): Promise<boolean>`
  - `signSessionToken(user: { id: string; email: string; name: string; role: string }): string`
  - `verifySessionToken(token: string): AuthSession | null`

- [ ] **Step 1: Write the failing tests**

```ts
// tests/security.test.ts
import { describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from '../src/lib/auth';

describe('Motor de Criptografia & Segurança (Bcrypt + JWT)', () => {
  it('deve gerar hash Bcrypt valido e verificar senha corretamente', async () => {
    const password = 'MinhaSenhaSegura123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$')).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isWrongValid = await verifyPassword('SenhaErrada', hash);
    expect(isWrongValid).toBe(false);
  });

  it('deve rejeitar explicitamente a senha backdoor admin', async () => {
    const realHash = await hashPassword('MinhaSenhaReal123!');
    const isBackdoorValid = await verifyPassword('admin', realHash);
    expect(isBackdoorValid).toBe(false);
  });

  it('deve assinar e verificar token JWT de sessao', () => {
    const user = {
      id: 'usr-123',
      email: 'patrick@kapel.digital',
      name: 'Patrick Silva',
      role: 'ADMIN',
    };

    const token = signSessionToken(user);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.user.email).toBe('patrick@kapel.digital');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/security.test.ts`
Expected: FAIL (functions not defined or not implemented).

- [ ] **Step 3: Write minimal implementation in src/lib/auth.ts**

```ts
// src/lib/auth.ts
import { cookies } from 'next/headers';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export interface AuthSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
  };
}

export const AUTH_COOKIE_NAME = 'kapel_session';
const JWT_SECRET = process.env.JWT_SECRET || 'kapel-super-secret-jwt-key-2026-production';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !password) return false;
  return bcrypt.compare(password, hash);
}

export function signSessionToken(user: { id: string; email: string; name: string; role: string }): string {
  return jwt.sign({ user }, JWT_SECRET, { expiresIn: '7d' });
}

export function verifySessionToken(token: string): AuthSession | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthSession;
    return decoded;
  } catch {
    return null;
  }
}

export function getSession(): AuthSession | null {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get(AUTH_COOKIE_NAME);
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return verifySessionToken(sessionCookie.value);
  } catch {
    return null;
  }
}

export function setSessionCookie(user: { id: string; email: string; name: string; role: string }) {
  const cookieStore = cookies();
  const token = signSessionToken(user);
  cookieStore.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function clearSessionCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE_NAME);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/security.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/security.test.ts src/lib/auth.ts
git commit -m "feat: implementar criptografia Bcrypt e assinatura JWT de sessao em auth.ts"
```

---

### Task 2: API Endpoints Refactoring (Login & Change Password)

**Files:**
- Modify: `src/app/api/auth/login/route.ts`
- Create: `src/app/api/auth/change-password/route.ts`

**Interfaces:**
- Consumes: `verifyPassword`, `hashPassword`, `setSessionCookie`, `getSession`, `prisma`.
- Produces: Blinded POST `/api/auth/login` and secure POST `/api/auth/change-password`.

- [ ] **Step 1: Refactor src/app/api/auth/login/route.ts to remove backdoor and use verifyPassword**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { setSessionCookie, verifyPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'E-mail e senha são obrigatórios.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    // Validação estrita de senha via Bcrypt (Sem backdoor 'admin')
    const isValid = await verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Credenciais inválidas.' },
        { status: 401 }
      );
    }

    setSessionCookie({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error('Erro no login:', error);
    return NextResponse.json(
      { error: 'Erro interno ao processar login.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 2: Create src/app/api/auth/change-password/route.ts**

```ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSession, verifyPassword, hashPassword } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = getSession();
    if (!session || !session.user) {
      return NextResponse.json(
        { error: 'Sessão expirada ou usuário não autenticado.' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Senha atual e nova senha são obrigatórias.' },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: 'A nova senha deve ter no mínimo 8 caracteres.' },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado.' },
        { status: 404 }
      );
    }

    const isCurrentValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentValid) {
      return NextResponse.json(
        { error: 'Senha atual incorreta.' },
        { status: 400 }
      );
    }

    const newHash = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: newHash },
    });

    return NextResponse.json({
      success: true,
      message: 'Senha alterada com sucesso!',
    });
  } catch (error: any) {
    console.error('Erro ao alterar senha:', error);
    return NextResponse.json(
      { error: 'Erro interno ao alterar senha.' },
      { status: 500 }
    );
  }
}
```

- [ ] **Step 3: Commit API endpoint refactoring**

```bash
git add src/app/api/auth/login/route.ts src/app/api/auth/change-password/route.ts
git commit -m "feat: remover backdoor 'admin' e criar API de alteracao segura de senha"
```

---

### Task 3: Strict Middleware Route Protection & Database Seed

**Files:**
- Modify: `src/middleware.ts`
- Modify: `prisma/seed.ts`

**Interfaces:**
- Consumes: `verifySessionToken`, `AUTH_COOKIE_NAME`.
- Produces: Secure JWT route enforcement and hashed initial seed.

- [ ] **Step 1: Update src/middleware.ts with JWT verification**

```ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AUTH_COOKIE_NAME, verifySessionToken } from './lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const sessionCookie = request.cookies.get(AUTH_COOKIE_NAME);
  const isValidSession = sessionCookie?.value ? !!verifySessionToken(sessionCookie.value) : false;

  const protectedRoutes = [
    '/dashboard',
    '/contracts',
    '/clients',
    '/services',
    '/templates',
    '/clauses',
    '/settings',
    '/upscaler',
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  // Redireciona raiz / para /dashboard ou /login
  if (pathname === '/') {
    if (isValidSession) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    } else {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Redireciona para login se rota protegida sem sessão válida
  if (isProtected && !isValidSession) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Se já autenticado e tentando acessar login, manda para dashboard
  if (pathname === '/login' && isValidSession) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
```

- [ ] **Step 2: Update prisma/seed.ts to hash user passwords**

Import `bcrypt` in `prisma/seed.ts` and hash admin password before creating user.

- [ ] **Step 3: Commit Middleware & Seed changes**

```bash
git add src/middleware.ts prisma/seed.ts
git commit -m "feat: blindar rotas protegidas no middleware com validacao JWT"
```

---

### Task 4: Password Change UI in Settings Page

**Files:**
- Modify: `src/app/settings/page.tsx`

**Interfaces:**
- Consumes: POST `/api/auth/change-password`.
- Produces: Interactive password change form with status alerts.

- [ ] **Step 1: Add Password Change Form to src/app/settings/page.tsx**

Add a card titled "Segurança & Alteração de Senha" with inputs for `currentPassword`, `newPassword`, and `confirmPassword`, submitting to `/api/auth/change-password`.

- [ ] **Step 2: Run all tests to verify zero regressions**

Run: `npx vitest run`
Expected: PASS (All test files passing).

- [ ] **Step 3: Commit and push**

```bash
git add src/app/settings/page.tsx
git commit -m "feat: adicionar interface de alteracao de senha no painel de configuracoes"
git push
```
