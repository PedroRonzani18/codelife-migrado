import { z } from 'zod';
import { uuidSchema } from './common.js';
import { islandSummarySchema, levelSummarySchema, trailSummarySchema } from './learning.js';

export const levelProgressSchema = z
  .object({
    currentLevelSlideId: uuidSchema,
    completedAt: z.string().datetime().nullable(),
  })
  .strict();
export type LevelProgress = z.infer<typeof levelProgressSchema>;

export const levelProgressSnapshotSchema = levelSummarySchema
  .extend({
    progress: levelProgressSchema.nullable(),
  })
  .strict();
export type LevelProgressSnapshot = z.infer<typeof levelProgressSnapshotSchema>;

export const islandProgressSnapshotSchema = islandSummarySchema
  .extend({
    levels: z.array(levelProgressSnapshotSchema),
  })
  .strict();
export type IslandProgressSnapshot = z.infer<typeof islandProgressSnapshotSchema>;

export const lastVisitedSchema = z
  .object({
    trailIslandId: uuidSchema,
    islandLevelId: uuidSchema,
    levelSlideId: uuidSchema,
  })
  .strict();
export type LastVisited = z.infer<typeof lastVisitedSchema>;

export const nextRecommendedSchema = z
  .object({
    islandLevelId: uuidSchema,
    levelSlideId: uuidSchema,
  })
  .strict();
export type NextRecommended = z.infer<typeof nextRecommendedSchema>;

// This is the sole public progress response. Reads and future mutations return
// the same complete snapshot rather than partial progress records.
export const progressSnapshotSchema = z
  .object({
    trail: trailSummarySchema,
    lastVisited: lastVisitedSchema.nullable(),
    nextRecommended: nextRecommendedSchema.nullable(),
    islands: z.array(islandProgressSnapshotSchema),
  })
  .strict();
export type ProgressSnapshot = z.infer<typeof progressSnapshotSchema>;

// The IslandLevel is path-scoped. Only the target LevelSlide may be supplied
// in the body; person, status, ordering, and timestamps are server-owned.
export const updateCurrentSlideInputSchema = z
  .object({
    levelSlideId: uuidSchema,
  })
  .strict();
export type UpdateCurrentSlideInput = z.infer<typeof updateCurrentSlideInputSchema>;

// The level identity is path-scoped and completion timestamps are server-owned.
export const completeLevelInputSchema = z.object({}).strict();
export type CompleteLevelInput = z.infer<typeof completeLevelInputSchema>;
