# Especificação de Design: Módulo de Assinatura Eletrônica Nativa KAPEL

**Data:** 12/08/2026  
**Status:** APROVADO  
**Autor:** Patrick Eduardo Lima Silva & Antigravity (Superpowers HQ)  
**Projeto:** KAPEL Contract System (`kapel-contract`)

---

## 1. Visão Geral & Objetivo

Implementar um módulo nativo de **Assinatura Eletrônica Simples/Avançada** (em conformidade com a MP 2.200-2/2001 e a Lei nº 14.063/2020) integrado ao KAPEL Contract System. 

O módulo permitirá que contratos gerados na plataforma sejam assinados em duas etapas (KAPEL + Cliente), colhendo vistos digitais, IPs, timestamps, validação de trecho do CPF/CNPJ e gerando um **Certificado de Auditoria com Hash Criptográfico SHA-256** e página pública de verificação por QR Code.

---

## 2. Requisitos do Sistema

### 2.1 Requisitos Funcionais (RF)
- **RF01 (Token Único):** Gerar um token UUID v4 único (`signature_token`) para cada contrato em estado de assinatura.
- **RF02 (Assinatura do Representante KAPEL):** Permitir que o Admin KAPEL assine o contrato pelo painel interno (`/contracts/[id]`), validando os 4 primeiros dígitos do seu CPF/CNPJ e colhendo o visto desenhado.
- **RF03 (Assinatura do Cliente):** Disponibilizar uma página pública segura (`/sign/[token]`) onde o cliente lê o contrato, confirma os 4 primeiros dígitos do seu documento (CNPJ ou CPF) e desenha/digita seu visto.
- **RF04 (Captura de Metadados de Auditoria):** Gravar para ambas as partes:
  - Endereço IP do assinante.
  - User-Agent (navegador/dispositivo).
  - Data/Hora UTC exata (`ISO 8601`).
  - Imagem do Visto/Assinatura (Canvas Data URL PNG).
  - Hash SHA-256 combinando contrato + metadados.
- **RF05 (Página Pública de Validação):** Criar a rota `/verify/[audit_hash]` que exibe a autenticidade do documento, signatários, horários e integridade.
- **RF06 (Certificado de Encerramento):** Anexar a folha de auditoria ao final da visualização/impressão do contrato com QR Code apontando para `/verify/[audit_hash]`.

### 2.2 Requisitos Não-Funcionais (RNF)
- **RNF01 (Segurança):** O token de assinatura deve ser randômico e não-adivinhável (UUID v4).
- **RNF02 (Responsividade):** A tela pública `/sign/[token]` deve funcionar perfeitamente em telas touch móveis (smartphones/tablets).
- **RNF03 (Performance):** A verificação e gravação da assinatura devem ocorrer em < 500ms.

---

## 3. Modelo de Dados (Prisma Schema Updates)

Adicionar ao modelo `Contract` em `prisma/schema.prisma`:

```prisma
model Contract {
  // ... campos existentes ...

  // Módulo de Assinatura Eletrônica Nativa
  signature_token              String?               @unique
  signature_status             String                @default("DRAFT") // DRAFT, PENDING_KAPEL, PENDING_CLIENT, SIGNED, CANCELLED

  // Dados do Assinante KAPEL (Primeiro Assinante)
  signed_kapel_at              DateTime?
  signed_kapel_ip              String?
  signed_kapel_user_agent      String?
  signed_kapel_name            String?
  signed_kapel_doc             String?
  signed_kapel_signature_data  String?               // Canvas PNG Data URL / Base64

  // Dados do Assinante CLIENTE (Segundo Assinante)
  signed_client_at             DateTime?
  signed_client_ip             String?
  signed_client_user_agent     String?
  signed_client_name           String?
  signed_client_doc            String?
  signed_client_signature_data String?               // Canvas PNG Data URL / Base64

  // Hash de Auditoria Criptográfica
  audit_hash                   String?               @unique
}
```

---

## 4. Arquitetura de Rotas e Endpoints

### 4.1 Endpoints da API (`/api/contracts/...`)
- `POST /api/contracts/[id]/sign-kapel`: Realiza a assinatura do representante KAPEL. Valida 4 dígitos do CPF/CNPJ, grava metadados, ajusta status para `PENDING_CLIENT` e gera `signature_token`.
- `GET /api/contracts/public/sign/[token]`: Retorna os dados públicos do contrato para exibição do cliente (sem dados sensíveis de auditoria interna).
- `POST /api/contracts/public/sign/[token]`: Processa a assinatura do cliente. Valida 4 dígitos do documento, grava metadados, calcula o `audit_hash` final e atualiza status para `SIGNED` / `FINALIZED`.
- `GET /api/contracts/public/verify/[hash]`: Retorna as evidências imutáveis de auditoria para consulta pública.

### 4.2 Páginas (Next.js App Router)
- `/contracts/[id]` (Admin Dashboard): Adição do modal de assinatura KAPEL e do botão de compartilhamento do link de assinatura do cliente.
- `/sign/[token]` (Página Pública): Interface de visualização, validação de documento, canvas de desenho de assinatura e aceite.
- `/verify/[hash]` (Página Pública): Certificado digital interativo com selo KAPEL VERIFIED.

---

## 5. Plano de Verificação e Testes (Vitest)
- Teste unitário para cálculo do `audit_hash` SHA-256.
- Teste unitário da verificação de 4 dígitos do CPF/CNPJ.
- Teste de integração das rotas de assinatura KAPEL e Cliente.
