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

export const apiErrorCodeSchema = z.enum([
  'VALIDATION_ERROR',
  'BAD_REQUEST',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'EXPERIMENTAL_LOGIN_DISABLED',
  'RESOURCE_NOT_FOUND',
  'METHOD_NOT_ALLOWED',
  'REQUEST_TIMEOUT',
  'CONFLICT',
  'UNIQUE_CONFLICT',
  'RELATION_CONFLICT',
  'PAYLOAD_TOO_LARGE',
  'UNSUPPORTED_MEDIA_TYPE',
  'TOO_MANY_REQUESTS',
  'SERVICE_UNAVAILABLE',
  'HTTP_ERROR',
  'INTERNAL_ERROR',
]);
export type ApiErrorCode = z.infer<typeof apiErrorCodeSchema>;

export const apiValidationErrorDetailSchema = z
  .object({
    field: z.string().min(1).optional(),
    message: z.string().min(1),
  })
  .strict();
export type ApiValidationErrorDetail = z.infer<typeof apiValidationErrorDetailSchema>;

export const apiErrorSchema = z
  .object({
    statusCode: z.number().int().min(400).max(599),
    code: apiErrorCodeSchema,
    message: z.string().min(1),
    details: z.array(apiValidationErrorDetailSchema).min(1).optional(),
    requestId: z.string().min(1).max(128),
  })
  .strict();
export type ApiError = z.infer<typeof apiErrorSchema>;
