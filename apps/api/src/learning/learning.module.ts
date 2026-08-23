import { Module } from '@nestjs/common';
import { LevelsController } from './levels/levels.controller';
import { LEVELS_REPOSITORY } from './levels/repository/levels.repository.port';
import { LevelsService } from './levels/levels.service';
import { PrismaLevelsRepository } from './levels/repository/prisma-levels.repository';
import { LocalObjectStorage } from './media/local-object-storage';
import { OBJECT_STORAGE } from './media/object-storage.port';
import { MediaController } from './media/media.controller';
import { MEDIA_REPOSITORY } from './media/media.repository.port';
import { PrismaMediaRepository } from './media/prisma-media.repository';
import { MediaService } from './media/media.service';
import { PrismaProgressRepository } from './progress/repository/prisma-progress.repository';
import { ProgressController } from './progress/progress.controller';
import { PROGRESS_REPOSITORY } from './progress/repository/progress.repository.port';
import { ProgressService } from './progress/progress.service';
import { IslandsController } from './islands/islands.controller';
import { ISLANDS_REPOSITORY } from './islands/islands.repository.port';
import { IslandsService } from './islands/islands.service';
import { PrismaIslandsRepository } from './islands/prisma-islands.repository';

@Module({
  controllers: [IslandsController, LevelsController, MediaController, ProgressController],
  providers: [
    { provide: ISLANDS_REPOSITORY, useClass: PrismaIslandsRepository },
    { provide: LEVELS_REPOSITORY, useClass: PrismaLevelsRepository },
    { provide: PROGRESS_REPOSITORY, useClass: PrismaProgressRepository },
    { provide: MEDIA_REPOSITORY, useClass: PrismaMediaRepository },
    { provide: OBJECT_STORAGE, useClass: LocalObjectStorage },
    IslandsService,
    LevelsService,
    MediaService,
    ProgressService,
  ],
})
export class LearningModule {}
