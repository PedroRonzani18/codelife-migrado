import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { ApiClientError, domainErrorMessage } from '@/shared/http';
import { LoadingState, PageContainer, RouteErrorState } from '@/shared/components';
import { startGoogleLogin, useSessionQuery } from '@/features/auth';
import { GoogleLogin } from '../GoogleLogin';

function isUnauthorized(error: unknown): boolean {
  return error instanceof ApiClientError && error.status === 401;
}

export function ProtectedRoute() {
  const location = useLocation();
  const session = useSessionQuery();

  if (session.isLoading) return <PageContainer><LoadingState label="Verificando sessão…" /></PageContainer>;
  if (isUnauthorized(session.error)) {
    return <GoogleLogin onLogin={startGoogleLogin} />;
  }
  if (session.error) {
    const error = session.error instanceof ApiClientError ? session.error : undefined;
    return <PageContainer><RouteErrorState description={error ? domainErrorMessage(error.code) : 'Não foi possível verificar a sessão.'} requestId={error?.requestId} onRetry={() => void session.refetch()} /></PageContainer>;
  }
  if (!session.data) return <Navigate to="/" replace state={{ from: location }} />;
  return <Outlet />;
}
