import { describe, expect, it } from 'vitest';
import { readEnum, readNumberInRange, readOptionalDate, readRequiredString } from '@/lib/validation';

describe('operations input validation', () => {
  it('returns field-safe errors for invalid values', () => {
    expect(readRequiredString('  ', 'Nome')).toEqual({ ok: false, message: 'Nome é obrigatório.' });
    expect(readEnum('UNKNOWN', ['ACTIVE', 'BLOCKED'] as const, 'Status').ok).toBe(false);
    expect(readNumberInRange(6, 1, 5, 'Valor').ok).toBe(false);
    expect(readOptionalDate('23/08/2026', 'Prazo').ok).toBe(false);
  });

  it('normalizes valid operational values', () => {
    expect(readRequiredString('  Ação  ', 'Ação')).toEqual({ ok: true, value: 'Ação' });
    expect(readEnum('ACTIVE', ['ACTIVE', 'BLOCKED'] as const, 'Status')).toEqual({ ok: true, value: 'ACTIVE' });
    expect(readNumberInRange('3', 1, 5, 'Valor')).toEqual({ ok: true, value: 3 });
    expect(readOptionalDate('2026-08-23T12:00:00.000Z', 'Prazo').ok).toBe(true);
  });
});
