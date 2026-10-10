import { crossCheck } from './crosscheck';
import { loadData, type DataSet } from './load';

const cache = new Map<string, DataSet>();

export function getData(root: string = process.cwd()): DataSet {
  const hit = cache.get(root);
  if (hit) return hit;
  const { data, issues } = loadData(root);
  const today = new Date().toISOString().slice(0, 10);
  const errors = [...issues, ...crossCheck(data, today)].filter((i) => i.level === 'error');
  if (errors.length) {
    throw new Error(`Invalid data:\n${errors.map((e) => `  ${e.file}: ${e.message}`).join('\n')}`);
  }
  cache.set(root, data);
  return data;
}
