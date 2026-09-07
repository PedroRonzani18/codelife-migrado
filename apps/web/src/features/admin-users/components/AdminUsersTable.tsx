import type { AdminUser, UserRole } from '@codelife/contracts/users';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type AdminUsersTableProps = {
  users: AdminUser[];
  currentUserKey?: string;
  isPending: boolean;
  pendingUserKey?: string;
  onChangeRole: (userKey: string, role: UserRole) => void;
};

export function AdminUsersTable({ users, currentUserKey, isPending, pendingUserKey, onChangeRole }: AdminUsersTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[42rem] text-left text-sm">
        <caption className="sr-only">Usuários disponíveis para gestão administrativa</caption>
        <thead className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
          <tr>
            <th scope="col" className="px-6 py-3 font-medium">Nome</th>
            <th scope="col" className="px-6 py-3 font-medium">Username</th>
            <th scope="col" className="px-6 py-3 font-medium">Papel</th>
            <th scope="col" className="px-6 py-3 text-right font-medium">Ação</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {users.map((user) => {
            const nextRole: UserRole = user.role === 'ADMIN' ? 'USER' : 'ADMIN';
            const isSelfDemotion = user.id === currentUserKey && user.role === 'ADMIN';
            const isThisMutationPending = isPending && pendingUserKey === user.id;

            return (
              <tr key={user.id} className="align-middle">
                <th scope="row" className="px-6 py-4 font-medium text-foreground">{user.displayName}</th>
                <td className="px-6 py-4 text-muted-foreground">{user.username}</td>
                <td className="px-6 py-4">
                  <Badge variant={user.role === 'ADMIN' ? 'default' : 'outline'}>{user.role}</Badge>
                </td>
                <td className="px-6 py-4 text-right">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isSelfDemotion || isPending}
                    aria-label={isThisMutationPending
                      ? `Salvando alteração para ${user.displayName}`
                      : isSelfDemotion
                        ? `Rebaixamento indisponível para ${user.displayName}`
                        : `Tornar ${user.displayName} ${nextRole}`}
                    onClick={() => onChangeRole(user.id, nextRole)}
                  >
                    {isSelfDemotion ? 'Acesso atual' : isThisMutationPending ? 'Salvando…' : `Tornar ${nextRole}`}
                  </Button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
