import type { Preset } from '../schema/data';
import type { IndexEntry } from '../lib/index-entry';
import { withBase } from '../lib/paths';
import { initFinder } from './finder-dom';

const presets = JSON.parse(document.getElementById('finder-presets')?.textContent ?? '[]') as Preset[];
const loadIndex = async (): Promise<IndexEntry[]> => {
  const res = await fetch(withBase('/phones.index.json'));
  if (!res.ok) throw new Error(`index ${res.status}`);
  return res.json();
};
initFinder(document, window, loadIndex, presets);
