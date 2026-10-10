export function withBase(path: string, base: string = import.meta.env.BASE_URL): string {
  const m = path.match(/^([^?#]*)(.*)$/)!;
  let p = m[1].replace(/^\/+/, '');
  const isFile = /\.[a-z0-9]+$/i.test(p);
  if (p && !isFile && !p.endsWith('/')) p += '/';
  const b = base.endsWith('/') ? base : `${base}/`;
  return `${b}${p}${m[2]}`;
}
