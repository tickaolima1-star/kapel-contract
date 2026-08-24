# KAPEL Command — Design da Central Operacional

**Data:** 23 de agosto de 2026  
**Status:** aprovado para planejamento  
**Produto-base:** KAPEL Contract  
**Primeiro usuário:** operação interna da KAPEL

## 1. Contexto e problema

O KAPEL Contract já resolve bem o núcleo comercial e jurídico: clientes contratantes, serviços, contratos, cláusulas, assinaturas, snapshots, auditoria e receita contratada. A aplicação usa Next.js 14, React, Prisma e PostgreSQL.

A operação diária, porém, não cabe no modelo atual. O dashboard trata contratos finalizados como “projetos”. Isso faz três contratos parecerem três projetos, embora Auri e Simone somem aproximadamente trinta projetos operacionais reais. As informações necessárias para decidir estão espalhadas entre ClickUp, dashboards, planilhas, grupos e memória.

O resultado é sobrecarga, baixa visibilidade de resultados, dificuldade de delegar e alocação de tempo incompatível com o retorno financeiro. Auri consome cerca de cinquenta horas por semana por R$ 5 mil mensais; Simone consome oito a dez horas por R$ 3,5 mil; REV consome sete a oito horas por R$ 6 mil. Agência 89 tem saldo condicionado por dependência externa de verba.

## 2. Objetivo

Transformar o KAPEL Contract na base de uma central interna de decisão que responda diariamente:

1. Qual é a melhor próxima hora do fundador?
2. Que receita, prazo ou relacionamento está em risco?
3. O que está bloqueado por terceiros?
4. O que pode ser delegado?
5. O que deliberadamente não deve ser feito hoje?

A primeira versão deve reduzir carga mental e aumentar eficiência e lucratividade agora. A comercialização da plataforma, cobrança por módulos, onboarding público e marketplace ficam para uma fase posterior.

## 3. Princípios

- Decisões antes de dashboards.
- Contrato não é projeto.
- Receita contratada não é caixa disponível.
- A prioridade deve ser explicável e reproduzível.
- A IA resume e explica; regras determinísticas calculam risco e prioridade.
- Fontes externas continuam existindo; o KAPEL consolida contexto e decisão.
- A entrada de dados precisa caber em poucos minutos.
- Informações financeiras só entram após reforço de autenticação e autorização.
- A arquitetura será interna primeiro, com fundação preparada para organizações futuras.

## 4. Escopo da primeira versão

### Incluído

- Reforço de autenticação e proteção das APIs.
- Organização padrão KAPEL e escopo de dados por organização.
- Projetos operacionais separados de contratos.
- Clientes finais/projetos atendidos dentro de contratantes como Auri e Simone.
- Objetivo, saúde, responsável, prazo, próxima ação, bloqueio e indicador principal.
- Atualizações rápidas de projeto.
- Importação inicial por planilha e colagem de resumo.
- Central “Hoje” com três decisões prioritárias.
- Receita em risco, bloqueios, delegações e itens que não devem ocupar o dia.
- Calendário financeiro simples de recebimentos e compromissos.
- Colaboradores, responsabilidades e atribuições.
- Resumo diário gerado por IA a partir de dados estruturados.
- Histórico das recomendações e das decisões tomadas.

### Fora do escopo

- Venda da plataforma e planos comerciais.
- Cobrança por módulos.
- Cadastro público de novas empresas.
- Aplicativo móvel nativo.
- Contabilidade completa, emissão fiscal ou conciliação bancária automática.
- Sincronização bidirecional completa com ClickUp.
- Integração bancária.
- Substituição do ClickUp, Adveronix ou planilhas.
- Automação que execute pagamentos, envie mensagens ou altere campanhas sem confirmação humana.

## 5. Arquitetura de produto

O produto passa a ter cinco módulos na mesma aplicação:

1. **Command:** decisões do dia, alertas, prioridades e resumo da IA.
2. **Contract:** módulo existente de clientes, serviços, contratos e assinatura.
3. **Operations:** projetos reais, atualizações, objetivos, ações e bloqueios.
4. **Finance:** recebíveis, compromissos, dívida, caixa e reserva.
5. **Team:** colaboradores, funções, capacidade, atribuições e delegação.

A IA é uma camada transversal. Ela não é a fonte de verdade e não substitui as regras de negócio.

A rota /dashboard permanece intacta durante a primeira entrega. A nova central nasce em /command. Depois da validação, /command vira a entrada padrão e o dashboard comercial continua acessível no módulo Contract.

## 6. Modelo de dados

### 6.1 Organização e acesso

**Organization**
- id
- name
- slug
- active
- created_at
- updated_at

**Membership**
- id
- organization_id
- user_id
- role: OWNER, ADMIN, OPERATOR ou VIEWER
- created_at

Uma organização KAPEL será criada e receberá todos os dados existentes por migração. Novas tabelas sempre terão organization_id. Clientes e contratos existentes passam a ser escopados pela organização para evitar uma migração futura perigosa.

### 6.2 Operação

