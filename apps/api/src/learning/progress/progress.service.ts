import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { LevelAvailability } from '@codelife/contracts/learning';
import {
  progressSnapshotSchema,
  type ProgressSnapshot,
  type UpdateCurrentSlideInput,
} from '@codelife/contracts/progress';
import {
  PROGRESS_REPOSITORY,
  type JourneyIslandRecord,
  type JourneyLevelProgressRecord,
  type JourneyLevelRecord,
  type ProgressJourneyRecord,
  type ProgressRepositoryPort,
} from './repository/progress.repository.port';

type LocatedLevel = {
  island: JourneyIslandRecord;
  level: JourneyLevelRecord;
  progress: JourneyLevelProgressRecord | null;
  availability: LevelAvailability;
};

function availability(level: JourneyLevelRecord, index: number, island: JourneyIslandRecord): LevelAvailability {
  const progress = island.progress?.levels.find((candidate) => candidate.levelId === level.id);
  if (progress?.completedAt) return 'completed';
  if (progress) return 'in_progress';
  if (index === 0) return 'available';
  const previousProgress = island.progress?.levels.find(
    (candidate) => candidate.levelId === island.levels[index - 1]?.id,
  );
  return previousProgress?.completedAt ? 'available' : 'blocked';
}

function locateLevel(journey: ProgressJourneyRecord, levelId: string): LocatedLevel | null {
  for (const island of journey.islands) {
    const index = island.levels.findIndex((level) => level.id === levelId);
    if (index >= 0) {
      const level = island.levels[index];
      return {
        island,
        level,
        progress: island.progress?.levels.find((candidate) => candidate.levelId === level.id) ?? null,
        availability: availability(level, index, island),
      };
    }
  }
  return null;
}

function buildSnapshot(journey: ProgressJourneyRecord): ProgressSnapshot {
  const visited = journey.islands.flatMap((island) =>
    (island.progress?.levels ?? []).map((levelProgress) => ({ island, levelProgress })),
  );
  const latest = visited.sort(
    (left, right) => right.levelProgress.updatedAt.getTime() - left.levelProgress.updatedAt.getTime(),
  )[0];
  const latestLevel = latest
    ? latest.island.levels.find((level) => level.id === latest.levelProgress.levelId)
    : undefined;

  let nextRecommended: { levelId: string; slideId: string } | null = null;
  for (const island of journey.islands) {
    for (const [index, level] of island.levels.entries()) {
      const state = availability(level, index, island);
      if (state === 'completed') continue;
      if (state === 'blocked') break;
      const levelProgress = island.progress?.levels.find((candidate) => candidate.levelId === level.id);
      const slideId = levelProgress?.currentSlideId ?? level.slides[0]?.id;
      if (slideId) nextRecommended = { levelId: level.id, slideId };
      break;
    }
    if (nextRecommended) break;
  }

  return progressSnapshotSchema.parse({
    lastVisited: latest && latestLevel
      ? {
          islandId: latest.island.id,
          levelId: latestLevel.id,
          slideId: latest.levelProgress.currentSlideId,
        }
      : null,
    nextRecommended,
    islands: journey.islands.map((island) => ({
      id: island.id,
      slug: island.slug,
      title: island.title,
      levelCount: island.levels.length,
      progress: island.progress
        ? {
            currentLevelId: island.progress.currentLevelId,
            startedAt: island.progress.startedAt.toISOString(),
          }
        : null,
      levels: island.levels.map((level, index) => {
        const levelProgress = island.progress?.levels.find((candidate) => candidate.levelId === level.id);
        return {
          id: level.id,
          title: level.title,
          position: level.position,
          availability: availability(level, index, island),
          progress: levelProgress
            ? {
                currentSlideId: levelProgress.currentSlideId,
                startedAt: levelProgress.startedAt.toISOString(),
                completedAt: levelProgress.completedAt?.toISOString() ?? null,
              }
            : null,
        };
      }),
    })),
  });
}

