import { Module } from '@nestjs/common';
import { LEARNING_PROVIDER_KEYS } from './constants';
import { IslandsController } from './controller/islands/islands.controller';
import { LevelsController } from './controller/levels/levels.controller';
import { MediaController } from './controller/media/media.controller';
import { ProgressController } from './controller/progress/progress.controller';
import { PrismaIslandsRepository } from './repository/islands/prisma-islands.repository';
import { PrismaLevelsRepository } from './repository/levels/prisma-levels.repository';
import { PrismaMediaRepository } from './repository/media/prisma-media.repository';
import { PrismaProgressRepository } from './repository/progress/prisma-progress.repository';
import { IslandsService } from './service/islands/islands.service';
import { LevelsService } from './service/levels/levels.service';
import { MediaService } from './service/media/media.service';
import { ProgressService } from './service/progress/progress.service';
import { LocalObjectStorage } from './storage/media/local-object-storage';

@Module({
  controllers: [IslandsController, LevelsController, MediaController, ProgressController],
  providers: [
    { provide: LEARNING_PROVIDER_KEYS.ISLANDS_REPOSITORY, useClass: PrismaIslandsRepository },
    { provide: LEARNING_PROVIDER_KEYS.LEVELS_REPOSITORY, useClass: PrismaLevelsRepository },
    { provide: LEARNING_PROVIDER_KEYS.PROGRESS_REPOSITORY, useClass: PrismaProgressRepository },
    { provide: LEARNING_PROVIDER_KEYS.MEDIA_REPOSITORY, useClass: PrismaMediaRepository },
    { provide: LEARNING_PROVIDER_KEYS.OBJECT_STORAGE, useClass: LocalObjectStorage },
    { provide: LEARNING_PROVIDER_KEYS.ISLANDS_SERVICE, useClass: IslandsService },
    { provide: LEARNING_PROVIDER_KEYS.LEVELS_SERVICE, useClass: LevelsService },
    { provide: LEARNING_PROVIDER_KEYS.MEDIA_SERVICE, useClass: MediaService },
    { provide: LEARNING_PROVIDER_KEYS.PROGRESS_SERVICE, useClass: ProgressService },
  ],
})
export class LearningModule {}
