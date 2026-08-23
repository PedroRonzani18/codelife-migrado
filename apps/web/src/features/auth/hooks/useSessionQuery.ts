import { useQuery } from '@tanstack/react-query';
import { getSession } from '../services/authService';
import { queryKeys } from '@/shared/query';

export function useSessionQuery() {
  return useQuery({
    queryKey: queryKeys.session.all,
    queryFn: getSession,
    retry: false,
  });
}

export const useSession = useSessionQuery;
