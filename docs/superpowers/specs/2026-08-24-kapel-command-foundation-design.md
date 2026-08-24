# KAPEL Command Foundation — Especificação do Design Operacional

**Data:** 24 de agosto de 2026  
**Status:** aprovado para especificação  
**Autor:** Antigravity (AI Coding Assistant)  
**Contexto:** Re-implementação segura e incremental da fundação do KAPEL Command sobre a base existente do KAPEL Contract.

---

## 1. Contexto e Objetivos

O objetivo deste documento é detalhar o design técnico para a re-implementação da fundação do **KAPEL Command**. O desenvolvimento foi desenhado em 5 Ondas Incrementais para mitigar riscos de regressão no módulo de contratos comerciais (`Contract`), que continuará operando normalmente.

Cada onda possui critérios de aceitação e testes específicos, garantindo que o sistema falhe fechado sob falhas de autenticação ou violação de escopo organizacional.

---

## 2. Detalhamento Técnico das 5 Ondas

### Onda 1: JWT Security & Edge API Guards
Esta onda implementa a camada de segurança inicial baseada em JWT, garantindo compatibilidade com o runtime Edge (do Next.js Middleware).

1. **Acesso Seguro ao Segredo (`src/lib/jwt-secret.ts`):**
   - Criação da função `getJwtSecret(): Uint8Array`.
   - Se `process.env.JWT_SECRET` não for definido ou possuir menos de 32 caracteres, lança um erro para falhar fechado.
   
2. **Biblioteca de Autenticação Edge (`src/lib/auth-edge.ts`):**
   - Exporta `verifyEdgeSessionToken(token: string): Promise<AuthSession | null>`.
   - Utiliza exclusivamente a biblioteca leve `jose` com o algoritmo HS256 para decodificar e validar tokens JWT de forma assíncrona.
   
3. **Wrapper de Proteção de API (`src/lib/api-auth.ts`):**
   - Cria o helper `withSession` para embrulhar handlers de rotas de API.
   - Retorna status `401 { error: 'Sessão inválida ou expirada.' }` em requisições não autenticadas ou com tokens malformados.
   
4. **Middleware (`src/middleware.ts`):**
   - Intercepta acessos às rotas `/command` e `/operations`, redirecionando para `/login` usuários sem sessão Edge válida.

---

### Onda 2: Fundação de Organização & Migração Segura de Tenant
Prepara o banco de dados para escopo organizacional (multitenant), associando dados existentes à organização padrão.

1. **Modelagem Prisma (`prisma/schema.prisma`):**
   - `Organization`: tabela que agrupa clientes, contratos, projetos e membros.
   - `Membership`: mapeia a associação de um `User` com uma `Organization`, incluindo o papel (`MembershipRole`: `OWNER`, `ADMIN`, `OPERATOR`, `VIEWER`).
   - `Client` e `Contract`: ganham relação obrigatória com `Organization`.
   
2. **Migração SQL (`prisma/migrations/202608230001_organization_foundation/migration.sql`):**
   - Criação das tabelas de organização e membros.
   - Inserção da organização inicial padrão: `org_kapel` (slug `kapel`, nome `KAPEL`).
   - Associação de todos os clientes e contratos existentes à `org_kapel`.
   - Alteração das colunas de `organization_id` para `NOT NULL`.
   
3. **API Guard Organizacional (`src/lib/api-auth.ts`):**
   - Criação de `withOrgContext<TContext>(handler, allowedRoles?)`.
   - Resolve o membership do usuário no banco. Caso o usuário não possua acesso à organização ou sua role não seja autorizada, retorna `403`.
   - Retorna o contexto em `OrgRequestContext` contendo `session`, `organizationId`, `membershipId` e `role`.

---

### Onda 3: Isolamento Multitenant das APIs Existentes
Protege as APIs comerciais e administrativas de contratos contra violação de acesso e enumeração de IDs.

1. **Escopo do Servidor:**
   - Todas as operações Prisma em clientes, categorias, serviços e contratos devem usar o `organizationId` resolvido internamente pelo `withOrgContext`.
   - O `organization_id` vindo no body ou query params da requisição é ignorado e sobrescrito com o ID verificado no servidor para evitar forjas.
   
2. **Prevenção de Enumeração de Recursos (Tenant Isolation):**
   - Leituras por ID e atualizações/exclusões de itens que pertençam a outras organizações retornam `404 Not Found` em vez de `403 Forbidden`, ocultando a existência do ID.
   
