import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { IslandAvailability, IslandCatalogItem, LevelAvailability } from '@codelife/contracts/learning';
import {
  progressSnapshotSchema,
  type ProgressSnapshot,
  type UpdateCurrentSlideInput,
} from '@codelife/contracts/progress';
import {
  type JourneySlideRecord,
  type JourneyLevelProgressRecord,
  type ProgressJourneyRecord,
  type JourneyIslandProgressRecord,
  type IProgressRepository,
} from './progress.repository.interface';
import { LEARNING_PROVIDER_KEYS } from '../constants';

export interface DerivedLevel {
  id: string;
  title: string;
  position: number;
  availability: LevelAvailability;
  slides: JourneySlideRecord[];
  progress: JourneyLevelProgressRecord | null;
}

export interface DerivedIsland {
  id: string;
  slug: string;
  title: string;
  position: number;
  availability: IslandAvailability;
  levels: DerivedLevel[];
  progress: JourneyIslandProgressRecord | null;
}

export interface DerivedJourney {
  islands: DerivedIsland[];
}

export function deriveJourney(journey: ProgressJourneyRecord): DerivedJourney {
  const publishedIslands = journey.islands.filter((i) => i.publishedAt === undefined || i.publishedAt !== null);
  const derivedIslands: DerivedIsland[] = [];

  for (let islandIndex = 0; islandIndex < publishedIslands.length; islandIndex++) {
    const island = publishedIslands[islandIndex];
    const publishedLevels = island.levels.filter((l) => l.publishedAt === undefined || l.publishedAt !== null);

    const allCompleted =
      publishedLevels.length > 0 &&
      publishedLevels.every((l) => island.progress?.levels.some((p) => p.levelId === l.id && p.completedAt !== null));

    const hasProgress = Boolean(
      island.progress && (island.progress.levels.length > 0 || island.progress.currentLevelId),
    );

    let islandAvailability: IslandAvailability;
    if (allCompleted) {
      islandAvailability = 'completed';
    } else if (hasProgress) {
      islandAvailability = 'in_progress';
    } else if (islandIndex === 0) {
      islandAvailability = 'available';
    } else {
      const prevIslandAvailability = derivedIslands[islandIndex - 1]?.availability;
      if (prevIslandAvailability === 'completed') {
        islandAvailability = 'available';
      } else {
        islandAvailability = 'blocked';
      }
    }

    const derivedLevels: DerivedLevel[] = [];
    for (let levelIndex = 0; levelIndex < publishedLevels.length; levelIndex++) {
      const level = publishedLevels[levelIndex];
      const levelProgress = island.progress?.levels.find((p) => p.levelId === level.id) ?? null;

      let levelAvailability: LevelAvailability;
      if (islandAvailability === 'blocked') {
        levelAvailability = 'blocked';
      } else if (levelProgress?.completedAt) {
        levelAvailability = 'completed';
      } else if (levelProgress) {
        levelAvailability = 'in_progress';
      } else if (levelIndex === 0) {
        levelAvailability = 'available';
      } else {
        const prevLevelProgress = island.progress?.levels.find(
          (p) => p.levelId === publishedLevels[levelIndex - 1]?.id,
        );
        if (prevLevelProgress?.completedAt) {
          levelAvailability = 'available';
        } else {
          levelAvailability = 'blocked';
        }
      }

      derivedLevels.push({
        id: level.id,
        title: level.title,
        position: levelIndex + 1,
        availability: levelAvailability,
        slides: level.slides,
        progress: levelProgress,
      });
    }

    derivedIslands.push({
      id: island.id,
      slug: island.slug,
      title: island.title,
      position: islandIndex + 1,
      availability: islandAvailability,
      levels: derivedLevels,
      progress: island.progress,
    });
  }

  return { islands: derivedIslands };
}

function buildSnapshot(derived: DerivedJourney): ProgressSnapshot {
  const visited = derived.islands.flatMap((island) =>
    (island.progress?.levels ?? [])
      .filter((lp) => island.levels.some((lvl) => lvl.id === lp.levelId))
      .map((levelProgress) => ({ island, levelProgress })),
  );
  const latest = visited.sort(
    (left, right) => right.levelProgress.updatedAt.getTime() - left.levelProgress.updatedAt.getTime(),
  )[0];
  const latestLevel = latest
    ? latest.island.levels.find((level) => level.id === latest.levelProgress.levelId)
    : undefined;

  let nextRecommended: { levelId: string; slideId: string } | null = null;
  for (const island of derived.islands) {
    if (island.availability === 'blocked') break;
    if (island.availability === 'completed') continue;
    for (const level of island.levels) {
      if (level.availability === 'completed') continue;
      if (level.availability === 'blocked') break;
      const slideId = level.progress?.currentSlideId ?? level.slides[0]?.id;
      if (slideId) {
        nextRecommended = { levelId: level.id, slideId };
        break;
      }
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
    islands: derived.islands.map((island) => ({
      id: island.id,
      slug: island.slug,
      title: island.title,
      levelCount: island.levels.length,
      progress: island.progress
        ? {
            currentLevelId: island.levels.some((lvl) => lvl.id === island.progress!.currentLevelId)
              ? island.progress.currentLevelId
              : null,
            startedAt: island.progress.startedAt.toISOString(),
          }
        : null,
      levels: island.levels.map((level) => ({
        id: level.id,
        title: level.title,
        position: level.position,
        availability: level.availability,
        progress: level.progress
          ? {
              currentSlideId: level.progress.currentSlideId,
              startedAt: level.progress.startedAt.toISOString(),
              completedAt: level.progress.completedAt?.toISOString() ?? null,
            }
          : null,
      })),
    })),
  });
}

