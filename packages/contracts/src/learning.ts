import { z } from 'zod';
import { stableKeySchema, uuidSchema } from './common.js';

export const slideTypeSchema = z.enum(['TextText', 'TextImage', 'TextCode']);
export type SlideType = z.infer<typeof slideTypeSchema>;

const positivePositionSchema = z.number().int().positive();

export const trailSummarySchema = z
  .object({
    id: uuidSchema,
    slug: stableKeySchema,
    title: z.string().min(1),
  })
  .strict();
export type TrailSummary = z.infer<typeof trailSummarySchema>;

// The public identifier is the TrailIsland positioning identifier. It is the
// contextual identity used by progress, rather than the reusable Island ID.
export const islandSummarySchema = z
  .object({
    id: uuidSchema,
    slug: stableKeySchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    levelCount: z.number().int().nonnegative(),
  })
  .strict();
export type IslandSummary = z.infer<typeof islandSummarySchema>;

export const levelAvailabilitySchema = z.enum([
  'available',
  'in_progress',
  'blocked',
  'completed',
]);
export type LevelAvailability = z.infer<typeof levelAvailabilitySchema>;

// The public identifier is the IslandLevel positioning identifier, which is
// also the identity accepted by level and progress routes.
export const levelSummarySchema = z
  .object({
    id: uuidSchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    availability: levelAvailabilitySchema,
  })
  .strict();
export type LevelSummary = z.infer<typeof levelSummarySchema>;

export const mediaAssetSummarySchema = z
  .object({
    id: uuidSchema,
    objectKey: z.string().min(1).max(512),
    mimeType: z.string().min(1).max(128),
    sizeBytes: z.number().int().positive().nullable(),
    width: z.number().int().positive().nullable(),
    height: z.number().int().positive().nullable(),
    checksum: z.string().min(1).max(256).nullable(),
  })
  .strict();
export type MediaAssetSummary = z.infer<typeof mediaAssetSummarySchema>;

const levelSlideBaseSchema = z
  .object({
    // The public identifier is the LevelSlide positioning identifier. The
    // atomic Slide identity is intentionally not a route or progress key.
    id: uuidSchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    previousLevelSlideId: uuidSchema.nullable(),
    nextLevelSlideId: uuidSchema.nullable(),
  })
  .strict();

export const textTextSlideSchema = levelSlideBaseSchema
  .extend({
    type: z.literal('TextText'),
    primaryText: z.string().min(1),
    secondaryText: z.string().min(1).nullable(),
  })
  .strict();
export type TextTextSlide = z.infer<typeof textTextSlideSchema>;

export const textImageSlideSchema = levelSlideBaseSchema
  .extend({
    type: z.literal('TextImage'),
    text: z.string().min(1),
    mediaAsset: mediaAssetSummarySchema,
    altText: z.string().min(1),
  })
  .strict();
export type TextImageSlide = z.infer<typeof textImageSlideSchema>;

export const textCodeSlideSchema = levelSlideBaseSchema
  .extend({
    type: z.literal('TextCode'),
    text: z.string().min(1),
    code: z.string().min(1),
    language: z.string().min(1).max(64),
  })
  .strict();
export type TextCodeSlide = z.infer<typeof textCodeSlideSchema>;

export const slideSchema = z.discriminatedUnion('type', [
  textTextSlideSchema,
  textImageSlideSchema,
  textCodeSlideSchema,
]);
export type Slide = z.infer<typeof slideSchema>;

export const islandDetailSchema = islandSummarySchema
  .extend({
    levels: z.array(levelSummarySchema),
  })
  .strict();
export type IslandDetail = z.infer<typeof islandDetailSchema>;

export const levelDetailSchema = levelSummarySchema
  .extend({
    trailIslandId: uuidSchema,
    slides: z.array(slideSchema),
  })
  .strict();
export type LevelDetail = z.infer<typeof levelDetailSchema>;
