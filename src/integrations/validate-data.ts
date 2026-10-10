import type { AstroIntegration } from 'astro';
import { getData } from '../lib/data';

// Fail `astro build` on invalid data, independent of the separate validate step.
export function validateData({ root = process.env.DATA_ROOT ?? process.cwd() }: { root?: string } = {}): AstroIntegration {
  return {
    name: 'validate-data',
    hooks: {
      'astro:build:start': ({ logger }) => {
        const { phones } = getData(root);
        logger.info(`${phones.length} phones passed validation`);
      },
    },
  };
}
