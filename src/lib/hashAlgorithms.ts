import { HashAlgorithm } from './types';

export const HASH_RING_MAX = 0xFFFFFFFF; // 2^32 - 1

/**
 * 32-bit FNV-1a hash function
 */
export function fnv1a32(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // Multiply by 32-bit FNV prime 0x01000193 with bitwise 32-bit clamp
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer
}

/**
 * 32-bit Murmur3 hash implementation
 */
export function murmur3_32(key: string, seed: number = 0): number {
  let h1 = seed >>> 0;
  const c1 = 0xcc9e2d51;
  const c2 = 0x1b873593;
  const remainder = key.length & 3; // key.length % 4
  const bytes = key.length - remainder;

  for (let i = 0; i < bytes; i += 4) {
    let k1 =
      (key.charCodeAt(i) & 0xff) |
      ((key.charCodeAt(i + 1) & 0xff) << 8) |
      ((key.charCodeAt(i + 2) & 0xff) << 16) |
      ((key.charCodeAt(i + 3) & 0xff) << 24);

    k1 = Math.imul(k1, c1);
    k1 = (k1 << 15) | (k1 >>> 17);
    k1 = Math.imul(k1, c2);

    h1 ^= k1;
    h1 = (h1 << 13) | (h1 >>> 19);
    h1 = Math.imul(h1, 5) + 0xe6546b64;
  }

  let k1 = 0;
  switch (remainder) {
    case 3:
      k1 ^= (key.charCodeAt(bytes + 2) & 0xff) << 16;
      // fallthrough
    case 2:
      k1 ^= (key.charCodeAt(bytes + 1) & 0xff) << 8;
      // fallthrough
    case 1:
      k1 ^= key.charCodeAt(bytes) & 0xff;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
  }

  h1 ^= key.length;
  h1 ^= h1 >>> 16;
  h1 = Math.imul(h1, 0x85ebca6b);
  h1 ^= h1 >>> 13;
  h1 = Math.imul(h1, 0xc2b2ae35);
  h1 ^= h1 >>> 16;

  return h1 >>> 0;
}

/**
 * Compute hash using selected algorithm
 */
export function computeHash(key: string, algo: HashAlgorithm = 'murmur3'): number {
  if (algo === 'fnv1a') {
    return fnv1a32(key);
  }
  return murmur3_32(key);
}

/**
 * Convert 32-bit unsigned hash to angle in degrees [0, 360)
 */
export function hashToAngle(hash: number): number {
  return (hash / HASH_RING_MAX) * 360;
}

/**
 * Format hash as human-readable 8-char hex string
 */
export function formatHexHash(hash: number): string {
  return '0x' + hash.toString(16).padStart(8, '0').toUpperCase();
}
