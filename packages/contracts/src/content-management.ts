import { z } from 'zod';
import { stableKeySchema, uuidSchema } from './common.js';
import { mediaAssetSummarySchema, slideTypeSchema } from './learning.js';

const positivePositionSchema = z.number().int().positive();

export const expectedUpdatedAtSchema = z.string().datetime();
export type ExpectedUpdatedAt = z.infer<typeof expectedUpdatedAtSchema>;

export const contentStatusSchema = z.enum(['DRAFT', 'PUBLISHED']);
export type ContentStatus = z.infer<typeof contentStatusSchema>;

// Tree representation (GET /admin/content/tree)
export const adminSlideTreeItemSchema = z
  .object({
    id: uuidSchema,
    levelId: uuidSchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    type: slideTypeSchema,
    updatedAt: z.string().datetime(),
  })
  .strict();
export type AdminSlideTreeItem = z.infer<typeof adminSlideTreeItemSchema>;

export const adminLevelTreeItemSchema = z
  .object({
    id: uuidSchema,
    islandId: uuidSchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    publishedAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
    slides: z.array(adminSlideTreeItemSchema),
  })
  .strict();
export type AdminLevelTreeItem = z.infer<typeof adminLevelTreeItemSchema>;

export const adminIslandTreeItemSchema = z
  .object({
    id: uuidSchema,
    slug: stableKeySchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    publishedAt: z.string().datetime().nullable(),
    updatedAt: z.string().datetime(),
    levels: z.array(adminLevelTreeItemSchema),
  })
  .strict();
export type AdminIslandTreeItem = z.infer<typeof adminIslandTreeItemSchema>;

export const adminContentTreeSchema = z.array(adminIslandTreeItemSchema);
export type AdminContentTree = z.infer<typeof adminContentTreeSchema>;

