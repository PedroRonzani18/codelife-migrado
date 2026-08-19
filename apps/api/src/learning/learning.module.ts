import { Module } from '@nestjs/common';
import { IslandsController } from './islands/islands.controller';
import { ISLANDS_REPOSITORY } from './islands/islands.repository.port';
import { IslandsService } from './islands/islands.service';
import { PrismaIslandsRepository } from './islands/prisma-islands.repository';

@Module({
  controllers: [IslandsController],
  providers: [
    { provide: ISLANDS_REPOSITORY, useClass: PrismaIslandsRepository },
    IslandsService,
  ],
})
export class LearningModule {}
