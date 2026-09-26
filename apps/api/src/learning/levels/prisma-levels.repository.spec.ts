import { fixtureIds } from '../../../prisma/seed';
import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaLevelsRepository } from './prisma-levels.repository';

describe('PrismaLevelsRepository', () => {
  const timestamp = new Date('2026-09-01T00:00:00.000Z');
  const level = {
    id: 'l1', islandId: 'i1', title: 'Nível', position: 1,
    publishedAt: timestamp, createdAt: timestamp, updatedAt: timestamp,
    _count: { slides: 1 },
    slides: [],
  };
  const slide = {
    id: 's1', levelId: 'l1', title: 'Slide', position: 1,
    createdAt: timestamp, updatedAt: timestamp,
    type: 'TextText', textText: { primaryText: 'Texto', secondaryText: null },
    textImage: null, textCode: null,
  };

  it('loads a direct level with ordered direct slides', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    await new PrismaLevelsRepository({ level: { findUnique } } as unknown as PrismaService).levelById(fixtureIds.levels[0]);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: fixtureIds.levels[0] } }));
    expect(findUnique.mock.calls[0][0].select.slides.orderBy).toEqual({ position: 'asc' });
  });

  it('returns null when an administrative level is absent', async () => {
    const repository = new PrismaLevelsRepository({
      level: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService);
    await expect(repository.getAdminDetail('missing')).resolves.toBeNull();
  });

  it('maps published TextText and TextImage slides in administrative detail', async () => {
    const image = {
      ...slide, id: 's2', position: 2, type: 'TextImage', textText: null,
      textImage: {
        text: 'Imagem', altText: 'Descrição', mediaAssetId: 'm1',
        mediaAsset: { id: 'm1', objectKey: 'key', mimeType: 'image/webp', sizeBytes: 10, width: 2, height: 3, checksum: 'abc' },
      },
    };
    const repository = new PrismaLevelsRepository({
      level: { findUnique: jest.fn().mockResolvedValue({ ...level, _count: { slides: 2 }, slides: [slide, image] }) },
    } as unknown as PrismaService);

    const result = await repository.getAdminDetail('l1');
    expect(result).toMatchObject({ publishedAt: timestamp.toISOString(), slideCount: 2 });
    expect(result?.slides).toMatchObject([
      { type: 'TextText', primaryText: 'Texto', secondaryText: null },
      { type: 'TextImage', mediaAssetId: 'm1', altText: 'Descrição', mediaAsset: { checksum: 'abc' } },
    ]);
  });

  it('maps an unpublished TextCode slide with missing optional text', async () => {
    const repository = new PrismaLevelsRepository({
      level: { findUnique: jest.fn().mockResolvedValue({
        ...level, publishedAt: null,
        slides: [{ ...slide, type: 'TextCode', textText: null, textCode: { code: 'const x = 1;', language: 'javascript' } }],
      }) },
    } as unknown as PrismaService);

    const result = await repository.getAdminDetail('l1');
    expect(result).toMatchObject({ publishedAt: null, slides: [{ type: 'TextCode', text: '', code: 'const x = 1;', language: 'javascript' }] });
  });

  it('preserves the island filter and ascending level order', async () => {
    const findMany = jest.fn().mockResolvedValue([level]);
    const repository = new PrismaLevelsRepository({ level: { findMany } } as unknown as PrismaService);
    await expect(repository.findByIslandId('i1')).resolves.toEqual([level]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { islandId: 'i1' }, orderBy: { position: 'asc' } }));
  });

  it('passes creation, update and deletion through the level port', async () => {
    const create = jest.fn().mockResolvedValue(level);
    const update = jest.fn().mockResolvedValue({ ...level, title: 'Novo título' });
    const remove = jest.fn().mockResolvedValue(level);
    const repository = new PrismaLevelsRepository({ level: { create, update, delete: remove } } as unknown as PrismaService);

    await expect(repository.create({ id: 'l1', islandId: 'i1', title: 'Nível', position: 1, publishedAt: timestamp })).resolves.toMatchObject({ id: 'l1' });
    await expect(repository.update('l1', { title: 'Novo título' })).resolves.toMatchObject({ title: 'Novo título' });
    await repository.delete('l1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ islandId: 'i1', publishedAt: timestamp }) }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'l1' }, data: expect.objectContaining({ title: 'Novo título' }) }));
    expect(remove).toHaveBeenCalledWith({ where: { id: 'l1' } });
  });
});
