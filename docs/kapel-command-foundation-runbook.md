# KAPEL Command Foundation — Runbook

## Ordem de implantação

1. Configure `JWT_SECRET` with at least 32 random characters.
2. Faça backup do PostgreSQL.
3. Execute `npx prisma migrate deploy`.
4. Execute `npx prisma db seed` para garantir a organização KAPEL e a membership de Patrick.
5. Execute `npm test` e `npm run build`.
6. Publique a aplicação Next.js.
7. Verifique que APIs privadas sem autenticação retornam 401.
8. Verifique `/dashboard`, criação de contrato, assinatura nativa, `/operations` e `/command`.
9. Se o smoke check falhar, reverta o build da aplicação; restaure o backup do banco somente se for necessário reverter a migração.

## Smoke checks sem autenticação

Os três comandos devem responder `401` com `{ "error": "Sessão inválida ou expirada." }`:

```bash
curl -i https://app.exemplo.com/api/dashboard
curl -i https://app.exemplo.com/api/projects
curl -i https://app.exemplo.com/api/command
```

## Smoke checks autenticados

Use um cookie de sessão obtido pelo fluxo normal de login; não registre nem cole o valor em logs:

```bash
curl -i --cookie "session=<COOKIE_DE_TESTE>" https://app.exemplo.com/api/dashboard
curl -i --cookie "session=<COOKIE_DE_TESTE>" https://app.exemplo.com/api/projects
curl -i --cookie "session=<COOKIE_DE_TESTE>" https://app.exemplo.com/api/command
```

O dashboard responde com métricas comerciais e contratos recentes. Projects responde com um array, inclusive quando vazio. Command responde com `generatedAt`, `decisions` (máximo três), `revenueAtRisk`, `externalBlockers`, `delegations`, `notNow`, `staleProjects` e `memberships`.

## Isolamento e funções

- Registros de outra organização devem produzir 404 em leitura/mutação por ID.
- `VIEWER` apenas lê; `OPERATOR` pode operar projetos, ações e bloqueios; cancelamento de projeto, waiver de bloqueio e configurações exigem `OWNER` ou `ADMIN`.
- Preserve `/api/contracts/public/sign/[token]` e `/api/contracts/public/verify/[hash]` como rotas públicas por token/hash.
