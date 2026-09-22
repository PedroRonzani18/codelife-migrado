import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { AdminSlidesService } from './admin-slides.service';
import { ContentProtectionService } from '../content-management/content-protection.service';
import type { ILevelsRepository } from '../levels/levels.repository.interface';
import type { ISlidesRepository } from './slides.repository.interface';
import type { IMediaRepository } from '../media/media.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';
import type { IContentTransactionRunner, ContentTransactionRepositories } from '../content-management/content-transaction-runner.interface';

describe('AdminSlidesService', () => {
  let service: AdminSlidesService;
  let levelsRepo: jest.Mocked<ILevelsRepository>;
  let slidesRepo: jest.Mocked<ISlidesRepository>;
  let mediaRepo: jest.Mocked<IMediaRepository>;
  let progressRepo: jest.Mocked<IProgressRepository>;
  let protectionService: ContentProtectionService;
  let transactionRunner: IContentTransactionRunner;
  let mockTxRepos: ContentTransactionRepositories;

  const sampleLevel = {
    id: 'level-1',
    islandId: 'island-1',
    title: 'Nível 1',
    position: 1,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const sampleSlide = {
    id: 'slide-1',
    levelId: 'level-1',
    title: 'Slide 1',
    type: 'TextText' as const,
    position: 1,
    createdAt: new Date(),
    updatedAt: new Date('2026-09-01T00:00:00.000Z'),
  };

  const sampleDetail = {
    id: 'slide-1',
    levelId: 'level-1',
    title: 'Slide 1',
    type: 'TextText' as const,
    position: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
    primaryText: 'Texto 1',
    secondaryText: null,
  };

  beforeEach(() => {
    levelsRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ILevelsRepository>;

    slidesRepo = {
      findById: jest.fn(),
      findByLevelId: jest.fn(),
      countByLevelId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      getAdminDetail: jest.fn(),
    } as unknown as jest.Mocked<ISlidesRepository>;

    mediaRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<IMediaRepository>;

    progressRepo = {
      hasProgressForLevel: jest.fn(),
    } as unknown as jest.Mocked<IProgressRepository>;

    mockTxRepos = {
      islands: {} as unknown as ContentTransactionRepositories['islands'],
      levels: levelsRepo,
      slides: slidesRepo,
      media: mediaRepo,
      progress: progressRepo,
    };

    transactionRunner = {
      run: jest.fn().mockImplementation((fn) => fn(mockTxRepos)),
    };

    protectionService = new ContentProtectionService();
    service = new AdminSlidesService(
      levelsRepo,
      slidesRepo,
      mediaRepo,
      progressRepo,
      transactionRunner,
      protectionService,
    );
  });

  describe('create', () => {
    it('creates slide with sequential position and subtype data', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(false);
      slidesRepo.countByLevelId.mockResolvedValue(0);
      slidesRepo.create.mockResolvedValue(sampleSlide);
      slidesRepo.getAdminDetail.mockResolvedValue(sampleDetail);

      const result = await service.create('level-1', {
        type: 'TextText',
        title: 'Slide 1',
        primaryText: 'Texto',
      });

      expect(slidesRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        levelId: 'level-1',
        position: 1,
        type: 'TextText',
      }));
      expect(result.id).toBe('slide-1');
    });

    it('rejects creating slide when level has progress', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(true);

      await expect(
        service.create('level-1', {
          type: 'TextText',
          title: 'Slide 1',
          primaryText: 'Texto',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('rejects TextImage slide if media asset does not exist', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(false);
      mediaRepo.findById.mockResolvedValue(null);

      await expect(
        service.create('level-1', {
          type: 'TextImage',
          title: 'Slide Imagem',
          text: 'Texto',
          mediaAssetId: 'nonexistent-media',
          altText: 'Alt',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('rejects changing slide type', async () => {
      slidesRepo.findById.mockResolvedValue(sampleSlide);

      await expect(
        service.update('slide-1', {
          type: 'TextCode',
          title: 'Novo',
          text: 'Texto',
          code: 'let x = 1;',
          language: 'typescript',
          expectedUpdatedAt: '2026-09-01T00:00:00.000Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('rejects deleting slide of published level', async () => {
      slidesRepo.findById.mockResolvedValue(sampleSlide);
      levelsRepo.findById.mockResolvedValue({ ...sampleLevel, publishedAt: new Date() });

      await expect(service.delete('slide-1')).rejects.toThrow(BadRequestException);
    });

    it('rejects deleting slide if parent level has progress', async () => {
      slidesRepo.findById.mockResolvedValue(sampleSlide);
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(true);

      await expect(service.delete('slide-1')).rejects.toThrow(ConflictException);
    });

    it('deletes draft slide and renumbers remaining', async () => {
      slidesRepo.findById.mockResolvedValue(sampleSlide);
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(false);
      slidesRepo.findByLevelId.mockResolvedValue([
        { ...sampleSlide, id: 'slide-2', position: 2 },
      ]);

      await service.delete('slide-1');

      expect(slidesRepo.delete).toHaveBeenCalledWith('slide-1');
      expect(slidesRepo.update).toHaveBeenCalledWith('slide-2', { position: 100000 });
      expect(slidesRepo.update).toHaveBeenCalledWith('slide-2', { position: 1 });
    });
  });
});
