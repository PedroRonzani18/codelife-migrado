import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/shared/query";
import { adminContentService } from "../services/adminContentService";

export function useAdminContentTreeQuery() {
  return useQuery({
    queryKey: queryKeys.adminContent.tree,
    queryFn: () => adminContentService.getTree(),
  });
}
