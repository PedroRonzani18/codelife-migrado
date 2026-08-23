import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/shared/query';
import { ApiClientError, domainErrorMessage } from '@/shared/http';
import { LoadingState, RouteErrorState } from '@/shared/components';
import { ExperimentalLogin } from '@/features/auth/ExperimentalLogin';
import { SessionHeader } from '@/features/auth/components/SessionHeader';
import { ProtectedRoute } from '@/features/auth/routes/ProtectedRoute';
import { useSessionMutations, useSessionQuery } from '@/features/auth';
import IslandView from '@/modules/learning/views/IslandView';
import LevelReaderView from '@/modules/learning/views/LevelReaderView';

function RootRoute() {
  const session = useSessionQuery();
  const { login } = useSessionMutations();
  const unauthorized = session.error instanceof ApiClientError && session.error.status === 401;
  if (session.isLoading) return <main className="mx-auto max-w-6xl px-5"><LoadingState label="Verificando sessão…" /></main>;
  if (session.data) return <Navigate to="/ilhas/island-3" replace />;
  if (unauthorized) {
    return <ExperimentalLogin onLogin={() => login.mutate()} isPending={login.isPending} error={login.error instanceof ApiClientError ? domainErrorMessage(login.error.code) : login.error?.message} requestId={login.error instanceof ApiClientError ? login.error.requestId : undefined} />;
  }
  if (session.error) return <main className="mx-auto max-w-6xl px-5"><RouteErrorState description="Não foi possível verificar a sessão." onRetry={() => void session.refetch()} /></main>;
  return null;
}

function AppShell() {
  const navigate = useNavigate();
  const session = useSessionQuery();
  const { logout } = useSessionMutations();
  if (!session.data) return null;
  return (
    <div className="min-h-screen bg-background text-foreground">
      <SessionHeader
        session={session.data}
        isPending={logout.isPending}
        onLogout={() => logout.mutate(undefined, { onSuccess: () => navigate('/', { replace: true }) })}
      />
      <Outlet />
    </div>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<RootRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route path="/ilhas/:islandSlug" element={<IslandView />} />
          <Route path="/ilhas/:islandSlug/niveis/:levelId/slides/:slideId" element={<LevelReaderView />} />
        </Route>
      </Route>
      <Route path="*" element={<main className="mx-auto max-w-6xl px-5"><RouteErrorState title="Página não encontrada" description="O endereço solicitado não pertence à jornada experimental." /></main>} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
