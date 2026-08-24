export type ParseResult<T> = { ok: true; value: T } | { ok: false; message: string };

export function readRequiredString(value: unknown, label: string): ParseResult<string> {
  if (typeof value !== 'string' || !value.trim()) return { ok: false, message: `${label} é obrigatório.` };
  return { ok: true, value: value.trim() };
}

export function readOptionalString(value: unknown, label: string): ParseResult<string | undefined> {
  if (value === undefined || value === null || value === '') return { ok: true, value: undefined };
  if (typeof value !== 'string') return { ok: false, message: `${label} deve ser texto.` };
  return { ok: true, value: value.trim() || undefined };
}

export function readEnum<const T extends readonly string[]>(value: unknown, allowed: T, label: string): ParseResult<T[number]> {
  if (typeof value !== 'string' || !allowed.includes(value)) {
    return { ok: false, message: `${label} inválido.` };
  }
  return { ok: true, value: value as T[number] };
}

export function readNumberInRange(value: unknown, min: number, max: number, label: string): ParseResult<number> {
  const number = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(number) || number < min || number > max) {
    return { ok: false, message: `${label} deve estar entre ${min} e ${max}.` };
  }
  return { ok: true, value: number };
}

export function readOptionalDate(value: unknown, label: string): ParseResult<Date | undefined> {
  if (value === undefined || value === null || value === '') return { ok: true, value: undefined };
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    return { ok: false, message: `${label} deve estar em ISO-8601.` };
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { ok: false, message: `${label} deve estar em ISO-8601.` };
  return { ok: true, value: date };
}
