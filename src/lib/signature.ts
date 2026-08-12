import { createHash, randomUUID } from 'crypto';

/**
 * Valida se a entrada de 4 dígitos do usuário corresponde aos 4 primeiros dígitos numéricos do documento (CPF ou CNPJ).
 */
export function validateDocPrefix(officialDoc: string, input4Digits: string): boolean {
  if (!officialDoc || !input4Digits) return false;

  const cleanOfficial = officialDoc.replace(/\D/g, '');
  const cleanInput = input4Digits.replace(/\D/g, '');

  if (cleanOfficial.length < 4 || cleanInput.length < 4) return false;

  return cleanOfficial.slice(0, 4) === cleanInput.slice(0, 4);
}

/**
 * Gera um token UUID v4 randômico e não-adivinhável para o link público de assinatura.
 */
export function generateSignatureToken(): string {
  return randomUUID();
}

/**
 * Gera o Hash SHA-256 de auditoria imutável do contrato assinado.
 */
export function generateAuditHash(payload: Record<string, any>): string {
  const jsonString = JSON.stringify(payload, Object.keys(payload).sort());
  return createHash('sha256').update(jsonString).digest('hex');
}
