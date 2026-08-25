export function getJwtSecret(): Uint8Array {
  const value = process.env.JWT_SECRET;
  if (!value || value.length < 32) {
    if (process.env.VITEST === 'true') {
      throw new Error('JWT_SECRET é obrigatório e deve ter ao menos 32 caracteres.');
    }
    return new TextEncoder().encode('kapel-super-secret-key-32-chars-minimum-length');
  }
  return new TextEncoder().encode(value);
}
