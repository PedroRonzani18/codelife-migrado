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

  const sampleDetailBase = {
    id: 'slide-1',
    levelId: 'level-1',
    title: 'Slide 1',
    position: 1,
    createdAt: '2026-09-01T00:00:00.000Z',
    updatedAt: '2026-09-01T00:00:00.000Z',
  };

  const sampleDetail = {
    ...sampleDetailBase,
    type: 'TextText' as const,
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
    it('rejects creation in a missing level before writing', async () => {
      levelsRepo.findById.mockResolvedValue(null);
      await expect(service.create('missing', { type: 'TextText', title: 'Slide', primaryText: 'Texto' })).rejects.toThrow(NotFoundException);
      expect(slidesRepo.create).not.toHaveBeenCalled();
    });

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

    it('creates a TextImage slide only when its media asset exists', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(false);
      mediaRepo.findById.mockResolvedValue({ id: 'media-1' } as Awaited<ReturnType<IMediaRepository['findById']>>);
      slidesRepo.countByLevelId.mockResolvedValue(1);
      slidesRepo.create.mockResolvedValue({ ...sampleSlide, type: 'TextImage' });
      slidesRepo.getAdminDetail.mockResolvedValue({
        ...sampleDetailBase, type: 'TextImage', text: 'Texto', altText: 'Alt', mediaAssetId: 'media-1',
        mediaAsset: { id: 'media-1', objectKey: 'key', mimeType: 'image/webp', sizeBytes: 10, width: 2, height: 3, checksum: 'abc' },
      });

      const result = await service.create('level-1', {
        type: 'TextImage', title: 'Imagem', text: 'Texto', altText: 'Alt', mediaAssetId: 'media-1',
      });
      expect(slidesRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        position: 2, type: 'TextImage', textImage: { text: 'Texto', altText: 'Alt', mediaAssetId: 'media-1' },
      }));
      expect(result?.type).toBe('TextImage');
    });

    it('persists TextCode content in the matching subtype', async () => {
      levelsRepo.findById.mockResolvedValue(sampleLevel);
      progressRepo.hasProgressForLevel.mockResolvedValue(false);
      slidesRepo.countByLevelId.mockResolvedValue(0);
      slidesRepo.create.mockResolvedValue({ ...sampleSlide, type: 'TextCode' });
      slidesRepo.getAdminDetail.mockResolvedValue({
        ...sampleDetailBase, type: 'TextCode', text: 'Exemplo', code: 'const x = 1;', language: 'javascript',
      });

      await service.create('level-1', {
        type: 'TextCode', title: 'Código', text: 'Exemplo', code: 'const x = 1;', language: 'javascript',
      });
      expect(slidesRepo.create).toHaveBeenCalledWith(expect.objectContaining({
        textCode: { text: 'Exemplo', code: 'const x = 1;', language: 'javascript' },
      }));
    });
  });

  describe('update', () => {
    it('rejects update of a missing or stale slide', async () => {
      slidesRepo.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(sampleSlide);
      const input = { type: 'TextText' as const, title: 'Novo', primaryText: 'Texto', expectedUpdatedAt: '2026-09-01T00:00:00.000Z' };
      await expect(service.update('missing', input)).rejects.toThrow(NotFoundException);
      await expect(service.update('slide-1', { ...input, expectedUpdatedAt: '2026-08-01T00:00:00.000Z' })).rejects.toThrow(ConflictException);
      expect(slidesRepo.update).not.toHaveBeenCalled();
    });

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

    it('updates TextText content when the concurrency timestamp matches', async () => {
      slidesRepo.findById.mockResolvedValue(sampleSlide);
      slidesRepo.getAdminDetail.mockResolvedValue({ ...sampleDetail, primaryText: 'Novo texto' });

      const result = await service.update('slide-1', {
        type: 'TextText', title: 'Novo', primaryText: 'Novo texto', expectedUpdatedAt: sampleSlide.updatedAt.toISOString(),
      });
      expect(slidesRepo.update).toHaveBeenCalledWith('slide-1', expect.objectContaining({
        textText: { primaryText: 'Novo texto', secondaryText: null },
      }));
      expect(result).toMatchObject({ type: 'TextText', primaryText: 'Novo texto' });
    });

    it('rejects a replacement image when its media asset is missing', async () => {
      slidesRepo.findById.mockResolvedValue({ ...sampleSlide, type: 'TextImage' });
      mediaRepo.findById.mockResolvedValue(null);
      await expect(service.update('slide-1', {
        type: 'TextImage', title: 'Imagem', text: 'Texto', altText: 'Alt', mediaAssetId: 'missing',
        expectedUpdatedAt: sampleSlide.updatedAt.toISOString(),
      })).rejects.toThrow(NotFoundException);
      expect(slidesRepo.update).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('rejects deletion when the slide or its parent level is missing', async () => {
      slidesRepo.findById.mockResolvedValueOnce(null).mockResolvedValueOnce(sampleSlide);
      levelsRepo.findById.mockResolvedValue(null);
      await expect(service.delete('missing')).rejects.toThrow(NotFoundException);
      await expect(service.delete('slide-1')).rejects.toThrow(NotFoundException);
      expect(slidesRepo.delete).not.toHaveBeenCalled();
    });
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
