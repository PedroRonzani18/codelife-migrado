import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LevelCard } from './LevelCard';

describe('LevelCard', () => {
  it('represents the four journey states with accessible actions', async () => {
    const onAction = vi.fn();
    render(
      <main>
        <h1>Jornada</h1>
        <LevelCard id="available" title="Disponível" position={1} availability="available" isPending={false} onAction={onAction} />
        <LevelCard id="progress" title="Em andamento" position={2} availability="in_progress" isPending={false} onAction={onAction} />
        <LevelCard id="blocked" title="Bloqueado" position={3} availability="blocked" isPending={false} onAction={onAction} />
        <LevelCard id="completed" title="Concluído" position={4} availability="completed" isPending={false} onAction={onAction} />
      </main>,
    );

    fireEvent.click(screen.getByRole('button', { name: /iniciar nível/i }));
    fireEvent.click(screen.getByRole('button', { name: /continuar/i }));
    fireEvent.click(screen.getByRole('button', { name: /revisar/i }));
    expect(onAction.mock.calls.map(([id]) => id)).toEqual(['available', 'progress', 'completed']);
    expect(screen.queryByRole('button', { name: /indisponível/i })).not.toBeInTheDocument();
    expect(screen.getByLabelText('Bloqueado: bloqueado')).toBeInTheDocument();
  });
});
