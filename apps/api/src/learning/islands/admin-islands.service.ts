import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminIslandDetail,
  CreateIslandInput,
  PublishContentInput,
  UnpublishContentInput,
  UpdateIslandInput,
} from '@codelife/contracts/content-management';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { IIslandsRepository } from './islands.repository.interface';
import type { ILevelsRepository } from '../levels/levels.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';
import type { IContentTransactionRunner } from '../content-management/content-transaction-runner.interface';

@Injectable()
export class AdminIslandsService {
  private readonly logger = new Logger(AdminIslandsService.name);

  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.ISLANDS_REPOSITORY)
    private readonly islandsRepo: IIslandsRepository,
    @Inject(LEARNING_PROVIDER_KEYS.LEVELS_REPOSITORY)
    private readonly levelsRepo: ILevelsRepository,
    @Inject(LEARNING_PROVIDER_KEYS.PROGRESS_REPOSITORY)
    private readonly progressRepo: IProgressRepository,
    @Inject(LEARNING_PROVIDER_KEYS.CONTENT_TRANSACTION_RUNNER)
    private readonly transactionRunner: IContentTransactionRunner,
  ) {}

  async getDetail(id: string): Promise<AdminIslandDetail> {
    const detail = await this.islandsRepo.getAdminDetail(id);
    if (!detail) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Ilha não encontrada',
      });
    }
    return detail;
  }

  async create(
    input: CreateIslandInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminIslandDetail> {
    const existing = await this.islandsRepo.findBySlug(input.slug);
    if (existing) {
      throw new ConflictException({
        code: 'UNIQUE_CONFLICT',
        message: 'Slug já está em uso',
      });
    }

    const count = await this.islandsRepo.count();
    const position = count + 1;

    const created = await this.islandsRepo.create({
      title: input.title,
      slug: input.slug,
      position,
      publishedAt: null,
    });

    this.logger.log({
      message: 'Ilha criada com sucesso',
      islandId: created.id,
      slug: created.slug,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.islandsRepo.getAdminDetail(created.id))!;
  }

  async update(
    id: string,
    input: UpdateIslandInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminIslandDetail> {
    const island = await this.islandsRepo.findById(id);
    if (!island) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Ilha não encontrada',
      });
    }

    if (new Date(input.expectedUpdatedAt).toISOString() !== island.updatedAt.toISOString()) {
      throw new ConflictException({
        code: 'CONTENT_STALE',
        message: 'Ilha foi modificada concorrentemente',
      });
    }

    if (input.slug && input.slug !== island.slug) {
      const hasProgress = await this.progressRepo.hasProgressForIsland(id);
      if (island.publishedAt !== null || hasProgress) {
        throw new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Slug não pode ser alterado após a publicação ou início de progresso',
        });
      }

      const existing = await this.islandsRepo.findBySlug(input.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException({
          code: 'UNIQUE_CONFLICT',
          message: 'Slug já está em uso',
        });
      }
    }

    await this.islandsRepo.update(id, {
      title: input.title,
      slug: input.slug,
    });

    this.logger.log({
      message: 'Ilha atualizada com sucesso',
      islandId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.islandsRepo.getAdminDetail(id))!;
  }

  async publish(
    id: string,
    input: PublishContentInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminIslandDetail> {
    const island = await this.islandsRepo.findById(id);
    if (!island) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Ilha não encontrada',
      });
    }

    if (input.expectedUpdatedAt && new Date(input.expectedUpdatedAt).toISOString() !== island.updatedAt.toISOString()) {
      throw new ConflictException({
        code: 'CONTENT_STALE',
        message: 'Ilha foi modificada concorrentemente',
      });
    }

    const levels = await this.levelsRepo.findByIslandId(id);
    const hasPublishedLevel = levels.some((level) => level.publishedAt !== null);
    if (!hasPublishedLevel) {
      throw new BadRequestException({
        code: 'CONTENT_NOT_PUBLISHABLE',
        message: 'Ilha precisa ter pelo menos um nível publicado para ser publicada',
      });
    }

    await this.islandsRepo.update(id, { publishedAt: new Date() });

    this.logger.log({
      message: 'Ilha publicada com sucesso',
      islandId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.islandsRepo.getAdminDetail(id))!;
  }

  async unpublish(
    id: string,
    input: UnpublishContentInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminIslandDetail> {
    const island = await this.islandsRepo.findById(id);
    if (!island) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Ilha não encontrada',
      });
    }

    if (input.expectedUpdatedAt && new Date(input.expectedUpdatedAt).toISOString() !== island.updatedAt.toISOString()) {
      throw new ConflictException({
        code: 'CONTENT_STALE',
        message: 'Ilha foi modificada concorrentemente',
      });
    }

    const hasProgress = await this.progressRepo.hasProgressForIsland(id);
    if (hasProgress) {
      throw new ConflictException({
        code: 'CONTENT_HAS_PROGRESS',
        message: 'Ilha com progresso de estudantes não pode ser despublicada',
      });
    }

    await this.islandsRepo.update(id, { publishedAt: null });

    this.logger.log({
      message: 'Ilha despublicada com sucesso',
      islandId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.islandsRepo.getAdminDetail(id))!;
  }

  async delete(
    id: string,
    context?: { actorId?: string; requestId?: string },
  ): Promise<void> {
    const island = await this.islandsRepo.findById(id);
    if (!island) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Ilha não encontrada',
      });
    }

    if (island.publishedAt !== null) {
      throw new BadRequestException({
        code: 'CONTENT_NOT_DRAFT',
        message: 'Apenas ilhas em rascunho podem ser excluídas',
      });
    }

    const hasProgress = await this.progressRepo.hasProgressForIsland(id);
    if (hasProgress) {
      throw new ConflictException({
        code: 'CONTENT_HAS_PROGRESS',
        message: 'Ilha com progresso não pode ser excluída',
      });
    }

    const levels = await this.levelsRepo.findByIslandId(id);
    if (levels.some((level) => level.publishedAt !== null)) {
      throw new BadRequestException({
        code: 'CONTENT_NOT_DRAFT',
        message: 'Ilha possui níveis publicados e não pode ser excluída',
      });
    }

    await this.transactionRunner.run(async (repos) => {
      for (const level of levels) {
        await repos.slides.deleteByLevelId(level.id);
        await repos.levels.delete(level.id);
      }
      await repos.islands.delete(id);

      // Renumber remaining islands
      const remaining = await repos.islands.listAll();
      for (let i = 0; i < remaining.length; i++) {
        await repos.islands.update(remaining[i].id, { position: 100000 + i });
      }
      for (let i = 0; i < remaining.length; i++) {
        await repos.islands.update(remaining[i].id, { position: i + 1 });
      }
    });

    this.logger.log({
      message: 'Ilha excluída com sucesso',
      islandId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });
  }
}
