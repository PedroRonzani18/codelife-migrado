export const PROGRESS_REPOSITORY = Symbol('PROGRESS_REPOSITORY');

export interface JourneySlideRecord {
  id: string;
  position: number;
}

export interface JourneyLevelProgressRecord {
  id: string;
  levelId: string;
  currentSlideId: string;
  startedAt: Date;
  completedAt: Date | null;
  updatedAt: Date;
}

export interface JourneyLevelRecord {
  id: string;
  title: string;
  position: number;
  slides: JourneySlideRecord[];
}

export interface JourneyIslandProgressRecord {
  id: string;
  currentLevelId: string;
  startedAt: Date;
  updatedAt: Date;
  levels: JourneyLevelProgressRecord[];
}

export interface JourneyIslandRecord {
  id: string;
  slug: string;
  title: string;
  levels: JourneyLevelRecord[];
  progress: JourneyIslandProgressRecord | null;
}

export interface ProgressJourneyRecord {
  islands: JourneyIslandRecord[];
}

export interface StartLevelProgressInput {
  userId: string;
  islandId: string;
  levelId: string;
  firstSlideId: string;
}

export interface SetCurrentSlideInput {
  islandProgressId: string;
  levelProgressId: string;
  levelId: string;
  slideId: string;
}

export interface CompleteLevelProgressInput {
  levelProgressId: string;
  currentSlideId: string;
  completedAt: Date;
}

export interface ProgressRepositoryPort {
  journeyForUser(userId: string): Promise<ProgressJourneyRecord>;
  startLevel(input: StartLevelProgressInput): Promise<void>;
  setCurrentSlide(input: SetCurrentSlideInput): Promise<void>;
  completeLevel(input: CompleteLevelProgressInput): Promise<boolean>;
}
