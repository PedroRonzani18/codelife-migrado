import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { islandDetailSchema, type IslandDetail } from '@codelife/contracts/learning';
import { LEARNING_PROVIDER_KEYS } from '../constants';
import type { IIslandsRepository } from './islands.repository.interface';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class IslandsService {
  constructor(
    @Inject(LEARNING_PROVIDER_KEYS.ISLANDS_REPOSITORY) private readonly repository: IIslandsRepository,
    private readonly progress: ProgressService,
  ) {}

  async islandDetail(userId: string, slug: string): Promise<IslandDetail> {
    const island = await this.repository.islandBySlug(slug);
    if (!island) throw new NotFoundException(`Ilha ${slug} não encontrada`);
    const snapshot = await this.progress.snapshot(userId);
    const progressIsland = snapshot.islands.find((candidate) => candidate.id === island.id);
    if (!progressIsland) throw new Error('Inconsistent learning data: island is absent from progress snapshot');
    return islandDetailSchema.parse({
      id: island.id,
      slug: island.slug,
      title: island.title,
      levelCount: island.levels.length,
      levels: island.levels.map((level) => {
        const progressLevel = progressIsland.levels.find((candidate) => candidate.id === level.id);
        if (!progressLevel) throw new Error('Inconsistent learning data: level is absent from progress snapshot');
        return { ...level, availability: progressLevel.availability };
      }),
    });
  }
}
