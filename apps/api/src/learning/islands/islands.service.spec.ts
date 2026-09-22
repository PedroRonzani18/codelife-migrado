import { ForbiddenException, NotFoundException } from '@nestjs/common';
import type { ProgressService } from '../progress/progress.service';
import { IslandsService } from './islands.service';

describe('IslandsService', () => {
  const progress = {
    catalog: jest.fn(),
    assertIslandAccess: jest.fn(),
  } as unknown as jest.Mocked<ProgressService>;
  const service = new IslandsService(progress);
  const islandId = '00000000-0000-4000-8000-000000000301';
  const levelId = '00000000-0000-4000-8000-000000000501';

  beforeEach(() => jest.clearAllMocks());

  it('returns catalog from progress service', async () => {
    const catalogData = [
      {
        id: islandId,
        slug: 'island-1',
        title: 'Introdução',
        position: 1,
        levelCount: 2,
        availability: 'available' as const,
      },
    ];
    progress.catalog.mockResolvedValue(catalogData);

    const result = await service.catalog('user-id');
    expect(result).toEqual(catalogData);
    expect(progress.catalog).toHaveBeenCalledWith('user-id');
  });

  it('returns island detail with canonical availability and levels', async () => {
    progress.assertIslandAccess.mockResolvedValue({
      id: islandId,
      slug: 'island-3',
      title: 'Interatividade',
      position: 1,
      availability: 'available',
      levels: [
        {
          id: levelId,
          title: 'Variáveis',
          position: 1,
          availability: 'available',
          slides: [],
          progress: null,
        },
      ],
      progress: null,
    });

    await expect(service.islandDetail('user-id', 'island-3')).resolves.toEqual({
      id: islandId,
      slug: 'island-3',
      title: 'Interatividade',
      levelCount: 1,
      availability: 'available',
      levels: [{ id: levelId, title: 'Variáveis', position: 1, availability: 'available' }],
    });
  });

  it('propagates not found when island is absent or unpublished', async () => {
    progress.assertIslandAccess.mockRejectedValue(new NotFoundException('Ilha unknown não encontrada'));
    await expect(service.islandDetail('user-id', 'unknown')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('propagates forbidden when island is blocked', async () => {
    progress.assertIslandAccess.mockRejectedValue(
      new ForbiddenException({ code: 'ISLAND_BLOCKED', message: 'Ilha bloqueada' }),
    );
    await expect(service.islandDetail('user-id', 'island-2')).rejects.toThrow(ForbiddenException);
  });
});