**Project**
- id
- organization_id
- contracting_client_id
- contract_id opcional
- name
- end_client_name opcional
- objective
- status: PLANNING, ACTIVE, BLOCKED, ON_HOLD, COMPLETED ou CANCELLED
- health: HEALTHY, ATTENTION ou CRITICAL
- owner_membership_id
- deadline opcional
- weekly_hours_estimate
- monthly_value_at_risk
- strategic_value de 1 a 5
- mental_load de 1 a 5
- source: MANUAL, SPREADSHEET, CLICKUP ou OTHER
- external_id opcional
- external_url opcional
- last_update_at
- created_at
- updated_at

**ProjectUpdate**
- id
- project_id
- author_membership_id
- summary
- next_action
- blocker
- metric_label opcional
- metric_value opcional
- confidence: CONFIRMED ou ESTIMATED
- created_at

**WorkItem**
- id
- project_id
- assignee_membership_id opcional
- title
- type: ACTION, FOLLOW_UP, REVIEW ou DECISION
- status: OPEN, DOING, DONE, BLOCKED ou CANCELLED
- due_at opcional
- estimated_minutes opcional
- external_source opcional
- external_id opcional
- completed_at opcional
- created_at
- updated_at

**OperationalBlocker**
- id
- project_id
- description
- responsible_party: KAPEL, CLIENT, PARTNER ou THIRD_PARTY
- blocks_delivery
- status: OPEN, RESOLVED ou WAIVED
- follow_up_at opcional
- created_at
- resolved_at opcional

### 6.3 Finanças

**CashFlowEntry**
- id
- organization_id
- project_id opcional
- contract_id opcional
- kind: RECEIVABLE ou OBLIGATION
- category
- description
- amount
- due_date
- status: FORECAST, CONFIRMED, PAID, OVERDUE ou CANCELLED
- recurrence opcional
- created_at
- updated_at

**Debt**
- id
- organization_id
- creditor
- debt_type
- current_balance
- status: OPEN, NEGOTIATING ou SETTLED
- interest_rate_monthly opcional
- installment_amount opcional
- installment_count opcional
- next_due_date opcional
- last_verified_at
- notes opcional

Na primeira carga, a dívida do Banco do Brasil entra como R$ 18 mil e “estimada”. Ela só passa a “confirmada” quando valor e proposta forem verificados.

### 6.4 Equipe

Membership representa acesso ao sistema. Para colaboradores que ainda não acessam o sistema, será permitido um perfil operacional sem login, associado posteriormente a um usuário.

**TeamProfile**
- id
- organization_id
- membership_id opcional
- name
- role_title
- weekly_capacity_hours
- active
- compensation_notes opcional
- created_at
- updated_at

## 7. Motor de prioridade

O motor produz uma pontuação de 0 a 100 e uma explicação por item. A primeira versão usa regras fixas:

- Prazo e atraso: até 25 pontos.
- Impacto financeiro: até 25 pontos.
- Capacidade de desbloquear outras entregas: até 20 pontos.
- Valor estratégico: até 15 pontos.
- Necessidade real do fundador: até 10 pontos.
- Eficiência de esforço: até 5 pontos.

Regras adicionais:

- Trabalho bloqueado por terceiro não ocupa um bloco de execução; gera somente uma ação de follow-up na data adequada.
- Itens delegáveis aparecem na fila do responsável, não na fila principal do fundador.
- Item sem atualização recente perde confiança e gera pedido de atualização.
- Uma obrigação contratual crítica pode superar retorno por hora quando houver risco jurídico ou reputacional.
- Nenhuma nota é escondida. A interface mostra os fatores que compõem a recomendação.

A IA recebe os itens já classificados e gera linguagem curta: por que agir, qual resultado proteger e o que ignorar. Ela não altera valores, status, responsáveis ou datas sem confirmação.

## 8. Experiência diária

### Manhã — até cinco minutos

A página /command mostra:

- três decisões do dia;
- receita em risco;
- bloqueios que exigem follow-up;
- delegações sugeridas;
- itens explicitamente fora do foco;
- próximo marco de caixa.

O usuário confirma, reorganiza ou delega. A decisão fica registrada.

### Durante o dia

Cada projeto aceita um check-in rápido:

- situação atual;
- próximo passo;
- bloqueio;
- responsável;
- prazo;
- indicador principal.

A atualização deve ser possível em menos de um minuto.

### Encerramento — até cinco minutos

O usuário marca:

- concluído;
- adiado com motivo;
- bloqueado;
- delegado;
- novo risco identificado.

### Revisão semanal

A revisão mostra retorno por hora, projetos sem atualização, receita em risco, capacidade da equipe, caixa futuro e decisões repetidamente adiadas.

## 9. Importações e integrações

### Primeira versão

- Cadastro manual rápido.
- Importação CSV/XLSX com pré-visualização e confirmação.
- Colagem de resumo do ClickUp ou de grupos.
- Registro de origem e horário da atualização.
- Operação idempotente para não duplicar projetos ou tarefas.

### Fase posterior

- Leitura da API do ClickUp.
- Leitura de Google Sheets/Adveronix.
- Atualização incremental por external_id.
- Detecção de conflito entre edição local e fonte externa.
- Sincronização de volta somente após validação e autorização explícita.

