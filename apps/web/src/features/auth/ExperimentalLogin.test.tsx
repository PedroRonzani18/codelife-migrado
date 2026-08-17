import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExperimentalLogin } from './ExperimentalLogin';

describe('ExperimentalLogin', () => {
  it('exposes only the fixed experimental login boundary', () => {
    render(<ExperimentalLogin onLogin={vi.fn()} isPending={false} />);
    expect(screen.getByRole('button', { name: 'Iniciar sessão experimental' })).toBeInTheDocument();
    expect(screen.getByText('aluna.demo')).toBeInTheDocument();
  });
});
