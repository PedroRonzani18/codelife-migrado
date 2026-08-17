import { Injectable, NotFoundException } from '@nestjs/common';
import type { IslandDetail } from '@codelife/contracts';
import { LearningRepository } from './learning.repository';

@Injectable()
export class LearningService {
  constructor(private readonly repository: LearningRepository) {}

  async islandDetail(key: string): Promise<IslandDetail> {
    const island = await this.repository.islandByKey(key);
    if (!island) throw new NotFoundException(`Ilha ${key} não encontrada`);
    return {
      id: island.key,
      title: island.title,
      order: island.sortOrder,
      levelCount: island.levels.length,
      // A política de liberação é intencionalmente entregue no TCC-15.
      levels: island.levels.map((level) => ({ id: level.key, islandId: island.key, title: level.title, order: level.sortOrder, availability: 'available' })),
    };
  }

  async assertSeedIntegrity() {
    const [islands, levels, slides] = await this.repository.fixtureCounts();
    return { islands, levels, slides, valid: islands === 1 && levels === 3 && slides === 9 };
  }
}