@Injectable()
export class ProgressService {
  constructor(
    @Inject(PROGRESS_REPOSITORY) private readonly repository: ProgressRepositoryPort,
  ) {}

  async snapshot(userId: string): Promise<ProgressSnapshot> {
    return buildSnapshot(await this.requiredJourney(userId));
  }

  async start(userId: string, levelId: string): Promise<ProgressSnapshot> {
    const journey = await this.requiredJourney(userId);
    const located = this.requiredLevel(journey, levelId);
    if (located.availability === 'blocked') this.blockedLevel();
    if (!located.progress) {
      const firstSlide = located.level.slides[0];
      if (!firstSlide) throw new ConflictException('O nível não possui slides');
      await this.repository.startLevel({
        userId,
        islandId: located.island.id,
        levelId: located.level.id,
        firstSlideId: firstSlide.id,
      });
    }
    return this.snapshot(userId);
  }

  async navigate(userId: string, levelId: string, input: UpdateCurrentSlideInput): Promise<ProgressSnapshot> {
    const journey = await this.requiredJourney(userId);
    const located = this.requiredLevel(journey, levelId);
    if (located.availability === 'blocked') this.blockedLevel();
    if (!located.progress || !located.island.progress) this.levelNotStarted();

    const current = located.level.slides.find(
      (slide) => slide.id === located.progress?.currentSlideId,
    );
    const target = located.level.slides.find((slide) => slide.id === input.slideId);
    if (!target) throw new NotFoundException('Slide não encontrado neste nível');
    if (!current) throw new Error('Inconsistent progress: current slide is absent from its level');
    if (!located.progress.completedAt && Math.abs(target.position - current.position) > 1) {
      this.invalidTransition();
    }

    await this.repository.setCurrentSlide({
      islandProgressId: located.island.progress.id,
      levelProgressId: located.progress.id,
      levelId: located.level.id,
      slideId: target.id,
    });
    return this.snapshot(userId);
  }

  async complete(userId: string, levelId: string): Promise<ProgressSnapshot> {
    const journey = await this.requiredJourney(userId);
    const located = this.requiredLevel(journey, levelId);
    if (located.availability === 'blocked') this.blockedLevel();
    if (!located.progress) this.levelNotStarted();
    if (located.progress.completedAt) return buildSnapshot(journey);
    const lastSlide = located.level.slides.at(-1);
    if (!lastSlide || lastSlide.id !== located.progress.currentSlideId) this.notReadyForCompletion();
    const completed = await this.repository.completeLevel({
      levelProgressId: located.progress.id,
      currentSlideId: lastSlide.id,
      completedAt: new Date(),
    });
    if (!completed) this.notReadyForCompletion();
    return this.snapshot(userId);
  }

  private async requiredJourney(userId: string): Promise<ProgressJourneyRecord> {
    const journey = await this.repository.journeyForUser(userId);
    if (journey.islands.length === 0) throw new NotFoundException('Conteúdo experimental não encontrado');
    return journey;
  }

  private requiredLevel(journey: ProgressJourneyRecord, levelId: string): LocatedLevel {
    const located = locateLevel(journey, levelId);
    if (!located) throw new NotFoundException('Nível não encontrado');
    return located;
  }

  private blockedLevel(): never {
    throw new ForbiddenException({ code: 'LEVEL_BLOCKED', message: 'Nível bloqueado' });
  }

  private levelNotStarted(): never {
    throw new ConflictException({ code: 'LEVEL_NOT_STARTED', message: 'O nível ainda não foi iniciado' });
  }

  private invalidTransition(): never {
    throw new ConflictException({
      code: 'INVALID_SLIDE_TRANSITION',
      message: 'A transição de slide solicitada não é válida',
    });
  }

  private notReadyForCompletion(): never {
    throw new ConflictException({
      code: 'LEVEL_NOT_READY_FOR_COMPLETION',
      message: 'O nível ainda não está pronto para conclusão',
    });
  }
}
