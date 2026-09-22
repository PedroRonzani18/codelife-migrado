import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaSlidesRepository } from './prisma-slides.repository';

describe('PrismaSlidesRepository', () => {
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
    const findMany = jest.fn().mockResolvedValue([]);
    const repository = new PrismaSlidesRepository({
      slide: { findMany },
    } as unknown as PrismaService);

    await repository.findByLevelId('00000000-0000-4000-8000-000000000501');
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { levelId: '00000000-0000-4000-8000-000000000501' },
        orderBy: { position: 'asc' },
      }),
    );
  });
});