@Injectable()
export class ProgressService {
  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.PROGRESS_REPOSITORY) private readonly repository: IProgressRepository,
  ) {}

  async catalog(userId: string): Promise<IslandCatalogItem[]> {
    const journey = await this.requiredJourney(userId);
    const derived = deriveJourney(journey);
    return derived.islands.map((island) => ({
      id: island.id,
      slug: island.slug,
      title: island.title,
      position: island.position,
      levelCount: island.levels.length,
      availability: island.availability,
    }));
  }

  async snapshot(userId: string): Promise<ProgressSnapshot> {
    const journey = await this.requiredJourney(userId);
    const derived = deriveJourney(journey);
    return buildSnapshot(derived);
  }

  async assertIslandAccess(userId: string, slug: string): Promise<DerivedIsland> {
    const journey = await this.requiredJourney(userId);
    const derived = deriveJourney(journey);
    const island = derived.islands.find((candidate) => candidate.slug === slug);
    if (!island) throw new NotFoundException(`Ilha ${slug} não encontrada`);
    if (island.availability === 'blocked') {
      this.blockedIsland();
    }
    return island;
  }

  async assertLevelAccess(userId: string, levelId: string): Promise<{ island: DerivedIsland; level: DerivedLevel }> {
    const journey = await this.requiredJourney(userId);
    const derived = deriveJourney(journey);
    for (const island of derived.islands) {
      const level = island.levels.find((candidate) => candidate.id === levelId);
      if (level) {
        if (island.availability === 'blocked') {
          this.blockedIsland();
        }
        if (level.availability === 'blocked') {
          this.blockedLevel();
        }
        return { island, level };
      }
    }
    throw new NotFoundException('Nível não encontrado');
  }

  async start(userId: string, levelId: string): Promise<ProgressSnapshot> {
    const journey = await this.requiredJourney(userId);
    const derived = deriveJourney(journey);
    const located = this.locateLevelInDerived(derived, levelId);
    if (located.island.availability === 'blocked') this.blockedIsland();
    if (located.level.availability === 'blocked') this.blockedLevel();
    if (!located.level.progress) {
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
    const derived = deriveJourney(journey);
    const located = this.locateLevelInDerived(derived, levelId);
    if (located.island.availability === 'blocked') this.blockedIsland();
    if (located.level.availability === 'blocked') this.blockedLevel();
    if (!located.level.progress || !located.island.progress) this.levelNotStarted();

    const current = located.level.slides.find(
      (slide) => slide.id === located.level.progress?.currentSlideId,
    );
    const target = located.level.slides.find((slide) => slide.id === input.slideId);
    if (!target) throw new NotFoundException('Slide não encontrado neste nível');
    if (!current) throw new Error('Inconsistent progress: current slide is absent from its level');
    if (!located.level.progress.completedAt && Math.abs(target.position - current.position) > 1) {
      this.invalidTransition();
    }

    await this.repository.setCurrentSlide({
      islandProgressId: located.island.progress.id,
      levelProgressId: located.level.progress.id,
      levelId: located.level.id,
      slideId: target.id,
    });
    return this.snapshot(userId);
  }

  async complete(userId: string, levelId: string): Promise<ProgressSnapshot> {
    const journey = await this.requiredJourney(userId);
    const derived = deriveJourney(journey);
    const located = this.locateLevelInDerived(derived, levelId);
    if (located.island.availability === 'blocked') this.blockedIsland();
    if (located.level.availability === 'blocked') this.blockedLevel();
    if (!located.level.progress) this.levelNotStarted();
    if (located.level.progress.completedAt) return buildSnapshot(derived);
    const lastSlide = located.level.slides.at(-1);
    if (!lastSlide || lastSlide.id !== located.level.progress.currentSlideId) this.notReadyForCompletion();
    const completed = await this.repository.completeLevel({
      levelProgressId: located.level.progress.id,
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

  private locateLevelInDerived(derived: DerivedJourney, levelId: string): { island: DerivedIsland; level: DerivedLevel } {
    for (const island of derived.islands) {
      const level = island.levels.find((candidate) => candidate.id === levelId);
      if (level) return { island, level };
    }
    throw new NotFoundException('Nível não encontrado');
  }

  private blockedIsland(): never {
    throw new ForbiddenException({ code: 'ISLAND_BLOCKED', message: 'Ilha bloqueada' });
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
