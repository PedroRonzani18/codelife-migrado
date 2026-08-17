import { Module } from '@nestjs/common';
import { LearningController } from './learning.controller';
import { LearningRepository } from './learning.repository';
import { LearningService } from './learning.service';
@Module({ controllers: [LearningController], providers: [LearningRepository, LearningService] })
export class LearningModule {}