## 10. Segurança

O estado atual usa o middleware para verificar apenas o formato do cookie JWT e lista rotas de interface protegidas. As APIs de dados não devem depender desse mecanismo.

Antes de dados operacionais ou financeiros:

- criar requireSession com validação criptográfica do JWT;
- aplicar autenticação em todas as APIs privadas;
- resolver organization_id no servidor;
- validar autorização por função;
- impedir que filtros fornecidos pelo cliente escapem do escopo da organização;
- proteger importações contra tipos e tamanhos indevidos;
- evitar dados sensíveis em logs;
- registrar ações financeiras e administrativas em auditoria;
- adicionar testes de acesso sem sessão, sessão inválida e organização incorreta.

O middleware continuará servindo como redirecionamento rápido, mas não será a barreira principal de segurança.

## 11. APIs e componentes

Novos grupos de API:

- /api/command
- /api/projects
- /api/projects/[id]
- /api/projects/[id]/updates
- /api/work-items
- /api/blockers
- /api/cash-flow
- /api/debts
- /api/team
- /api/imports/projects
- /api/ai/daily-brief

A UI será dividida em componentes focados. O arquivo atual de dashboard, que concentra consulta, métricas, importação e múltiplos modais, não receberá o novo módulo. Command e Operations terão rotas e componentes próprios.

## 12. Tratamento de erros

- Falha de importação não grava lote parcial sem indicação clara.
- Linhas inválidas aparecem em relatório de correção.
- Falha da IA não bloqueia a central; as prioridades determinísticas continuam disponíveis.
- Fonte externa indisponível mantém o último estado com data e sinal de desatualização.
- Valores financeiros estimados aparecem visualmente como estimados.
- Toda mutação retorna erro legível e mantém o formulário preenchido.
- Operações destrutivas exigem confirmação e deixam auditoria.

## 13. Estratégia de testes

- Testes unitários para pontuação de prioridade e regras de bloqueio.
- Testes de migração com cópia dos dados existentes.
- Testes de autorização por organização e função.
- Testes de API para CRUD de projetos, atualizações, caixa e equipe.
- Testes de importação com duplicatas, campos ausentes e arquivos inválidos.
- Testes da central com IA indisponível.
- Testes de responsividade em desktop e celular.
- Teste de não regressão do fluxo de contratos, assinatura e dashboard comercial.
- Build de produção antes de qualquer publicação.

## 14. Sequência de entrega

### Entrega 0 — segurança e fundação
Autenticação verificável, organização KAPEL, migração dos dados existentes e testes de acesso.

### Entrega 1 — Operations
Projetos reais, atualizações, responsáveis, bloqueios e importação inicial.

### Entrega 2 — Command
Motor determinístico, três decisões diárias, receita em risco, delegações e itens fora do foco.

### Entrega 3 — Finance e Team
Recebíveis, compromissos, dívida, reserva, colaboradores e capacidade.

### Entrega 4 — IA
Resumo diário explicável, sem autoridade para alterar dados por conta própria.

### Entrega 5 — integrações
ClickUp e planilhas com sincronização incremental. A comercialização da plataforma permanece fora deste ciclo.

## 15. Dados iniciais da KAPEL

A primeira carga operacional usará:

- Auri: R$ 5 mil/mês, cerca de cinquenta horas semanais, 18–20 projetos.
- Simone/WPL: R$ 3,5 mil/mês, oito a dez horas semanais, 9–10 projetos.
- REV: R$ 6 mil/mês, sete a oito horas semanais, um projeto.
- Agência 89/Ademir: R$ 7,5 mil por 45 dias, saldo final de R$ 3,75 mil condicionado à execução e à verba.
- Caixa pessoal atual: cerca de R$ 1 mil.
- Dívida provisória de cartão: R$ 18 mil.
- Recebimentos previstos: Auri no quinto dia útil, Simone no dia 15 e REV em 28 de setembro.
- Compromisso de remuneração da primeira colaboradora: TV parcelada em quatro vezes, valor final a registrar quando confirmado.

Esses dados começam como estimativas e carregam data de verificação.

## 16. Critérios de sucesso

Após duas semanas de uso:

- o fundador identifica as três prioridades do dia em menos de cinco minutos;
- todos os projetos ativos têm responsável, próxima ação e estado de atualização;
- bloqueios externos não consomem tempo de execução sem ação possível;
- tarefas delegáveis aparecem para a colaboradora;
- recebimentos e obrigações dos próximos trinta dias estão visíveis;
- nenhuma informação financeira privada fica exposta por API sem sessão válida;
- a aplicação de contratos continua funcionando sem regressão;
- o usuário relata redução da necessidade de manter o portfólio inteiro na memória.

## 17. Decisões registradas

- Evoluir o repositório existente, sem reescrever do zero.
- Manter Contract como módulo.
- Criar Operations e Command separados.
- Uso interno primeiro.
- Comercialização e cobrança por módulos depois.
- Atualização semiautomática antes de integrações completas.
- IA explicável depois da estruturação dos dados.
- Segurança antes de armazenar finanças.
