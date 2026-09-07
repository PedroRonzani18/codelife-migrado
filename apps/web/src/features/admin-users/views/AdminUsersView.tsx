import { useEffect, useRef } from 'react';
import type { AdminUser } from '@codelife/contracts/users';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSessionQuery } from '@/features/auth/hooks/useSessionQuery';
import { ApiClientError, mapApiErrorMessage } from '@/shared/http';
import { FeedbackAlert, LoadingState, PageContainer, RouteErrorState } from '@/shared/components';
import { useAdminUserRoleMutation } from '../hooks/useAdminUserRoleMutation';
import { useAdminUsersQuery } from '../hooks/useAdminUsersQuery';
import { AdminUsersTable } from '../components/AdminUsersTable';

function isForbidden(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 403;
}

function requestId(error: unknown): string | undefined {
  return error instanceof ApiClientError ? error.requestId : undefined;
}

function adminAccessErrorDescription(): string {
  return 'Seu acesso administrativo pode ter sido alterado em outra sessão. Atualize a sessão para continuar ou volte à jornada.';
}

export default function AdminUsersView() {
  const session = useSessionQuery();
  const users = useAdminUsersQuery();
  const updateRole = useAdminUserRoleMutation();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const mutationAlertRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!users.isLoading && !users.error) headingRef.current?.focus();
  }, [users.error, users.isLoading]);

  useEffect(() => {
    if (updateRole.error) mutationAlertRef.current?.focus();
  }, [updateRole.error]);

  useEffect(() => {
    if (isForbidden(users.error) || isForbidden(updateRole.error)) void session.refetch();
  }, [session.refetch, updateRole.error, users.error]);

  if (users.isLoading) {
    return <PageContainer><LoadingState label="Carregando usuários…" /></PageContainer>;
  }

  if (users.error) {
    const forbidden = isForbidden(users.error);
    return (
      <PageContainer className="py-8 sm:py-12">
        <RouteErrorState
          title={forbidden ? 'Acesso administrativo indisponível' : 'Não foi possível carregar os usuários'}
          description={forbidden ? adminAccessErrorDescription() : mapApiErrorMessage(users.error)}
          requestId={requestId(users.error)}
          onRetry={async () => {
            if (forbidden) await session.refetch();
            await users.refetch();
          }}
        />
      </PageContainer>
    );
  }

  const userList: AdminUser[] = users.data ?? [];
  const mutationError = updateRole.error;

  return (
    <PageContainer className="py-8 sm:py-12">
      <header className="mb-8 space-y-3">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary">Administração</p>
        <h1 ref={headingRef} tabIndex={-1} className="text-balance text-3xl font-bold tracking-tight outline-none sm:text-4xl">
          Administração de usuários
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          Consulte os usuários persistidos e altere seus papéis administrativos.
        </p>
      </header>

      {mutationError && (
        <FeedbackAlert
          focusRef={mutationAlertRef}
          className="mb-6"
          kind="error"
          title={isForbidden(mutationError) ? 'Acesso administrativo indisponível' : 'Não foi possível alterar o papel'}
          description={isForbidden(mutationError) ? adminAccessErrorDescription() : mapApiErrorMessage(mutationError)}
          requestId={requestId(mutationError)}
        />
      )}

      {userList.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Nenhum usuário encontrado</CardTitle>
            <CardDescription>A lista administrativa está vazia no momento.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Usuários cadastrados</CardTitle>
            <CardDescription>{userList.length} usuário{userList.length === 1 ? '' : 's'} na lista administrativa.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <AdminUsersTable
              users={userList}
              currentUserKey={session.data?.user.id}
              isPending={updateRole.isPending}
              pendingUserKey={updateRole.variables?.userKey}
              onChangeRole={(userKey, role) => updateRole.mutate({ userKey, role })}
            />
          </CardContent>
        </Card>
      )}
    </PageContainer>
  );
}
