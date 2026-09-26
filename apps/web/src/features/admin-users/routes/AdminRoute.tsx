import { Navigate, Outlet } from 'react-router-dom';
import { useSessionQuery } from '@/features/auth/hooks/useSessionQuery';

export function AdminRoute() {
  const session = useSessionQuery();

  if (!session.data) return null;
  if (session.data.user.role !== 'ADMIN') return <Navigate to="/ilhas" replace />;

  return <Outlet />;
}