// Slide Details
const adminSlideDetailBaseSchema = z
  .object({
    id: uuidSchema,
    levelId: uuidSchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export const adminTextTextSlideDetailSchema = adminSlideDetailBaseSchema
  .extend({
    type: z.literal('TextText'),
    primaryText: z.string().min(1),
    secondaryText: z.string().min(1).nullable(),
  })
  .strict();
export type AdminTextTextSlideDetail = z.infer<typeof adminTextTextSlideDetailSchema>;

export const adminTextImageSlideDetailSchema = adminSlideDetailBaseSchema
  .extend({
    type: z.literal('TextImage'),
    text: z.string().min(1),
    mediaAssetId: uuidSchema,
    mediaAsset: mediaAssetSummarySchema,
    altText: z.string().min(1),
  })
  .strict();
export type AdminTextImageSlideDetail = z.infer<typeof adminTextImageSlideDetailSchema>;

export const adminTextCodeSlideDetailSchema = adminSlideDetailBaseSchema
  .extend({
    type: z.literal('TextCode'),
    text: z.string().min(1),
    code: z.string().min(1),
    language: z.string().min(1).max(64),
  })
  .strict();
export type AdminTextCodeSlideDetail = z.infer<typeof adminTextCodeSlideDetailSchema>;

export const adminSlideDetailSchema = z.discriminatedUnion('type', [
  adminTextTextSlideDetailSchema,
  adminTextImageSlideDetailSchema,
  adminTextCodeSlideDetailSchema,
]);
export type AdminSlideDetail = z.infer<typeof adminSlideDetailSchema>;

// Level Details
export const adminLevelSummarySchema = z
  .object({
    id: uuidSchema,
    islandId: uuidSchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    slideCount: z.number().int().nonnegative(),
  })
  .strict();
export type AdminLevelSummary = z.infer<typeof adminLevelSummarySchema>;

export const adminLevelDetailSchema = adminLevelSummarySchema
  .extend({
    slides: z.array(adminSlideDetailSchema),
  })
  .strict();
export type AdminLevelDetail = z.infer<typeof adminLevelDetailSchema>;

// Island Details
export const adminIslandSummarySchema = z
  .object({
    id: uuidSchema,
    slug: stableKeySchema,
    title: z.string().min(1),
    position: positivePositionSchema,
    publishedAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
    levelCount: z.number().int().nonnegative(),
  })
  .strict();
export type AdminIslandSummary = z.infer<typeof adminIslandSummarySchema>;

export const adminIslandDetailSchema = adminIslandSummarySchema
  .extend({
    levels: z.array(adminLevelSummarySchema),
  })
  .strict();
export type AdminIslandDetail = z.infer<typeof adminIslandDetailSchema>;

// Creation Schemas
export const createIslandInputSchema = z
  .object({
    title: z.string().min(1),
    slug: stableKeySchema,
  })
  .strict();
export type CreateIslandInput = z.infer<typeof createIslandInputSchema>;

export const createLevelInputSchema = z
  .object({
    title: z.string().min(1),
  })
  .strict();
export type CreateLevelInput = z.infer<typeof createLevelInputSchema>;

export const createTextTextSlideInputSchema = z
  .object({
    type: z.literal('TextText'),
    title: z.string().min(1),
    primaryText: z.string().min(1),
    secondaryText: z.string().min(1).nullable().optional(),
  })
  .strict();
export type CreateTextTextSlideInput = z.infer<typeof createTextTextSlideInputSchema>;

export const createTextImageSlideInputSchema = z
  .object({
    type: z.literal('TextImage'),
    title: z.string().min(1),
    text: z.string().min(1),
    mediaAssetId: uuidSchema,
    altText: z.string().min(1),
  })
  .strict();
export type CreateTextImageSlideInput = z.infer<typeof createTextImageSlideInputSchema>;

export const createTextCodeSlideInputSchema = z
  .object({
    type: z.literal('TextCode'),
    title: z.string().min(1),
    text: z.string().min(1),
    code: z.string().min(1),
    language: z.string().min(1).max(64),
  })
  .strict();
export type CreateTextCodeSlideInput = z.infer<typeof createTextCodeSlideInputSchema>;

export const createSlideInputSchema = z.discriminatedUnion('type', [
  createTextTextSlideInputSchema,
  createTextImageSlideInputSchema,
  createTextCodeSlideInputSchema,
]);
export type CreateSlideInput = z.infer<typeof createSlideInputSchema>;

// Update Schemas
export const updateIslandInputSchema = z
  .object({
    title: z.string().min(1).optional(),
    slug: stableKeySchema.optional(),
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict();
export type UpdateIslandInput = z.infer<typeof updateIslandInputSchema>;

export const updateLevelInputSchema = z
  .object({
    title: z.string().min(1).optional(),
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict();
export type UpdateLevelInput = z.infer<typeof updateLevelInputSchema>;

export const updateTextTextSlideInputSchema = z
  .object({
    type: z.literal('TextText'),
    title: z.string().min(1).optional(),
    primaryText: z.string().min(1).optional(),
    secondaryText: z.string().min(1).nullable().optional(),
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict();
export type UpdateTextTextSlideInput = z.infer<typeof updateTextTextSlideInputSchema>;

export const updateTextImageSlideInputSchema = z
  .object({
    type: z.literal('TextImage'),
    title: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    mediaAssetId: uuidSchema.optional(),
    altText: z.string().min(1).optional(),
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict();
export type UpdateTextImageSlideInput = z.infer<typeof updateTextImageSlideInputSchema>;

export const updateTextCodeSlideInputSchema = z
  .object({
    type: z.literal('TextCode'),
    title: z.string().min(1).optional(),
    text: z.string().min(1).optional(),
    code: z.string().min(1).optional(),
    language: z.string().min(1).max(64).optional(),
    expectedUpdatedAt: expectedUpdatedAtSchema,
  })
  .strict();
export type UpdateTextCodeSlideInput = z.infer<typeof updateTextCodeSlideInputSchema>;

export const updateSlideInputSchema = z.discriminatedUnion('type', [
  updateTextTextSlideInputSchema,
  updateTextImageSlideInputSchema,
  updateTextCodeSlideInputSchema,
]);
export type UpdateSlideInput = z.infer<typeof updateSlideInputSchema>;

// Reordering Schemas
export const reorderIslandsInputSchema = z
  .object({
    islandIds: z.array(uuidSchema).min(1),
    expectedUpdatedAts: z.record(uuidSchema, expectedUpdatedAtSchema).optional(),
  })
  .strict();
export type ReorderIslandsInput = z.infer<typeof reorderIslandsInputSchema>;

export const reorderLevelsInputSchema = z
  .object({
    levelIds: z.array(uuidSchema).min(1),
    expectedUpdatedAts: z.record(uuidSchema, expectedUpdatedAtSchema).optional(),
  })
  .strict();
export type ReorderLevelsInput = z.infer<typeof reorderLevelsInputSchema>;

export const reorderSlidesInputSchema = z
  .object({
    slideIds: z.array(uuidSchema).min(1),
    expectedUpdatedAts: z.record(uuidSchema, expectedUpdatedAtSchema).optional(),
  })
  .strict();
export type ReorderSlidesInput = z.infer<typeof reorderSlidesInputSchema>;

// Publishing Schemas
export const publishContentInputSchema = z
  .object({
    expectedUpdatedAt: expectedUpdatedAtSchema.optional(),
  })
  .strict();
export type PublishContentInput = z.infer<typeof publishContentInputSchema>;

export const unpublishContentInputSchema = z
  .object({
    expectedUpdatedAt: expectedUpdatedAtSchema.optional(),
  })
  .strict();
export type UnpublishContentInput = z.infer<typeof unpublishContentInputSchema>;
