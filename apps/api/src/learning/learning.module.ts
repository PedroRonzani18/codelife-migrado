import { Module } from '@nestjs/common';
import { LEARNING_PROVIDER_KEYS } from './constants';
import { IslandsController } from './islands/islands.controller';
import { IslandsService } from './islands/islands.service';
import { PrismaIslandsRepository } from './islands/prisma-islands.repository';
import { LevelsController } from './levels/levels.controller';
import { LevelsService } from './levels/levels.service';
import { PrismaLevelsRepository } from './levels/prisma-levels.repository';
import { MediaController } from './media/media.controller';
import { MediaService } from './media/media.service';
import { PrismaMediaRepository } from './media/prisma-media.repository';
import { LocalObjectStorage } from './media/local-object-storage';
import { ProgressController } from './progress/progress.controller';
import { ProgressService } from './progress/progress.service';
import { PrismaProgressRepository } from './progress/prisma-progress.repository';

import { PrismaSlidesRepository } from './slides/prisma-slides.repository';
import { PrismaContentTransactionRunner } from './content-management/prisma-content-transaction-runner';

@Module({
  controllers: [IslandsController, LevelsController, MediaController, ProgressController],
  providers: [
    { provide: LEARNING_PROVIDER_KEYS.ISLANDS_REPOSITORY, useClass: PrismaIslandsRepository },
    { provide: LEARNING_PROVIDER_KEYS.LEVELS_REPOSITORY, useClass: PrismaLevelsRepository },
    { provide: LEARNING_PROVIDER_KEYS.SLIDES_REPOSITORY, useClass: PrismaSlidesRepository },
    { provide: LEARNING_PROVIDER_KEYS.PROGRESS_REPOSITORY, useClass: PrismaProgressRepository },
    { provide: LEARNING_PROVIDER_KEYS.MEDIA_REPOSITORY, useClass: PrismaMediaRepository },
    { provide: LEARNING_PROVIDER_KEYS.CONTENT_TRANSACTION_RUNNER, useClass: PrismaContentTransactionRunner },
    { provide: LEARNING_PROVIDER_KEYS.OBJECT_STORAGE, useClass: LocalObjectStorage },
    IslandsService,
    LevelsService,
    MediaService,
    ProgressService,
  ],
})
export class LearningModule {}
