import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query";
import { adminContentService } from "../services/adminContentService";

export function useAdminIslandQuery(islandId?: string | null) {
  return useQuery({
    queryKey: queryKeys.adminContent.island(islandId ?? ""),
    queryFn: () => adminContentService.getIsland(islandId!),
    enabled: Boolean(islandId),
  });
}

export function useAdminLevelQuery(levelId?: string | null) {
  return useQuery({
    queryKey: queryKeys.adminContent.level(levelId ?? ""),
    queryFn: () => adminContentService.getLevel(levelId!),
    enabled: Boolean(levelId),
  });
}

export function useAdminSlideQuery(slideId?: string | null) {
  return useQuery({
    queryKey: queryKeys.adminContent.slide(slideId ?? ""),
    queryFn: () => adminContentService.getSlide(slideId!),
    enabled: Boolean(slideId),
  });
}
