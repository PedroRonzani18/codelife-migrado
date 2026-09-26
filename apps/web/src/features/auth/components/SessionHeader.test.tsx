import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import type { AuthSession } from '@codelife/contracts/auth';
import { SessionHeader } from './SessionHeader';

const session = (role: AuthSession['user']['role']): AuthSession => ({
  user: { id: 'user-key', username: 'user.name', displayName: 'User Name', role },
});

function renderHeader(role: AuthSession['user']['role']) {
  return render(
    <MemoryRouter>
      <SessionHeader session={session(role)} isPending={false} onLogout={vi.fn()} />
    </MemoryRouter>,
  );
}

describe('SessionHeader', () => {
  it('shows the journey and logout, but no administrative action, for USER', () => {
    renderHeader('USER');

    expect(screen.getByRole('link', { name: 'Jornada' })).toHaveAttribute('href', '/ilhas');
    expect(screen.getByRole('link', { name: /CodeLife/ })).toHaveAttribute('href', '/ilhas');
    expect(screen.queryByRole('link', { name: 'Administração' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Conteúdo' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair' })).toBeInTheDocument();
  });

  it('shows the administrative navigation for ADMIN', () => {
    renderHeader('ADMIN');

    expect(screen.getByRole('link', { name: 'Administração' })).toHaveAttribute('href', '/admin/users');
    expect(screen.getByRole('link', { name: 'Conteúdo' })).toHaveAttribute('href', '/admin/content');
  });
});
