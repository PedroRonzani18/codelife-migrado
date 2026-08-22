import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { levelDetailSchema, type LevelDetail, type Slide } from '@codelife/contracts/learning';
import { OBJECT_STORAGE, type ObjectStoragePort } from '../media/object-storage.port';
import { ProgressService } from '../progress/progress.service';
import {
  LEVELS_REPOSITORY,
  type LevelsRepositoryPort,
  type PositionedSlideRecord,
} from './repository/levels.repository.port';

@Injectable()
export class LevelsService {
  constructor(
    @Inject(LEVELS_REPOSITORY) private readonly repository: LevelsRepositoryPort,
    @Inject(OBJECT_STORAGE) private readonly storage: ObjectStoragePort,
    private readonly progress: ProgressService,
  ) {}

  async levelDetail(userId: string, levelId: string): Promise<LevelDetail> {
    const level = await this.repository.levelById(levelId);
    if (!level) throw new NotFoundException('Nível não encontrado');
    const snapshot = await this.progress.snapshot(userId);
    const snapshotIsland = snapshot.islands.find((island) => island.id === level.islandId);
    const snapshotLevel = snapshotIsland?.levels.find((candidate) => candidate.id === level.id);
    if (!snapshotLevel) throw new Error('Inconsistent learning data: level is absent from the progress snapshot');

    const slides = await Promise.all(
      level.slides.map((slide, index) => this.mapSlide(slide, level.slides, index)),
    );
    return levelDetailSchema.parse({
      id: level.id,
      islandId: level.islandId,
      title: level.title,
      position: level.position,
      availability: snapshotLevel.availability,
      slides,
    });
  }

  private async mapSlide(
    slide: PositionedSlideRecord,
    slides: PositionedSlideRecord[],
    index: number,
  ): Promise<Slide> {
    const subtypeCount = [slide.textText, slide.textImage, slide.textCode].filter(Boolean).length;
    if (subtypeCount !== 1) throw new Error(`Inconsistent slide ${slide.id}: expected exactly one subtype`);
    const base = {
      id: slide.id,
      title: slide.title,
      position: slide.position,
      previousSlideId: slides[index - 1]?.id ?? null,
      nextSlideId: slides[index + 1]?.id ?? null,
    };

    if (slide.type === 'TextText' && slide.textText) {
      return {
        ...base,
        type: slide.type,
        primaryText: slide.textText.primaryText,
        secondaryText: slide.textText.secondaryText,
      };
    }
    if (slide.type === 'TextCode' && slide.textCode) {
      return {
        ...base,
        type: slide.type,
        text: slide.textCode.text,
        code: slide.textCode.code,
        language: slide.textCode.language,
      };
    }
    if (slide.type === 'TextImage' && slide.textImage) {
      await this.storage.resolveControlledObject(
        slide.textImage.mediaAsset.objectKey,
        slide.textImage.mediaAsset.mimeType,
      );
      return {
        ...base,
        type: slide.type,
        text: slide.textImage.text,
        altText: slide.textImage.altText,
        mediaAsset: slide.textImage.mediaAsset,
      };
    }
    throw new Error(`Inconsistent slide ${slide.id}: subtype does not match ${slide.type}`);
  }
}
