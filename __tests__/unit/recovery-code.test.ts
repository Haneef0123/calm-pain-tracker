import { describe, it, expect } from 'vitest';
import { generateCode, formatGrouped, normalize } from '@/lib/recovery/code';

const CROCKFORD_CHARSET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

describe('generateCode', () => {
  it('returns a 12-character string', () => {
    expect(generateCode()).toHaveLength(12);
  });

  it('only uses Crockford base32 characters', () => {
    const code = generateCode();
    for (const ch of code) {
      expect(CROCKFORD_CHARSET).toContain(ch);
    }
  });

  it('never contains visually ambiguous characters I, L, O, U', () => {
    for (let i = 0; i < 50; i++) {
      expect(generateCode()).not.toMatch(/[ILOU]/);
    }
  });

  it('produces different codes on successive calls', () => {
    const codes = new Set(Array.from({ length: 20 }, generateCode));
    // With 32^12 possible codes the chance of a collision in 20 draws is negligible
    expect(codes.size).toBeGreaterThan(1);
  });
});

describe('formatGrouped', () => {
  it('formats a raw 12-char code as XXXX-XXXX-XXXX', () => {
    expect(formatGrouped('ABCDEFGHJKMN')).toBe('ABCD-EFGH-JKMN');
  });

  it('re-formats an already-grouped code correctly', () => {
    expect(formatGrouped('ABCD-EFGH-JKMN')).toBe('ABCD-EFGH-JKMN');
  });

  it('works with numeric codes', () => {
    expect(formatGrouped('012345678901')).toBe('0123-4567-8901');
  });
});

describe('normalize', () => {
  it('strips dashes from a grouped code', () => {
    expect(normalize('ABCD-EFGH-JKMN')).toBe('ABCDEFGHJKMN');
  });

  it('uppercases lowercase input', () => {
    expect(normalize('abcdefghjkmn')).toBe('ABCDEFGHJKMN');
  });

  it('is idempotent on an already-normalized code', () => {
    expect(normalize('ABCDEFGHJKMN')).toBe('ABCDEFGHJKMN');
  });

  it('strips multiple dashes', () => {
    expect(normalize('AB-CD-EF-GH-JK-MN')).toBe('ABCDEFGHJKMN');
  });
});
