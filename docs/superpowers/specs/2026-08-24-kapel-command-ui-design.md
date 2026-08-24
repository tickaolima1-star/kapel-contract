# Design Spec — KAPEL Command Dashboard UI

**Data:** 24 de agosto de 2026  
**Status:** aprovado pelo usuário  
**Autor:** Antigravity (AI Coding Assistant)  
**Contexto:** Construção da interface visual do painel central operacional em `/command` consumindo os dados da API `/api/command`.

---

## 1. Requisitos de Interface e Experiência do Usuário

A página de dashboard `/command` deve apresentar de forma limpa e imediata o estado de execução operacional da organização do fundador, dividindo-se em:

1. **Top 3 Decisões (Foco Diário):**
   - Apresenta as 3 tarefas de maior prioridade atribuídas ao fundador.
   - Cada item deve exibir: título, projeto associado, pontuação de prioridade (0-100), estimativa de esforço (tempo) e prazo.
   - Botões de ação direta:
     - **Começar** (só aparece se o status for `OPEN`) -> envia `START`.
     - **Concluir** -> envia `COMPLETE`.
     - **Adiar** -> envia `DEFER` (abre um campo opcional de justificativa ou seleciona período de adiamento).

2. **Métricas de Receita em Risco (Faturamento em Risco):**
   - Lista os projetos com saúde crítica ou atenção, com o valor financeiro associado (`monthly_value_at_risk`).

3. **Impedimentos Ativos (Blockers):**
   - Lista impedimentos de entrega de responsabilidade de parceiros ou clientes terceiros (`OperationalBlocker`).

4. **Delegações:**
   - Lista tarefas associadas a outros membros da organização.

5. **Fila Secundária ("Not Now"):**
   - Fila sanfonada ou recolhida com os próximos itens de prioridade.

---

## 2. Padrões de Design e Estilo

- **Estrutura:** Embrulhado com o componente `AdminLayout` e `Header` existentes.
- **Tema:** Dark theme, usando cor de fundo `#121312` e bordas `#335943` / `rgba(242,242,237,0.1)`.
- **Animações:** Efeitos hover sutis em cards de decisão e spinners durante o carregamento de transações.

---

## 3. Fluxo de Dados e APIs

- **Leitura:** No carregamento da página, realiza um `GET /api/command` para preencher o modelo.
- **Mutação:** Ao interagir com uma decisão, envia um `POST /api/command` com `{ workItemId, action, reason }` e recarrega os dados do dashboard imediatamente.
- **Tratamento de Erros:** Exibe banners vermelhos flutuantes em caso de erro na rede ou validação.
