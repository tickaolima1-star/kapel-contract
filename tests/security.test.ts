import { afterEach, beforeEach, describe, it, expect } from 'vitest';
import {
  hashPassword,
  verifyPassword,
  signSessionToken,
  verifySessionToken,
} from '../src/lib/auth';

describe('Motor de Criptografia & Segurança (Bcrypt + JWT)', () => {
  const originalSecret = process.env.JWT_SECRET;
  const user = {
    id: 'usr-123',
    email: 'patrick@kapel.digital',
    name: 'Patrick Silva',
    role: 'ADMIN',
  };

  beforeEach(() => {
    process.env.JWT_SECRET = 'chave-segura-com-32-caracteres-para-testes';
  });

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.JWT_SECRET;
    else process.env.JWT_SECRET = originalSecret;
  });

  it('deve gerar hash Bcrypt valido e verificar senha corretamente', async () => {
    const password = 'MinhaSenhaSegura123!';
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash.startsWith('$2a$') || hash.startsWith('$2b$')).toBe(true);

    const isValid = await verifyPassword(password, hash);
    expect(isValid).toBe(true);

    const isWrongValid = await verifyPassword('SenhaErrada', hash);
    expect(isWrongValid).toBe(false);
  });

  it('deve rejeitar explicitamente a senha backdoor admin', async () => {
    const realHash = await hashPassword('MinhaSenhaReal123!');
    const isBackdoorValid = await verifyPassword('admin', realHash);
    expect(isBackdoorValid).toBe(false);
  });

  it('deve assinar e verificar token JWT de sessao', () => {
    const token = signSessionToken(user);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.user.email).toBe('patrick@kapel.digital');
  });

  it('falha fechado quando JWT_SECRET não existe', () => {
    delete process.env.JWT_SECRET;
    expect(() => signSessionToken(user)).toThrow('JWT_SECRET é obrigatório');
  });

  it('rejeita token assinado com outra chave', () => {
    process.env.JWT_SECRET = 'chave-com-32-bytes-para-testes-01';
    const token = signSessionToken(user);
    process.env.JWT_SECRET = 'chave-com-32-bytes-para-testes-02';
    expect(verifySessionToken(token)).toBeNull();
  });
});
