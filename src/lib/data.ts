import { crossCheck } from './crosscheck';
import { loadData, type DataSet } from './load';

let cache: DataSet | undefined;

export function getData(): DataSet {
  if (cache) return cache;
  const { data, issues } = loadData(process.cwd());
  const today = new Date().toISOString().slice(0, 10);
  const errors = [...issues, ...crossCheck(data, today)].filter((i) => i.level === 'error');
  if (errors.length) {
    throw new Error(`Invalid data:\n${errors.map((e) => `  ${e.file}: ${e.message}`).join('\n')}`);
  }
  cache = data;
  return data;
}
