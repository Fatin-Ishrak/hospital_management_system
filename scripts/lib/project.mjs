// Shared helpers for the check scripts (no dependencies needed).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const SKIP = new Set(['node_modules', 'dist', '.git']);

export const toPosix = (p) => p.split(path.sep).join('/');

export function walk(dir = ROOT) {
  const out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(e.name) || e.name.startsWith('dist-')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(full));
    else out.push(toPosix(path.relative(ROOT, full)));
  }
  return out.sort();
}

// Line endings are normalised so Windows (CRLF) and Linux (LF) give the same fingerprint.
export function fingerprint(rel) {
  const text = fs.readFileSync(path.join(ROOT, rel), 'utf8').replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(text).digest('hex');
}

const ownership = JSON.parse(fs.readFileSync(path.join(ROOT, 'OWNERSHIP.json'), 'utf8'));
export const OWNERS = ownership.owners;
export function ownerOf(rel) {
  let best = null;
  for (const r of ownership.rules) {
    const hit = r.path.endsWith('/') ? rel.startsWith(r.path) : rel === r.path;
    if (hit && (!best || r.path.length > best.path.length)) best = r;
  }
  return best ? best.owner : ownership.default;
}

export const color = {
  red: (s) => `\x1b[31m${s}\x1b[0m`, green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`, bold: (s) => `\x1b[1m${s}\x1b[0m`,
};
