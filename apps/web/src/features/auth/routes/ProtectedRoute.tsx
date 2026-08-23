import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ApiClientError, domainErrorMessage } from '@/shared/http';
import { LoadingState, RouteErrorState } from '@/shared/components';
import { useSessionMutations, useSessionQuery } from '@/features/auth';
import { ExperimentalLogin } from '../ExperimentalLogin';

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function ProtectedRoute() {
  const location = useLocation();
  const session = useSessionQuery();
  const { login } = useSessionMutations();

  if (session.isLoading) return <main className="mx-auto max-w-6xl px-5"><LoadingState label="Verificando sessão…" /></main>;
  if (isUnauthorized(session.error)) {
    return (
      <ExperimentalLogin
        onLogin={() => login.mutate()}
        isPending={login.isPending}
        error={login.error instanceof ApiClientError ? domainErrorMessage(login.error.code) : login.error?.message}
        requestId={login.error instanceof ApiClientError ? login.error.requestId : undefined}
      />
    );
  }
  if (session.error) {
    const error = session.error instanceof ApiClientError ? session.error : undefined;
    return <main className="mx-auto max-w-6xl px-5"><RouteErrorState description={error ? domainErrorMessage(error.code) : 'Não foi possível verificar a sessão.'} requestId={error?.requestId} onRetry={() => void session.refetch()} /></main>;
  }
  if (!session.data) return <Navigate to="/" replace state={{ from: location }} />;
  return <Outlet />;
}
