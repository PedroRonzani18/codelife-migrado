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
});
