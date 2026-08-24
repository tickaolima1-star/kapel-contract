export function readRequiredString(value: unknown, fieldName: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Campo ${fieldName} é obrigatório.`);
  }
  return value;
}

export function readNumberInRange(value: unknown, min: number, max: number, fieldName: string): number {
  const num = Number(value);
  if (isNaN(num) || num < min || num > max) {
    throw new Error(`Campo ${fieldName} deve ser um número entre ${min} e ${max}.`);
  }
  return num;
}
