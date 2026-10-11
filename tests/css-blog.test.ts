import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const css = readFileSync('src/styles/global.css', 'utf8');
const rule = (selector: string) => css.match(new RegExp(`${selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\{([^}]*)\\}`))?.[1] ?? '';

describe('blog post tables', () => {
  it('collapse borders and scroll sideways instead of squashing on phones', () => {
    expect(rule('.post-body table')).toMatch(/border-collapse:\s*collapse/);
    expect(rule('.post-body table')).toMatch(/overflow-x:\s*auto/);
  });
  it('have bordered, padded cells and a distinct header row', () => {
    expect(rule('.post-body th, .post-body td')).toMatch(/border(-bottom)?:/);
    expect(rule('.post-body th, .post-body td')).toMatch(/padding:/);
    expect(rule('.post-body thead th')).toMatch(/background:/);
  });
});
