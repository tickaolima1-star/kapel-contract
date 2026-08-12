# 🗺️ Relatório do Grafo de Conhecimento (Graphify Report)

**Projeto:** KAPEL Contract System (`kapel-contract`)  
**Data:** 12/08/2026  
**Status:** Mapeamento 100% Concluído  
**Visualizador Interativo:** [KAPEL_ARCHITECTURE_GRAPH.html](file:///c:/Users/BTG%20Computadores/Documents/kapel-contract/docs/KAPEL_ARCHITECTURE_GRAPH.html)

---

## 🏛️ Resumo da Arquitetura do Sistema KAPEL

O Grafo de Arquitetura mapeia o fluxo completo de dados, desde o banco de dados PostgreSQL/Supabase até as rotas de API, componentes React e telas públicas de validação jurídica.

```
[Prisma DB] ◄──► [API Routes / Engines] ◄──► [Admin Dashboard]
                         │
                         ▼
             [Páginas Públicas /sign & /verify] ◄──► [Audit Trail SHA-256]
```

---

## 📊 Nós e Módulos Mapeados no Grafo

### 🟢 1. Camada de Dados (Prisma ORM & PostgreSQL)
- **`Contract`**: Modelo central que armazena os dados do contrato, honorários, cláusulas customizadas, tokens e status de assinatura.
- **`Client`**: Registro dos contratantes (Pessoa Física ou Jurídica).
- **`CompanySettings`**: Dados cadastrais imutáveis da KAPEL Digital (Representante, CNPJ, Endereço).
- **`Service` / `ServiceCategory`**: Catálogo de serviços com precificação e regras de cobrança (Ex: Recorrência vs. Projeto 50/50).
- **`ContractSnapshot`**: Congelamento imutável do contrato gerado na emissão.
- **`AuditLog`**: Registro histórico de ações do sistema (criação, edições, assinaturas).

### 🔵 2. APIs e Motores de Negócio
- **`src/lib/engine/financial.ts`**: Motor financeiro determinístico que calcula MRR, valor de entrada e parcelas futuras.
- **`src/lib/engine/clauses.ts`**: Gerador determinístico de cláusulas jurídicas dinâmicas.
- **`src/lib/signature.ts`**: Biblioteca de criptografia e assinatura (validação de 4 dígitos do documento, geração de token UUID v4 e Hash SHA-256).
- **`/api/contracts`**: Endpoint de criação e listagem de contratos.
- **`/api/contracts/[id]/sign-kapel`**: Endpoint para assinatura do representante KAPEL.
- **`/api/contracts/public/sign/[token]`**: API pública para consumo e conclusão da assinatura do cliente.
- **`/api/contracts/public/verify/[hash]`**: API de consulta pública do certificado de auditoria.

### 🟣 3. Páginas Administrativas (Next.js App Router)
- **`/dashboard`**: Painel executivo com métricas de MRR, contagem de clientes e gráficos.
- **`/contracts`**: Tabela responsiva de gestão de contratos.
- **`/contracts/new`**: Formulário interativo para criação de novos contratos.
- **`/contracts/[id]/preview`**: Pré-visualização do contrato formatado em papel A4.
- **`KapelSignModal.tsx`**: Modal de assinatura do representante KAPEL.

### 🟡 4. Páginas Públicas (Experiência do Cliente)
- **`/sign/[token]`**: Tela pública responsiva para leitura do contrato, confirmação dos 4 dígitos do documento, canvas de desenho de visto e aceite.
- **`/verify/[hash]`**: Certificado público de autenticidade jurídica com selo **KAPEL VERIFIED**.
- **`SignatureCanvas.tsx`**: Canvas interativo compatível com mouse e touch para visto digital.

### 🔴 5. Conformidade Criptográfica & Jurídica
- **MP 2.200-2/2001 e Lei 14.063/2020**: Regulamentação da Assinatura Eletrônica Simples e Avançada.
- **Validação por 4 Dígitos**: Trava de segurança para impedir assinaturas indevidas.
- **Hash SHA-256 Imutável**: Selo de integridade que vincula os dados do contrato com os metadados dos assinantes (IPs, User-Agent, Data/Hora UTC).
