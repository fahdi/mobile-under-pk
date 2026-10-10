import { z } from 'zod';

export const SCORE_KEYS = [
  'camera', 'performance', 'battery', 'display', 'build', 'software', 'value', 'availability',
] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];

export const STATUSES = ['available', 'limited', 'discontinued'] as const;
export const WARRANTIES = ['official', 'local-shop', 'none'] as const;
export const RELEASE_YEARS = [2024, 2025, 2026] as const;

export const SlugSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'lowercase kebab-case');
const IsoDate = z.iso.date();
const PositiveInt = z.number().int().positive();

export const SourceSchema = z.strictObject({ name: z.string().min(1), url: z.url() });

export const VariantSchema = z.strictObject({
  ram: PositiveInt,
  storage: PositiveInt,
  pricePkr: PositiveInt,
  priceCheckedAt: IsoDate,
  pta: z.boolean(),
  warranty: z.enum(WARRANTIES),
  sources: z.array(SourceSchema).min(1),
});

const ScoreSchema = z.strictObject({
  value: z.number().int().min(1).max(10),
  reason: z.string().min(10),
});

const CameraSchema = z.strictObject({
  mp: z.number().positive(),
  type: z.enum(['wide', 'ultrawide', 'telephoto', 'periscope', 'macro', 'depth', 'mono']),
  ois: z.boolean(),
});

const SpecsSchema = z.strictObject({
  chipset: z.string().min(1),
  display: z.strictObject({
    size: z.number().positive(),
    type: z.string().min(1),
    refreshHz: PositiveInt,
    resolution: z.string().regex(/^\d+x\d+$/),
    peakNits: PositiveInt.optional(),
  }),
  battery: z.strictObject({
    mah: PositiveInt,
    wiredW: z.number().nonnegative(),
    wirelessW: z.number().nonnegative(),
  }),
  cameras: z.strictObject({
    rear: z.array(CameraSchema).min(1),
    front: z.strictObject({ mp: z.number().positive() }),
    video: z.string().min(1),
  }),
  build: z.strictObject({
    frame: z.string().min(1),
    back: z.string().min(1),
    front: z.string().min(1).nullable(),
    ip: z.string().regex(/^IP\d[\dX]K?(\/IP\d[\dX]K?)*$/).nullable(),
  }),
  software: z.strictObject({
    os: z.string().min(1),
    osUpdates: z.number().int().nonnegative(),
    securityYears: z.number().int().nonnegative(),
  }),
  connectivity: z.strictObject({
    fiveG: z.boolean(), nfc: z.boolean(), jack35: z.boolean(), esim: z.boolean(),
  }),
  weightG: z.number().positive(),
});

export const PhoneSchema = z.strictObject({
  slug: SlugSchema,
  brand: SlugSchema,
  model: z.string().min(1),
  releaseDate: IsoDate.refine(
    (d) => (RELEASE_YEARS as readonly number[]).includes(Number(d.slice(0, 4))),
    'release year must be 2024, 2025 or 2026',
  ),
  status: z.enum(STATUSES),
  image: z.string().regex(/^\/images\/phones\/[a-z0-9-]+\.webp$/),
  imageCredit: SourceSchema,
  variants: z.array(VariantSchema).min(1),
  specs: SpecsSchema,
  scores: z.strictObject(
    Object.fromEntries(SCORE_KEYS.map((k) => [k, ScoreSchema])) as Record<ScoreKey, typeof ScoreSchema>,
  ),
  tags: z.array(SlugSchema),
  rivals: z.array(SlugSchema),
  notes: z.string().min(1).optional(),
});

export type Phone = z.infer<typeof PhoneSchema>;
export type Variant = z.infer<typeof VariantSchema>;
export type Status = (typeof STATUSES)[number];
export type Warranty = (typeof WARRANTIES)[number];
export type Scores = Phone['scores'];
