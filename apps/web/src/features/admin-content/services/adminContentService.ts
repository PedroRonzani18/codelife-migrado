import {
  adminContentTreeSchema,
  adminIslandDetailSchema,
  adminLevelDetailSchema,
  adminSlideDetailSchema,
  type AdminContentTree,
  type AdminIslandDetail,
  type AdminIslandTreeItem,
  type AdminLevelDetail,
  type AdminLevelTreeItem,
  type AdminSlideDetail,
  type AdminSlideTreeItem,
  type CreateIslandInput,
  type CreateLevelInput,
  type CreateSlideInput,
  type PublishContentInput,
  type ReorderIslandsInput,
  type ReorderLevelsInput,
  type ReorderSlidesInput,
  type UnpublishContentInput,
  type UpdateIslandInput,
  type UpdateLevelInput,
  type UpdateSlideInput,
} from "@codelife/contracts/content-management";
import {
  mediaAssetSummarySchema,
  type MediaAssetSummary,
} from "@codelife/contracts/learning";
import { z } from "zod";
import { apiFetch, apiFetchParsed } from "@/shared/http";

export const adminContentService = {
  // Tree
  async getTree(): Promise<AdminContentTree> {
    return apiFetchParsed("admin/content/tree", adminContentTreeSchema);
  },

  // Islands
  async getIsland(islandId: string): Promise<AdminIslandDetail> {
    return apiFetchParsed(`admin/content/islands/${islandId}`, adminIslandDetailSchema);
  },

  async createIsland(input: CreateIslandInput): Promise<AdminIslandDetail> {
    return apiFetchParsed("admin/content/islands", adminIslandDetailSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateIsland(islandId: string, input: UpdateIslandInput): Promise<AdminIslandDetail> {
    return apiFetchParsed(`admin/content/islands/${islandId}`, adminIslandDetailSchema, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteIsland(islandId: string): Promise<void> {
    await apiFetch(`admin/content/islands/${islandId}`, {
      method: "DELETE",
    });
  },

  async publishIsland(islandId: string, input: PublishContentInput): Promise<AdminIslandDetail> {
    return apiFetchParsed(`admin/content/islands/${islandId}/publish`, adminIslandDetailSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async unpublishIsland(islandId: string, input: UnpublishContentInput): Promise<AdminIslandDetail> {
    return apiFetchParsed(`admin/content/islands/${islandId}/unpublish`, adminIslandDetailSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async reorderIslands(input: ReorderIslandsInput): Promise<AdminIslandTreeItem[]> {
    return apiFetchParsed("admin/content/islands/order", z.array(z.any()), {
      method: "PUT",
      body: JSON.stringify(input),
    }) as Promise<AdminIslandTreeItem[]>;
  },

  // Levels
  async getLevel(levelId: string): Promise<AdminLevelDetail> {
    return apiFetchParsed(`admin/content/levels/${levelId}`, adminLevelDetailSchema);
  },

  async createLevel(islandId: string, input: CreateLevelInput): Promise<AdminLevelDetail> {
    return apiFetchParsed(`admin/content/islands/${islandId}/levels`, adminLevelDetailSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateLevel(levelId: string, input: UpdateLevelInput): Promise<AdminLevelDetail> {
    return apiFetchParsed(`admin/content/levels/${levelId}`, adminLevelDetailSchema, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteLevel(levelId: string): Promise<void> {
    await apiFetch(`admin/content/levels/${levelId}`, {
      method: "DELETE",
    });
  },

  async publishLevel(levelId: string, input: PublishContentInput): Promise<AdminLevelDetail> {
    return apiFetchParsed(`admin/content/levels/${levelId}/publish`, adminLevelDetailSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async unpublishLevel(levelId: string, input: UnpublishContentInput): Promise<AdminLevelDetail> {
    return apiFetchParsed(`admin/content/levels/${levelId}/unpublish`, adminLevelDetailSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async reorderLevels(islandId: string, input: ReorderLevelsInput): Promise<AdminLevelTreeItem[]> {
    return apiFetchParsed(`admin/content/islands/${islandId}/levels/order`, z.array(z.any()), {
      method: "PUT",
      body: JSON.stringify(input),
    }) as Promise<AdminLevelTreeItem[]>;
  },

  // Slides
  async getSlide(slideId: string): Promise<AdminSlideDetail> {
    return apiFetchParsed(`admin/content/slides/${slideId}`, adminSlideDetailSchema);
  },

  async createSlide(levelId: string, input: CreateSlideInput): Promise<AdminSlideDetail> {
    return apiFetchParsed(`admin/content/levels/${levelId}/slides`, adminSlideDetailSchema, {
      method: "POST",
      body: JSON.stringify(input),
    });
  },

  async updateSlide(slideId: string, input: UpdateSlideInput): Promise<AdminSlideDetail> {
    return apiFetchParsed(`admin/content/slides/${slideId}`, adminSlideDetailSchema, {
      method: "PATCH",
      body: JSON.stringify(input),
    });
  },

  async deleteSlide(slideId: string): Promise<void> {
    await apiFetch(`admin/content/slides/${slideId}`, {
      method: "DELETE",
    });
  },

  async reorderSlides(levelId: string, input: ReorderSlidesInput): Promise<AdminSlideTreeItem[]> {
    return apiFetchParsed(`admin/content/levels/${levelId}/slides/order`, z.array(z.any()), {
      method: "PUT",
      body: JSON.stringify(input),
    }) as Promise<AdminSlideTreeItem[]>;
  },

  // Media
  async uploadMedia(file: File): Promise<MediaAssetSummary> {
    const formData = new FormData();
    formData.append("file", file);
    return apiFetchParsed("admin/content/media", mediaAssetSummarySchema, {
      method: "POST",
      body: formData,
    });
  },
};
