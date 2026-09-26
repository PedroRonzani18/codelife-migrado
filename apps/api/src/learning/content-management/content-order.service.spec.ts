import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ContentOrderService } from './content-order.service';
import { ContentProtectionService } from './content-protection.service';
import type { IContentTransactionRunner, ContentTransactionRepositories } from './content-transaction-runner.interface';

describe('ContentOrderService', () => {
  let service: ContentOrderService;
  let transactionRunner: IContentTransactionRunner;
  let protectionService: ContentProtectionService;
  let mockRepos: ContentTransactionRepositories;

  beforeEach(() => {
    mockRepos = {
      islands: {
        listAll: jest.fn(),
        update: jest.fn(),
        getAdminTree: jest.fn(),
        findById: jest.fn(),
        findBySlug: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        islandBySlug: jest.fn(),
        getAdminDetail: jest.fn(),
      },
      levels: {
        findById: jest.fn(),
        findByIslandId: jest.fn(),
        update: jest.fn(),
        countByIslandId: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        levelById: jest.fn(),
        getAdminDetail: jest.fn(),
      },
      slides: {
        findById: jest.fn(),
        findByLevelId: jest.fn(),
        update: jest.fn(),
        countByLevelId: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
        deleteByLevelId: jest.fn(),
        getAdminDetail: jest.fn(),
      },
      media: {
        findById: jest.fn(),
        mediaAssetById: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      progress: {
        highestIslandPositionWithProgress: jest.fn(),
        highestLevelPositionWithProgress: jest.fn(),
        hasProgressForIsland: jest.fn(),
        hasProgressForLevel: jest.fn(),
        journeyForUser: jest.fn(),
        startLevel: jest.fn(),
        setCurrentSlide: jest.fn(),
        completeLevel: jest.fn(),
      },
    };

    transactionRunner = {
      run: jest.fn().mockImplementation((fn) => fn(mockRepos)),
    };
    (mockRepos.progress.highestIslandPositionWithProgress as jest.Mock).mockResolvedValue(null);
    (mockRepos.progress.highestLevelPositionWithProgress as jest.Mock).mockResolvedValue(null);
    (mockRepos.progress.hasProgressForLevel as jest.Mock).mockResolvedValue(false);
    protectionService = new ContentProtectionService();
    service = new ContentOrderService(transactionRunner, protectionService);
  });

  describe('reorderIslands', () => {
    it('executes two-phase renumbering when order is valid', async () => {
      const current = [
        { id: 'i1', slug: 'i1', title: 'I1', position: 1, publishedAt: null, createdAt: new Date(), updatedAt: new Date('2026-09-01T00:00:00.000Z') },
        { id: 'i2', slug: 'i2', title: 'I2', position: 2, publishedAt: null, createdAt: new Date(), updatedAt: new Date('2026-09-01T00:00:00.000Z') },
      ];
      (mockRepos.islands.listAll as jest.Mock).mockResolvedValue(current);
      (mockRepos.islands.getAdminTree as jest.Mock).mockResolvedValue([{ id: 'i2' }, { id: 'i1' }]);

      const result = await service.reorderIslands({ islandIds: ['i2', 'i1'] });

      expect(mockRepos.islands.update).toHaveBeenCalledWith('i2', { position: 100000 });
      expect(mockRepos.islands.update).toHaveBeenCalledWith('i1', { position: 100001 });
      expect(mockRepos.islands.update).toHaveBeenCalledWith('i2', { position: 1 });
      expect(mockRepos.islands.update).toHaveBeenCalledWith('i1', { position: 2 });
      expect(result).toHaveLength(2);
    });

    it('throws VALIDATION_ERROR on missing or extra IDs', async () => {
      (mockRepos.islands.listAll as jest.Mock).mockResolvedValue([
        { id: 'i1', slug: 'i1', title: 'I1', position: 1, publishedAt: null, createdAt: new Date(), updatedAt: new Date() },
      ]);

      await expect(service.reorderIslands({ islandIds: ['i1', 'i2'] })).rejects.toThrow(BadRequestException);
    });

    it('throws CONTENT_STALE when expectedUpdatedAts diverged', async () => {
      (mockRepos.islands.listAll as jest.Mock).mockResolvedValue([
        { id: 'i1', slug: 'i1', title: 'I1', position: 1, publishedAt: null, createdAt: new Date(), updatedAt: new Date('2026-09-02T00:00:00.000Z') },
      ]);

      await expect(
        service.reorderIslands({
          islandIds: ['i1'],
          expectedUpdatedAts: { i1: '2026-09-01T00:00:00.000Z' },
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects an unknown island even when the list length matches', async () => {
      (mockRepos.islands.listAll as jest.Mock).mockResolvedValue([
        { id: 'i1', position: 1, updatedAt: new Date() },
      ]);

      await expect(service.reorderIslands({ islandIds: ['unknown'] })).rejects.toThrow(BadRequestException);
      expect(mockRepos.islands.update).not.toHaveBeenCalled();
    });

    it('accepts a matching concurrency timestamp', async () => {
      const updatedAt = new Date('2026-09-01T00:00:00.000Z');
      (mockRepos.islands.listAll as jest.Mock).mockResolvedValue([{ id: 'i1', position: 1, updatedAt }]);
      (mockRepos.islands.getAdminTree as jest.Mock).mockResolvedValue([{ id: 'i1' }]);

      await expect(service.reorderIslands({
        islandIds: ['i1'],
        expectedUpdatedAts: { i1: updatedAt.toISOString() },
      })).resolves.toEqual([{ id: 'i1' }]);
    });
  });

  describe('reorderLevels', () => {
    it('throws NotFoundException if island does not exist', async () => {
      (mockRepos.islands.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.reorderLevels('nonexistent', { levelIds: ['l1'] })).rejects.toThrow(NotFoundException);
    });

    it('reorders levels in two phases and returns the updated island levels', async () => {
      const updatedAt = new Date('2026-09-01T00:00:00.000Z');
      (mockRepos.islands.findById as jest.Mock).mockResolvedValue({ id: 'i1', position: 1 });
      (mockRepos.levels.findByIslandId as jest.Mock).mockResolvedValue([
        { id: 'l1', position: 1, updatedAt },
        { id: 'l2', position: 2, updatedAt },
      ]);
      (mockRepos.islands.getAdminTree as jest.Mock).mockResolvedValue([
        { id: 'i1', levels: [{ id: 'l2' }, { id: 'l1' }] },
      ]);

      const result = await service.reorderLevels('i1', {
        levelIds: ['l2', 'l1'],
        expectedUpdatedAts: { l1: updatedAt.toISOString(), l2: updatedAt.toISOString() },
      });

      expect(result.map((level) => level.id)).toEqual(['l2', 'l1']);
      expect(mockRepos.levels.update).toHaveBeenNthCalledWith(1, 'l2', { position: 100000 });
      expect(mockRepos.levels.update).toHaveBeenNthCalledWith(2, 'l1', { position: 100001 });
      expect(mockRepos.levels.update).toHaveBeenNthCalledWith(3, 'l2', { position: 1 });
      expect(mockRepos.levels.update).toHaveBeenNthCalledWith(4, 'l1', { position: 2 });
    });

    it('rejects incomplete, unknown and stale level orders before updating', async () => {
      const updatedAt = new Date('2026-09-02T00:00:00.000Z');
      (mockRepos.islands.findById as jest.Mock).mockResolvedValue({ id: 'i1', position: 1 });
      (mockRepos.levels.findByIslandId as jest.Mock).mockResolvedValue([{ id: 'l1', position: 1, updatedAt }]);

      await expect(service.reorderLevels('i1', { levelIds: [] })).rejects.toThrow(BadRequestException);
      await expect(service.reorderLevels('i1', { levelIds: ['unknown'] })).rejects.toThrow(BadRequestException);
      await expect(service.reorderLevels('i1', {
        levelIds: ['l1'],
        expectedUpdatedAts: { l1: '2026-09-01T00:00:00.000Z' },
      })).rejects.toThrow(ConflictException);
      expect(mockRepos.levels.update).not.toHaveBeenCalled();
    });
  });

  describe('reorderSlides', () => {
    it('throws NotFoundException if level does not exist', async () => {
      (mockRepos.levels.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.reorderSlides('nonexistent', { slideIds: ['s1'] })).rejects.toThrow(NotFoundException);
    });

    it('reorders slides and returns their public summaries', async () => {
      const updatedAt = new Date('2026-09-01T00:00:00.000Z');
      (mockRepos.levels.findById as jest.Mock).mockResolvedValue({ id: 'l1' });
      (mockRepos.slides.findByLevelId as jest.Mock)
        .mockResolvedValueOnce([
          { id: 's1', position: 1, updatedAt },
          { id: 's2', position: 2, updatedAt },
        ])
        .mockResolvedValueOnce([
          { id: 's2', levelId: 'l1', title: 'Segundo', position: 1, type: 'TextCode', updatedAt },
          { id: 's1', levelId: 'l1', title: 'Primeiro', position: 2, type: 'TextText', updatedAt },
        ]);

      const result = await service.reorderSlides('l1', {
        slideIds: ['s2', 's1'],
        expectedUpdatedAts: { s1: updatedAt.toISOString(), s2: updatedAt.toISOString() },
      });

      expect(result).toEqual([
        { id: 's2', levelId: 'l1', title: 'Segundo', position: 1, type: 'TextCode', updatedAt: updatedAt.toISOString() },
        { id: 's1', levelId: 'l1', title: 'Primeiro', position: 2, type: 'TextText', updatedAt: updatedAt.toISOString() },
      ]);
      expect(mockRepos.slides.update).toHaveBeenCalledTimes(4);
    });

    it('rejects incomplete, unknown and stale slide orders before updating', async () => {
      const updatedAt = new Date('2026-09-02T00:00:00.000Z');
      (mockRepos.levels.findById as jest.Mock).mockResolvedValue({ id: 'l1' });
      (mockRepos.slides.findByLevelId as jest.Mock).mockResolvedValue([{ id: 's1', position: 1, updatedAt }]);

      await expect(service.reorderSlides('l1', { slideIds: [] })).rejects.toThrow(BadRequestException);
      await expect(service.reorderSlides('l1', { slideIds: ['unknown'] })).rejects.toThrow(BadRequestException);
      await expect(service.reorderSlides('l1', {
        slideIds: ['s1'],
        expectedUpdatedAts: { s1: '2026-09-01T00:00:00.000Z' },
      })).rejects.toThrow(ConflictException);
      expect(mockRepos.slides.update).not.toHaveBeenCalled();
    });
  });
});
