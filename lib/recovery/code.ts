import { randomInt } from 'crypto';

// Crockford base32 — removes I, L, O, U to avoid visual ambiguity
const CHARSET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export function generateCode(): string {
  return Array.from({ length: 12 }, () => CHARSET[randomInt(0, CHARSET.length)]).join('');
}

export function formatGrouped(code: string): string {
  const c = normalize(code);
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8, 12)}`;
}

export function normalize(code: string): string {
  return code.replace(/-/g, '').toUpperCase();
}
