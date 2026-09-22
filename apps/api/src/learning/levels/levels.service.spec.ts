import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { fixtureIds } from '../../../prisma/seed';
import type { IObjectStorage } from '../media/object-storage.interface';
import type { ProgressService } from '../progress/progress.service';
import type { ILevelsRepository, PositionedSlideRecord } from './levels.repository.interface';
import { LevelsService } from './levels.service';

describe('LevelsService', () => {
  let repository: jest.Mocked<ILevelsRepository>;
  let storage: jest.Mocked<IObjectStorage>;
  let progress: jest.Mocked<Pick<ProgressService, 'snapshot'>>;
  let service: LevelsService;
  const slides: PositionedSlideRecord[] = [
    { id: fixtureIds.slides[0], title: 'Texto', type: 'TextText', position: 1, textText: { primaryText: 'Principal', secondaryText: null }, textImage: null, textCode: null },
    { id: fixtureIds.slides[1], title: 'Código', type: 'TextCode', position: 2, textText: null, textImage: null, textCode: { text: 'Exemplo', code: 'const x = 1;', language: 'javascript' } },
    { id: fixtureIds.slides[2], title: 'Imagem', type: 'TextImage', position: 3, textText: null, textCode: null, textImage: { text: 'Ilustração', altText: 'Descrição', mediaAsset: { id: fixtureIds.assets[0], objectKey: 'learning/island-3/variables.svg', mimeType: 'image/svg+xml', sizeBytes: null, width: 640, height: 360, checksum: null } } },
  ];

  beforeEach(() => {
    repository = {
      levelById: jest.fn().mockResolvedValue({ id: fixtureIds.levels[0], islandId: fixtureIds.island, title: 'Variáveis', position: 1, slides }),
      findById: jest.fn(),
      findByIslandId: jest.fn(),
      countByIslandId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAdminDetail: jest.fn(),
    };
    storage = {
      resolveControlledObject: jest.fn().mockResolvedValue('/controlled/asset.svg'),
      writeMediaObject: jest.fn(),
      deleteMediaObject: jest.fn(),
    };
    progress = { snapshot: jest.fn().mockResolvedValue({ lastVisited: null, nextRecommended: null, islands: [{ id: fixtureIds.island, slug: 'island-3', title: 'Interatividade', levelCount: 1, progress: null, levels: [{ id: fixtureIds.levels[0], title: 'Variáveis', position: 1, availability: 'available', progress: null }] }] }) };
    service = new LevelsService(repository, storage, progress as unknown as ProgressService);
  });

  it('maps all subtypes and derives simple adjacent slide ids', async () => {
    const detail = await service.levelDetail(fixtureIds.user, fixtureIds.levels[0]);
    expect(detail).toMatchObject({ id: fixtureIds.levels[0], islandId: fixtureIds.island, availability: 'available' });
    expect(detail.slides).toEqual([
      expect.objectContaining({ type: 'TextText', previousSlideId: null, nextSlideId: fixtureIds.slides[1] }),
      expect.objectContaining({ type: 'TextCode', previousSlideId: fixtureIds.slides[0], nextSlideId: fixtureIds.slides[2] }),
      expect.objectContaining({ type: 'TextImage', previousSlideId: fixtureIds.slides[1], nextSlideId: null }),
    ]);
    expect(storage.resolveControlledObject).toHaveBeenCalledTimes(1);
  });

  it('returns not found for an absent level', async () => {
    repository.levelById.mockResolvedValue(null);
    await expect(service.levelDetail(fixtureIds.user, fixtureIds.levels[0])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('rejects direct reads of a blocked level before loading slide assets', async () => {
    progress.snapshot.mockResolvedValue({
      lastVisited: null,
      nextRecommended: null,
      islands: [{
        id: fixtureIds.island,
        slug: 'island-3',
        title: 'Interatividade',
        levelCount: 1,
        progress: null,
        levels: [{
          id: fixtureIds.levels[0],
          title: 'Variáveis',
          position: 1,
          availability: 'blocked',
          progress: null,
        }],
      }],
    });
    await expect(service.levelDetail(fixtureIds.user, fixtureIds.levels[0])).rejects.toBeInstanceOf(ForbiddenException);
    expect(storage.resolveControlledObject).not.toHaveBeenCalled();
  });

  it('rejects inconsistent subtypes and a divergent progress snapshot', async () => {
    repository.levelById.mockResolvedValue({ id: fixtureIds.levels[0], islandId: fixtureIds.island, title: 'Variáveis', position: 1, slides: [{ ...slides[0], textCode: { text: 'x', code: 'x', language: 'text' } }] });
    await expect(service.levelDetail(fixtureIds.user, fixtureIds.levels[0])).rejects.toThrow('expected exactly one subtype');
    repository.levelById.mockResolvedValue({ id: fixtureIds.levels[0], islandId: fixtureIds.island, title: 'Variáveis', position: 1, slides: [] });
    progress.snapshot.mockResolvedValue({ lastVisited: null, nextRecommended: null, islands: [] });
    await expect(service.levelDetail(fixtureIds.user, fixtureIds.levels[0])).rejects.toThrow('level is absent');
  });
});
