import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { basename, join } from 'node:path';
import { z } from 'zod';
import { PhoneSchema, type Phone } from '../schema/phone';
import { BracketsFileSchema, BrandSchema, PresetSchema, type Bracket, type Brand, type Preset } from '../schema/data';

export interface DataSet { phones: Phone[]; brands: Brand[]; brackets: Bracket[]; presets: Preset[] }
export interface Issue { level: 'error' | 'warning'; file: string; message: string }

const fmt = (e: z.ZodError) => e.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ');

function readJson(path: string, file: string, issues: Issue[]): unknown {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (err) {
    issues.push({ level: 'error', file, message: `cannot read JSON: ${(err as Error).message}` });
    return undefined;
  }
}

function parseFile<T>(root: string, rel: string, schema: z.ZodType<T>, fallback: T, issues: Issue[]): T {
  const raw = readJson(join(root, rel), rel, issues);
  if (raw === undefined) return fallback;
  const r = schema.safeParse(raw);
  if (!r.success) { issues.push({ level: 'error', file: rel, message: fmt(r.error) }); return fallback; }
  return r.data;
}

export function loadData(root: string): { data: DataSet; issues: Issue[] } {
  const issues: Issue[] = [];
  const brands = parseFile(root, 'data/brands.json', z.array(BrandSchema), [], issues);
  const brackets = parseFile(root, 'data/brackets.json', BracketsFileSchema, [], issues);
  const presets = parseFile(root, 'data/presets.json', z.array(PresetSchema), [], issues);

  const dir = join(root, 'data/phones');
  const files = existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.json')).sort() : [];
  const phones: Phone[] = [];
  for (const f of files) {
    const rel = `data/phones/${f}`;
    const raw = readJson(join(dir, f), rel, issues);
    if (raw === undefined) continue;
    const r = PhoneSchema.safeParse(raw);
    if (!r.success) { issues.push({ level: 'error', file: rel, message: fmt(r.error) }); continue; }
    if (r.data.slug !== basename(f, '.json')) {
      issues.push({ level: 'error', file: rel, message: `slug "${r.data.slug}" does not match filename` });
    }
    phones.push(r.data);
  }
  return { data: { phones, brands, brackets, presets }, issues };
}
