import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { completeLevel, navigateToSlide, startLevel } from '../services/progressService';

type NavigationVariables = { levelId: string; slideId: string };

export function useProgressMutations() {
  const start = useStartLevelMutation();
  const navigate = useNavigateToSlideMutation();
  const complete = useCompleteLevelMutation();
  return { start, navigate, complete, startLevel: start, navigateToSlide: navigate, completeLevel: complete };
}

export function useStartLevelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (levelId: string) => startLevel(levelId),
    retry: 0,
    throwOnError: false,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.progress.snapshot, data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.learning.catalog });
    },
  });
}

export function useNavigateToSlideMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ levelId, slideId }: NavigationVariables) => navigateToSlide(levelId, slideId),
    retry: 0,
    throwOnError: false,
    onSuccess: (data) => queryClient.setQueryData(queryKeys.progress.snapshot, data),
  });
}

export function useCompleteLevelMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (levelId: string) => completeLevel(levelId),
    retry: 0,
    throwOnError: false,
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.progress.snapshot, data);
      void queryClient.invalidateQueries({ queryKey: queryKeys.learning.catalog });
    },
  });
}
