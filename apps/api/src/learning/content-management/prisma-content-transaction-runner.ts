import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { PrismaIslandsRepository } from '../islands/prisma-islands.repository';
import { PrismaLevelsRepository } from '../levels/prisma-levels.repository';
import { PrismaSlidesRepository } from '../slides/prisma-slides.repository';
import { PrismaMediaRepository } from '../media/prisma-media.repository';
import { PrismaProgressRepository } from '../progress/prisma-progress.repository';
import type {
  ContentTransactionRepositories,
  IContentTransactionRunner,
} from './content-transaction-runner.interface';

@Injectable()
export class PrismaContentTransactionRunner implements IContentTransactionRunner {
  constructor(private readonly prisma: PrismaService) {}

  run<T>(operation: (repositories: ContentTransactionRepositories) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => {
      const repositories: ContentTransactionRepositories = {
        islands: new PrismaIslandsRepository(tx),
        levels: new PrismaLevelsRepository(tx),
        slides: new PrismaSlidesRepository(tx),
        media: new PrismaMediaRepository(tx),
        progress: new PrismaProgressRepository(tx as unknown as PrismaService),
      };
      return operation(repositories);
    });
  }
}
