import { randomBytes } from 'crypto';

export function generateRandom(length = 32): string {
  const buffer = randomBytes(length);
  return buffer.toString('hex');
}
