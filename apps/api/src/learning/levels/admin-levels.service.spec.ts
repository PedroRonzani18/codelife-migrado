import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminLevelsService } from './admin-levels.service';
import { ContentProtectionService } from '../content-management/content-protection.service';
import type { IIslandsRepository } from '../islands/islands.repository.interface';
import type { ILevelsRepository } from './levels.repository.interface';
import type { ISlidesRepository } from '../slides/slides.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';
import type { IContentTransactionRunner, ContentTransactionRepositories } from '../content-management/content-transaction-runner.interface';

describe('AdminLevelsService', () => {
  let service: AdminLevelsService;
  let islandsRepo: jest.Mocked<IIslandsRepository>;
  let levelsRepo: jest.Mocked<ILevelsRepository>;
  let slidesRepo: jest.Mocked<ISlidesRepository>;
  let progressRepo: jest.Mocked<IProgressRepository>;
  let protectionService: ContentProtectionService;
  let transactionRunner: IContentTransactionRunner;
  let mockTxRepos: ContentTransactionRepositories;

  const sampleIsland = {
    id: 'island-1',
    slug: 'ilha-1',
    title: 'Ilha 1',
    position: 1,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleLevel = {
    id: 'level-1',
    islandId: 'island-1',
    title: 'Nível 1',
    position: 1,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  const sampleDetail = {
    id: 'level-1',
    islandId: 'island-1',
    title: 'Nível 1',
    position: 1,
    publishedAt: null,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    slideCount: 0,
    slides: [],
  };

  beforeEach(() => {
    islandsRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IIslandsRepository>;

    levelsRepo = {
      findById: jest.fn(),
      findByIslandId: jest.fn(),
      countByIslandId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAdminDetail: jest.fn(),
    } as unknown as jest.Mocked<ILevelsRepository>;

    slidesRepo = {
      countByLevelId: jest.fn(),
      deleteByLevelId: jest.fn(),
    } as unknown as jest.Mocked<ISlidesRepository>;

    progressRepo = {
      hasProgressForLevel: jest.fn(),
      highestIslandPositionWithProgress: jest.fn(),
      highestLevelPositionWithProgress: jest.fn(),
    } as unknown as jest.Mocked<IProgressRepository>;

    mockTxRepos = {
      islands: islandsRepo,
      levels: levelsRepo,
      slides: slidesRepo,
      media: {} as unknown as ContentTransactionRepositories['media'],
      progress: progressRepo,
    };

    transactionRunner = {
      run: jest.fn().mockImplementation((fn) => fn(mockTxRepos)),
    };

    protectionService = new ContentProtectionService();
    service = new AdminLevelsService(
      islandsRepo,
      levelsRepo,
      slidesRepo,
      progressRepo,
      transactionRunner,
      protectionService,
    );
  });

  describe('create', () => {
    it('creates level with sequential position and draft state', async () => {
      islandsRepo.findById.mockResolvedValue(sampleIsland);
      progressRepo.highestIslandPositionWithProgress.mockResolvedValue(null);
      levelsRepo.countByIslandId.mockResolvedValue(1);
      levelsRepo.create.mockResolvedValue({ ...sampleLevel, position: 2 });
      levelsRepo.getAdminDetail.mockResolvedValue({ ...sampleDetail, position: 2 });

      const result = await service.create('island-1', { title: 'Novo Nível' });

      expect(levelsRepo.create).toHaveBeenCalledWith({
        islandId: 'island-1',
        title: 'Novo Nível',
        position: 2,
        publishedAt: null,
      });
      expect(result.position).toBe(2);
    });

    it('rejects creating level when island does not exist', async () => {
      islandsRepo.findById.mockResolvedValue(null);
      await expect(service.create('nonexistent', { title: 'L' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('publish and unpublish', () => {
    it('rejects publishing level without slides', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      slidesRepo.countByLevelId.mockResolvedValue(0);

      await expect(
        service.publish('level-1', { expectedUpdatedAt: '2026-09-01T00:00:00.000Z' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('publishes level with slides', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      slidesRepo.countByLevelId.mockResolvedValue(1);
      levelsRepo.getAdminDetail.mockResolvedValue({ ...sampleDetail, publishedAt: '2026-09-22T00:00:00.000Z' });

      const result = await service.publish('level-1', { expectedUpdatedAt: '2026-09-01T00:00:00.000Z' });
      expect(levelsRepo.update).toHaveBeenCalledWith('level-1', expect.objectContaining({ publishedAt: expect.any(Date) }));
      expect(result.publishedAt).not.toBeNull();
    });

    it('rejects unpublishing level with progress', async () => {
      levelsRepo.findById.mockResolvedValue({ ...sampleLevel, publishedAt: new Date() });
      progressRepo.hasProgressForLevel.mockResolvedValue(true);

      await expect(
        service.unpublish('level-1', { expectedUpdatedAt: '2026-09-01T00:00:00.000Z' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('delete', () => {
    it('rejects deleting published level', async () => {
      levelsRepo.findById.mockResolvedValue({ ...sampleLevel, publishedAt: new Date() });
      await expect(service.delete('level-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects deleting level with progress', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(true);
      await expect(service.delete('level-1')).rejects.toThrow(ConflictException);
    });

    it('deletes draft level, deletes slides and renumbers remaining', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(false);
      levelsRepo.findByIslandId.mockResolvedValue([
        { id: 'level-2', islandId: 'island-1', title: 'L2', position: 2, publishedAt: null, createdAt: new Date(), updatedAt: new Date() },
      ]);

      await service.delete('level-1');

      expect(slidesRepo.deleteByLevelId).toHaveBeenCalledWith('level-1');
      expect(levelsRepo.delete).toHaveBeenCalledWith('level-1');
      expect(levelsRepo.update).toHaveBeenCalledWith('level-2', { position: 100000 });
      expect(levelsRepo.update).toHaveBeenCalledWith('level-2', { position: 1 });
    });
  });
});
