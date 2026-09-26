import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaIslandsRepository } from './prisma-islands.repository';

describe('PrismaIslandsRepository', () => {
  const timestamp = new Date('2026-09-01T00:00:00.000Z');
  const island = {
    id: 'i1', slug: 'ilha', title: 'Ilha', position: 1,
    publishedAt: timestamp, createdAt: timestamp, updatedAt: timestamp,
  };

  it('loads a direct island and its ordered levels', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const repository = new PrismaIslandsRepository({ island: { findUnique } } as unknown as PrismaService);
    await repository.islandBySlug('island-3');
    expect(findUnique).toHaveBeenCalledWith({
      where: { slug: 'island-3' },
      select: { id: true, slug: true, title: true, position: true, publishedAt: true, levels: { orderBy: { position: 'asc' }, select: { id: true, position: true, title: true } } },
    });
  });

  it('maps publication state and slide types in the administrative tree', async () => {
    const findMany = jest.fn().mockResolvedValue([{
      ...island,
      levels: [{
        id: 'l1', islandId: 'i1', title: 'Nível', position: 1,
        publishedAt: null, updatedAt: timestamp,
        slides: [
          { id: 's1', levelId: 'l1', title: 'Texto', position: 1, updatedAt: timestamp, textText: {} },
          { id: 's2', levelId: 'l1', title: 'Imagem', position: 2, updatedAt: timestamp, textText: null, textImage: {} },
          { id: 's3', levelId: 'l1', title: 'Código', position: 3, updatedAt: timestamp, textText: null, textImage: null, textCode: {} },
        ],
      }],
    }]);
    const repository = new PrismaIslandsRepository({ island: { findMany } } as unknown as PrismaService);

    const tree = await repository.getAdminTree();
    expect(tree).toMatchObject([{
      publishedAt: timestamp.toISOString(),
      levels: [{ publishedAt: null, slides: [{ type: 'TextText' }, { type: 'TextImage' }, { type: 'TextCode' }] }],
    }]);
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { position: 'asc' } }));
  });

  it('returns null when an administrative island is absent', async () => {
    const repository = new PrismaIslandsRepository({
      island: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService);
    await expect(repository.getAdminDetail('missing')).resolves.toBeNull();
  });

  it('maps an unpublished island and its level counts', async () => {
    const repository = new PrismaIslandsRepository({
      island: { findUnique: jest.fn().mockResolvedValue({
        ...island, publishedAt: null,
        levels: [{ id: 'l1', islandId: 'i1', title: 'Nível', position: 1, publishedAt: timestamp, createdAt: timestamp, updatedAt: timestamp, _count: { slides: 3 } }],
      }) },
    } as unknown as PrismaService);

    const detail = await repository.getAdminDetail('i1');
    expect(detail).toMatchObject({
      publishedAt: null, levelCount: 1,
      levels: [{ publishedAt: timestamp.toISOString(), slideCount: 3 }],
    });
  });

  it('keeps filters and ordering on the public repository reads', async () => {
    const findUnique = jest.fn().mockResolvedValue(island);
    const findMany = jest.fn().mockResolvedValue([island]);
    const count = jest.fn().mockResolvedValue(1);
    const repository = new PrismaIslandsRepository({ island: { findUnique, findMany, count } } as unknown as PrismaService);

    await expect(repository.findById('i1')).resolves.toEqual(island);
    await expect(repository.findBySlug('ilha')).resolves.toEqual(island);
    await expect(repository.listAll()).resolves.toEqual([island]);
    await expect(repository.count()).resolves.toBe(1);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { slug: 'ilha' } }));
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { position: 'asc' } }));
  });

  it('passes creation, update and deletion through the island port', async () => {
    const create = jest.fn().mockResolvedValue(island);
    const update = jest.fn().mockResolvedValue({ ...island, title: 'Nova ilha' });
    const remove = jest.fn().mockResolvedValue(island);
    const repository = new PrismaIslandsRepository({ island: { create, update, delete: remove } } as unknown as PrismaService);

    await expect(repository.create({ id: 'i1', slug: 'ilha', title: 'Ilha', position: 1, publishedAt: timestamp })).resolves.toMatchObject({ id: 'i1' });
    await expect(repository.update('i1', { title: 'Nova ilha' })).resolves.toMatchObject({ title: 'Nova ilha' });
    await repository.delete('i1');
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ slug: 'ilha', publishedAt: timestamp }) }));
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'i1' }, data: expect.objectContaining({ title: 'Nova ilha' }) }));
    expect(remove).toHaveBeenCalledWith({ where: { id: 'i1' } });
  });
});
