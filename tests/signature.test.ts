import { describe, it, expect } from 'vitest';
import { validateDocPrefix, generateSignatureToken, generateAuditHash } from '../src/lib/signature';

describe('Assinatura Eletrônica Nativa - Helper Module Tests', () => {
  it('Deve validar corretamente os 4 primeiros dígitos de CNPJ e CPF (limpando pontuação)', () => {
    // CNPJ: 67.726.428/0001-97 -> 4 primeiros dígitos: 6772
    expect(validateDocPrefix('67.726.428/0001-97', '6772')).toBe(true);
    expect(validateDocPrefix('67.726.428/0001-97', '67.72')).toBe(true);
    expect(validateDocPrefix('67.726.428/0001-97', '1234')).toBe(false);

    // CPF: 000.111.222-33 -> 4 primeiros dígitos: 0001
    expect(validateDocPrefix('000.111.222-33', '0001')).toBe(true);
    expect(validateDocPrefix('000.111.222-33', '0002')).toBe(false);
  });

  it('Deve gerar um token de assinatura UUID v4 válido de 36 caracteres', () => {
    const token = generateSignatureToken();
    expect(token).toBeTypeOf('string');
    expect(token.length).toBe(36);
    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
  });

  it('Deve gerar um Hash SHA-256 de auditoria determinístico de 64 caracteres hexadecimais', () => {
    const mockPayload = {
      contractNumber: '000001',
      kapelSignedAt: '2026-08-12T04:00:00.000Z',
      kapelIp: '189.100.10.1',
      clientSignedAt: '2026-08-12T04:05:00.000Z',
      clientIp: '201.50.20.2',
    };

    const hash1 = generateAuditHash(mockPayload);
    const hash2 = generateAuditHash(mockPayload);

    expect(hash1).toBeTypeOf('string');
    expect(hash1.length).toBe(64);
    expect(hash1).toBe(hash2);

    // Alterar o payload deve gerar hash totalmente diferente
    const hash3 = generateAuditHash({ ...mockPayload, clientIp: '201.50.20.3' });
    expect(hash1).not.toBe(hash3);
  });
});
