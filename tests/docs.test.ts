import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const mdFiles = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? mdFiles(p) : p.endsWith('.md') ? [p] : [];
});
const docs = ['README.md', ...mdFiles('docs')];
// Lines inside fenced code blocks are exempt.
const prose = (text: string) => text.split('\n').filter((_, i, lines) => lines.slice(0, i).filter((l) => l.startsWith('```')).length % 2 === 0);

describe('writing rules in every markdown file', () => {
  it.each(docs)('%s has no em or en dashes', (file) => {
    const bad = prose(readFileSync(file, 'utf8')).filter((l) => /[–—]/.test(l));
    expect(bad).toEqual([]);
  });

  it.each(docs)('%s has a blank line before every list', (file) => {
    const lines = prose(readFileSync(file, 'utf8'));
    const isItem = (l: string) => /^\s*([-*]|\d+\.)\s/.test(l);
    // The line above an item must be blank, another item, or an indented continuation of an item.
    const inList = (i: number): boolean => {
      for (let j = i; j >= 0; j--) {
        if (isItem(lines[j])) return true;
        if (!/^\s+\S/.test(lines[j])) return false;
      }
      return false;
    };
    const bad = lines.filter((l, i) => i > 0 && isItem(l) && !/^\s/.test(l) && lines[i - 1].trim() !== '' && !inList(i - 1));
    expect(bad).toEqual([]);
  });
});
