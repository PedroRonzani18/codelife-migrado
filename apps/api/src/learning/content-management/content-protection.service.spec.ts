import { ConflictException } from '@nestjs/common';
import { ContentProtectionService } from './content-protection.service';
import type { IslandRecord } from '../islands/islands.repository.interface';
import type { LevelRecord } from '../levels/levels.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';

describe('ContentProtectionService', () => {
  let service: ContentProtectionService;
  let progressRepo: jest.Mocked<IProgressRepository>;

  beforeEach(() => {
    service = new ContentProtectionService();
    progressRepo = {
      highestIslandPositionWithProgress: jest.fn(),
      highestLevelPositionWithProgress: jest.fn(),
      hasProgressForLevel: jest.fn(),
      hasProgressForIsland: jest.fn(),
      journeyForUser: jest.fn(),
      startLevel: jest.fn(),
      setCurrentSlide: jest.fn(),
      completeLevel: jest.fn(),
    };
  });

  describe('validateIslandReorder', () => {
    const islands: IslandRecord[] = [
      { id: 'i1', slug: 'i1', title: 'I1', position: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'i2', slug: 'i2', title: 'I2', position: 2, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'i3', slug: 'i3', title: 'I3', position: 3, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ];

    it('allows reordering when no progress exists', async () => {
      progressRepo.highestIslandPositionWithProgress.mockResolvedValue(null);
      await expect(service.validateIslandReorder(islands, ['i3', 'i2', 'i1'], progressRepo)).resolves.toBeUndefined();
    });

    it('throws CONTENT_ORDER_CONFLICT when modifying the protected prefix', async () => {
      progressRepo.highestIslandPositionWithProgress.mockResolvedValue(2); // i1 and i2 are protected
      await expect(service.validateIslandReorder(islands, ['i2', 'i1', 'i3'], progressRepo)).rejects.toThrow(ConflictException);
    });

    it('allows reordering beyond the protected prefix', async () => {
      progressRepo.highestIslandPositionWithProgress.mockResolvedValue(1); // only i1 is protected
      // i1 stays at index 0, i2 and i3 swapped
      await expect(service.validateIslandReorder(islands, ['i1', 'i3', 'i2'], progressRepo)).resolves.toBeUndefined();
    });
  });

  describe('validateLevelReorder', () => {
    const island: IslandRecord = {
      id: 'i1', slug: 'i1', title: 'I1', position: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date(),
    };
    const levels: LevelRecord[] = [
      { id: 'l1', islandId: 'i1', title: 'L1', position: 1, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'l2', islandId: 'i1', title: 'L2', position: 2, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
      { id: 'l3', islandId: 'i1', title: 'L3', position: 3, publishedAt: new Date(), createdAt: new Date(), updatedAt: new Date() },
    ];

    it('freezes all levels if a subsequent island has progress', async () => {
      progressRepo.highestIslandPositionWithProgress.mockResolvedValue(2); // Island 2 has progress, island 1 is position 1
      await expect(service.validateLevelReorder(island, levels, ['l1', 'l3', 'l2'], progressRepo)).rejects.toThrow(ConflictException);
    });

    it('protects levels up to highest level with progress within same island', async () => {
      progressRepo.highestIslandPositionWithProgress.mockResolvedValue(1);
      progressRepo.highestLevelPositionWithProgress.mockResolvedValue(2); // l1, l2 protected

      await expect(service.validateLevelReorder(island, levels, ['l2', 'l1', 'l3'], progressRepo)).rejects.toThrow(ConflictException);
      await expect(service.validateLevelReorder(island, levels, ['l1', 'l2', 'l3'], progressRepo)).resolves.toBeUndefined();
    });
  });

  describe('validateSlideReorder and insertion', () => {
    it('throws when level has progress', async () => {
      progressRepo.hasProgressForLevel.mockResolvedValue(true);
      await expect(service.validateSlideReorder('l1', progressRepo)).rejects.toThrow(ConflictException);
      await expect(service.validateSlideInsertion('l1', progressRepo)).rejects.toThrow(ConflictException);
    });

    it('allows when level has no progress', async () => {
      progressRepo.hasProgressForLevel.mockResolvedValue(false);
      await expect(service.validateSlideReorder('l1', progressRepo)).resolves.toBeUndefined();
      await expect(service.validateSlideInsertion('l1', progressRepo)).resolves.toBeUndefined();
    });
  });
});
