import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '@codelife/contracts/auth';
import { useSessionQuery } from '@/features/auth/hooks/useSessionQuery';
import { AdminRoute } from './AdminRoute';

vi.mock('@/features/auth/hooks/useSessionQuery', () => ({ useSessionQuery: vi.fn() }));

const session = (role: AuthSession['user']['role']): AuthSession => ({
  user: { id: 'user-key', username: 'user.name', displayName: 'User Name', role },
});

function renderRoute(role: AuthSession['user']['role']) {
  vi.mocked(useSessionQuery).mockReturnValue({ data: session(role), isLoading: false } as ReturnType<typeof useSessionQuery>);
  return render(
    <MemoryRouter initialEntries={['/admin/users']}>
      <Routes>
        <Route element={<AdminRoute />}>
          <Route path="/admin/users" element={<p>Admin screen</p>} />
        </Route>
        <Route path="/ilhas/island-3" element={<p>Journey screen</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AdminRoute', () => {
  beforeEach(() => vi.resetAllMocks());

  it('redirects USER away from the administrative route', async () => {
    renderRoute('USER');

    expect(await screen.findByText('Journey screen')).toBeInTheDocument();
    expect(screen.queryByText('Admin screen')).not.toBeInTheDocument();
  });

  it('renders the administrative outlet for ADMIN', () => {
    renderRoute('ADMIN');

    expect(screen.getByText('Admin screen')).toBeInTheDocument();
  });
});
