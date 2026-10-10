import { describe, expect, it } from 'vitest';
import { loadData } from '../src/lib/load';

describe('loadData', () => {
  it('loads a valid tree with no issues', () => {
    const { data, issues } = loadData('tests/fixtures/data-ok');
    expect(issues).toEqual([]);
    expect(data.phones.map((p) => p.slug)).toEqual(['samsung-galaxy-a55']);
  });
  it('reports broken JSON and slug/filename mismatch without throwing', () => {
    const { issues } = loadData('tests/fixtures/data-bad');
    const msgs = issues.map((i) => `${i.file}: ${i.message}`).join('\n');
    expect(msgs).toContain('broken.json: cannot read JSON');
    expect(msgs).toContain('wrong-name.json: slug "samsung-galaxy-a55" does not match filename');
  });
});
