import { NotFoundException } from '@nestjs/common';
import type { ProgressService } from '../progress/progress.service';
import type { IIslandsRepository } from './islands.repository.interface';
import { IslandsService } from './islands.service';

describe('IslandsService', () => {
  const repository: jest.Mocked<IIslandsRepository> = { islandBySlug: jest.fn() };
  const progress = { snapshot: jest.fn() } as unknown as jest.Mocked<ProgressService>;
  const service = new IslandsService(repository, progress);
  const islandId = '00000000-0000-4000-8000-000000000301';
  const levelId = '00000000-0000-4000-8000-000000000501';

  beforeEach(() => jest.clearAllMocks());

  it('combines direct content with canonical availability', async () => {
    repository.islandBySlug.mockResolvedValue({ id: islandId, slug: 'island-3', title: 'Interatividade', levels: [{ id: levelId, title: 'Variáveis', position: 1 }] });
    progress.snapshot.mockResolvedValue({
      lastVisited: null,
      nextRecommended: null,
      islands: [{ id: islandId, slug: 'island-3', title: 'Interatividade', levelCount: 1, progress: null, levels: [{ id: levelId, title: 'Variáveis', position: 1, availability: 'available', progress: null }] }],
    });
    await expect(service.islandDetail('user-id', 'island-3')).resolves.toEqual({ id: islandId, slug: 'island-3', title: 'Interatividade', levelCount: 1, levels: [{ id: levelId, title: 'Variáveis', position: 1, availability: 'available' }] });
  });

  it('returns not found before loading progress', async () => {
    repository.islandBySlug.mockResolvedValue(null);
    await expect(service.islandDetail('user-id', 'unknown')).rejects.toBeInstanceOf(NotFoundException);
    expect(progress.snapshot).not.toHaveBeenCalled();
  });

  it('fails when content and progress snapshots diverge', async () => {
    repository.islandBySlug.mockResolvedValue({ id: islandId, slug: 'island-3', title: 'Interatividade', levels: [] });
    progress.snapshot.mockResolvedValue({ lastVisited: null, nextRecommended: null, islands: [] });
    await expect(service.islandDetail('user-id', 'island-3')).rejects.toThrow('island is absent');
  });
});
