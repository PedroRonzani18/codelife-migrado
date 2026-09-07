import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '@codelife/contracts/auth';
import type { AdminUser } from '@codelife/contracts/users';
import { useSessionQuery } from '@/features/auth/hooks/useSessionQuery';
import { ApiClientError } from '@/shared/http';
import * as adminUsersService from '../services/adminUsersService';
import AdminUsersView from './AdminUsersView';

vi.mock('@/features/auth/hooks/useSessionQuery', () => ({ useSessionQuery: vi.fn() }));
vi.mock('../services/adminUsersService', () => ({
  getAdminUsers: vi.fn(),
  updateAdminUserRole: vi.fn(),
}));

const currentUser: AdminUser = { id: 'admin-user', username: 'admin.user', displayName: 'Admin User', role: 'ADMIN' };
const targetUser: AdminUser = { id: 'target-user', username: 'target.user', displayName: 'Target User', role: 'USER' };
const session: AuthSession = { user: currentUser };

function renderView() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: 0 } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <AdminUsersView />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('AdminUsersView', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(useSessionQuery).mockReturnValue({ data: session, isLoading: false, refetch: vi.fn() } as unknown as ReturnType<typeof useSessionQuery>);
  });

  afterEach(cleanup);

  it('shows loading while the list is being fetched', () => {
    vi.mocked(adminUsersService.getAdminUsers).mockReturnValue(new Promise<AdminUser[]>(() => {}));

    renderView();

    expect(screen.getByRole('status')).toHaveTextContent('Carregando usuários…');
  });

  it('renders the list and disables self-demotion', async () => {
    vi.mocked(adminUsersService.getAdminUsers).mockResolvedValue([currentUser, targetUser]);

    renderView();

    expect(await screen.findByRole('heading', { name: 'Administração de usuários' })).toBeInTheDocument();
    expect(screen.getByRole('table')).toHaveTextContent('Admin User');
    expect(screen.getByRole('button', { name: 'Rebaixamento indisponível para Admin User' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Tornar Target User ADMIN' })).toBeEnabled();
  });

  it('renders an explicit empty state', async () => {
    vi.mocked(adminUsersService.getAdminUsers).mockResolvedValue([]);

    renderView();

    expect(await screen.findByRole('heading', { name: 'Nenhum usuário encontrado' })).toBeInTheDocument();
  });

  it('renders a recoverable query error', async () => {
    vi.mocked(adminUsersService.getAdminUsers).mockRejectedValue(new ApiClientError(500, 'INTERNAL_ERROR', 'Falha', undefined, 'request-1'));

    renderView();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os usuários');
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });

  it('disables actions while persisting and reflects the refetched role', async () => {
    let resolveUpdate!: (user: AdminUser) => void;
    vi.mocked(adminUsersService.getAdminUsers)
      .mockResolvedValueOnce([currentUser, targetUser])
      .mockResolvedValueOnce([currentUser, { ...targetUser, role: 'ADMIN' }]);
    vi.mocked(adminUsersService.updateAdminUserRole).mockReturnValue(new Promise((resolve) => { resolveUpdate = resolve; }));

    renderView();
    await userEvent.click(await screen.findByRole('button', { name: 'Tornar Target User ADMIN' }));

    expect(screen.getByRole('button', { name: 'Salvando alteração para Target User' })).toBeDisabled();
    resolveUpdate({ ...targetUser, role: 'ADMIN' });

    await waitFor(() => expect(screen.getByRole('button', { name: 'Tornar Target User USER' })).toBeEnabled());
    expect(adminUsersService.updateAdminUserRole).toHaveBeenCalledWith('target-user', { role: 'ADMIN' });
  });

  it('shows mutation failure and leaves the action recoverable', async () => {
    vi.mocked(adminUsersService.getAdminUsers).mockResolvedValue([currentUser, targetUser]);
    vi.mocked(adminUsersService.updateAdminUserRole).mockRejectedValue(new ApiClientError(500, 'INTERNAL_ERROR', 'Falha', undefined, 'request-2'));

    renderView();
    await userEvent.click(await screen.findByRole('button', { name: 'Tornar Target User ADMIN' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível alterar o papel');
    await waitFor(() => expect(screen.getByRole('button', { name: 'Tornar Target User ADMIN' })).toBeEnabled());
  });
});
