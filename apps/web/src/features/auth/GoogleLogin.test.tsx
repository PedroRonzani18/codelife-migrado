import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { GoogleLogin } from './GoogleLogin';

describe('GoogleLogin', () => {
  it('starts the Google login flow without exposing the test fixture', async () => {
    const onLogin = vi.fn();
    render(<GoogleLogin onLogin={onLogin} />);

    const button = screen.getByRole('button', { name: 'Entrar com Google' });
    expect(button).toBeInTheDocument();
    expect(screen.queryByText('aluna.demo')).not.toBeInTheDocument();

    await userEvent.click(button);

    expect(onLogin).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Redirecionando…' })).toBeDisabled();
  });

  it('restores the button and reports a startup failure', async () => {
    const onLogin = vi.fn(() => {
      throw new Error('Falha de navegação');
    });
    render(<GoogleLogin onLogin={onLogin} />);

    await userEvent.click(screen.getByRole('button', { name: 'Entrar com Google' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Falha de navegação');
    expect(screen.getByRole('button', { name: 'Entrar com Google' })).toBeEnabled();
  });
});
