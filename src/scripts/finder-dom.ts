import { SCORE_KEYS, type Status } from '../schema/phone';
import type { Preset, Weights } from '../schema/data';
import { DEFAULT_STATE, matchesFilters, sortEntries, type FinderState, type SortKey } from '../lib/filters';
import type { IndexEntry } from '../lib/index-entry';
import { fromQuery, toQuery } from '../lib/url-state';

type Field = HTMLInputElement | HTMLSelectElement;
const field = (f: HTMLFormElement, name: string) => f.elements.namedItem(name) as Field | null;
const boxes = (f: HTMLFormElement, name: string) => [...f.querySelectorAll<HTMLInputElement>(`input[type=checkbox][name="${name}"]`)];
const num = (v: string | undefined) => (v && /^\d+(\.\d+)?$/.test(v) && Number(v) > 0 ? Number(v) : undefined);
const FLAGS = [['pta', 'pta'], ['official', 'official'], ['fiveG', '5g'], ['nfc', 'nfc'], ['jack', 'jack']] as const;

export function readForm(f: HTMLFormElement): FinderState {
  const checked = (name: string) => boxes(f, name).filter((b) => b.checked).map((b) => b.value);
  const weights: Weights = {};
  for (const k of SCORE_KEYS) {
    const v = field(f, `w-${k}`)?.value;
    if (v !== undefined && /^\d+(\.\d+)?$/.test(v)) weights[k] = Number(v);
  }
  const state: FinderState = {
    ...DEFAULT_STATE,
    min: num(field(f, 'min')?.value), max: num(field(f, 'max')?.value),
    brands: checked('brand'), years: checked('year').map(Number), statuses: checked('status') as Status[],
    battery: num(field(f, 'battery')?.value), hz: num(field(f, 'hz')?.value),
    sort: (field(f, 'sort')?.value || DEFAULT_STATE.sort) as SortKey,
    preset: field(f, 'preset')?.value || DEFAULT_STATE.preset,
    weights: Object.keys(weights).length ? weights : undefined,
  };
  for (const [key, name] of FLAGS) state[key] = boxes(f, name).some((b) => b.checked);
  return state;
}

export function writeForm(f: HTMLFormElement, s: FinderState): void {
  const set = (name: string, v: unknown) => {
    const el = field(f, name);
    if (el) el.value = v === undefined ? '' : String(v);
  };
  set('min', s.min); set('max', s.max); set('battery', s.battery); set('hz', s.hz);
  set('sort', s.sort); set('preset', s.preset);
  const tick = (name: string, values: string[]) => boxes(f, name).forEach((b) => { b.checked = values.includes(b.value); });
  tick('brand', s.brands); tick('year', s.years.map(String)); tick('status', s.statuses);
  for (const [key, name] of FLAGS) tick(name, s[key] ? ['1'] : []);
  for (const k of SCORE_KEYS) set(`w-${k}`, s.weights?.[k]);
}

// Reorder and hide the server-rendered rows; rows are never re-created.
export function applyResults(doc: Document, results: Array<{ slug: string; overall: number }>, total: number): void {
  const rows = new Map([...doc.querySelectorAll<HTMLTableRowElement>('tr[data-slug]')].map((r) => [r.dataset.slug!, r]));
  const tbody = rows.values().next().value?.parentElement;
  if (!tbody) return;
  let shown = 0;
  for (const { slug, overall } of results) {
    const row = rows.get(slug);
    if (!row) continue;
    row.hidden = false;
    row.querySelector('[data-rank]')!.textContent = String(++shown);
    row.querySelector('[data-overall]')!.textContent = overall.toFixed(1);
    tbody.append(row);
    rows.delete(slug);
  }
  for (const row of rows.values()) {
    row.hidden = true;
    tbody.append(row);
  }
  const count = doc.getElementById('finder-count');
  if (count) {
    count.textContent = shown ? `Showing ${shown} of ${total} phones` : 'No phones match these filters. Try a higher budget or fewer must-haves.';
  }
}

export async function initFinder(doc: Document, win: Window, loadIndex: () => Promise<IndexEntry[]>, presets: Preset[]): Promise<void> {
  const form = doc.getElementById('finder') as HTMLFormElement | null;
  if (!form) return;
  const known = { brands: boxes(form, 'brand').map((b) => b.value), presets: presets.map((p) => p.slug) };
  writeForm(form, fromQuery(win.location.search, known));

  let entries: IndexEntry[];
  try {
    entries = await loadIndex();
  } catch {
    const notice = doc.getElementById('finder-notice');
    if (notice) {
      notice.textContent = 'Could not load the live filter. Showing all phones ranked by overall score.';
      notice.hidden = false;
    }
    return;
  }

  const update = () => {
    const s = readForm(form);
    applyResults(doc, sortEntries(entries.filter((e) => matchesFilters(e, s)), s, presets), entries.length);
    const q = toQuery(s);
    win.history.replaceState(null, '', q ? `?${q}` : win.location.pathname);
  };
  form.addEventListener('input', update);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    update();
  });
  update();
}

// Phones: filters live in a drawer that slides in from the left. Desktop CSS ignores all of this.
export function initFilterDrawer(doc: Document): void {
  const form = doc.getElementById('finder') as HTMLFormElement | null;
  const toggle = form?.querySelector<HTMLButtonElement>('.filters-toggle');
  const panel = form?.querySelector<HTMLElement>('.finder-filters');
  if (!form || !toggle || !panel) return;
  const apply = form.querySelector<HTMLButtonElement>('.drawer-apply');
  form.classList.add('has-drawer');

  const set = (open: boolean) => {
    form.classList.toggle('drawer-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    doc.body.classList.toggle('no-scroll', open);
    if (open) panel.querySelector<HTMLElement>('.drawer-close')?.focus();
    else if (doc.activeElement && panel.contains(doc.activeElement)) toggle.focus();
  };
  toggle.addEventListener('click', () => set(true));
  form.querySelector('.drawer-close')?.addEventListener('click', () => set(false));
  form.querySelector('.drawer-backdrop')?.addEventListener('click', () => set(false));
  apply?.addEventListener('click', () => set(false));
  doc.addEventListener('keydown', (e) => { if ((e as KeyboardEvent).key === 'Escape' && form.classList.contains('drawer-open')) set(false); });

  const showCount = () => {
    const n = doc.getElementById('finder-count')?.textContent?.match(/(\d+)(?: of \d+)? phones/)?.[1];
    if (apply) apply.textContent = n ? `Show ${n} phones` : 'Show phones';
  };
  const refresh = () => {
    const active = [...panel.querySelectorAll<HTMLInputElement | HTMLSelectElement>('input, select')]
      .filter((el) => (el instanceof HTMLInputElement && el.type === 'checkbox' ? el.checked : el.value !== '')).length;
    toggle.textContent = active ? `Filters · ${active}` : 'Filters';
    showCount();
  };
  form.addEventListener('input', refresh);
  const count = doc.getElementById('finder-count');
  if (count && typeof MutationObserver !== 'undefined') new MutationObserver(showCount).observe(count, { childList: true, characterData: true, subtree: true });
  refresh();
}
