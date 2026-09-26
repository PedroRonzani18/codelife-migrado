import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaSlidesRepository } from './prisma-slides.repository';

describe('PrismaSlidesRepository', () => {
  const timestamp = new Date('2026-09-01T00:00:00.000Z');
  const slideBase = {
    id: 's1', levelId: 'l1', title: 'Slide', type: 'TextText', position: 1,
    createdAt: timestamp, updatedAt: timestamp,
    textText: { primaryText: 'Texto', secondaryText: null }, textImage: null, textCode: null,
  };

  it('finds slide by id and maps to domain record', async () => {
    const mockSlide = {
      id: '00000000-0000-4000-8000-000000000701',
      levelId: '00000000-0000-4000-8000-000000000501',
      title: 'Slide 1',
      type: 'TextText',
      position: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      textText: { primaryText: 'Texto', secondaryText: null },
      textImage: null,
      textCode: null,
    };
    const findUnique = jest.fn().mockResolvedValue(mockSlide);
    const repository = new PrismaSlidesRepository({
      slide: { findUnique },
    } as unknown as PrismaService);

    const result = await repository.findById(mockSlide.id);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: mockSlide.id } }));
    expect(result).toMatchObject({
      id: mockSlide.id,
      title: 'Slide 1',
      type: 'TextText',
    });
  });

  it('finds slides by levelId ordered by position', async () => {
    const findMany = jest.fn().mockResolvedValue([slideBase]);
    const repository = new PrismaSlidesRepository({
      slide: { findMany },
    } as unknown as PrismaService);

    const result = await repository.findByLevelId('00000000-0000-4000-8000-000000000501');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { levelId: '00000000-0000-4000-8000-000000000501' },
        orderBy: { position: 'asc' },
      }),
    );
    expect(result).toEqual([slideBase]);
  });

  it('returns null for a slide that no longer exists', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const repository = new PrismaSlidesRepository({ slide: { findUnique } } as unknown as PrismaService);
    await expect(repository.findById('missing')).resolves.toBeNull();
  });

  it.each([
    ['TextText', { textText: { primaryText: 'Texto', secondaryText: null } }, 'textText'],
    ['TextImage', { textImage: { text: 'Imagem', altText: 'Descrição', mediaAssetId: 'm1' } }, 'textImage'],
    ['TextCode', { textCode: { text: 'Código', code: 'const x = 1;', language: 'javascript' } }, 'textCode'],
  ] as const)('creates a %s slide with only its matching content relation', async (type, content, relation) => {
    const create = jest.fn().mockResolvedValue({ ...slideBase, type, ...content });
    const repository = new PrismaSlidesRepository({ slide: { create } } as unknown as PrismaService);

    const result = await repository.create({ id: 's1', levelId: 'l1', title: 'Slide', type, position: 1, ...content });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ [relation]: { create: Object.values(content)[0] } }),
    }));
    expect(result.type).toBe(type);
  });

  it('updates only supplied content and preserves the slide record shape', async () => {
    const update = jest.fn().mockResolvedValue({
      ...slideBase,
      type: 'TextImage', textText: null,
      textImage: { text: 'Novo texto', altText: 'Nova descrição', mediaAssetId: 'm2' },
    });
    const repository = new PrismaSlidesRepository({ slide: { update } } as unknown as PrismaService);

    const result = await repository.update('s1', {
      textImage: { text: 'Novo texto', altText: 'Nova descrição', mediaAssetId: 'm2' },
    });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 's1' },
      data: expect.objectContaining({ textImage: { update: { text: 'Novo texto', altText: 'Nova descrição', mediaAssetId: 'm2' } } }),
    }));
    expect(result.textImage?.mediaAssetId).toBe('m2');
  });

  it('deletes subtype rows before deleting the slide', async () => {
    const operations: string[] = [];
    const relation = (name: string) => ({ deleteMany: jest.fn().mockImplementation(async () => { operations.push(name); }) });
    const repository = new PrismaSlidesRepository({
      textTextSlide: relation('textText'), textImageSlide: relation('textImage'),
      textCodeSlide: relation('textCode'),
      slide: { delete: jest.fn().mockImplementation(async () => { operations.push('slide'); }) },
    } as unknown as PrismaService);

    await repository.delete('s1');
    expect(operations).toEqual(['textText', 'textImage', 'textCode', 'slide']);
  });

  it('deletes all content relations for slides belonging to a level', async () => {
    const deleteMany = jest.fn().mockResolvedValue(undefined);
    const repository = new PrismaSlidesRepository({
      textTextSlide: { deleteMany }, textImageSlide: { deleteMany }, textCodeSlide: { deleteMany },
      slide: { findMany: jest.fn().mockResolvedValue([{ id: 's1' }, { id: 's2' }]), deleteMany },
    } as unknown as PrismaService);

    await repository.deleteByLevelId('l1');
    expect(deleteMany).toHaveBeenCalledTimes(4);
    expect(deleteMany).toHaveBeenCalledWith({ where: { slideId: { in: ['s1', 's2'] } } });
  });

  it('leaves content untouched when the level has no slides', async () => {
    const deleteMany = jest.fn();
    const repository = new PrismaSlidesRepository({
      slide: { findMany: jest.fn().mockResolvedValue([]), deleteMany },
      textTextSlide: { deleteMany }, textImageSlide: { deleteMany }, textCodeSlide: { deleteMany },
    } as unknown as PrismaService);

    await repository.deleteByLevelId('l1');
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it.each([
    ['TextText', { textText: { primaryText: 'Texto', secondaryText: null } }, { type: 'TextText', primaryText: 'Texto', secondaryText: null }],
    ['TextImage', { textText: null, textImage: { text: 'Imagem', altText: 'Descrição', mediaAssetId: 'm1', mediaAsset: { id: 'm1', objectKey: 'key', mimeType: 'image/webp', sizeBytes: 10, width: 2, height: 3, checksum: 'abc' } } }, { type: 'TextImage', text: 'Imagem', mediaAssetId: 'm1', altText: 'Descrição' }],
    ['TextCode', { textText: null, textCode: { text: 'Código', code: 'const x = 1;', language: 'javascript' } }, { type: 'TextCode', code: 'const x = 1;', language: 'javascript' }],
  ] as const)('maps %s administrative detail', async (type, content, expected) => {
    const findUnique = jest.fn().mockResolvedValue({ ...slideBase, type, ...content });
    const repository = new PrismaSlidesRepository({ slide: { findUnique } } as unknown as PrismaService);

    await expect(repository.getAdminDetail('s1')).resolves.toMatchObject(expected);
  });

  it('returns null for a missing administrative slide', async () => {
    const repository = new PrismaSlidesRepository({
      slide: { findUnique: jest.fn().mockResolvedValue(null) },
    } as unknown as PrismaService);
    await expect(repository.getAdminDetail('missing')).resolves.toBeNull();
  });
});