3. **Mapeamento de Rotas Privadas protegidas por `withOrgContext`:**
   - `/api/clients`, `/api/clients/[id]`
   - `/api/contracts`, `/api/contracts/[id]`, `/api/contracts/[id]/duplicate`, `/api/contracts/[id]/sign-kapel`, `/api/contracts/import`
   - `/api/categories`, `/api/services`, `/api/services/[id]`, `/api/settings`
   - `/api/dashboard`

---

### Onda 4: Modelagem de Projetos e APIs Operacionais
Adiciona os modelos operacionais e implementa as rotas de manipulação transacional.

1. **Modelagem Operacional:**
   - `Project`: representa os projetos reais executados para clientes finais. Possui horas semanais estimadas, deadline, receita em risco, valor estratégico (1 a 5) e carga mental (1 a 5).
   - `ProjectUpdate`: check-ins diários com sumário de status, próxima ação, blocker e métricas.
   - `WorkItem`: tarefas associadas com tipos (`ACTION`, `FOLLOW_UP`, `REVIEW`, `DECISION`).
   - `OperationalBlocker`: impedimentos de entrega de responsabilidade de parceiros ou terceiros.
   - `CommandAction`: log histórico das decisões tomadas pelo usuário na central.
   
2. **Endpoints Operacionais e Regras de Negócio:**
   - Restrições no banco de dados (`CHECK`) para limitar valores de estratégia/esforço a 1–5.
   - `POST /api/projects`: Cria projeto e `initialWorkItem` em uma única transação Prisma.
   - `POST /api/projects/[id]/updates`: Cria a atualização, atualiza `last_update_at` no projeto, altera saúde e opcionalmente gera um item de trabalho de próxima ação ou blocker em uma transação Prisma.
   - `PATCH /api/work-items/[id]`: Modifica status do item e atualiza `completed_at` automaticamente caso finalizado.

---

### Onda 5: Motor de Prioridade & Command API
Implementa a lógica central de tomada de decisão e expõe o painel de bordo.

1. **Motor de Priorização (`src/lib/command/priority.ts`):**
   - Lógica pura determinística com pontuação de 0 a 100 baseada em 7 fatores principais:
     - **Prazo/Atraso (0 a 25):** Vencidos recebem 25.
     - **Impacto Financeiro (0 a 25):** Projetos com receita em risco ganham escala até 25.
     - **Capacidade de Desbloqueio (0 a 20):** Follow-ups de blockers ativos pontuam alto.
     - **Valor Estratégico (0 a 15):** Multiplica o valor estratégico (1–5) por 3.
     - **Necessidade do Fundador (0 a 10):** Pontua se o item estiver atribuído ao dono do projeto.
     - **Eficiência do Esforço (0 a 5):** Favorece tarefas curtas (< 15 minutos).
     - **Penalidade de Atraso (-5):** Projetos sem check-in há mais de 7 dias perdem pontos.
   - **Regra de Bloqueio por Terceiros:** Se o projeto estiver bloqueado por terceiros, a tarefa tem score travado em `0` (não-executável), a menos que seja uma tarefa de `FOLLOW_UP` com prazo já atingido (`follow_up_at <= now`).
   - **Ordenação Estável:** Score descrescente, deadline crescente (nulls last), data de criação crescente.

2. **Endpoints da Command API (`/api/command`):**
   - `GET`: Retorna o read model estruturado diário contendo exatamente as top 3 decisões do fundador, receita em risco, blockers ativos, delegações e fila "Not Now".
   - `POST`: Grava a tomada de decisão do usuário (`START`, `COMPLETE`, `DEFER`, `DELEGATE`) e atualiza o histórico imutável `CommandAction`.

---

## 3. Estratégia de Testes e Não-Regressão

* **Segurança e Isolamento:** Testes em `tests/private-api-auth.test.ts` e `tests/tenant-scope.test.ts` validando que acessos sem sessão, com JWT expirado ou para IDs de outras organizações retornem 401/404.
* **Integridade de Dados:** Testes em `tests/operations-schema.test.ts` validando os CHECK constraints.
* **Corretude da Prioridade:** Teste unitário in `tests/priority.test.ts` cobrindo cenários com dados mockados para checar scores e o comportamento estável de ordenação.
* **Não Regressão:** Execução da suíte atual de testes (`npm test`) garantindo que as modificações de escopo organizacional em contratos não quebrem o fluxo comercial ou de assinaturas eletrônicas.
