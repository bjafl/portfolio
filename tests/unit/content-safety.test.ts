import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = join(import.meta.dirname, '../../src');
const ROOTS = [join(SRC, 'content'), join(SRC, 'assets')];

// sha256 of lower-cased tokens that must not appear in content (the names themselves are kept out of the repo):
// employer-internal hostnames, and the names of vendors whose systems the work projects touch.
// CONTENT_SAFETY_EXTRA (comma-separated plain tokens) adds more at runtime.
const BLOCKED_HASHES = new Set([
  '5c6f1e84752be19ad79c7bbda541f028f4487008cc579fd507fb205e5d1e0242',
  'a711ce5e5baeabdbd4983f95683a4bf8670a3c25acbd3d3e58c0f082499e969f',
  '4b042ad4858a361774789d582a4f4b49c0e954b09b7a03e534e9b4912b2e8a0b',
  'ec5c888c4998afece8abe764e8bbeb0049ebcdc9c4a96a5e44f456d329880e40',
]);
for (const t of (process.env.CONTENT_SAFETY_EXTRA ?? '').split(',')) {
  if (t.trim()) BLOCKED_HASHES.add(sha256(t.trim().toLowerCase()));
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

function blockedTokens(line: string): string[] {
  return (line.toLowerCase().match(/[a-z0-9]+/g) ?? []).filter((w) => BLOCKED_HASHES.has(sha256(w)));
}

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const RULES: [string, RegExp][] = [
  ['email', /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[a-z]{2,}/],
  ['ip address', /\b(?:\d{1,3}\.){3}\d{1,3}\b/],
  ['internal host', /(\.local\b|\.internal\b|\blocalhost\b)/i],
  ['placeholder', /\b(TODO|FIXME|lorem ipsum)\b/i],
  ['credential', /(api[_-]?key|secret|token)\s*[:=]/i],
];

describe('content safety', () => {
  const files = ROOTS.flatMap(walk).filter((f) => /\.(md|yaml|svg)$/.test(f));

  it('hash matcher flags a blocked token', () => {
    process.env.CONTENT_SAFETY_EXTRA = '';
    expect(blockedTokens('see Example1 here')).toEqual([]);
    BLOCKED_HASHES.add(sha256('example1'));
    expect(blockedTokens('see Example1 here')).toEqual(['example1']);
    BLOCKED_HASHES.delete(sha256('example1'));
  });

  it('finds content files', () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it('contains no sensitive or placeholder text', () => {
    const hits: string[] = [];
    for (const file of files) {
      readFileSync(file, 'utf8')
        .split('\n')
        .forEach((line, i) => {
          if (blockedTokens(line).length) hits.push(`${file}:${i + 1} [blocked name]`);
          for (const [name, re] of RULES) {
            if (re.test(line)) hits.push(`${file}:${i + 1} [${name}] ${line.trim()}`);
          }
        });
    }
    expect(hits).toEqual([]);
  });
});
