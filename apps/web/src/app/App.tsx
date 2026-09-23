import { QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/shared/query';
import { ApiClientError } from '@/shared/http';
import { LoadingState, PageContainer, RouteErrorState } from '@/shared/components';
import { GoogleLogin } from '@/features/auth/GoogleLogin';
import { SessionHeader } from '@/features/auth/components/SessionHeader';
import { ProtectedRoute } from '@/features/auth/routes/ProtectedRoute';
import { AdminRoute, AdminUsersView } from '@/features/admin-users';
import { AdminContentView } from '@/features/admin-content';
import { startGoogleLogin, useSessionMutations, useSessionQuery } from '@/features/auth';
import { IslandCatalogView, IslandView, LevelReaderView } from '@/modules/learning';

function RootRoute() {
  const session = useSessionQuery();
  const unauthorized = session.error instanceof ApiClientError && session.error.status === 401;
  if (session.isLoading) return <PageContainer><LoadingState label="Verificando sessão…" /></PageContainer>;
  if (session.data) return <Navigate to="/ilhas" replace />;
  if (unauthorized) {
    return <GoogleLogin onLogin={startGoogleLogin} />;
  }
  if (session.error) return <PageContainer><RouteErrorState description="Não foi possível verificar a sessão." onRetry={() => void session.refetch()} /></PageContainer>;
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
          <Route path="/ilhas" element={<IslandCatalogView />} />
          <Route path="/ilhas/:islandSlug" element={<IslandView />} />
          <Route path="/ilhas/:islandSlug/niveis/:levelId/slides/:slideId" element={<LevelReaderView />} />
        </Route>
        <Route element={<AdminRoute />}>
          <Route element={<AppShell />}>
            <Route path="/admin/users" element={<AdminUsersView />} />
            <Route path="/admin/content" element={<AdminContentView />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<PageContainer><RouteErrorState title="Página não encontrada" description="O endereço solicitado não pertence à jornada experimental." /></PageContainer>} />
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
