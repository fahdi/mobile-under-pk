import { SCORE_KEYS, type Phone } from '../schema/phone';
import type { Preset } from '../schema/data';
import type { DataSet } from './load';
import { assignBracket, bracketSlug } from './brackets';
import { formatDate } from './format';
import { topPicks } from './scoring';

export type LandingProps = { kind: 'bracket'; ceiling: number } | { kind: 'intent'; ceiling: number; preset: string };

export function intentSlug(intent: string, ceiling: number): string {
  return `best-${intent}-phone-under-${ceiling}`;
}

export function phonesInBracket(data: DataSet, ceiling: number): Phone[] {
  return data.phones.filter((p) => assignBracket(p, data.brackets)?.ceiling === ceiling);
}

const nonEmpty = (data: DataSet) => data.brackets.map((b) => b.ceiling).filter((c) => phonesInBracket(data, c).length > 0);

const slugs = (rs: Array<{ phone: Phone }>) => rs.map((r) => r.phone.slug).join(',');

// Bracket pages for every non-empty bracket, plus intent pages only where the preset
// changes the bracket's top 3 (spec 15: avoid thin duplicate pages).
export function landingPaths(data: DataSet): Array<{ params: { landing: string }; props: LandingProps }> {
  const balanced = data.presets.find((p) => p.slug === 'balanced');
  return nonEmpty(data).flatMap((ceiling) => {
    const bracket = { params: { landing: bracketSlug(ceiling) }, props: { kind: 'bracket' as const, ceiling } };
    const phones = phonesInBracket(data, ceiling);
    if (!balanced || phones.length < 3) return [bracket];
    const base = slugs(topPicks(phones, balanced));
    const intents = data.presets
      .filter((p) => p.intent && slugs(topPicks(phones, p)) !== base)
      .map((p) => ({ params: { landing: intentSlug(p.intent!, ceiling) }, props: { kind: 'intent' as const, ceiling, preset: p.slug } }));
    return [bracket, ...intents];
  });
}

export function neighbours(data: DataSet, ceiling: number): { prev?: number; next?: number } {
  const list = nonEmpty(data);
  const i = list.indexOf(ceiling);
  return { prev: i > 0 ? list[i - 1] : undefined, next: i >= 0 && i < list.length - 1 ? list[i + 1] : undefined };
}

export function pickReason(phone: Phone, preset: Preset): string {
  const best = SCORE_KEYS.reduce((a, k) =>
    (preset.weights[k] ?? 0) * phone.scores[k].value > (preset.weights[a] ?? 0) * phone.scores[a].value ? k : a);
  return phone.scores[best].reason;
}

const money = (n: number) => n.toLocaleString('en-US');

export function bracketTitle(ceiling: number, checkedIso: string): string {
  const [, month, year] = formatDate(checkedIso).split(' ');
  return `Mobile under ${money(ceiling)} in Pakistan: best phones (${month} ${year})`;
}

const joinNames = (names: string[]) =>
  names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`;

export function bracketDescription(ceiling: number, count: number, checkedIso: string, picks: string[]): string {
  const phones = count === 1 ? 'phone' : 'phones';
  const label = picks.length === 1 ? 'Top pick' : 'Top picks';
  return `Compare ${count} ${phones} under Rs ${money(ceiling)} in Pakistan with PTA prices checked ${formatDate(checkedIso)}. ${label}: ${joinNames(picks)}.`;
}

export function intentTitle(intent: string, ceiling: number, checkedIso: string): string {
  const [, month, year] = formatDate(checkedIso).split(' ');
  return `Best ${intent} phone under ${money(ceiling)} in Pakistan (${month} ${year})`;
}
