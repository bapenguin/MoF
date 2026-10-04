import path from 'node:path';

// Original file references were case-insensitive and some contain spaces or "!".
// Every asset gets a URL-safe, lowercase basename (no extension); the data
// converter applies the same function so references always line up.
export function assetKey(fileName) {
  const base = path.basename(fileName, path.extname(fileName));
  return base
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9._-]/g, '');
}
