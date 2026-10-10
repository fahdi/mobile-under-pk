import { loadData } from '../src/lib/load';
import { crossCheck } from '../src/lib/crosscheck';
import { imageExistsIn } from '../src/lib/data';

const root = process.argv[2] ?? process.cwd();
const today = new Date().toISOString().slice(0, 10);
const { data, issues } = loadData(root);
const all = [...issues, ...crossCheck(data, today, { imageExists: imageExistsIn(root) })];

for (const i of all) console.log(`${i.level.toUpperCase()} ${i.file}: ${i.message}`);
const errors = all.filter((i) => i.level === 'error').length;
console.log(`\n${data.phones.length} phones, ${errors} errors, ${all.length - errors} warnings`);
process.exit(errors ? 1 : 0);
