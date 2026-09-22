import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { fixtureIds } from '../../../prisma/seed';
import { createJourney, createProgress, progressRecordIds } from '../../../test/fixtures/progress.fixture';
import type { IProgressRepository } from './progress.repository.interface';
import { ProgressService } from './progress.service';

describe('ProgressService', () => {
  let repository: jest.Mocked<IProgressRepository>;
  let service: ProgressService;

  beforeEach(() => {
    repository = {
      journeyForUser: jest.fn(),
      startLevel: jest.fn(),
      setCurrentSlide: jest.fn(),
      completeLevel: jest.fn(),
      hasProgressForIsland: jest.fn(),
      hasProgressForLevel: jest.fn(),
      highestIslandPositionWithProgress: jest.fn(),
      highestLevelPositionWithProgress: jest.fn(),
    };
    service = new ProgressService(repository);
  });

  it('builds an empty snapshot without creating progress', async () => {
    repository.journeyForUser.mockResolvedValue(createJourney());
    await expect(service.snapshot(fixtureIds.user)).resolves.toMatchObject({
      lastVisited: null,
      nextRecommended: { levelId: fixtureIds.levels[0], slideId: fixtureIds.slides[0] },
      islands: [{ progress: null, levels: [
        { availability: 'available' },
        { availability: 'blocked' },
        { availability: 'blocked' },
      ] }],
    });
    expect(repository.startLevel).not.toHaveBeenCalled();
  });

  it('returns not found when there is no learning content', async () => {
    repository.journeyForUser.mockResolvedValue({ islands: [] });
    await expect(service.snapshot(fixtureIds.user)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('starts an available level at its first slide and is idempotent', async () => {
    repository.journeyForUser
      .mockResolvedValueOnce(createJourney())
      .mockResolvedValue(createJourney(createProgress([{ levelIndex: 0, slideIndex: 0 }])));
    await expect(service.start(fixtureIds.user, fixtureIds.levels[0])).resolves.toMatchObject({
      lastVisited: { islandId: fixtureIds.island, levelId: fixtureIds.levels[0], slideId: fixtureIds.slides[0] },
    });
    expect(repository.startLevel).toHaveBeenCalledWith({
      userId: fixtureIds.user,
      islandId: fixtureIds.island,
      levelId: fixtureIds.levels[0],
      firstSlideId: fixtureIds.slides[0],
    });

    repository.startLevel.mockClear();
    await service.start(fixtureIds.user, fixtureIds.levels[0]);
    expect(repository.startLevel).not.toHaveBeenCalled();
  });

  it('rejects a blocked or unknown level', async () => {
    repository.journeyForUser.mockResolvedValue(createJourney());
    await expect(service.start(fixtureIds.user, fixtureIds.levels[1])).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.start(fixtureIds.user, fixtureIds.assets[0])).rejects.toBeInstanceOf(NotFoundException);
  });

  it('requires explicit start before navigation', async () => {
    repository.journeyForUser.mockResolvedValue(createJourney());
    await expect(service.navigate(fixtureIds.user, fixtureIds.levels[0], {
      slideId: fixtureIds.slides[0],
    })).rejects.toMatchObject({ response: expect.objectContaining({ code: 'LEVEL_NOT_STARTED' }) });
  });

  it.each([0, 1, 2])('allows navigating to current or adjacent slide %s', async (slideIndex) => {
    repository.journeyForUser
      .mockResolvedValueOnce(createJourney(createProgress([{ levelIndex: 0, slideIndex: 1 }])))
      .mockResolvedValueOnce(createJourney(createProgress([{ levelIndex: 0, slideIndex }])));
    await expect(service.navigate(fixtureIds.user, fixtureIds.levels[0], {
      slideId: fixtureIds.slides[slideIndex],
    })).resolves.toMatchObject({ lastVisited: { slideId: fixtureIds.slides[slideIndex] } });
    expect(repository.setCurrentSlide).toHaveBeenCalledWith({
      islandProgressId: progressRecordIds.island,
      levelProgressId: progressRecordIds.levels[0],
      levelId: fixtureIds.levels[0],
      slideId: fixtureIds.slides[slideIndex],
    });
  });

  it('rejects non-adjacent navigation and a slide outside the level', async () => {
    repository.journeyForUser.mockResolvedValue(createJourney(createProgress([{ levelIndex: 0, slideIndex: 0 }])));
    await expect(service.navigate(fixtureIds.user, fixtureIds.levels[0], {
      slideId: fixtureIds.slides[2],
    })).rejects.toBeInstanceOf(ConflictException);
    await expect(service.navigate(fixtureIds.user, fixtureIds.levels[0], {
      slideId: fixtureIds.slides[3],
    })).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.setCurrentSlide).not.toHaveBeenCalled();
  });

  it('allows revisiting any slide after completion without changing completion', async () => {
    const completedAt = new Date('2026-08-20T12:00:00.000Z');
    repository.journeyForUser
      .mockResolvedValueOnce(createJourney(createProgress([{ levelIndex: 0, slideIndex: 2, completedAt }])))
      .mockResolvedValueOnce(createJourney(createProgress([{ levelIndex: 0, slideIndex: 0, completedAt }])));
    const snapshot = await service.navigate(fixtureIds.user, fixtureIds.levels[0], {
      slideId: fixtureIds.slides[0],
    });
    expect(snapshot.islands[0].levels[0].availability).toBe('completed');
  });

  it('requires the last slide to complete and releases the next level', async () => {
    repository.journeyForUser.mockResolvedValueOnce(createJourney(createProgress([{ levelIndex: 0, slideIndex: 1 }])));
    await expect(service.complete(fixtureIds.user, fixtureIds.levels[0])).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'LEVEL_NOT_READY_FOR_COMPLETION' }),
    });

    const completedAt = new Date('2026-08-20T12:00:00.000Z');
    repository.journeyForUser
      .mockResolvedValueOnce(createJourney(createProgress([{ levelIndex: 0, slideIndex: 2 }])))
      .mockResolvedValueOnce(createJourney(createProgress([{ levelIndex: 0, slideIndex: 2, completedAt }])));
    repository.completeLevel.mockResolvedValue(true);
    await expect(service.complete(fixtureIds.user, fixtureIds.levels[0])).resolves.toMatchObject({
      nextRecommended: { levelId: fixtureIds.levels[1], slideId: fixtureIds.slides[3] },
      islands: [{ levels: [
        { availability: 'completed' },
        { availability: 'available' },
        { availability: 'blocked' },
      ] }],
    });
  });

  it('keeps repeated completion idempotent and reports an atomic completion conflict', async () => {
    const completedAt = new Date('2026-08-20T12:00:00.000Z');
    repository.journeyForUser.mockResolvedValue(createJourney(createProgress([{ levelIndex: 0, slideIndex: 2, completedAt }])));
    await service.complete(fixtureIds.user, fixtureIds.levels[0]);
    expect(repository.completeLevel).not.toHaveBeenCalled();

    repository.journeyForUser.mockResolvedValue(createJourney(createProgress([{ levelIndex: 0, slideIndex: 2 }])));
    repository.completeLevel.mockResolvedValue(false);
    await expect(service.complete(fixtureIds.user, fixtureIds.levels[0])).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'LEVEL_NOT_READY_FOR_COMPLETION' }),
    });
  });

  describe('multi-island sequential availability and catalog', () => {
    const multiIslandJourney = {
      islands: [
        {
          id: '00000000-0000-4000-8000-000000000010',
          slug: 'island-1',
          title: 'Ilha 1',
          position: 1,
          publishedAt: new Date('2026-01-01'),
          levels: [
            {
              id: '00000000-0000-4000-8000-000000000101',
              title: 'L1.1',
              position: 1,
              publishedAt: new Date('2026-01-01'),
              slides: [{ id: '00000000-0000-4000-8000-000000001001', position: 1 }],
            },
            {
              id: '00000000-0000-4000-8000-000000000102',
              title: 'L1.2',
              position: 2,
              publishedAt: new Date('2026-01-01'),
              slides: [{ id: '00000000-0000-4000-8000-000000001002', position: 1 }],
            },
          ],
          progress: null,
        },
        {
          id: '00000000-0000-4000-8000-000000000020',
          slug: 'island-2',
          title: 'Ilha 2',
          position: 2,
          publishedAt: new Date('2026-01-01'),
          levels: [
            {
              id: '00000000-0000-4000-8000-000000000201',
              title: 'L2.1',
              position: 1,
              publishedAt: new Date('2026-01-01'),
              slides: [{ id: '00000000-0000-4000-8000-000000002001', position: 1 }],
            },
          ],
          progress: null,
        },
      ],
    };

    it('returns catalog without creating progress, with sequential availability', async () => {
      repository.journeyForUser.mockResolvedValue(multiIslandJourney);
      const catalog = await service.catalog(fixtureIds.user);

      expect(catalog).toEqual([
        {
          id: '00000000-0000-4000-8000-000000000010',
          slug: 'island-1',
          title: 'Ilha 1',
          position: 1,
          levelCount: 2,
          availability: 'available',
        },
        {
          id: '00000000-0000-4000-8000-000000000020',
          slug: 'island-2',
          title: 'Ilha 2',
          position: 2,
          levelCount: 1,
          availability: 'blocked',
        },
      ]);
      expect(repository.startLevel).not.toHaveBeenCalled();
    });

    it('filters out unpublished islands and draft levels and renumbers contiguously', async () => {
      repository.journeyForUser.mockResolvedValue({
        islands: [
          {
            id: '00000000-0000-4000-8000-000000000010',
            slug: 'island-1',
            title: 'Ilha 1',
            position: 10,
            publishedAt: new Date('2026-01-01'),
            levels: [
              {
                id: '00000000-0000-4000-8000-000000000101',
                title: 'L1.1',
                position: 5,
                publishedAt: new Date('2026-01-01'),
                slides: [{ id: '00000000-0000-4000-8000-000000001001', position: 1 }],
              },
              {
                id: '00000000-0000-4000-8000-000000000102',
                title: 'L1.2 Draft',
                position: 15,
                publishedAt: null,
                slides: [{ id: '00000000-0000-4000-8000-000000001002', position: 1 }],
              },
              {
                id: '00000000-0000-4000-8000-000000000103',
                title: 'L1.3',
                position: 25,
                publishedAt: new Date('2026-01-01'),
                slides: [{ id: '00000000-0000-4000-8000-000000001003', position: 1 }],
              },
            ],
            progress: null,
          },
          {
            id: '00000000-0000-4000-8000-000000000099',
            slug: 'island-draft',
            title: 'Ilha Draft',
            position: 20,
            publishedAt: null,
            levels: [],
            progress: null,
          },
          {
            id: '00000000-0000-4000-8000-000000000020',
            slug: 'island-2',
            title: 'Ilha 2',
            position: 30,
            publishedAt: new Date('2026-01-01'),
            levels: [
              {
                id: '00000000-0000-4000-8000-000000000201',
                title: 'L2.1',
                position: 1,
                publishedAt: new Date('2026-01-01'),
                slides: [{ id: '00000000-0000-4000-8000-000000002001', position: 1 }],
              },
            ],
            progress: null,
          },
        ],
      });

      const catalog = await service.catalog(fixtureIds.user);
      expect(catalog).toEqual([
        {
          id: '00000000-0000-4000-8000-000000000010',
          slug: 'island-1',
          title: 'Ilha 1',
          position: 1,
          levelCount: 2,
          availability: 'available',
        },
        {
          id: '00000000-0000-4000-8000-000000000020',
          slug: 'island-2',
          title: 'Ilha 2',
          position: 2,
          levelCount: 1,
          availability: 'blocked',
        },
      ]);
    });

    it('rejects access to blocked island with ISLAND_BLOCKED', async () => {
      repository.journeyForUser.mockResolvedValue(multiIslandJourney);

      await expect(service.assertIslandAccess(fixtureIds.user, 'island-2')).rejects.toMatchObject({
        response: { code: 'ISLAND_BLOCKED' },
      });
      await expect(
        service.assertLevelAccess(fixtureIds.user, '00000000-0000-4000-8000-000000000201'),
      ).rejects.toMatchObject({
        response: { code: 'ISLAND_BLOCKED' },
      });
      await expect(
        service.start(fixtureIds.user, '00000000-0000-4000-8000-000000000201'),
      ).rejects.toMatchObject({
        response: { code: 'ISLAND_BLOCKED' },
      });
    });

    it('unlocks Island 2 when all levels of Island 1 are completed', async () => {
      const completedJourney = {
        islands: [
          {
            ...multiIslandJourney.islands[0],
            progress: {
              id: 'prog-1',
              currentLevelId: '00000000-0000-4000-8000-000000000102',
              startedAt: new Date('2026-08-01'),
              updatedAt: new Date('2026-08-01'),
              levels: [
                {
                  id: 'lp-1',
                  levelId: '00000000-0000-4000-8000-000000000101',
                  currentSlideId: '00000000-0000-4000-8000-000000001001',
                  startedAt: new Date('2026-08-01'),
                  completedAt: new Date('2026-08-01'),
                  updatedAt: new Date('2026-08-01'),
                },
                {
                  id: 'lp-2',
                  levelId: '00000000-0000-4000-8000-000000000102',
                  currentSlideId: '00000000-0000-4000-8000-000000001002',
                  startedAt: new Date('2026-08-02'),
                  completedAt: new Date('2026-08-02'),
                  updatedAt: new Date('2026-08-02'),
                },
              ],
            },
          },
          multiIslandJourney.islands[1],
        ],
      };

      repository.journeyForUser.mockResolvedValue(completedJourney);
      const catalog = await service.catalog(fixtureIds.user);

      expect(catalog[0].availability).toBe('completed');
      expect(catalog[1].availability).toBe('available');

      // Island 1 completed is revisitable
      const island1 = await service.assertIslandAccess(fixtureIds.user, 'island-1');
      expect(island1.availability).toBe('completed');

      // Island 2 is now accessible
      const island2 = await service.assertIslandAccess(fixtureIds.user, 'island-2');
      expect(island2.availability).toBe('available');
    });
  });
});
