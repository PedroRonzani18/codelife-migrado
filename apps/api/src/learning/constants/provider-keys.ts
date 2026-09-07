export const LEARNING_PROVIDER_KEYS = {
  // Ports de persistência e infraestrutura substituível
  ISLANDS_REPOSITORY: 'IIslandsRepository',
  LEVELS_REPOSITORY: 'ILevelsRepository',
  MEDIA_REPOSITORY: 'IMediaRepository',
  PROGRESS_REPOSITORY: 'IProgressRepository',
  OBJECT_STORAGE: 'IObjectStorage',
} as const;

export type LearningProviderKeys =
  (typeof LEARNING_PROVIDER_KEYS)[keyof typeof LEARNING_PROVIDER_KEYS];
