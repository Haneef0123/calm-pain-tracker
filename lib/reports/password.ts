import crypto from 'crypto';

const KEY_LENGTH = 64;

export function hashReportPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyReportPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(':');

  if (!salt || !hash) {
    return false;
  }

  const attemptedHash = crypto.scryptSync(password, salt, KEY_LENGTH).toString('hex');
  const hashBuffer = Buffer.from(hash, 'hex');
  const attemptedBuffer = Buffer.from(attemptedHash, 'hex');

  if (hashBuffer.length !== attemptedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(hashBuffer, attemptedBuffer);
}
