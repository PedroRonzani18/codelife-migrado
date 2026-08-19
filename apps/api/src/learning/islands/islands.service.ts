import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { islandDetailSchema, type IslandDetail } from 'contracts';
import { ISLANDS_REPOSITORY, type IslandsRepositoryPort } from './islands.repository.port';

@Injectable()
export class IslandsService {
  constructor(@Inject(ISLANDS_REPOSITORY) private readonly repository: IslandsRepositoryPort) {}

  async islandDetail(key: string): Promise<IslandDetail> {
    const island = await this.repository.islandByKey(key);
    if (!island) throw new NotFoundException(`Ilha ${key} não encontrada`);
    return islandDetailSchema.parse({
      id: island.key,
      title: island.title,
      order: island.sortOrder,
      levelCount: island.levels.length,
      // A política de liberação é intencionalmente entregue no TCC-15.
      levels: island.levels.map((level) => ({ id: level.key, islandId: island.key, title: level.title, order: level.sortOrder, availability: 'available' })),
    });
  }
}
