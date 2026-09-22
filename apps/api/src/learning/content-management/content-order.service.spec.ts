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
  });

  describe('reorderLevels', () => {
    it('throws NotFoundException if island does not exist', async () => {
      (mockRepos.islands.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.reorderLevels('nonexistent', { levelIds: ['l1'] })).rejects.toThrow(NotFoundException);
    });
  });

  describe('reorderSlides', () => {
    it('throws NotFoundException if level does not exist', async () => {
      (mockRepos.levels.findById as jest.Mock).mockResolvedValue(null);
      await expect(service.reorderSlides('nonexistent', { slideIds: ['s1'] })).rejects.toThrow(NotFoundException);
    });
  });
});
