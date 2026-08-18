# Especificação de Design: Módulo de Segurança Máxima & Autenticação JWT/Bcrypt KAPEL

**Data:** 18/08/2026  
**Status:** APROVADO  
**Autor:** Patrick Eduardo Lima Silva & Antigravity (Superpowers HQ)  
**Projeto:** KAPEL Contract System (`kapel-contract`)

---

## 1. Visão Geral & Objetivos de Segurança

Implementar blindagem de segurança máxima no **KAPEL Contract System**, eliminando senhas genéricas de teste/backdoors, introduzindo criptografia de senhas com `bcryptjs` (salt + hash), sessões assinadas com `jose`/JWT (HMAC-SHA256), proteção de rotas no Middleware do Next.js e uma interface intuitiva no painel de Configurações (`/settings`) para alteração segura de senha.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)
- **RF01 (Remoção de Backdoor):** Eliminar completamente a verificação `password === 'admin'` no login. O acesso exige unicamente a senha cadastrada.
- **RF02 (Hash Bcrypt de Senhas):** Armazenar e comparar todas as senhas com `bcryptjs` com custo de hash = 10.
- **RF03 (Cookies JWT Assinados):** Assinar a sessão no cookie HTTP-Only `kapel_session` com um token JWT utilizando a chave secreta `JWT_SECRET`.
- **RF04 (Proteção Estrita de Rotas no Middleware):** Bloquear acesso não autenticado às rotas `/dashboard`, `/contracts`, `/clients`, `/services`, `/templates`, `/clauses`, `/settings` e `/upscaler`.
- **RF05 (Alteração de Senha no Painel):** Disponibilizar formulário na tela `/settings` para o usuário alterar sua senha informando a senha atual, nova senha e confirmação.
- **RF06 (Atualização do Seed do Banco):** Atualizar `prisma/seed.ts` para cadastrar o usuário administrador com hash Bcrypt válido.

### 2.2 Requisitos Não-Funcionais (RNF)
- **RNF01 (Segurança de Cookies):** Cookies com atributos `HttpOnly`, `SameSite=Lax`, `Secure` em produção e validade de 7 dias.
- **RNF02 (Resistência a Tampering):** Tentativas de alteração de cookies via DevTools invalidam a sessão imediatamente.
- **RNF03 (Performance):** Verificação de sessão e hashing Bcrypt concluídos em < 100ms.

---

## 3. Arquitetura & Componentes do Módulo de Segurança

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── login/route.ts            # Endpoint de Login (Bcrypt + JWT)
│   │       ├── logout/route.ts           # Endpoint de Logout (Limpeza de Cookie)
│   │       ├── me/route.ts               # Endpoint de Verificação da Sessão Atual
│   │       └── change-password/route.ts  # Endpoint de Alteração Segura de Senha
│   └── settings/
│       └── page.tsx                      # Painel de Configurações com Form de Alteração de Senha
├── lib/
│   ├── auth.ts                           # Helpers de JWT (signToken, verifyToken, setSessionCookie, getSession)
│   └── prisma.ts                         # Cliente Prisma ORM
└── middleware.ts                         # Middleware Next.js com Validação JWT de Rotas
```

---

## 4. Interfaces de API & Estrutura de Payload

### 4.1 POST `/api/auth/login`
- **Entrada (Body JSON):** `{ email: string, password: string }`
- **Processamento:**
  1. Localizar usuário por e-mail no Prisma.
  2. Verificar `bcrypt.compare(password, user.password)`.
  3. Se válido, gerar JWT assinado com `JWT_SECRET` e definir cookie HTTP-Only `kapel_session`.
- **Saída (JSON):** `{ success: true, user: { id, email, name, role } }`

### 4.2 POST `/api/auth/change-password`
- **Entrada (Body JSON):** `{ currentPassword: string, newPassword: string }`
- **Processamento:**
  1. Validar sessão autenticada via JWT.
  2. Buscar usuário no banco e testar `bcrypt.compare(currentPassword, user.password)`.
  3. Gerar novo hash com `bcrypt.hash(newPassword, 10)`.
  4. Atualizar registro no banco e registrar log em `AuditLog`.
- **Saída (JSON):** `{ success: true, message: 'Senha alterada com sucesso.' }`

---

## 5. Plano de Testes & Validação (Vitest & Integration)

- **Testes Unitários (`tests/security.test.ts`):**
  - Testar hash e verificação de senhas com `bcryptjs`.
  - Testar criação e verificação de tokens JWT assinados.
  - Testar recusa de senhas incorretas ou adulteradas.
  - Testar rejeição do backdoor de teste `'admin'`.
