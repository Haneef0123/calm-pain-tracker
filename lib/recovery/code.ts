import { randomInt } from 'crypto';

// Crockford base32 — removes I, L, O, U to avoid visual ambiguity
const CHARSET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';

export const RECOVERY_CODE_LENGTH = 14; // 12 alphanum + 2 hyphens

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

/**
 * Derives the next formatted code value from a controlled input's onChange event.
 * Handles backspace-past-hyphen so a single keypress never deletes two characters.
 *
 * @param nextValue - e.target.value from the input event
 * @param prevFormatted - the current React state value before this keystroke
 * @returns the new formatted string to store in state (e.g. "ABCD-EF")
 */
export function applyCodeInput(nextValue: string, prevFormatted: string): string {
  const isDeleting = nextValue.length < prevFormatted.length;
  let raw = nextValue.replace(/[^0-9A-Za-z]/g, '').toUpperCase().slice(0, 12);
  if (isDeleting && prevFormatted.endsWith('-')) {
    raw = raw.slice(0, -1);
  }
  if (raw.length > 8) return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
  if (raw.length > 4) return `${raw.slice(0, 4)}-${raw.slice(4)}`;
  return raw;
}
