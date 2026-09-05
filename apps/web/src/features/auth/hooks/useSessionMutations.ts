import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { logout, startExperimentalSession } from '../services/authService';

export function useSessionMutations() {
  const queryClient = useQueryClient();
  const login = useMutation({
    mutationFn: startExperimentalSession,
    retry: 0,
    onSuccess: (session) => queryClient.setQueryData(queryKeys.session.all, session),
  });
  const leave = useMutation({
    mutationFn: logout,
    retry: 0,
    onSuccess: () => queryClient.clear(),
  });
  return { login, logout: leave, startExperimentalSession: login, leave };
}

export const useAuthMutations = useSessionMutations;
