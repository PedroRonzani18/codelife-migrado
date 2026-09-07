import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { UserRole } from '@codelife/contracts/users';
import { queryKeys } from '@/shared/query';
import { updateAdminUserRole } from '../services/adminUsersService';

export type UpdateAdminUserRoleVariables = {
  userKey: string;
  role: UserRole;
};

export function useAdminUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userKey, role }: UpdateAdminUserRoleVariables) => updateAdminUserRole(userKey, { role }),
    retry: 0,
    throwOnError: false,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.adminUsers.list });
    },
  });
}
