import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminIslandTreeItem,
  AdminLevelTreeItem,
  AdminSlideTreeItem,
  ReorderIslandsInput,
  ReorderLevelsInput,
  ReorderSlidesInput,
} from '@codelife/contracts/content-management';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { IContentTransactionRunner } from './content-transaction-runner.interface';
import { ContentProtectionService } from './content-protection.service';

@Injectable()
export class ContentOrderService {
  private readonly logger = new Logger(ContentOrderService.name);

  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.CONTENT_TRANSACTION_RUNNER)
    private readonly transactionRunner: IContentTransactionRunner,
    private readonly protectionService: ContentProtectionService,
  ) {}

  async reorderIslands(
    input: ReorderIslandsInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminIslandTreeItem[]> {
    return this.transactionRunner.run(async (repos) => {
      const currentIslands = await repos.islands.listAll();

      if (input.islandIds.length !== currentIslands.length) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'A lista de IDs deve conter exatamente todas as ilhas existentes',
        });
      }

      const currentMap = new Map(currentIslands.map((i) => [i.id, i]));
      for (const id of input.islandIds) {
        if (!currentMap.has(id)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `ID de ilha desconhecido na reordenação: ${id}`,
          });
        }
      }

      if (input.expectedUpdatedAts) {
        for (const [id, expectedUpdatedAt] of Object.entries(input.expectedUpdatedAts)) {
          const island = currentMap.get(id);
          if (island && new Date(expectedUpdatedAt).toISOString() !== island.updatedAt.toISOString()) {
            throw new ConflictException({
              code: 'CONTENT_STALE',
              message: 'Ilha foi modificada concorrentemente',
            });
          }
        }
      }

      await this.protectionService.validateIslandReorder(currentIslands, input.islandIds, repos.progress);

      // Phase 1: temporary non-conflicting positions
      for (let i = 0; i < input.islandIds.length; i++) {
        await repos.islands.update(input.islandIds[i], { position: 100000 + i });
      }

      // Phase 2: assign final positions 1..n
      for (let i = 0; i < input.islandIds.length; i++) {
        await repos.islands.update(input.islandIds[i], { position: i + 1 });
      }

      this.logger.log({
        message: 'Ilhas reordenadas com sucesso',
        newOrder: input.islandIds,
        actorId: context?.actorId,
        requestId: context?.requestId,
      });

      return repos.islands.getAdminTree();
    });
  }

  async reorderLevels(
    islandId: string,
    input: ReorderLevelsInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminLevelTreeItem[]> {
    return this.transactionRunner.run(async (repos) => {
      const island = await repos.islands.findById(islandId);
      if (!island) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Ilha não encontrada',
        });
      }

      const currentLevels = await repos.levels.findByIslandId(islandId);
      if (input.levelIds.length !== currentLevels.length) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'A lista de IDs deve conter exatamente todos os níveis da ilha',
        });
      }

      const currentMap = new Map(currentLevels.map((l) => [l.id, l]));
      for (const id of input.levelIds) {
        if (!currentMap.has(id)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `ID de nível desconhecido na reordenação: ${id}`,
          });
        }
      }

      if (input.expectedUpdatedAts) {
        for (const [id, expectedUpdatedAt] of Object.entries(input.expectedUpdatedAts)) {
          const level = currentMap.get(id);
          if (level && new Date(expectedUpdatedAt).toISOString() !== level.updatedAt.toISOString()) {
            throw new ConflictException({
              code: 'CONTENT_STALE',
              message: 'Nível foi modificado concorrentemente',
            });
          }
        }
      }

      await this.protectionService.validateLevelReorder(island, currentLevels, input.levelIds, repos.progress);

      // Phase 1
      for (let i = 0; i < input.levelIds.length; i++) {
        await repos.levels.update(input.levelIds[i], { position: 100000 + i });
      }

      // Phase 2
      for (let i = 0; i < input.levelIds.length; i++) {
        await repos.levels.update(input.levelIds[i], { position: i + 1 });
      }

      this.logger.log({
        message: 'Níveis reordenados com sucesso',
        islandId,
        newOrder: input.levelIds,
        actorId: context?.actorId,
        requestId: context?.requestId,
      });

      const tree = await repos.islands.getAdminTree();
      const updatedIsland = tree.find((i) => i.id === islandId);
      return updatedIsland?.levels ?? [];
    });
  }

  async reorderSlides(
    levelId: string,
    input: ReorderSlidesInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminSlideTreeItem[]> {
    return this.transactionRunner.run(async (repos) => {
      const level = await repos.levels.findById(levelId);
      if (!level) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Nível não encontrado',
        });
      }

      const currentSlides = await repos.slides.findByLevelId(levelId);
      if (input.slideIds.length !== currentSlides.length) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'A lista de IDs deve conter exatamente todos os slides do nível',
        });
      }

      const currentMap = new Map(currentSlides.map((s) => [s.id, s]));
      for (const id of input.slideIds) {
        if (!currentMap.has(id)) {
          throw new BadRequestException({
            code: 'VALIDATION_ERROR',
            message: `ID de slide desconhecido na reordenação: ${id}`,
          });
        }
      }

      if (input.expectedUpdatedAts) {
        for (const [id, expectedUpdatedAt] of Object.entries(input.expectedUpdatedAts)) {
          const slide = currentMap.get(id);
          if (slide && new Date(expectedUpdatedAt).toISOString() !== slide.updatedAt.toISOString()) {
            throw new ConflictException({
              code: 'CONTENT_STALE',
              message: 'Slide foi modificado concorrentemente',
            });
          }
        }
      }

      await this.protectionService.validateSlideReorder(levelId, repos.progress);

      // Phase 1
      for (let i = 0; i < input.slideIds.length; i++) {
        await repos.slides.update(input.slideIds[i], { position: 100000 + i });
      }

      // Phase 2
      for (let i = 0; i < input.slideIds.length; i++) {
        await repos.slides.update(input.slideIds[i], { position: i + 1 });
      }

      this.logger.log({
        message: 'Slides reordenados com sucesso',
        levelId,
        newOrder: input.slideIds,
        actorId: context?.actorId,
        requestId: context?.requestId,
      });

      const updatedSlides = await repos.slides.findByLevelId(levelId);
      return updatedSlides.map((s) => ({
        id: s.id,
        levelId: s.levelId,
        title: s.title,
        position: s.position,
        type: s.type,
        updatedAt: s.updatedAt.toISOString(),
      }));
    });
  }
}
