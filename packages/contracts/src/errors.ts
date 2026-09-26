import { z } from 'zod';

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
  'LEVEL_BLOCKED',
  'LEVEL_NOT_STARTED',
  'INVALID_SLIDE_TRANSITION',
  'LEVEL_NOT_READY_FOR_COMPLETION',
  'ISLAND_BLOCKED',
  'CONTENT_STALE',
  'CONTENT_HAS_PROGRESS',
  'CONTENT_NOT_DRAFT',
  'CONTENT_NOT_PUBLISHABLE',
  'CONTENT_ORDER_CONFLICT',
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
