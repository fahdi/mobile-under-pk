import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

export interface SiteCheck { pages: number; jsonLd: number; problems: string[] }

const htmlFiles = (dir: string): string[] => readdirSync(dir).flatMap((f) => {
  const p = join(dir, f);
  return statSync(p).isDirectory() ? htmlFiles(p) : p.endsWith('.html') ? [p] : [];
});

// Check a built site: every root-relative href/src carries the base and resolves to a file; JSON-LD parses.
export function checkSite(outDir: string, base: string): SiteCheck {
  const problems: string[] = [];
  let jsonLd = 0;
  const files = htmlFiles(outDir);
  for (const file of files) {
    const page = file.slice(outDir.length);
    const html = readFileSync(file, 'utf8');
    for (const [, body] of html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)) {
      jsonLd++;
      try { JSON.parse(body); } catch { problems.push(`${page}: invalid JSON-LD`); }
    }
    for (const [, url] of html.matchAll(/(?:href|src)="(\/[^"]*)"/g)) {
      const path = url.replace(/[?#].*$/, '');
      if (!path.startsWith(base)) { problems.push(`${page}: link without base path ${path}`); continue; }
      const rel = path.slice(base.length);
      const target = rel === '' || rel.endsWith('/') ? join(outDir, rel, 'index.html') : join(outDir, rel);
      if (!existsSync(target)) problems.push(`${page}: broken link ${path}`);
    }
  }
  return { pages: files.length, jsonLd, problems: [...new Set(problems)] };
}
