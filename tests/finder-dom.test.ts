// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { applyResults, initFinder, readForm, writeForm } from '../src/scripts/finder-dom';
import { DEFAULT_STATE } from '../src/lib/filters';
import type { IndexEntry } from '../src/lib/index-entry';

const entry = (slug: string, ptaPrice: number, scores = [7, 7, 7, 7, 7, 7, 7, 7], o: Partial<IndexEntry> = {}): IndexEntry => ({
  slug, name: slug, brand: 'samsung', image: `/images/phones/${slug}.webp`, price: ptaPrice, ptaPrice,
  officialWarranty: true, status: 'available', year: 2025, releaseDate: '2025-01-01',
  fiveG: true, nfc: false, jack: false, mah: 5000, hz: 120, scores, ...o,
});
const presets = [
  { slug: 'balanced', name: 'Balanced', description: 'd', weights: { camera: 1, value: 1 } },
  { slug: 'camera-first', name: 'Camera', description: 'd', weights: { camera: 3 } },
];

function mountPage() {
  document.body.innerHTML = `
    <form id="finder">
      <input name="min" type="number"><input name="max" type="number">
      <input type="checkbox" name="brand" value="samsung"><input type="checkbox" name="brand" value="xiaomi">
      <input type="checkbox" name="year" value="2025">
      <input type="checkbox" name="status" value="available">
      <input type="checkbox" name="pta" value="1"><input type="checkbox" name="official" value="1">
      <input type="checkbox" name="5g" value="1"><input type="checkbox" name="nfc" value="1"><input type="checkbox" name="jack" value="1">
      <select name="battery"><option value="">Any</option><option value="5000">5000</option></select>
      <select name="hz"><option value="">Any</option><option value="120">120</option></select>
      <select name="sort"><option value="overall">Overall</option><option value="price">Price</option><option value="camera">Camera</option></select>
      <select name="preset"><option value="balanced">Balanced</option><option value="camera-first">Camera</option></select>
      <input type="number" name="w-camera"><input type="number" name="w-value">
    </form>
    <p id="finder-count" aria-live="polite"></p>
    <p id="finder-notice" hidden></p>
    <table><tbody>
      <tr data-slug="a"><td data-rank>1</td><td>A</td><td><span data-overall>7.0</span></td></tr>
      <tr data-slug="b"><td data-rank>2</td><td>B</td><td><span data-overall>7.0</span></td></tr>
      <tr data-slug="c"><td data-rank>3</td><td>C</td><td><span data-overall>7.0</span></td></tr>
    </tbody></table>`;
}
const rows = () => [...document.querySelectorAll('tbody tr')] as HTMLTableRowElement[];
const visible = () => rows().filter((r) => !r.hidden).map((r) => r.dataset.slug);
const form = () => document.getElementById('finder') as HTMLFormElement;

beforeEach(mountPage);

describe('applyResults', () => {
  it('hides non-matching rows, reorders, renumbers and updates scores and the count', () => {
    applyResults(document, [{ slug: 'c', overall: 8.25 }, { slug: 'a', overall: 6 }], 3);
    expect(visible()).toEqual(['c', 'a']);
    expect(rows().map((r) => r.dataset.slug)).toEqual(['c', 'a', 'b']);
    expect(rows()[0].querySelector('[data-rank]')!.textContent).toBe('1');
    expect(rows()[0].querySelector('[data-overall]')!.textContent).toBe('8.3');
    expect(document.getElementById('finder-count')!.textContent).toBe('Showing 2 of 3 phones');
  });
});

describe('readForm and writeForm', () => {
  it('round-trip a full state', () => {
    const s = { ...DEFAULT_STATE, min: 20000, max: 50000, brands: ['xiaomi'], years: [2025], statuses: ['available' as const],
      pta: true, official: true, fiveG: true, nfc: true, jack: true, battery: 5000, hz: 120,
      sort: 'camera' as const, preset: 'camera-first', weights: { camera: 2, value: 1.5 } };
    writeForm(form(), s);
    expect(readForm(form())).toEqual(s);
  });
  it('reads an untouched form as the default state', () => {
    expect(readForm(form())).toEqual(DEFAULT_STATE);
  });
});

describe('initFinder', () => {
  const index = [entry('a', 40000, [5, 5, 5, 5, 5, 5, 9, 5]), entry('b', 47000, [9, 5, 5, 5, 5, 5, 5, 5]), entry('c', 52000)];

  it('applies the state from the URL on load and writes it into the form', async () => {
    window.history.replaceState(null, '', '/finder/?max=48000');
    await initFinder(document, window, async () => index, presets);
    expect(visible()).toEqual(['a', 'b']);
    expect((form().elements.namedItem('max') as HTMLInputElement).value).toBe('48000');
  });

  it('re-sorts on input and puts the new state in the URL', async () => {
    window.history.replaceState(null, '', '/finder/');
    await initFinder(document, window, async () => index, presets);
    (form().elements.namedItem('preset') as HTMLSelectElement).value = 'camera-first';
    form().dispatchEvent(new Event('input', { bubbles: true }));
    expect(visible()[0]).toBe('b');
    expect(window.location.search).toBe('?preset=camera-first');
  });

  it('leaves the server list alone and shows a notice when the index fails to load', async () => {
    window.history.replaceState(null, '', '/finder/?max=1');
    await initFinder(document, window, vi.fn().mockRejectedValue(new Error('offline')), presets);
    expect(visible()).toEqual(['a', 'b', 'c']);
    expect(document.getElementById('finder-notice')!.hidden).toBe(false);
  });
});
