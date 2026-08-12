# 🎮 KAPEL Superpowers: Trilha de Maestria em Engenharia com IA

Bem-vindo ao seu painel de bordo gamificado! Aqui você acompanha sua evolução na operacionalização com IA e no desenvolvimento da plataforma **KAPEL Contract System**.

---

## 📊 Status do Jogador & Projeto
- **Projeto:** `KAPEL Contract` (Next.js 14 + Prisma + Supabase + Tailwind + Vitest)
- **Empresa:** KAPEL Digital (Representante: Patrick Eduardo Lima Silva)
- **Nível Atual:** 🔴 **Nível 4: O General de Subagentes** (Liberado!)
- **XP Atual:** 500 / 1000 XP

---

## 🏆 Trilha de Conquistas (Quests)

### 🟢 Nível 1: Mapeador do Terreno (Entendimento Automático)
- [x] **Quest 1.1:** Instalar o repositório `obra/superpowers` em `.agents/skills`.
- [x] **Quest 1.2:** Escanear a stack tecnológica (Next.js 14 App Router, Prisma ORM, PostgreSQL/Supabase, Lucide, Vitest).
- [x] **Quest 1.3:** Mapear o modelo de dados (Contratos Políticos, Performance, Cláusulas Customizadas, Snapshots, Log de Auditoria).
- [x] **Quest 1.4:** Gerar o Grafo de Conhecimento e Arquitetura Interativo (`docs/KAPEL_ARCHITECTURE_GRAPH.html` e `GRAPH_REPORT.md`).

### 🔵 Nível 2: O Arquiteto (Design & Brainstorming de Novas Features)
- [x] **Quest 2.1:** Escolher a funcionalidade (Módulo de Assinatura Eletrônica Nativa).
- [x] **Quest 2.2:** Executar a skill `brainstorming` com rodadas de perguntas e aprovação arquitetural.
- [x] **Quest 2.3:** Salvar a especificação formal em `docs/superpowers/specs/2026-08-12-native-signature-flow-design.md`.

### 🟣 Nível 3: O Comandante de Planos (Micro-tarefas & Execução com TDD)
- [x] **Quest 3.1:** Converter o spec aprovado em um plano detalhado em `implementation_plan.md`.
- [x] **Quest 3.2:** Desenvolver e testar o Módulo de Assinatura Eletrônica (Prisma Schema, Criptografia SHA-256, SignatureCanvas, Rotas de API e Telas Públicas `/sign` e `/verify`).

### 🔴 Nível 4: O General de Subagentes (Desenvolvimento Paralelo)
- [ ] **Quest 4.1:** Dividir tarefas independentes para subagentes em paralelo (`subagent-driven-development`).
- [ ] **Quest 4.2:** Integrar e consolidar entregas sem colisão de código.

### 🟡 Nível 5: O CTO Invicto (Garantia de Qualidade & Zero Bugs)
- [ ] **Quest 5.1:** Aplicar TDD (`test-driven-development`) criando testes com Vitest antes da implementação.
- [ ] **Quest 5.2:** Usar `systematic-debugging` ao encontrar qualquer erro ou log de falha.
- [ ] **Quest 5.3:** Exigir `verification-before-completion` com testes passando de forma empírica antes de declarar vitória.

---

## 💡 Regras de Ouro & Lembretes

1. **Você NÃO precisa copiar tudo manualmente de fora!**
   A IA lê os arquivos da pasta do projeto em tempo real. Se você tiver um PDF ou documento de regras de negócio, basta colocar na pasta `docs/` do projeto ou colar o texto no chat.
2. **A IA NUNCA deve sair codando sem plano aprovado.**
   Sempre que quiser criar uma funcionalidade, iniciamos no **Modo Brainstorming**.
3. **Evidência antes de afirmação.**
   Antes de dizer "está pronto", executamos os testes automatizados (`npm test` ou `npx vitest run`).
