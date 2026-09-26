import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminLevelDetail,
  CreateLevelInput,
  PublishContentInput,
  UnpublishContentInput,
  UpdateLevelInput,
} from '@codelife/contracts/content-management';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { IIslandsRepository } from '../islands/islands.repository.interface';
import type { ILevelsRepository } from './levels.repository.interface';
import type { ISlidesRepository } from '../slides/slides.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';
import type { IContentTransactionRunner } from '../content-management/content-transaction-runner.interface';
import { ContentProtectionService } from '../content-management/content-protection.service';

@Injectable()
export class AdminLevelsService {
  private readonly logger = new Logger(AdminLevelsService.name);

  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.ISLANDS_REPOSITORY)
    private readonly islandsRepo: IIslandsRepository,
    @Inject(LEARNING_PROVIDER_KEYS.LEVELS_REPOSITORY)
    private readonly levelsRepo: ILevelsRepository,
    @Inject(LEARNING_PROVIDER_KEYS.SLIDES_REPOSITORY)
    private readonly slidesRepo: ISlidesRepository,
    @Inject(LEARNING_PROVIDER_KEYS.PROGRESS_REPOSITORY)
    private readonly progressRepo: IProgressRepository,
    @Inject(LEARNING_PROVIDER_KEYS.CONTENT_TRANSACTION_RUNNER)
    private readonly transactionRunner: IContentTransactionRunner,
    private readonly protectionService: ContentProtectionService,
  ) {}

  async getDetail(id: string): Promise<AdminLevelDetail> {
    const detail = await this.levelsRepo.getAdminDetail(id);
    if (!detail) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Nível não encontrado',
      });
    }
    return detail;
  }

  async create(
    islandId: string,
    input: CreateLevelInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminLevelDetail> {
    const island = await this.islandsRepo.findById(islandId);
    if (!island) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Ilha não encontrada',
      });
    }

    await this.protectionService.validateLevelInsertion(island, this.progressRepo);

    const count = await this.levelsRepo.countByIslandId(islandId);
    const position = count + 1;

    const created = await this.levelsRepo.create({
      islandId,
      title: input.title,
      position,
      publishedAt: null,
    });

    this.logger.log({
      message: 'Nível criado com sucesso',
      levelId: created.id,
      islandId,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.levelsRepo.getAdminDetail(created.id))!;
  }

  async update(
    id: string,
    input: UpdateLevelInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminLevelDetail> {
    const level = await this.levelsRepo.findById(id);
    if (!level) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Nível não encontrado',
      });
    }

    if (new Date(input.expectedUpdatedAt).toISOString() !== level.updatedAt.toISOString()) {
      throw new ConflictException({
        code: 'CONTENT_STALE',
        message: 'Nível foi modificado concorrentemente',
      });
    }

    await this.levelsRepo.update(id, {
      title: input.title,
    });

    this.logger.log({
      message: 'Nível atualizado com sucesso',
      levelId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.levelsRepo.getAdminDetail(id))!;
  }

  async publish(
    id: string,
    input: PublishContentInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminLevelDetail> {
    const level = await this.levelsRepo.findById(id);
    if (!level) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Nível não encontrado',
      });
    }

    if (input.expectedUpdatedAt && new Date(input.expectedUpdatedAt).toISOString() !== level.updatedAt.toISOString()) {
      throw new ConflictException({
        code: 'CONTENT_STALE',
        message: 'Nível foi modificado concorrentemente',
      });
    }

    const slideCount = await this.slidesRepo.countByLevelId(id);
    if (slideCount === 0) {
      throw new BadRequestException({
        code: 'CONTENT_NOT_PUBLISHABLE',
        message: 'Nível precisa ter pelo menos um slide para ser publicado',
      });
    }

    await this.levelsRepo.update(id, { publishedAt: new Date() });

    this.logger.log({
      message: 'Nível publicado com sucesso',
      levelId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.levelsRepo.getAdminDetail(id))!;
  }

  async unpublish(
    id: string,
    input: UnpublishContentInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminLevelDetail> {
    const level = await this.levelsRepo.findById(id);
    if (!level) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Nível não encontrado',
      });
    }

    if (input.expectedUpdatedAt && new Date(input.expectedUpdatedAt).toISOString() !== level.updatedAt.toISOString()) {
      throw new ConflictException({
        code: 'CONTENT_STALE',
        message: 'Nível foi modificado concorrentemente',
      });
    }

    const hasProgress = await this.progressRepo.hasProgressForLevel(id);
    if (hasProgress) {
      throw new ConflictException({
        code: 'CONTENT_HAS_PROGRESS',
        message: 'Nível com progresso de estudantes não pode ser despublicado',
      });
    }

    await this.levelsRepo.update(id, { publishedAt: null });

    this.logger.log({
      message: 'Nível despublicado com sucesso',
      levelId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.levelsRepo.getAdminDetail(id))!;
  }

  async delete(
    id: string,
    context?: { actorId?: string; requestId?: string },
  ): Promise<void> {
    const level = await this.levelsRepo.findById(id);
    if (!level) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Nível não encontrado',
      });
    }

    if (level.publishedAt !== null) {
      throw new BadRequestException({
        code: 'CONTENT_NOT_DRAFT',
        message: 'Apenas níveis em rascunho podem ser excluídos',
      });
    }

    const hasProgress = await this.progressRepo.hasProgressForLevel(id);
    if (hasProgress) {
      throw new ConflictException({
        code: 'CONTENT_HAS_PROGRESS',
        message: 'Nível com progresso não pode ser excluído',
      });
    }

    await this.transactionRunner.run(async (repos) => {
      await repos.slides.deleteByLevelId(id);
      await repos.levels.delete(id);

      const remaining = await repos.levels.findByIslandId(level.islandId);
      for (let i = 0; i < remaining.length; i++) {
        await repos.levels.update(remaining[i].id, { position: 100000 + i });
      }
      for (let i = 0; i < remaining.length; i++) {
        await repos.levels.update(remaining[i].id, { position: i + 1 });
      }
    });

    this.logger.log({
      message: 'Nível excluído com sucesso',
      levelId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });
  }
}
