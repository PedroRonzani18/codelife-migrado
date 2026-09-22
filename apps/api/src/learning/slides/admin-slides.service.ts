import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  AdminSlideDetail,
  CreateSlideInput,
  UpdateSlideInput,
} from '@codelife/contracts/content-management';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { ILevelsRepository } from '../levels/levels.repository.interface';
import type { ISlidesRepository } from './slides.repository.interface';
import type { IMediaRepository } from '../media/media.repository.interface';
import type { IProgressRepository } from '../progress/progress.repository.interface';
import type { IContentTransactionRunner } from '../content-management/content-transaction-runner.interface';
import { ContentProtectionService } from '../content-management/content-protection.service';

@Injectable()
export class AdminSlidesService {
  private readonly logger = new Logger(AdminSlidesService.name);

  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.LEVELS_REPOSITORY)
    private readonly levelsRepo: ILevelsRepository,
    @Inject(LEARNING_PROVIDER_KEYS.SLIDES_REPOSITORY)
    private readonly slidesRepo: ISlidesRepository,
    @Inject(LEARNING_PROVIDER_KEYS.MEDIA_REPOSITORY)
    private readonly mediaRepo: IMediaRepository,
    @Inject(LEARNING_PROVIDER_KEYS.PROGRESS_REPOSITORY)
    private readonly progressRepo: IProgressRepository,
    @Inject(LEARNING_PROVIDER_KEYS.CONTENT_TRANSACTION_RUNNER)
    private readonly transactionRunner: IContentTransactionRunner,
    private readonly protectionService: ContentProtectionService,
  ) {}

  async getDetail(id: string): Promise<AdminSlideDetail> {
    const detail = await this.slidesRepo.getAdminDetail(id);
    if (!detail) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Slide não encontrado',
      });
    }
    return detail;
  }

  async create(
    levelId: string,
    input: CreateSlideInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminSlideDetail> {
    const level = await this.levelsRepo.findById(levelId);
    if (!level) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Nível não encontrado',
      });
    }

    await this.protectionService.validateSlideInsertion(levelId, this.progressRepo);

    if (input.type === 'TextImage') {
      const asset = await this.mediaRepo.findById(input.mediaAssetId);
      if (!asset) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Ativo de mídia não encontrado',
        });
      }
    }

    const count = await this.slidesRepo.countByLevelId(levelId);
    const position = count + 1;

    const created = await this.slidesRepo.create({
      levelId,
      title: input.title,
      type: input.type,
      position,
      textText: input.type === 'TextText' ? { primaryText: input.primaryText, secondaryText: input.secondaryText ?? null } : undefined,
      textImage: input.type === 'TextImage' ? { text: input.text, altText: input.altText, mediaAssetId: input.mediaAssetId } : undefined,
      textCode: input.type === 'TextCode' ? { text: input.text, code: input.code, language: input.language } : undefined,
    });

    this.logger.log({
      message: 'Slide criado com sucesso',
      slideId: created.id,
      levelId,
      type: input.type,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.slidesRepo.getAdminDetail(created.id))!;
  }

  async update(
    id: string,
    input: UpdateSlideInput,
    context?: { actorId?: string; requestId?: string },
  ): Promise<AdminSlideDetail> {
    const slide = await this.slidesRepo.findById(id);
    if (!slide) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Slide não encontrado',
      });
    }

    if (new Date(input.expectedUpdatedAt).toISOString() !== slide.updatedAt.toISOString()) {
      throw new ConflictException({
        code: 'CONTENT_STALE',
        message: 'Slide foi modificado concorrentemente',
      });
    }

    if (input.type !== slide.type) {
      throw new BadRequestException({
        code: 'VALIDATION_ERROR',
        message: 'Tipo do slide não pode ser alterado',
      });
    }

    if (input.type === 'TextImage' && input.mediaAssetId) {
      const asset = await this.mediaRepo.findById(input.mediaAssetId);
      if (!asset) {
        throw new NotFoundException({
          code: 'RESOURCE_NOT_FOUND',
          message: 'Ativo de mídia não encontrado',
        });
      }
    }

    await this.slidesRepo.update(id, {
      title: input.title,
      textText: input.type === 'TextText' ? { primaryText: input.primaryText, secondaryText: input.secondaryText ?? null } : undefined,
      textImage: input.type === 'TextImage' ? { text: input.text, altText: input.altText, mediaAssetId: input.mediaAssetId } : undefined,
      textCode: input.type === 'TextCode' ? { text: input.text, code: input.code, language: input.language } : undefined,
    });

    this.logger.log({
      message: 'Slide atualizado com sucesso',
      slideId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });

    return (await this.slidesRepo.getAdminDetail(id))!;
  }

  async delete(
    id: string,
    context?: { actorId?: string; requestId?: string },
  ): Promise<void> {
    const slide = await this.slidesRepo.findById(id);
    if (!slide) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Slide não encontrado',
      });
    }

    const level = await this.levelsRepo.findById(slide.levelId);
    if (!level) {
      throw new NotFoundException({
        code: 'RESOURCE_NOT_FOUND',
        message: 'Nível não encontrado',
      });
    }

    if (level.publishedAt !== null) {
      throw new BadRequestException({
        code: 'CONTENT_NOT_DRAFT',
        message: 'Apenas slides de níveis em rascunho podem ser excluídos',
      });
    }

    const hasProgress = await this.progressRepo.hasProgressForLevel(slide.levelId);
    if (hasProgress) {
      throw new ConflictException({
        code: 'CONTENT_HAS_PROGRESS',
        message: 'Nível com progresso não permite exclusão de slides',
      });
    }

    await this.transactionRunner.run(async (repos) => {
      await repos.slides.delete(id);

      const remaining = await repos.slides.findByLevelId(slide.levelId);
      for (let i = 0; i < remaining.length; i++) {
        await repos.slides.update(remaining[i].id, { position: 100000 + i });
      }
      for (let i = 0; i < remaining.length; i++) {
        await repos.slides.update(remaining[i].id, { position: i + 1 });
      }
    });

    this.logger.log({
      message: 'Slide excluído com sucesso',
      slideId: id,
      actorId: context?.actorId,
      requestId: context?.requestId,
    });
  }
}
