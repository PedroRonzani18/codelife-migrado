import { z } from 'zod';
import { uuidSchema } from './common.js';
import { islandSummarySchema, levelSummarySchema } from './learning.js';

export const levelProgressSchema = z
  .object({
    currentSlideId: uuidSchema,
    startedAt: z.string().datetime(),
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
    progress: z
      .object({
        currentLevelId: uuidSchema,
        startedAt: z.string().datetime(),
      })
      .strict()
      .nullable(),
    levels: z.array(levelProgressSnapshotSchema),
  })
  .strict();
export type IslandProgressSnapshot = z.infer<typeof islandProgressSnapshotSchema>;

export const lastVisitedSchema = z
  .object({
    islandId: uuidSchema,
    levelId: uuidSchema,
    slideId: uuidSchema,
  })
  .strict();
export type LastVisited = z.infer<typeof lastVisitedSchema>;

export const nextRecommendedSchema = z
  .object({
    levelId: uuidSchema,
    slideId: uuidSchema,
  })
  .strict();
export type NextRecommended = z.infer<typeof nextRecommendedSchema>;

export const progressSnapshotSchema = z
  .object({
    lastVisited: lastVisitedSchema.nullable(),
    nextRecommended: nextRecommendedSchema.nullable(),
    islands: z.array(islandProgressSnapshotSchema),
  })
  .strict();
export type ProgressSnapshot = z.infer<typeof progressSnapshotSchema>;

export const startLevelInputSchema = z.object({}).strict();
export type StartLevelInput = z.infer<typeof startLevelInputSchema>;

export const updateCurrentSlideInputSchema = z
  .object({
    slideId: uuidSchema,
  })
  .strict();
export type UpdateCurrentSlideInput = z.infer<typeof updateCurrentSlideInputSchema>;

export const completeLevelInputSchema = z.object({}).strict();
export type CompleteLevelInput = z.infer<typeof completeLevelInputSchema>;
