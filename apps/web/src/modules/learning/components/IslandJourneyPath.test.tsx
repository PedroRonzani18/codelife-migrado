import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { LevelJourney } from '../selectors/selectLearning';
import { IslandJourneyPath } from './IslandJourneyPath';

const levels: LevelJourney[] = [
  { id: '00000000-0000-4000-8000-000000000501', title: 'Variáveis JS', position: 1, availability: 'completed', progress: { currentSlideId: '00000000-0000-4000-8000-000000000701', startedAt: '2026-08-23T10:00:00.000Z', completedAt: '2026-08-23T10:10:00.000Z' } },
  { id: '00000000-0000-4000-8000-000000000502', title: 'Eventos de Clique', position: 2, availability: 'in_progress', progress: { currentSlideId: '00000000-0000-4000-8000-000000000704', startedAt: '2026-08-23T10:10:00.000Z', completedAt: null } },
  { id: '00000000-0000-4000-8000-000000000503', title: 'Atualizando o DOM', position: 3, availability: 'blocked', progress: null },
];

describe('IslandJourneyPath', () => {
  it('presents the island as a sequential path and exposes only actionable milestones', () => {
    const onOpenLevel = vi.fn();
    render(<IslandJourneyPath title="Interatividade" levels={levels} isPending={false} onOpenLevel={onOpenLevel} />);

    expect(screen.getByRole('heading', { name: 'Interatividade' })).toBeInTheDocument();
    expect(screen.getByRole('progressbar', { name: '1 de 3 etapas concluídas' })).toBeInTheDocument();
    expect(screen.getByText('Você está aqui')).toBeInTheDocument();
    expect(screen.getByText('Em breve')).toBeInTheDocument();
    expect(screen.getByText('Aguarde a etapa anterior')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /continuar jornada/i }));
    expect(onOpenLevel).toHaveBeenCalledWith(levels[1].id);
  });
});
