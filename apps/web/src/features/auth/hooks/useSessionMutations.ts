import { useMutation, useQueryClient } from '@tanstack/react-query';
import { logout } from '../services/authService';

export function useSessionMutations() {
  const queryClient = useQueryClient();
  const leave = useMutation({
    mutationFn: logout,
    retry: 0,
    onSuccess: () => queryClient.clear(),
  });
  return { logout: leave, leave };
}

export const useAuthMutations = useSessionMutations;
