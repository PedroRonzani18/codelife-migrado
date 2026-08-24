export const LEARNING_PROVIDER_KEYS = {
  // Serviços
  ISLANDS_SERVICE: 'IIslandsService',
  LEVELS_SERVICE: 'ILevelsService',
  MEDIA_SERVICE: 'IMediaService',
  PROGRESS_SERVICE: 'IProgressService',

  // Repositórios e infraestrutura
  ISLANDS_REPOSITORY: 'IIslandsRepository',
  LEVELS_REPOSITORY: 'ILevelsRepository',
  MEDIA_REPOSITORY: 'IMediaRepository',
  PROGRESS_REPOSITORY: 'IProgressRepository',
  OBJECT_STORAGE: 'IObjectStorage',
} as const;

export type LearningProviderKeys =
  (typeof LEARNING_PROVIDER_KEYS)[keyof typeof LEARNING_PROVIDER_KEYS];
