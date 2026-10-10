import { describe, expect, it } from 'vitest';
import { render } from './helpers/render';
import Base from '../src/layouts/Base.astro';
import PhoneTable from '../src/components/PhoneTable.astro';
import PriceChecked from '../src/components/PriceChecked.astro';
import ScoreList from '../src/components/ScoreList.astro';
import { makePhone, makeVariant } from './fixtures/phone';

const brands = [{ slug: 'samsung', name: 'Samsung', country: 'South Korea', officialStoreUrl: null, warrantyNote: null }];

describe('Base layout', () => {
  const props = { title: 'T', description: 'D', path: '/phones/x/', jsonLd: [{ '@type': 'Thing', name: 'a</script>b' }] };

  it('sets lang, title, description and a base-path canonical', async () => {
    const html = await render(Base, props, { default: '<p>body</p>' });
    expect(html).toContain('lang="en-PK"');
    expect(html).toContain('<title>T</title>');
    expect(html).toContain('<meta name="description" content="D">');
    expect(html).toContain('<link rel="canonical" href="https://fahdi.github.io/mobile-under-pk/phones/x/">');
    expect(html).toContain('<p>body</p>');
  });

  it('emits JSON-LD that cannot break out of its script tag', async () => {
    const html = await render(Base, props);
    expect(html).toContain('<script type="application/ld+json">');
    expect(html).not.toContain('a</script>b');
  });

  it('adds noindex only when asked', async () => {
    expect(await render(Base, props)).not.toContain('noindex');
    expect(await render(Base, { ...props, noindex: true })).toContain('<meta name="robots" content="noindex">');
  });

  it('links the favicon and home through the base path', async () => {
    const html = await render(Base, props);
    expect(html).toContain('href="/mobile-under-pk/favicon.svg"');
    expect(html).toContain('href="/mobile-under-pk/"');
  });
});

describe('PhoneTable', () => {
  const rows = [
    { phone: makePhone({ slug: 'a', model: 'Alpha' }), overall: 7.5, price: 45000 },
    { phone: makePhone({ slug: 'b', model: 'Beta', status: 'discontinued', variants: [makeVariant({ warranty: 'local-shop', pricePkr: 48000 })] }), overall: 6.1, price: 48000 },
  ];

  it('renders one row per phone with data-slug, rank, price and overall', async () => {
    const html = await render(PhoneTable, { rows, brands });
    expect(html.match(/<tr data-slug=/g)).toHaveLength(2);
    expect(html).toContain('data-slug="a"');
    expect(html).toContain('href="/mobile-under-pk/phones/a/"');
    expect(html).toContain('Samsung Alpha');
    expect(html).toContain('Rs 45,000');
    expect(html).toContain('7.5');
  });

  it('flags discontinued phones and shop-only warranty', async () => {
    const html = await render(PhoneTable, { rows, brands });
    expect(html).toContain('Discontinued');
    expect(html).toContain('Shop warranty');
  });
});

describe('PriceChecked', () => {
  it('shows the human date inside a machine-readable time element', async () => {
    const html = await render(PriceChecked, { date: '2026-10-10' });
    expect(html).toContain('Prices last checked');
    expect(html).toContain('<time datetime="2026-10-10">10 Oct 2026</time>');
  });
});

describe('ScoreList', () => {
  it('lists all eight scores with their reasons', async () => {
    const html = await render(ScoreList, { scores: makePhone().scores });
    expect(html.match(/<li/g)).toHaveLength(8);
    expect(html).toContain('OIS main camera drives this score');
    expect(html).toContain('7/10');
  });
});

import PickCard from '../src/components/PickCard.astro';
import SpecTable from '../src/components/SpecTable.astro';

describe('PickCard', () => {
  it('shows rank, linked name, PTA price, overall and the reason', async () => {
    const html = await render(PickCard, {
      ranked: { phone: makePhone(), overall: 7.5, price: 120000 }, brands, rank: 1,
      reason: 'Bright 120Hz AMOLED.',
    });
    expect(html).toContain('#1');
    expect(html).toContain('href="/mobile-under-pk/phones/samsung-galaxy-a55/"');
    expect(html).toContain('Samsung Galaxy A55');
    expect(html).toContain('Rs 120,000');
    expect(html).toContain('7.5');
    expect(html).toContain('Bright 120Hz AMOLED.');
  });
});

describe('SpecTable', () => {
  it('renders the key specs in readable form', async () => {
    const html = await render(SpecTable, { specs: makePhone().specs });
    for (const s of ['Exynos 1480', '6.6 inch Super AMOLED, 120Hz, 1080x2340', '5000 mAh, 25W wired', '50 MP wide (OIS)', '32 MP', 'IP67', '4 OS updates, 5 years of security patches', '213 g']) {
      expect(html).toContain(s);
    }
  });
  it('says "None" when there is no IP rating and "No" for missing features', async () => {
    const p = makePhone();
    const html = await render(SpecTable, { specs: { ...p.specs, build: { ...p.specs.build, ip: null }, connectivity: { ...p.specs.connectivity, nfc: false } } });
    expect(html).toMatch(/IP rating<\/th><td>None/);
    expect(html).toMatch(/NFC<\/th><td>No/);
  });
});
