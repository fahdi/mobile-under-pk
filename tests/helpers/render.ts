import { experimental_AstroContainer as AstroContainer } from 'astro/container';

export async function render(component: any, props: Record<string, unknown> = {}, slots: Record<string, string> = {}) {
  const container = await AstroContainer.create({ astroConfig: { site: 'https://fahdi.github.io' } as any });
  return container.renderToString(component, { props, slots });
}
