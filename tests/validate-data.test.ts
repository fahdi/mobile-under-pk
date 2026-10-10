import { describe, expect, it, vi } from 'vitest';
import { validateData } from '../src/integrations/validate-data';
import { getData } from '../src/lib/data';

type BuildStart = (opts: { logger: { info: (m: string) => void } }) => void;
const runBuildStart = (root: string) => {
  const hook = validateData({ root }).hooks['astro:build:start'] as unknown as BuildStart;
  const info = vi.fn();
  hook({ logger: { info } });
  return info;
};

describe('validate-data integration', () => {
  it('passes valid data and logs the phone count', () => {
    expect(runBuildStart('tests/fixtures/data-ok')).toHaveBeenCalledWith('1 phones passed validation');
  });

  it('fails the build on invalid data, naming every bad file', () => {
    expect(() => runBuildStart('tests/fixtures/data-bad')).toThrow(/broken\.json[\s\S]*wrong-name\.json/);
  });
});

describe('getData', () => {
  it('caches per root, so a good root never masks a bad one', () => {
    expect(getData('tests/fixtures/data-ok').phones).toHaveLength(1);
    expect(() => getData('tests/fixtures/data-bad')).toThrow(/Invalid data/);
  });
});

describe('image files on disk', () => {
  it('fails the build when a referenced photo is missing', () => {
    expect(() => getData('tests/fixtures/data-noimage')).toThrow(/samsung-galaxy-a55\.webp is missing/);
  });
});

describe('DATA_ROOT', () => {
  it('points getData at another data tree when no root is passed', () => {
    const prev = process.env.DATA_ROOT;
    process.env.DATA_ROOT = 'tests/fixtures/data-bad';
    try {
      expect(() => getData()).toThrow(/broken\.json/);
    } finally {
      if (prev === undefined) delete process.env.DATA_ROOT; else process.env.DATA_ROOT = prev;
    }
  });
});
