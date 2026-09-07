import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/shared/query';
import { getAdminUsers } from '../services/adminUsersService';

export function useAdminUsersQuery() {
  return useQuery({
    queryKey: queryKeys.adminUsers.list,
    queryFn: getAdminUsers,
    retry: false,
  });
}
