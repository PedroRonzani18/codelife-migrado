import { z } from 'zod';

export const stableKeySchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a stable kebab-case key');

export const slideTypeSchema = z.enum(['TextText', 'TextImage', 'TextCode']);
export type SlideType = z.infer<typeof slideTypeSchema>;

export const currentUserSchema = z.object({
  id: stableKeySchema,
  username: z.string().min(1),
  displayName: z.string().min(1),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const authSessionSchema = z.object({ user: currentUserSchema });
export type AuthSession = z.infer<typeof authSessionSchema>;

export const islandSummarySchema = z.object({
  id: stableKeySchema,
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  levelCount: z.number().int().nonnegative(),
});
export type IslandSummary = z.infer<typeof islandSummarySchema>;

export const levelAvailabilitySchema = z.enum(['available', 'blocked', 'completed']);
export const levelSchema = z.object({
  id: stableKeySchema,
  islandId: stableKeySchema,
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  availability: levelAvailabilitySchema,
});
export type Level = z.infer<typeof levelSchema>;

export const slideSchema = z.object({
  id: stableKeySchema,
  levelId: stableKeySchema,
  title: z.string().min(1),
  order: z.number().int().nonnegative(),
  type: slideTypeSchema,
  content: z.string().min(1),
});
export type Slide = z.infer<typeof slideSchema>;

export const islandDetailSchema = islandSummarySchema.extend({
  levels: z.array(levelSchema),
});
export type IslandDetail = z.infer<typeof islandDetailSchema>;

export const levelProgressSchema = z.object({
  levelId: stableKeySchema,
  completedAt: z.string().datetime(),
});
export type LevelProgress = z.infer<typeof levelProgressSchema>;

export const completeLevelInputSchema = z.object({ levelId: stableKeySchema });
export type CompleteLevelInput = z.infer<typeof completeLevelInputSchema>;

export const apiErrorSchema = z.object({
  statusCode: z.number().int(),
  code: z.string().min(1),
  message: z.string().min(1),
  requestId: z.string().optional(),
});
export type ApiError = z.infer<typeof apiErrorSchema>;
