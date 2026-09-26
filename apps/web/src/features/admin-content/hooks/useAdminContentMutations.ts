import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  CreateIslandInput,
  CreateLevelInput,
  CreateSlideInput,
  PublishContentInput,
  ReorderIslandsInput,
  ReorderLevelsInput,
  ReorderSlidesInput,
  UnpublishContentInput,
  UpdateIslandInput,
  UpdateLevelInput,
  UpdateSlideInput,
} from "@codelife/contracts/content-management";
import { queryKeys } from "@/shared/query";
import { adminContentService } from "../services/adminContentService";

export function useAdminContentMutations() {
  const queryClient = useQueryClient();

  const invalidateTree = () => queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.tree });

  // Island mutations
  const createIsland = useMutation({
    mutationFn: (input: CreateIslandInput) => adminContentService.createIsland(input),
    onSuccess: invalidateTree,
  });

  const updateIsland = useMutation({
    mutationFn: ({ islandId, input }: { islandId: string; input: UpdateIslandInput }) =>
      adminContentService.updateIsland(islandId, input),
    onSuccess: (_data, { islandId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.island(islandId) });
    },
  });

  const deleteIsland = useMutation({
    mutationFn: (islandId: string) => adminContentService.deleteIsland(islandId),
    onSuccess: () => invalidateTree(),
  });

  const publishIsland = useMutation({
    mutationFn: ({ islandId, input }: { islandId: string; input: PublishContentInput }) =>
      adminContentService.publishIsland(islandId, input),
    onSuccess: (_data, { islandId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.island(islandId) });
    },
  });

  const unpublishIsland = useMutation({
    mutationFn: ({ islandId, input }: { islandId: string; input: UnpublishContentInput }) =>
      adminContentService.unpublishIsland(islandId, input),
    onSuccess: (_data, { islandId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.island(islandId) });
    },
  });

  const reorderIslands = useMutation({
    mutationFn: (input: ReorderIslandsInput) => adminContentService.reorderIslands(input),
    onSuccess: invalidateTree,
  });

  // Level mutations
  const createLevel = useMutation({
    mutationFn: ({ islandId, input }: { islandId: string; input: CreateLevelInput }) =>
      adminContentService.createLevel(islandId, input),
    onSuccess: (_data, { islandId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.island(islandId) });
    },
  });

  const updateLevel = useMutation({
    mutationFn: ({ levelId, input }: { levelId: string; input: UpdateLevelInput }) =>
      adminContentService.updateLevel(levelId, input),
    onSuccess: (_data, { levelId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.level(levelId) });
    },
  });

  const deleteLevel = useMutation({
    mutationFn: ({ levelId }: { levelId: string; islandId?: string }) =>
      adminContentService.deleteLevel(levelId),
    onSuccess: (_data, { islandId }) => {
      invalidateTree();
      if (islandId) queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.island(islandId) });
    },
  });

  const publishLevel = useMutation({
    mutationFn: ({ levelId, input }: { levelId: string; input: PublishContentInput }) =>
      adminContentService.publishLevel(levelId, input),
    onSuccess: (_data, { levelId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.level(levelId) });
    },
  });

  const unpublishLevel = useMutation({
    mutationFn: ({ levelId, input }: { levelId: string; input: UnpublishContentInput }) =>
      adminContentService.unpublishLevel(levelId, input),
    onSuccess: (_data, { levelId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.level(levelId) });
    },
  });

  const reorderLevels = useMutation({
    mutationFn: ({ islandId, input }: { islandId: string; input: ReorderLevelsInput }) =>
      adminContentService.reorderLevels(islandId, input),
    onSuccess: (_data, { islandId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.island(islandId) });
    },
  });

  // Slide mutations
  const createSlide = useMutation({
    mutationFn: ({ levelId, input }: { levelId: string; input: CreateSlideInput }) =>
      adminContentService.createSlide(levelId, input),
    onSuccess: (_data, { levelId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.level(levelId) });
    },
  });

  const updateSlide = useMutation({
    mutationFn: ({ slideId, input }: { slideId: string; input: UpdateSlideInput }) =>
      adminContentService.updateSlide(slideId, input),
    onSuccess: (_data, { slideId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.slide(slideId) });
    },
  });

  const deleteSlide = useMutation({
    mutationFn: ({ slideId }: { slideId: string; levelId?: string }) =>
      adminContentService.deleteSlide(slideId),
    onSuccess: (_data, { levelId }) => {
      invalidateTree();
      if (levelId) queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.level(levelId) });
    },
  });

  const reorderSlides = useMutation({
    mutationFn: ({ levelId, input }: { levelId: string; input: ReorderSlidesInput }) =>
      adminContentService.reorderSlides(levelId, input),
    onSuccess: (_data, { levelId }) => {
      invalidateTree();
      queryClient.invalidateQueries({ queryKey: queryKeys.adminContent.level(levelId) });
    },
  });

  const uploadMedia = useMutation({
    mutationFn: (file: File) => adminContentService.uploadMedia(file),
  });

  return {
    createIsland,
    updateIsland,
    deleteIsland,
    publishIsland,
    unpublishIsland,
    reorderIslands,
    createLevel,
    updateLevel,
    deleteLevel,
    publishLevel,
    unpublishLevel,
    reorderLevels,
    createSlide,
    updateSlide,
    deleteSlide,
    reorderSlides,
    uploadMedia,
  };
}
