import { BadRequestException, ConflictException } from '@nestjs/common';
import { AdminIslandsService } from './admin-islands.service';
import type { IIslandsRepository } from './islands.repository.interface';
import type { ILevelsRepository } from '../levels/levels.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';
import type { IContentTransactionRunner, ContentTransactionRepositories } from '../content-management/content-transaction-runner.interface';

describe('AdminIslandsService', () => {
  let service: AdminIslandsService;
  let islandsRepo: jest.Mocked<IIslandsRepository>;
  let levelsRepo: jest.Mocked<ILevelsRepository>;
  let progressRepo: jest.Mocked<IProgressRepository>;
  let transactionRunner: IContentTransactionRunner;
  let mockTxRepos: ContentTransactionRepositories;

  const sampleIsland = {
    id: 'island-1',
    slug: 'ilha-1',
    title: 'Ilha 1',
    position: 1,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  const sampleDetail = {
    id: 'island-1',
    slug: 'ilha-1',
    title: 'Ilha 1',
    position: 1,
    publishedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    levelCount: 0,
    levels: [],
  };

  beforeEach(() => {
    islandsRepo = {
      findById: jest.fn(),
      findBySlug: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      listAll: jest.fn(),
      islandBySlug: jest.fn(),
      getAdminTree: jest.fn(),
      getAdminDetail: jest.fn(),
    };

    levelsRepo = {
      findById: jest.fn(),
      findByIslandId: jest.fn(),
      countByIslandId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      levelById: jest.fn(),
      getAdminDetail: jest.fn(),
    };

    progressRepo = {
      hasProgressForIsland: jest.fn(),
      hasProgressForLevel: jest.fn(),
      highestIslandPositionWithProgress: jest.fn(),
      highestLevelPositionWithProgress: jest.fn(),
      journeyForUser: jest.fn(),
      startLevel: jest.fn(),
      setCurrentSlide: jest.fn(),
      completeLevel: jest.fn(),
    };

    mockTxRepos = {
      islands: islandsRepo,
      levels: levelsRepo,
      slides: {
        deleteByLevelId: jest.fn(),
      } as unknown as ContentTransactionRepositories['slides'],
      media: {} as unknown as ContentTransactionRepositories['media'],
      progress: progressRepo,
    };

    transactionRunner = {
      run: jest.fn().mockImplementation((fn) => fn(mockTxRepos)),
    };

    service = new AdminIslandsService(islandsRepo, levelsRepo, progressRepo, transactionRunner);
  });

  describe('create', () => {
    it('creates island with next sequential position and draft state', async () => {
      islandsRepo.findBySlug.mockResolvedValue(null);
      islandsRepo.count.mockResolvedValue(2);
      islandsRepo.create.mockResolvedValue({ ...sampleIsland, position: 3 });
      islandsRepo.getAdminDetail.mockResolvedValue({ ...sampleDetail, position: 3 });

      const result = await service.create({ title: 'Nova Ilha', slug: 'nova-ilha' });

      expect(islandsRepo.create).toHaveBeenCalledWith({
        title: 'Nova Ilha',
        slug: 'nova-ilha',
        position: 3,
        publishedAt: null,
      });
      expect(result.position).toBe(3);
    });

    it('rejects duplicate slug', async () => {
      islandsRepo.findBySlug.mockResolvedValue(sampleIsland);
      await expect(service.create({ title: 'Nova Ilha', slug: 'ilha-1' })).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('rejects stale expectedUpdatedAt', async () => {
      islandsRepo.findById.mockResolvedValue(sampleIsland);
      await expect(
        service.update('island-1', {
          title: 'Ilha Modificada',
          expectedUpdatedAt: '2026-08-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects changing slug after island has progress', async () => {
      islandsRepo.findById.mockResolvedValue(sampleIsland);
      progressRepo.hasProgressForIsland.mockResolvedValue(true);

      await expect(
        service.update('island-1', {
          slug: 'novo-slug',
          expectedUpdatedAt: '2026-09-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('publish and unpublish', () => {
    it('rejects publishing island without published levels', async () => {
      islandsRepo.findById.mockResolvedValue(sampleIsland);
      levelsRepo.findByIslandId.mockResolvedValue([
        { id: 'l1', islandId: 'island-1', title: 'L1', position: 1, publishedAt: null, createdAt: new Date(), updatedAt: new Date() },
      ]);

      await expect(
        service.publish('island-1', { expectedUpdatedAt: '2026-09-01T00:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('publishes island when at least one level is published', async () => {
      islandsRepo.findById.mockResolvedValue(sampleIsland);
      levelsRepo.findByIslandId.mockResolvedValue([
        { id: 'l1', islandId: 'island-1', title: 'L1', position: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      ]);
      islandsRepo.getAdminDetail.mockResolvedValue({ ...sampleDetail, publishedAt: '2026-09-22T00:00:00.000Z' });

      const result = await service.publish('island-1', { expectedUpdatedAt: '2026-09-01T00:00:00.000Z' });
      expect(islandsRepo.update).toHaveBeenCalledWith('island-1', expect.objectContaining({ publishedAt: expect.any(Date) }));
      expect(result.publishedAt).not.toBeNull();
    });

    it('rejects unpublishing island with user progress', async () => {
      islandsRepo.findById.mockResolvedValue({ ...sampleIsland, publishedAt: new Date() });
      progressRepo.hasProgressForIsland.mockResolvedValue(true);

      await expect(
        service.unpublish('island-1', { expectedUpdatedAt: '2026-09-01T00:00:00.000Z' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('rejects deleting published island', async () => {
      islandsRepo.findById.mockResolvedValue({ ...sampleIsland, publishedAt: new Date() });
      await expect(service.delete('island-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects deleting island with progress', async () => {
      islandsRepo.findById.mockResolvedValue(sampleIsland);
      progressRepo.hasProgressForIsland.mockResolvedValue(true);
      await expect(service.delete('island-1')).rejects.toThrow(ConflictException);
    });

    it('deletes draft island, cascades through children and renumbers remaining', async () => {
      islandsRepo.findById.mockResolvedValue(sampleIsland);
      progressRepo.hasProgressForIsland.mockResolvedValue(false);
      levelsRepo.findByIslandId.mockResolvedValue([]);
      islandsRepo.listAll.mockResolvedValue([
        { id: 'island-2', slug: 'i2', title: 'I2', position: 2, publishedAt: null, createdAt: new Date(), updatedAt: new Date() },
      ]);

      await service.delete('island-1');

      expect(islandsRepo.delete).toHaveBeenCalledWith('island-1');
      expect(islandsRepo.update).toHaveBeenCalledWith('island-2', { position: 100000 });
      expect(islandsRepo.update).toHaveBeenCalledWith('island-2', { position: 1 });
    });
  });
});
