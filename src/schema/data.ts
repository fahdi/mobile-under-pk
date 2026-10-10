import { z } from 'zod';
import { SCORE_KEYS, SlugSchema, type ScoreKey } from './phone';

export const BrandSchema = z.strictObject({
  slug: SlugSchema,
  name: z.string().min(1),
  country: z.string().min(1),
  officialStoreUrl: z.url().nullable(),
  warrantyNote: z.string().min(1).nullable(),
});

const FaqSchema = z.strictObject({ q: z.string().min(1), a: z.string().min(1) });

export const BracketSchema = z.strictObject({
  ceiling: z.number().int().positive(),
  intro: z.string().min(1),
  faq: z.array(FaqSchema),
});

export const BracketsFileSchema = z.array(BracketSchema).min(1).refine(
  (bs) => bs.every((b, i) => i === 0 || b.ceiling > bs[i - 1].ceiling),
  'ceilings must be strictly ascending',
);

const WeightsSchema = z
  .partialRecord(z.enum(SCORE_KEYS), z.number().nonnegative())
  .refine((w) => Object.values(w).some((v) => (v ?? 0) > 0), 'at least one weight must be positive');

export const PresetSchema = z.strictObject({
  slug: SlugSchema,
  name: z.string().min(1),
  description: z.string().min(1),
  weights: WeightsSchema,
  requireOfficialWarranty: z.boolean().optional(),
  intent: z.string().min(1).optional(),
});

export type Brand = z.infer<typeof BrandSchema>;
export type Bracket = z.infer<typeof BracketSchema>;
export type Preset = z.infer<typeof PresetSchema>;
export type Weights = Partial<Record<ScoreKey, number>>;
