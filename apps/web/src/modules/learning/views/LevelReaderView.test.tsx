import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { LevelDetail } from '@codelife/contracts/learning';
import type { ProgressSnapshot } from '@codelife/contracts/progress';
import { queryKeys } from '@/shared/query';
import * as progressService from '../services/progressService';
import LevelReaderView from './LevelReaderView';

vi.mock('../services/progressService', async (importOriginal) => {
  const original = await importOriginal<typeof progressService>();
  return { ...original, completeLevel: vi.fn(), navigateToSlide: vi.fn(), startLevel: vi.fn() };
});

const levelId = '00000000-0000-4000-8000-000000000501';
const slideOne = '00000000-0000-4000-8000-000000000701';
const slideTwo = '00000000-0000-4000-8000-000000000702';
const unknownSlide = '00000000-0000-4000-8000-000000000799';
const islandId = '00000000-0000-4000-8000-000000000301';
const nextLevelId = '00000000-0000-4000-8000-000000000502';
const nextSlideId = '00000000-0000-4000-8000-000000000703';

const level: LevelDetail = {
  id: levelId,
  islandId,
  title: 'Variáveis JS',
  position: 1,
  availability: 'in_progress',
  slides: [
    { id: slideOne, title: 'Variáveis', position: 1, previousSlideId: null, nextSlideId: slideTwo, type: 'TextText', primaryText: 'Primeiro conteúdo', secondaryText: null },
    { id: slideTwo, title: 'Declarando valores', position: 2, previousSlideId: slideOne, nextSlideId: null, type: 'TextCode', text: 'Segundo conteúdo', code: 'const valor = 1;', language: 'javascript' },
  ],
};

function snapshot(currentSlideId: string): ProgressSnapshot {
  return {
    lastVisited: { islandId, levelId, slideId: currentSlideId },
    nextRecommended: { levelId, slideId: currentSlideId },
    islands: [{
      id: islandId,
      slug: 'island-3',
      title: 'Interatividade',
      levelCount: 1,
      progress: { currentLevelId: levelId, startedAt: '2026-08-22T10:00:00.000Z' },
      levels: [{ id: levelId, title: level.title, position: 1, availability: 'in_progress', progress: { currentSlideId, startedAt: '2026-08-22T10:00:00.000Z', completedAt: null } }],
    }],
  };
}

function completedSnapshot(nextLevel = false): ProgressSnapshot {
  return {
    lastVisited: { islandId, levelId, slideId: slideTwo },
    nextRecommended: nextLevel ? { levelId: nextLevelId, slideId: nextSlideId } : null,
    islands: [{
      id: islandId,
      slug: 'island-3',
      title: 'Interatividade',
      levelCount: nextLevel ? 2 : 1,
      progress: { currentLevelId: levelId, startedAt: '2026-08-22T10:00:00.000Z' },
      levels: [
        { id: levelId, title: level.title, position: 1, availability: 'completed', progress: { currentSlideId: slideTwo, startedAt: '2026-08-22T10:00:00.000Z', completedAt: '2026-08-22T11:00:00.000Z' } },
        ...(nextLevel ? [{ id: nextLevelId, title: 'Funções', position: 2, availability: 'available' as const, progress: null }] : []),
      ],
    }],
  };
}

function notStartedSnapshot(): ProgressSnapshot {
  return {
    ...snapshot(slideOne),
    lastVisited: null,
    nextRecommended: { levelId, slideId: slideOne },
    islands: [{
      ...snapshot(slideOne).islands[0],
      progress: null,
      levels: [{ id: levelId, title: level.title, position: 1, availability: 'available', progress: null }],
    }],
  };
}

function renderReader(initialSlideId = slideOne, initialSnapshot = snapshot(slideOne)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity }, mutations: { retry: 0 } } });
  client.setQueryData(queryKeys.progress.snapshot, initialSnapshot);
  client.setQueryData(queryKeys.learning.level(levelId), level);
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/ilhas/island-3/niveis/${levelId}/slides/${initialSlideId}`]}>
        <Routes><Route path="/ilhas/:islandSlug/niveis/:levelId/slides/:slideId" element={<LevelReaderView />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('LevelReaderView', () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.mocked(progressService.completeLevel).mockReset();
    vi.mocked(progressService.navigateToSlide).mockReset();
    vi.mocked(progressService.startLevel).mockReset();
  });

  it('changes the visible slide only after persistence succeeds', async () => {
    vi.mocked(progressService.navigateToSlide).mockResolvedValue(snapshot(slideTwo));
    renderReader();
    await userEvent.click(screen.getByRole('button', { name: /próximo/i }));
    expect(await screen.findByRole('heading', { name: 'Declarando valores' })).toBeInTheDocument();
    expect(progressService.navigateToSlide).toHaveBeenCalledWith(levelId, slideTwo);
    await waitFor(() => expect(progressService.navigateToSlide).toHaveBeenCalledTimes(1));
  });

  it('keeps the last confirmed slide when a direct target is invalid', async () => {
    renderReader(unknownSlide);
    await waitFor(() => expect(screen.getByText('Conteúdo não encontrado.')).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Variáveis' })).toBeInTheDocument();
    expect(progressService.navigateToSlide).not.toHaveBeenCalled();
  });

  it('starts a newly opened level without an intermediate confirmation screen', async () => {
    vi.mocked(progressService.startLevel).mockResolvedValue(snapshot(slideOne));
    renderReader(slideOne, notStartedSnapshot());
    expect(await screen.findByRole('heading', { name: 'Variáveis' })).toBeInTheDocument();
    expect(progressService.startLevel).toHaveBeenCalledWith(levelId);
    expect(screen.queryByText(/pronto para começar/i)).not.toBeInTheDocument();
  });

  it('offers island completion after the final level is completed', async () => {
    vi.mocked(progressService.completeLevel).mockResolvedValue(completedSnapshot());
    renderReader(slideTwo, snapshot(slideTwo));
    await userEvent.click(screen.getByRole('button', { name: /concluir nível/i }));
    expect(await screen.findByRole('button', { name: /voltar ao catálogo/i })).toBeInTheDocument();
  });

  it('offers the next level after a non-final level is completed', async () => {
    vi.mocked(progressService.completeLevel).mockResolvedValue(completedSnapshot(true));
    renderReader(slideTwo, snapshot(slideTwo));
    await userEvent.click(screen.getByRole('button', { name: /concluir nível/i }));
    expect(await screen.findByRole('button', { name: /ir para o próximo nível/i })).toBeInTheDocument();
  });
});
