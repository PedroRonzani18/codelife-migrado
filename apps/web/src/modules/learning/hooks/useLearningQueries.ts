import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { getIsland, getLevel } from '../services/learningService';
import { getProgressSnapshot } from '../services/progressService';

export function useIslandQuery(slug = 'island-3') {
  return useQuery({ queryKey: queryKeys.learning.island(slug), queryFn: () => getIsland(slug), retry: false });
}

export function useLevelQuery(levelId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.learning.level(levelId),
    queryFn: () => getLevel(levelId),
    enabled: enabled && Boolean(levelId),
    retry: false,
  });
}

export function useProgressSnapshotQuery(enabled = true) {
  return useQuery({ queryKey: queryKeys.progress.snapshot, queryFn: getProgressSnapshot, enabled, retry: false });
}

export const useLearningQueries = useProgressSnapshotQuery;
